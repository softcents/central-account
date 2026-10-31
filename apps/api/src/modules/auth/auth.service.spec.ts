import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus, UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MfaService } from '../mfa/mfa.service';
import { EmailService } from '../email/email.service';

describe('AuthService (Unit Tests)', () => {
  let authService: AuthService;
  let prisma: any;
  let auditService: any;
  let mfaService: any;
  let jwtService: any;
  let emailService: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      userProfile: {
        create: jest.fn(),
      },
      userSecurity: {
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      },
      userSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      emailVerification: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((callback) => {
        if (typeof callback === 'function') {
          return callback(prisma);
        }
        return Promise.all(callback);
      }),
    };

    auditService = {
      logEvent: jest.fn().mockResolvedValue({ id: 'audit-log-1' }),
    };

    mfaService = {
      verifyTotpOrBackup: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked.jwt.token'),
      verify: jest.fn(),
    };

    emailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(true),
      sendAccountCreatedEmail: jest.fn().mockResolvedValue(undefined),
      sendLoginAlertEmail: jest.fn().mockResolvedValue(undefined),
      sendSecurityAlertEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: MfaService, useValue: mfaService },
        { provide: JwtService, useValue: jwtService },
        { provide: EmailService, useValue: emailService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              if (key === 'FRONTEND_URL') return 'http://localhost:3000';
              if (key === 'JWT_ACCESS_SECRET') return 'test_access_secret';
              if (key === 'JWT_REFRESH_SECRET') return 'test_refresh_secret';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('Password Hashing (Argon2id)', () => {
    it('should hash a plain password and verify successfully', async () => {
      const password = 'StrongPassword123!';
      const hash = await authService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).toContain('$argon2id$');

      const isMatch = await authService.verifyPassword(hash, password);
      expect(isMatch).toBe(true);

      const isWrongMatch = await authService.verifyPassword(hash, 'WrongPassword456!');
      expect(isWrongMatch).toBe(false);
    });
  });

  describe('Registration', () => {
    it('should throw ConflictException if email already registered', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-user', email: 'test@example.com' });

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          countryCode: 'US',
          termsAccepted: true,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user, profile, security, and verification token on successful registration', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'test@example.com',
        status: 'PENDING_VERIFICATION',
        email_verified: false,
      });

      const result = await authService.register({
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        countryCode: 'US',
        termsAccepted: true,
      });

      expect(result.success).toBe(true);
      expect(result.verificationUrl).toContain('/verify-email?token=');
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.stringContaining('/verify-email?token='),
      );
      expect(auditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-uuid-1',
          eventType: 'ACCOUNT_CREATED',
        }),
      );
    });
  });

  describe('Email Verification', () => {
    it('should verify email and activate account when token is valid', async () => {
      prisma.emailVerification.findUnique.mockResolvedValue({
        id: 'verif-1',
        user_id: 'user-uuid-1',
        expires_at: new Date(Date.now() + 100000),
        verified_at: null,
        user: { email: 'test@example.com' },
      });

      const result = await authService.verifyEmail('valid-token-string');
      expect(result.success).toBe(true);
      expect(auditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-uuid-1',
          eventType: 'EMAIL_VERIFIED',
        }),
      );
    });
  });

  describe('Brute-Force Lockout & Login', () => {
    it('should throw Locked status if account is locked_until future date', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'test@example.com',
        security: {
          locked_until: new Date(Date.now() + 10 * 60 * 1000), // locked for 10 more minutes
        },
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(HttpException);
    });

    it('should lock account after reaching failed attempt threshold', async () => {
      const hash = await authService.hashPassword('CorrectPassword123!');
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'test@example.com',
        password_hash: hash,
        security: {
          failed_login_attempts: 4, // 5th attempt will lock
          locked_until: null,
        },
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(HttpException);

      expect(prisma.userSecurity.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            failed_login_attempts: 5,
            locked_until: expect.any(Date),
          }),
        }),
      );
    });
  });
});
