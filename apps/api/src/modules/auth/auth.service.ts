import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService, AuditEventType } from '../audit/audit.service';
import { MfaService } from '../mfa/mfa.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly mfaService: MfaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Hashes a password using Argon2id.
   */
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });
  }

  /**
   * Verifies an Argon2id password hash.
   */
  async verifyPassword(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * User Registration Flow
   */
  async register(
    dto: RegisterDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await this.hashPassword(dto.password);
    const email = dto.email.toLowerCase().trim();

    // Create user, profile, security in a transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password_hash: passwordHash,
          status: 'PENDING_VERIFICATION',
          email_verified: false,
        },
      });

      await tx.userProfile.create({
        data: {
          user_id: newUser.id,
          country_code: dto.countryCode.toUpperCase(),
        },
      });

      await tx.userSecurity.create({
        data: {
          user_id: newUser.id,
          failed_login_attempts: 0,
        },
      });

      return newUser;
    });

    // Generate signed email verification token (valid for 24 hours)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(verificationToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.emailVerification.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'https://account.softcents.com');
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    // Audit log: ACCOUNT_CREATED
    await this.auditService.logEvent({
      userId: user.id,
      eventType: AuditEventType.ACCOUNT_CREATED,
      ipAddress,
      userAgent,
      metadata: { email: user.email, countryCode: dto.countryCode },
    });

    this.logger.log(`[Email Verification] Verification link for ${user.email}: ${verificationUrl}`);

    // Send verification email via SMTP
    await this.emailService.sendVerificationEmail(user.email, verificationUrl);

    return {
      success: true,
      message: 'Account registered successfully. Please verify your email.',
      verificationUrl,
      userId: user.id,
    };
  }

  /**
   * Email Verification Flow
   */
  async verifyEmail(token: string, ipAddress?: string, userAgent?: string) {
    const tokenHash = this.hashToken(token);

    const record = await this.prisma.emailVerification.findUnique({
      where: { token_hash: tokenHash },
      include: { user: true },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (record.verified_at) {
      const existingUser = await this.prisma.user.findUnique({
        where: { id: record.user_id },
        include: {
          profile: true,
          security: true,
          mfa_methods: { where: { is_enabled: true } },
        },
      });
      const userForSession = existingUser || {
        id: record.user_id,
        email: record.user?.email || '',
        status: 'ACTIVE',
        email_verified: true,
        customer_registration_completed: false,
        mfa_methods: [],
        profile: null,
      };
      const sessionData = await this.createSessionAndTokens(userForSession, ipAddress, userAgent);
      return {
        success: true,
        message: 'Email is already verified.',
        accessToken: sessionData.accessToken,
        refreshToken: sessionData.refreshToken,
        sessionId: sessionData.sessionId,
        user: sessionData.user,
        customerRegistrationCompleted: userForSession.customer_registration_completed || false,
        nextStep: '/customer-registration',
      };
    }

    if (new Date() > record.expires_at) {
      throw new BadRequestException('Verification token has expired. Please request a new one.');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerification.update({
        where: { id: record.id },
        data: { verified_at: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.user_id },
        data: {
          email_verified: true,
          email_verified_at: new Date(),
          status: 'ACTIVE',
        },
      }),
    ]);

    await this.auditService.logEvent({
      userId: record.user_id,
      eventType: AuditEventType.EMAIL_VERIFIED,
      ipAddress,
      userAgent,
      metadata: { email: record.user.email },
    });

    // Welcome email upon email verification
    await this.emailService.sendAccountCreatedEmail(record.user.email);

    const verifiedUser = await this.prisma.user.findUnique({
      where: { id: record.user_id },
      include: {
        profile: true,
        security: true,
        mfa_methods: { where: { is_enabled: true } },
      },
    });

    const userForSession = verifiedUser || {
      id: record.user_id,
      email: record.user?.email || '',
      status: 'ACTIVE',
      email_verified: true,
      customer_registration_completed: false,
      mfa_methods: [],
      profile: null,
    };

    const sessionData = await this.createSessionAndTokens(userForSession, ipAddress, userAgent);

    return {
      success: true,
      message: 'Email successfully verified. Please complete your mandatory KYC & Customer Registration.',
      accessToken: sessionData.accessToken,
      refreshToken: sessionData.refreshToken,
      sessionId: sessionData.sessionId,
      user: sessionData.user,
      customerRegistrationCompleted: userForSession.customer_registration_completed || false,
      nextStep: '/customer-registration',
    };
  }

  /**
   * Resend Email Verification with 60-second rate limiting
   */
  async resendVerificationEmail(emailInput: string, ipAddress?: string, userAgent?: string) {
    const email = emailInput.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return generic message to prevent email enumeration
      return {
        success: true,
        message: 'If an unverified account exists with that email, a new verification link has been sent.',
      };
    }

    if (user.email_verified) {
      return { success: true, message: 'Email is already verified.' };
    }

    // Rate-limiting check: last verification token created within 60 seconds
    const latestToken = await this.prisma.emailVerification.findFirst({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
    });

    if (latestToken) {
      const elapsedSeconds = Math.floor((Date.now() - latestToken.created_at.getTime()) / 1000);
      const cooldownSeconds = 60;
      if (elapsedSeconds < cooldownSeconds) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Please wait ${cooldownSeconds - elapsedSeconds} seconds before requesting another verification email.`,
            retryAfter: cooldownSeconds - elapsedSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(verificationToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.emailVerification.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'https://account.softcents.com');
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    this.logger.log(`[Resend Verification] Link for ${user.email}: ${verificationUrl}`);

    // Send verification email via SMTP
    await this.emailService.sendVerificationEmail(user.email, verificationUrl);

    return {
      success: true,
      message: 'A new verification link has been sent to your email address.',
      verificationUrl,
    };
  }

  /**
   * User Login Flow with Brute-Force Protection & MFA Handling
   */
  async login(
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        security: true,
        profile: true,
        mfa_methods: { where: { is_enabled: true } },
      },
    });

    if (!user) {
      await this.auditService.logEvent({
        eventType: AuditEventType.LOGIN_FAILED,
        ipAddress,
        userAgent,
        metadata: { email, reason: 'User not found' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    // 1. Brute-force lockout verification
    const HTTP_STATUS_LOCKED = 423;
    if (user.security?.locked_until && user.security.locked_until > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.security.locked_until.getTime() - Date.now()) / (1000 * 60),
      );
      await this.auditService.logEvent({
        userId: user.id,
        eventType: AuditEventType.LOGIN_FAILED,
        ipAddress,
        userAgent,
        metadata: { email, reason: 'Account locked' },
      });
      throw new HttpException(
        {
          statusCode: HTTP_STATUS_LOCKED,
          message: `Account is temporarily locked due to multiple failed login attempts. Try again in ${remainingMinutes} minute(s).`,
          lockedUntil: user.security.locked_until,
        },
        HTTP_STATUS_LOCKED,
      );
    }

    // 2. Validate Password
    const isPasswordValid = await this.verifyPassword(user.password_hash, dto.password);
    if (!isPasswordValid) {
      const attempts = (user.security?.failed_login_attempts || 0) + 1;
      let lockedUntil: Date | null = null;

      // Lock account after 5 consecutive failures for 15 minutes
      if (attempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await this.prisma.userSecurity.upsert({
        where: { user_id: user.id },
        update: {
          failed_login_attempts: attempts,
          locked_until: lockedUntil,
        },
        create: {
          user_id: user.id,
          failed_login_attempts: attempts,
          locked_until: lockedUntil,
        },
      });

      await this.auditService.logEvent({
        userId: user.id,
        eventType: AuditEventType.LOGIN_FAILED,
        ipAddress,
        userAgent,
        metadata: { email, reason: 'Invalid password', attempts },
      });

      if (lockedUntil) {
        await this.emailService.sendSecurityAlertEmail(user.email, {
          alertType: 'Account Temporarily Locked',
          message: 'Your account was locked for 15 minutes due to 5 consecutive failed login attempts.',
          ipAddress,
          timestamp: new Date(),
        });

        throw new HttpException(
          {
            statusCode: HTTP_STATUS_LOCKED,
            message: 'Too many failed login attempts. Your account has been locked for 15 minutes.',
            lockedUntil,
          },
          HTTP_STATUS_LOCKED,
        );
      }

      throw new UnauthorizedException('Invalid email or password');
    }

    // 3. Reset failed login attempts on valid password
    if ((user.security?.failed_login_attempts || 0) > 0 || user.security?.locked_until) {
      await this.prisma.userSecurity.update({
        where: { user_id: user.id },
        data: {
          failed_login_attempts: 0,
          locked_until: null,
        },
      });
    }

    // 4. Check email verification status
    if (!user.email_verified) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        emailNotVerified: true,
        message: 'Your email address is not verified. Please verify your email before logging in.',
      });
    }

    // 5. MFA Challenge handling
    const isMfaActive = user.mfa_methods.length > 0;
    if (isMfaActive) {
      // Check if MFA code or challenge response is provided
      if (!dto.mfaCode) {
        // Issue short-lived challenge token (valid 5 minutes)
        const mfaChallengeToken = this.jwtService.sign(
          { sub: user.id, type: 'mfa_challenge' },
          {
            secret: this.configService.get<string>('JWT_MFA_SECRET', 'mfa_challenge_secret_32chars'),
            expiresIn: '5m',
          },
        );

        return {
          mfaRequired: true,
          mfaToken: mfaChallengeToken,
          message: 'Two-factor authentication code required.',
        };
      }

      // Verify MFA code
      const isMfaCodeValid = await this.mfaService.verifyTotpOrBackup(user.id, dto.mfaCode);
      if (!isMfaCodeValid) {
        await this.auditService.logEvent({
          userId: user.id,
          eventType: AuditEventType.LOGIN_FAILED,
          ipAddress,
          userAgent,
          metadata: { email, reason: 'Invalid MFA code' },
        });
        throw new UnauthorizedException('Invalid authentication code or recovery code');
      }
    }

    // 6. Issue full session & tokens
    return this.createSessionAndTokens(user, ipAddress, userAgent);
  }

  /**
   * Verifies an MFA Challenge token and completes login.
   */
  async verifyMfaChallenge(
    mfaToken: string,
    code: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    let payload: any;
    try {
      payload = this.jwtService.verify(mfaToken, {
        secret: this.configService.get<string>('JWT_MFA_SECRET', 'mfa_challenge_secret_32chars'),
      });
    } catch {
      throw new UnauthorizedException('MFA challenge session has expired or is invalid. Please log in again.');
    }

    if (payload.type !== 'mfa_challenge' || !payload.sub) {
      throw new UnauthorizedException('Invalid challenge token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        profile: true,
        security: true,
        mfa_methods: { where: { is_enabled: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCodeValid = await this.mfaService.verifyTotpOrBackup(user.id, code);
    if (!isCodeValid) {
      await this.auditService.logEvent({
        userId: user.id,
        eventType: AuditEventType.LOGIN_FAILED,
        ipAddress,
        userAgent,
        metadata: { email: user.email, reason: 'Invalid MFA challenge code' },
      });
      throw new UnauthorizedException('Invalid authentication code or recovery code');
    }

    return this.createSessionAndTokens(user, ipAddress, userAgent);
  }

  /**
   * Creates access token, refresh token, user session, and audit log.
   */
  async createSessionAndTokens(
    user: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET', 'access_secret_key_default_32chars');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET', 'refresh_secret_key_default_32chars');

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, type: 'access' },
      { secret: accessSecret, expiresIn: '15m' },
    );

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const deviceName = this.extractDeviceName(userAgent);

    const session = await this.prisma.userSession.create({
      data: {
        user_id: user.id,
        refresh_token_hash: refreshTokenHash,
        user_agent: userAgent || 'Unknown Client',
        ip_address: ipAddress || 'Unknown IP',
        device_name: deviceName,
        expires_at: expiresAt,
        is_revoked: false,
      },
    });

    await this.auditService.logEvent({
      userId: user.id,
      eventType: AuditEventType.LOGIN_SUCCESS,
      ipAddress,
      userAgent,
      metadata: { sessionId: session?.id || 'session-default-id' },
    });

    // Send login alert notification email
    await this.emailService.sendLoginAlertEmail(user.email, {
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      sessionId: session?.id || 'session-default-id',
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        emailVerified: user.email_verified,
        customerRegistrationCompleted: user.customer_registration_completed || false,
        mfaEnabled: (user.mfa_methods || []).length > 0,
        profile: user.profile,
      },
    };
  }

  /**
   * Refreshes access token using active refresh token.
   */
  async refreshAccessToken(rawRefreshToken: string, ipAddress?: string, userAgent?: string) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const tokenHash = this.hashToken(rawRefreshToken);
    const session = await this.prisma.userSession.findUnique({
      where: { refresh_token_hash: tokenHash },
      include: {
        user: {
          include: {
            profile: true,
            mfa_methods: { where: { is_enabled: true } },
          },
        },
      },
    });

    if (!session || session.is_revoked || session.expires_at < new Date()) {
      throw new UnauthorizedException('Session is invalid or expired. Please log in again.');
    }

    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET', 'access_secret_key_default_32chars');
    const accessToken = this.jwtService.sign(
      { sub: session.user.id, email: session.user.email, type: 'access' },
      { secret: accessSecret, expiresIn: '15m' },
    );

    return {
      accessToken,
      user: {
        id: session.user.id,
        email: session.user.email,
        status: session.user.status,
        emailVerified: session.user.email_verified,
        customerRegistrationCompleted: session.user.customer_registration_completed || false,
        mfaEnabled: session.user.mfa_methods.length > 0,
        profile: session.user.profile,
      },
    };
  }

  /**
   * Logs out user by revoking the session.
   */
  async logout(rawRefreshToken?: string) {
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      await this.prisma.userSession.updateMany({
        where: { refresh_token_hash: tokenHash },
        data: { is_revoked: true },
      });
    }
    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Lists active sessions for a user.
   */
  async getActiveSessions(userId: string, currentRefreshToken?: string) {
    const currentHash = currentRefreshToken ? this.hashToken(currentRefreshToken) : null;

    const sessions = await this.prisma.userSession.findMany({
      where: {
        user_id: userId,
        is_revoked: false,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      deviceName: s.device_name || 'Browser Session',
      ipAddress: s.ip_address || 'Unknown',
      createdAt: s.created_at,
      expiresAt: s.expires_at,
      isCurrent: currentHash ? s.refresh_token_hash === currentHash : false,
    }));
  }

  /**
   * Revokes a specific session.
   */
  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.userSession.findFirst({
      where: { id: sessionId, user_id: userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { is_revoked: true },
    });

    return { success: true, message: 'Session revoked successfully' };
  }

  private extractDeviceName(userAgent?: string): string {
    if (!userAgent) return 'Web Browser';
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Macintosh')) return 'Mac OS Device';
    if (userAgent.includes('iPhone')) return 'iPhone (iOS)';
    if (userAgent.includes('Android')) return 'Android Device';
    if (userAgent.includes('Linux')) return 'Linux Machine';
    return 'Web Browser';
  }
}
