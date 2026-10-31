import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OidcKeysService } from './oidc-keys.service';
import { RegisterClientDto } from './dto/register-client.dto';
import { AuthorizeQueryDto } from './dto/authorize-query.dto';
import { TokenRequestDto } from './dto/token-request.dto';
import { ConsentDto } from './dto/consent.dto';
import { OAuthClientStatus, VerificationLevel } from '@prisma/client';

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly oidcKeysService: OidcKeysService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private base64UrlSha256(str: string): string {
    return crypto.createHash('sha256').update(str).digest('base64url');
  }

  // --------------------------------------------------------------------------
  // 1. Client Management (Internal Admin)
  // --------------------------------------------------------------------------

  async registerClient(dto: RegisterClientDto, adminId?: string) {
    const clientId = `client_${crypto.randomBytes(12).toString('hex')}`;
    const plainSecret = `sec_${crypto.randomBytes(24).toString('hex')}`;
    const secretHash = await argon2.hash(plainSecret, { type: argon2.argon2id });

    const client = await this.prisma.oAuthClient.create({
      data: {
        client_id: clientId,
        client_secret_hash: secretHash,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        logo_uri: dto.logoUri?.trim() || null,
        redirect_uris: dto.redirectUris.map((u) => u.trim()),
        allowed_scopes: dto.allowedScopes.map((s) => s.trim().toLowerCase()),
        required_verification_level: dto.requiredVerificationLevel || VerificationLevel.LEVEL_0,
        status: OAuthClientStatus.ACTIVE,
      },
    });

    await this.auditService.logEvent({
      userId: adminId,
      eventType: 'OAUTH_CLIENT_REGISTERED',
      metadata: { clientId, name: client.name, allowedScopes: client.allowed_scopes },
    });

    return {
      id: client.id,
      clientId: client.client_id,
      clientSecret: plainSecret, // Returned ONCE only at creation
      name: client.name,
      description: client.description,
      logoUri: client.logo_uri,
      redirectUris: client.redirect_uris,
      allowedScopes: client.allowed_scopes,
      requiredVerificationLevel: client.required_verification_level,
      status: client.status,
      createdAt: client.created_at,
    };
  }

  async rotateClientSecret(clientId: string, adminId?: string) {
    const client = await this.prisma.oAuthClient.findUnique({
      where: { client_id: clientId },
    });

    if (!client) {
      throw new NotFoundException('OAuth client not found');
    }

    const newPlainSecret = `sec_${crypto.randomBytes(24).toString('hex')}`;
    const newSecretHash = await argon2.hash(newPlainSecret, { type: argon2.argon2id });

    await this.prisma.oAuthClient.update({
      where: { client_id: clientId },
      data: { client_secret_hash: newSecretHash, updated_at: new Date() },
    });

    await this.auditService.logEvent({
      userId: adminId,
      eventType: 'OAUTH_CLIENT_SECRET_ROTATED',
      metadata: { clientId },
    });

    return {
      clientId,
      newClientSecret: newPlainSecret, // Returned ONCE only upon rotation
      message: 'Client secret successfully rotated',
    };
  }

  async updateClient(
    clientId: string,
    updates: {
      status?: OAuthClientStatus;
      name?: string;
      redirectUris?: string[];
      allowedScopes?: string[];
      requiredVerificationLevel?: VerificationLevel;
    },
    adminId?: string,
  ) {
    const client = await this.prisma.oAuthClient.findUnique({
      where: { client_id: clientId },
    });

    if (!client) {
      throw new NotFoundException('OAuth client not found');
    }

    const data: any = {};
    if (updates.status) data.status = updates.status;
    if (updates.name) data.name = updates.name.trim();
    if (updates.redirectUris) data.redirect_uris = updates.redirectUris.map((u) => u.trim());
    if (updates.allowedScopes) data.allowed_scopes = updates.allowedScopes.map((s) => s.trim().toLowerCase());
    if (updates.requiredVerificationLevel) data.required_verification_level = updates.requiredVerificationLevel;

    const updated = await this.prisma.oAuthClient.update({
      where: { client_id: clientId },
      data,
    });

    await this.auditService.logEvent({
      userId: adminId,
      eventType: 'OAUTH_CLIENT_UPDATED',
      metadata: { clientId, updates },
    });

    return {
      id: updated.id,
      clientId: updated.client_id,
      name: updated.name,
      redirectUris: updated.redirect_uris,
      allowedScopes: updated.allowed_scopes,
      requiredVerificationLevel: updated.required_verification_level,
      status: updated.status,
      updatedAt: updated.updated_at,
    };
  }

  async listClients() {
    const clients = await this.prisma.oAuthClient.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        client_id: true,
        name: true,
        description: true,
        logo_uri: true,
        redirect_uris: true,
        allowed_scopes: true,
        required_verification_level: true,
        status: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: { authorizations: true },
        },
      },
    });

    return clients.map((c) => ({
      id: c.id,
      clientId: c.client_id,
      name: c.name,
      description: c.description,
      logoUri: c.logo_uri,
      redirectUris: c.redirect_uris,
      allowedScopes: c.allowed_scopes,
      requiredVerificationLevel: c.required_verification_level,
      status: c.status,
      activeUsersCount: c._count.authorizations,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));
  }

  // --------------------------------------------------------------------------
  // 2. Authorize Flow (OIDC Core 1.0 + RFC 7636 PKCE)
  // --------------------------------------------------------------------------

  async validateAuthorizeRequest(query: AuthorizeQueryDto, userId: string) {
    if (query.response_type !== 'code') {
      throw new BadRequestException('Unsupported response_type. Only "code" is supported.');
    }

    if (query.code_challenge_method !== 'S256') {
      throw new BadRequestException('PKCE code_challenge_method must be "S256".');
    }

    if (!query.code_challenge) {
      throw new BadRequestException('PKCE code_challenge is required.');
    }

    const client = await this.prisma.oAuthClient.findUnique({
      where: { client_id: query.client_id },
    });

    if (!client || client.status !== OAuthClientStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid or inactive OAuth client');
    }

    // Exact Redirect URI matching (no wildcards or prefix matching)
    if (!client.redirect_uris.includes(query.redirect_uri)) {
      throw new BadRequestException(
        `Redirect URI mismatch: "${query.redirect_uri}" is not registered for this client.`,
      );
    }

    const requestedScopes = query.scope
      .split(' ')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (!requestedScopes.includes('openid')) {
      throw new BadRequestException('Scope "openid" is required for OpenID Connect authorization.');
    }

    // Validate that requested scopes are permitted for this client
    for (const sc of requestedScopes) {
      if (!client.allowed_scopes.includes(sc)) {
        throw new BadRequestException(`Scope "${sc}" is not permitted for this client.`);
      }
    }

    // Check verification level requirement
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        identity_verifications: {
          where: { status: 'VERIFIED' },
          orderBy: { updated_at: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userKycLevel = user.identity_verifications[0]?.verification_level || VerificationLevel.LEVEL_0;
    const levelHierarchy: Record<VerificationLevel, number> = {
      LEVEL_0: 0,
      LEVEL_1: 1,
      LEVEL_2: 2,
      LEVEL_3: 3,
      LEVEL_4: 4,
      LEVEL_5: 5,
    };

    if (levelHierarchy[userKycLevel] < levelHierarchy[client.required_verification_level]) {
      throw new ForbiddenException(
        `This application requires identity verification level ${client.required_verification_level}. Your current level is ${userKycLevel}. Please upgrade your verification to proceed.`,
      );
    }

    // Check existing authorization (consent)
    const existingConsent = await this.prisma.connectedApplication.findUnique({
      where: {
        user_id_client_id: {
          user_id: userId,
          client_id: query.client_id,
        },
      },
    });

    const hasAllScopes =
      existingConsent &&
      !existingConsent.is_revoked &&
      requestedScopes.every((sc) => existingConsent.granted_scopes.includes(sc));

    if (hasAllScopes) {
      // Auto-issue authorization code without showing consent again
      const code = await this.issueAuthorizationCode({
        clientId: client.client_id,
        userId,
        redirectUri: query.redirect_uri,
        scope: requestedScopes.join(' '),
        codeChallenge: query.code_challenge,
        codeChallengeMethod: query.code_challenge_method,
      });

      const redirectWithParams = new URL(query.redirect_uri);
      redirectWithParams.searchParams.set('code', code);
      if (query.state) redirectWithParams.searchParams.set('state', query.state);

      return {
        requiresConsent: false,
        redirectUrl: redirectWithParams.toString(),
      };
    }

    return {
      requiresConsent: true,
      client: {
        id: client.client_id,
        name: client.name,
        description: client.description,
        logoUri: client.logo_uri,
      },
      requestedScopes,
      redirectUri: query.redirect_uri,
      codeChallenge: query.code_challenge,
      codeChallengeMethod: query.code_challenge_method,
      state: query.state || '',
    };
  }

  async handleConsent(userId: string, dto: ConsentDto) {
    if (!dto.granted) {
      const deniedUrl = new URL(dto.redirectUri);
      deniedUrl.searchParams.set('error', 'access_denied');
      deniedUrl.searchParams.set('error_description', 'The user denied authorization.');
      if (dto.state) deniedUrl.searchParams.set('state', dto.state);
      return { redirectUrl: deniedUrl.toString() };
    }

    // Store or update user authorization (consent)
    await this.prisma.connectedApplication.upsert({
      where: {
        user_id_client_id: {
          user_id: userId,
          client_id: dto.clientId,
        },
      },
      update: {
        granted_scopes: dto.scopes,
        is_revoked: false,
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        client_id: dto.clientId,
        granted_scopes: dto.scopes,
        is_revoked: false,
      },
    });

    const code = await this.issueAuthorizationCode({
      clientId: dto.clientId,
      userId,
      redirectUri: dto.redirectUri,
      scope: dto.scopes.join(' '),
      codeChallenge: dto.codeChallenge,
      codeChallengeMethod: dto.codeChallengeMethod,
    });

    const redirectWithParams = new URL(dto.redirectUri);
    redirectWithParams.searchParams.set('code', code);
    if (dto.state) redirectWithParams.searchParams.set('state', dto.state);

    return { redirectUrl: redirectWithParams.toString() };
  }

  private async issueAuthorizationCode(params: {
    clientId: string;
    userId: string;
    redirectUri: string;
    scope: string;
    codeChallenge: string;
    codeChallengeMethod: string;
  }): Promise<string> {
    const rawCode = `code_${crypto.randomBytes(32).toString('hex')}`;
    const codeHash = this.hashToken(rawCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    await this.prisma.oAuthAuthorizationCode.create({
      data: {
        code_hash: codeHash,
        client_id: params.clientId,
        user_id: params.userId,
        redirect_uri: params.redirectUri,
        scope: params.scope,
        code_challenge: params.codeChallenge,
        code_challenge_method: params.codeChallengeMethod,
        expires_at: expiresAt,
        is_used: false,
      },
    });

    return rawCode;
  }

  // --------------------------------------------------------------------------
  // 3. Token Exchange Flow (Authorization Code & Refresh Token Rotation)
  // --------------------------------------------------------------------------

  async exchangeToken(dto: TokenRequestDto) {
    if (dto.grant_type === 'authorization_code') {
      return this.handleAuthorizationCodeGrant(dto);
    } else if (dto.grant_type === 'refresh_token') {
      return this.handleRefreshTokenGrant(dto);
    } else {
      throw new BadRequestException(`Unsupported grant_type: "${dto.grant_type}"`);
    }
  }

  private async handleAuthorizationCodeGrant(dto: TokenRequestDto) {
    if (!dto.code) {
      throw new BadRequestException('Authorization code is required');
    }
    if (!dto.code_verifier) {
      throw new BadRequestException('PKCE code_verifier is required');
    }

    const codeHash = this.hashToken(dto.code);
    const authCode = await this.prisma.oAuthAuthorizationCode.findUnique({
      where: { code_hash: codeHash },
      include: { client: true, user: true },
    });

    if (!authCode) {
      throw new UnauthorizedException('Invalid authorization code');
    }

    // Replay protection: if already used, invalidate all active tokens for this user/client!
    if (authCode.is_used) {
      this.logger.warn(`[OAuth] Authorization code reuse detected for client ${authCode.client_id}! Revoking sessions.`);
      await this.prisma.oAuthAccessToken.updateMany({
        where: { client_id: authCode.client_id, user_id: authCode.user_id },
        data: { is_revoked: true },
      });
      await this.prisma.oAuthRefreshToken.updateMany({
        where: { client_id: authCode.client_id, user_id: authCode.user_id },
        data: { is_revoked: true },
      });
      throw new UnauthorizedException('Authorization code was already used. Tokens revoked for security.');
    }

    // Check expiration
    if (new Date() > authCode.expires_at) {
      throw new UnauthorizedException('Authorization code has expired');
    }

    // Check exact redirect_uri match
    if (dto.redirect_uri && dto.redirect_uri !== authCode.redirect_uri) {
      throw new BadRequestException('redirect_uri mismatch');
    }

    // PKCE Verification: base64url(sha256(code_verifier)) === code_challenge
    const calculatedChallenge = this.base64UrlSha256(dto.code_verifier);
    if (calculatedChallenge !== authCode.code_challenge) {
      throw new UnauthorizedException('PKCE validation failed: invalid code_verifier');
    }

    // Client Authentication (if client_secret provided)
    if (dto.client_secret) {
      const isSecretValid = await argon2.verify(authCode.client.client_secret_hash, dto.client_secret);
      if (!isSecretValid) {
        throw new UnauthorizedException('Invalid client credentials');
      }
    }

    // Mark code as used
    await this.prisma.oAuthAuthorizationCode.update({
      where: { id: authCode.id },
      data: { is_used: true },
    });

    return this.generateTokenResponse(authCode.client_id, authCode.user_id, authCode.scope);
  }

  private async handleRefreshTokenGrant(dto: TokenRequestDto) {
    if (!dto.refresh_token) {
      throw new BadRequestException('refresh_token is required');
    }

    const tokenHash = this.hashToken(dto.refresh_token);
    const refreshTokenRecord = await this.prisma.oAuthRefreshToken.findUnique({
      where: { token_hash: tokenHash },
      include: { client: true, user: true },
    });

    if (!refreshTokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // REFRESH TOKEN ROTATION REPLAY DETECTION:
    // If a previously used refresh token is submitted again, immediately revoke the entire lineage!
    if (refreshTokenRecord.is_used || refreshTokenRecord.is_revoked) {
      this.logger.warn(`[OAuth] Used refresh token re-submitted for client ${refreshTokenRecord.client_id}! Revoking all tokens.`);
      await this.prisma.oAuthRefreshToken.updateMany({
        where: { client_id: refreshTokenRecord.client_id, user_id: refreshTokenRecord.user_id },
        data: { is_revoked: true },
      });
      await this.prisma.oAuthAccessToken.updateMany({
        where: { client_id: refreshTokenRecord.client_id, user_id: refreshTokenRecord.user_id },
        data: { is_revoked: true },
      });
      await this.auditService.logEvent({
        userId: refreshTokenRecord.user_id,
        eventType: 'OAUTH_TOKEN_REPLAY_DETECTED',
        metadata: {
          clientId: refreshTokenRecord.client_id,
          tokenId: refreshTokenRecord.id,
        },
      });
      throw new UnauthorizedException('Refresh token was already used. Token family revoked.');
    }

    if (new Date() > refreshTokenRecord.expires_at) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    if (refreshTokenRecord.client.status !== OAuthClientStatus.ACTIVE) {
      throw new UnauthorizedException('OAuth client is inactive or suspended');
    }

    // Invalidate the current refresh token (Rotation)
    await this.prisma.oAuthRefreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: { is_used: true, is_revoked: true },
    });

    return this.generateTokenResponse(
      refreshTokenRecord.client_id,
      refreshTokenRecord.user_id,
      refreshTokenRecord.scope,
    );
  }

  private async generateTokenResponse(clientId: string, userId: string, scopeString: string) {
    const scopes = scopeString.split(' ').map((s) => s.trim().toLowerCase());
    const issuer = this.configService.get<string>('OAUTH_ISSUER', 'https://account.softcents.com/api/v1/oauth');

    // Fetch user details for claims
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        identity_verifications: {
          where: { status: 'VERIFIED' },
          orderBy: { updated_at: 'desc' },
          take: 1,
        },
        business_memberships: {
          include: { business: true },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 1. Build OIDC Personal Claims (per specification)
    const claims: Record<string, any> = {
      iss: issuer,
      sub: user.id,
      aud: clientId,
    };

    if (scopes.includes('email')) {
      claims.email = user.email;
      claims.email_verified = user.email_verified;
    }

    if (scopes.includes('profile')) {
      claims.name = [user.profile?.first_name, user.profile?.last_name].filter(Boolean).join(' ') || null;
      claims.country = user.profile?.country_code || null;
    }

    if (scopes.includes('identity')) {
      const verifiedKyc = user.identity_verifications[0];
      claims.identity_verified = !!verifiedKyc;
      claims.verification_level = verifiedKyc?.verification_level || VerificationLevel.LEVEL_0;
      claims.country = user.profile?.country_code || null;
    }

    // 2. Build Business Claims if business scope requested
    if (scopes.includes('business')) {
      const membership = user.business_memberships[0];
      claims.business_id = membership?.business_id || null;
      claims.business_verified = membership?.business?.status === 'VERIFIED';
      claims.business_role = membership?.role || null;
    }

    // Sign ID Token with RS256
    const idToken = await this.oidcKeysService.signJwt(claims, '1h');

    // Generate Access Token (RS256 JWT, valid 1 hour)
    const accessTokenPayload = {
      iss: issuer,
      sub: user.id,
      aud: clientId,
      client_id: clientId,
      scope: scopeString,
      token_type: 'Bearer',
      jti: crypto.randomBytes(16).toString('hex'),
    };
    const accessToken = await this.oidcKeysService.signJwt(accessTokenPayload, '1h');
    const accessTokenHash = this.hashToken(accessToken);

    // Save Access Token in DB
    await this.prisma.oAuthAccessToken.create({
      data: {
        token_hash: accessTokenHash,
        client_id: clientId,
        user_id: user.id,
        scope: scopeString,
        expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Generate Refresh Token (valid 30 days)
    const rawRefreshToken = `rt_${crypto.randomBytes(32).toString('hex')}`;
    const refreshTokenHash = this.hashToken(rawRefreshToken);

    await this.prisma.oAuthRefreshToken.create({
      data: {
        token_hash: refreshTokenHash,
        client_id: clientId,
        user_id: user.id,
        scope: scopeString,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        is_used: false,
        is_revoked: false,
      },
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: rawRefreshToken,
      id_token: idToken,
      scope: scopeString,
    };
  }

  // --------------------------------------------------------------------------
  // 4. UserInfo Endpoint
  // --------------------------------------------------------------------------

  async getUserInfo(accessToken: string) {
    const { payload } = await this.oidcKeysService.verifyJwt(accessToken);
    const userId = payload.sub as string;
    const scopes = ((payload.scope as string) || '').split(' ');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        identity_verifications: {
          where: { status: 'VERIFIED' },
          orderBy: { updated_at: 'desc' },
          take: 1,
        },
        business_memberships: {
          include: { business: true },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userInfo: Record<string, any> = {
      sub: user.id,
    };

    if (scopes.includes('email')) {
      userInfo.email = user.email;
      userInfo.email_verified = user.email_verified;
    }

    if (scopes.includes('profile')) {
      userInfo.name = [user.profile?.first_name, user.profile?.last_name].filter(Boolean).join(' ') || null;
      userInfo.given_name = user.profile?.first_name || null;
      userInfo.family_name = user.profile?.last_name || null;
      userInfo.country = user.profile?.country_code || null;
    }

    if (scopes.includes('identity')) {
      const kyc = user.identity_verifications[0];
      userInfo.identity_verified = !!kyc;
      userInfo.verification_level = kyc?.verification_level || VerificationLevel.LEVEL_0;
      userInfo.country = user.profile?.country_code || null;
    }

    if (scopes.includes('business')) {
      const membership = user.business_memberships[0];
      userInfo.business_id = membership?.business_id || null;
      userInfo.business_verified = membership?.business?.status === 'VERIFIED';
      userInfo.business_role = membership?.role || null;
    }

    return userInfo;
  }

  // --------------------------------------------------------------------------
  // 5. User Connected Applications Management
  // --------------------------------------------------------------------------

  async getUserAuthorizations(userId: string) {
    const authorizations = await this.prisma.connectedApplication.findMany({
      where: { user_id: userId, is_revoked: false },
      include: {
        client: {
          select: {
            client_id: true,
            name: true,
            description: true,
            logo_uri: true,
          },
        },
      },
      orderBy: { updated_at: 'desc' },
    });

    return authorizations.map((a) => ({
      id: a.id,
      clientId: a.client_id,
      clientName: a.client.name,
      clientDescription: a.client.description,
      clientLogo: a.client.logo_uri,
      grantedScopes: a.granted_scopes,
      authorizedAt: a.created_at,
      updatedAt: a.updated_at,
    }));
  }

  async revokeUserAuthorization(userId: string, clientId: string) {
    await this.prisma.connectedApplication.updateMany({
      where: { user_id: userId, client_id: clientId },
      data: { is_revoked: true },
    });

    // Invalidate all access and refresh tokens for this app
    await this.prisma.oAuthAccessToken.updateMany({
      where: { user_id: userId, client_id: clientId },
      data: { is_revoked: true },
    });

    await this.prisma.oAuthRefreshToken.updateMany({
      where: { user_id: userId, client_id: clientId },
      data: { is_revoked: true },
    });

    await this.auditService.logEvent({
      userId,
      eventType: 'OAUTH_APPLICATION_REVOKED',
      metadata: { clientId },
    });

    return {
      success: true,
      message: 'Application access revoked and all issued tokens invalidated',
    };
  }

  // --------------------------------------------------------------------------
  // 6. OpenID Connect Discovery Metadata
  // --------------------------------------------------------------------------

  getOpenIdConfiguration() {
    const baseUrl = this.configService.get<string>('BASE_API_URL', 'https://account.softcents.com/api/v1/oauth');
    return {
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/authorize`,
      token_endpoint: `${baseUrl}/token`,
      userinfo_endpoint: `${baseUrl}/userinfo`,
      jwks_uri: `${baseUrl}/jwks`,
      response_types_supported: ['code'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
      scopes_supported: ['openid', 'profile', 'email', 'identity', 'business'],
      token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'none'],
      claims_supported: [
        'sub',
        'iss',
        'aud',
        'email',
        'email_verified',
        'identity_verified',
        'verification_level',
        'country',
        'business_id',
        'business_verified',
        'business_role',
      ],
      code_challenge_methods_supported: ['S256'],
    };
  }
}
