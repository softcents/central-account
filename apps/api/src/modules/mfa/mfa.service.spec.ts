import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { authenticator } from 'otplib';
import { MfaService } from './mfa.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';

describe('MfaService (Unit Tests)', () => {
  let mfaService: MfaService;
  let prisma: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ email: 'user@example.com' }),
      },
      mfaMethod: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    auditService = {
      logEvent: jest.fn().mockResolvedValue({ id: 'audit-log-mfa' }),
    };

    const emailService = {
      sendMfaStatusEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MfaService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    mfaService = module.get<MfaService>(MfaService);
  });

  describe('generateMfaSecret', () => {
    it('should generate a secret, QR code data url, and 10 recovery codes', async () => {
      const result = await mfaService.generateMfaSecret({
        id: 'user-1',
        email: 'user@example.com',
      });

      expect(result.secret).toBeDefined();
      expect(result.qrCodeDataUrl).toContain('data:image/png;base64');
      expect(result.backupCodes).toHaveLength(10);
      expect(result.otpAuthUrl).toContain('Central%20Identity%20Platform');
    });
  });

  describe('enableMfa', () => {
    it('should reject invalid 6-digit code', async () => {
      const secret = authenticator.generateSecret();
      await expect(
        mfaService.enableMfa('user-1', secret, '000000', ['code1', 'code2']),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully enable MFA with correct TOTP code', async () => {
      const secret = authenticator.generateSecret();
      const validCode = authenticator.generate(secret);

      prisma.mfaMethod.findFirst.mockResolvedValue(null);
      prisma.mfaMethod.create.mockResolvedValue({ id: 'mfa-1', is_enabled: true });

      const result = await mfaService.enableMfa(
        'user-1',
        secret,
        validCode,
        ['code-12345'],
      );

      expect(result.success).toBe(true);
      expect(auditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          eventType: 'MFA_ENABLED',
        }),
      );
    });
  });
});
