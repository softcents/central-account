import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import { OAuthService } from './oauth.service';
import { OidcKeysService } from './oidc-keys.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OAuthClientStatus, VerificationLevel } from '@prisma/client';

describe('OAuthService', () => {
  let service: OAuthService;
  let prisma: any;
  let oidcKeysService: any;
  let auditService: any;
  let configService: any;

  const mockClient = {
    id: 'client-db-1',
    client_id: 'client_test123',
    client_secret_hash: '$argon2id$mockhash',
    name: 'Test Partner App',
    description: 'A test client',
    logo_uri: null,
    redirect_uris: ['https://partner.example.com/callback'],
    allowed_scopes: ['openid', 'profile', 'email', 'kyc:status'],
    required_verification_level: VerificationLevel.LEVEL_0,
    status: OAuthClientStatus.ACTIVE,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockUser = {
    id: 'user-oidc-1',
    email: 'user@example.com',
    email_verified: true,
    country_code: 'US',
    identity_verifications: [
      {
        id: 'kyc-1',
        verification_level: VerificationLevel.LEVEL_2,
        status: 'VERIFIED',
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      oAuthClient: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      oAuthAuthorizationCode: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      oAuthAccessToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      oAuthRefreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      connectedApplication: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (cbOrArr) => {
        if (typeof cbOrArr === 'function') {
          return cbOrArr(prisma);
        }
        return Promise.all(cbOrArr);
      }),
    };

    oidcKeysService = {
      signIdToken: jest.fn().mockResolvedValue('mock.jwt.idtoken'),
      getIssuer: jest.fn().mockReturnValue('http://localhost:4000'),
    };

    configService = {
      get: jest.fn().mockImplementation((key, defaultVal) => {
        if (key === 'API_URL') return 'http://localhost:4000';
        return defaultVal;
      }),
    };

    auditService = {
      logEvent: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configService },
        { provide: AuditService, useValue: auditService },
        { provide: OidcKeysService, useValue: oidcKeysService },
      ],
    }).compile();

    service = module.get<OAuthService>(OAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerClient', () => {
    it('should register client, hash secret with argon2, and return plain secret once', async () => {
      prisma.oAuthClient.create.mockImplementation(async ({ data }: any) => ({
        id: 'new-id',
        ...data,
        created_at: new Date(),
      }));

      const res = await service.registerClient({
        name: 'My Service',
        redirectUris: ['https://service.com/oauth/callback'],
        allowedScopes: ['openid', 'email'],
        requiredVerificationLevel: VerificationLevel.LEVEL_1,
      });

      expect(res.clientId).toMatch(/^client_/);
      expect(res.clientSecret).toMatch(/^sec_/);
      expect(res.redirectUris).toEqual(['https://service.com/oauth/callback']);
      expect(prisma.oAuthClient.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'My Service',
            allowed_scopes: ['openid', 'email'],
          }),
        }),
      );
      expect(auditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'OAUTH_CLIENT_REGISTERED',
        }),
      );
    });
  });

  describe('rotateClientSecret', () => {
    it('should rotate client secret and update secret hash', async () => {
      prisma.oAuthClient.findUnique.mockResolvedValue(mockClient);
      prisma.oAuthClient.update.mockResolvedValue(mockClient);

      const res = await service.rotateClientSecret(mockClient.client_id);

      expect(res.newClientSecret).toMatch(/^sec_/);
      expect(prisma.oAuthClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { client_id: mockClient.client_id },
          data: expect.objectContaining({
            client_secret_hash: expect.any(String),
          }),
        }),
      );
    });
  });

  describe('validateAuthorizeRequest', () => {
    it('should reject request without code_challenge or non-S256 method', async () => {
      await expect(
        service.validateAuthorizeRequest(
          {
            client_id: mockClient.client_id,
            redirect_uri: mockClient.redirect_uris[0],
            response_type: 'code',
            scope: 'openid',
            code_challenge: 'abc',
            code_challenge_method: 'plain' as any,
          },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject redirect_uri mismatch strictly', async () => {
      prisma.oAuthClient.findUnique.mockResolvedValue(mockClient);

      await expect(
        service.validateAuthorizeRequest(
          {
            client_id: mockClient.client_id,
            redirect_uri: 'https://evil.com/callback',
            response_type: 'code',
            scope: 'openid',
            code_challenge: 'challenge',
            code_challenge_method: 'S256',
          },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if user verification level is below client required verification level', async () => {
      const highKycClient = {
        ...mockClient,
        required_verification_level: VerificationLevel.LEVEL_3,
      };
      prisma.oAuthClient.findUnique.mockResolvedValue(highKycClient);
      prisma.user.findUnique.mockResolvedValue(mockUser); // user is only LEVEL_2

      await expect(
        service.validateAuthorizeRequest(
          {
            client_id: highKycClient.client_id,
            redirect_uri: highKycClient.redirect_uris[0],
            response_type: 'code',
            scope: 'openid',
            code_challenge: 'challenge',
            code_challenge_method: 'S256',
          },
          mockUser.id,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('exchangeAuthorizationCode with PKCE', () => {
    it('should reject code exchange if PKCE verifier does not match challenge', async () => {
      const codeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
      const actualChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

      const codeRecord = {
        id: 'code-1',
        code_hash: 'hash-of-code',
        client_id: mockClient.client_id,
        user_id: mockUser.id,
        redirect_uri: mockClient.redirect_uris[0],
        scope: 'openid email',
        code_challenge: actualChallenge,
        code_challenge_method: 'S256',
        expires_at: new Date(Date.now() + 60000),
        is_used: false,
        client: mockClient,
      };

      prisma.oAuthAuthorizationCode.findUnique.mockResolvedValue(codeRecord);

      // Supply wrong verifier
      await expect(
        service.exchangeToken({
          grant_type: 'authorization_code',
          client_id: mockClient.client_id,
          code: 'some-code',
          redirect_uri: mockClient.redirect_uris[0],
          code_verifier: 'wrong-verifier-123456789012345678901234567890',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('exchangeRefreshToken and Replay Attack Protection', () => {
    it('should detect replay attack when already-used refresh token is submitted and revoke token lineage', async () => {
      const alreadyUsedToken = {
        id: 'rt-old-1',
        client_id: mockClient.client_id,
        user_id: mockUser.id,
        scope: 'openid email',
        is_used: true, // Marked as used already!
        is_revoked: false,
        expires_at: new Date(Date.now() + 100000),
      };

      prisma.oAuthRefreshToken.findUnique.mockResolvedValue(alreadyUsedToken);
      prisma.oAuthRefreshToken.updateMany.mockResolvedValue({ count: 5 });
      prisma.oAuthAccessToken.updateMany.mockResolvedValue({ count: 5 });

      await expect(
        service.exchangeToken({
          grant_type: 'refresh_token',
          client_id: mockClient.client_id,
          refresh_token: 'old-used-token',
        }),
      ).rejects.toThrow(UnauthorizedException);

      // Assert that entire lineage is revoked
      expect(prisma.oAuthRefreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          client_id: mockClient.client_id,
          user_id: mockUser.id,
        },
        data: { is_revoked: true },
      });

      expect(auditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'OAUTH_TOKEN_REPLAY_DETECTED',
        }),
      );
    });
  });
});
