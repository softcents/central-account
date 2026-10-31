import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { EmailChangeService } from './email-change.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { EmailChangeStatus, TicketCategory, TicketPriority, TicketStatus, VerificationLevel } from '@prisma/client';

describe('EmailChangeService', () => {
  let service: EmailChangeService;
  let prisma: any;
  let auditService: any;
  let emailService: any;
  let configService: any;

  const mockUserLevel1 = {
    id: 'user-uuid-1',
    email: 'old@example.com',
    identity_verifications: [
      {
        id: 'kyc-1',
        verification_level: VerificationLevel.LEVEL_1,
        status: 'VERIFIED',
      },
    ],
  };

  const mockUserLevel2 = {
    id: 'user-uuid-2',
    email: 'verified@example.com',
    identity_verifications: [
      {
        id: 'kyc-2',
        verification_level: VerificationLevel.LEVEL_2,
        status: 'VERIFIED',
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      emailChangeRequest: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      supportTicket: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      supportTicketMessage: {
        create: jest.fn(),
      },
      userSession: {
        updateMany: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (callbackOrArr) => {
        if (typeof callbackOrArr === 'function') {
          return callbackOrArr(prisma);
        }
        return Promise.all(callbackOrArr);
      }),
    };

    configService = {
      get: jest.fn().mockReturnValue('http://localhost:3000'),
    };

    auditService = {
      logEvent: jest.fn().mockResolvedValue(undefined),
    };

    emailService = {
      sendEmailChangeRequestedEmail: jest.fn().mockResolvedValue(undefined),
      sendEmailChangeVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendEmailChangedNotificationEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailChangeService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configService },
        { provide: AuditService, useValue: auditService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<EmailChangeService>(EmailChangeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestEmailChange', () => {
    it('should reject email change if user KYC level is below LEVEL_2', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(mockUserLevel1) // user check
        .mockResolvedValueOnce(null); // email not taken
      prisma.emailChangeRequest.findFirst.mockResolvedValue(null);

      await expect(
        service.requestEmailChange(mockUserLevel1.id, { newEmail: 'new@example.com' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject email change if user has no verified KYC', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ ...mockUserLevel1, identity_verifications: [] })
        .mockResolvedValueOnce(null);
      prisma.emailChangeRequest.findFirst.mockResolvedValue(null);

      await expect(
        service.requestEmailChange(mockUserLevel1.id, { newEmail: 'new@example.com' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should succeed for LEVEL_2 user, create ticket, request, and alert old email', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(mockUserLevel2) // for user
        .mockResolvedValueOnce(null); // for new email check
      prisma.emailChangeRequest.findFirst.mockResolvedValue(null);

      const mockCreatedTicket = { id: 'ticket-ec-1' };
      const mockCreatedRequest = { id: 'req-ec-1', status: EmailChangeStatus.PENDING_APPROVAL };
      prisma.supportTicket.create.mockResolvedValue(mockCreatedTicket);
      prisma.supportTicketMessage.create.mockResolvedValue({ id: 'msg-1' });
      prisma.emailChangeRequest.create.mockResolvedValue(mockCreatedRequest);

      const res = await service.requestEmailChange(mockUserLevel2.id, {
        newEmail: 'brandnew@example.com',
      });

      expect(res.success).toBe(true);
      expect(prisma.supportTicket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            category: TicketCategory.EMAIL_CHANGE,
            priority: TicketPriority.HIGH,
          }),
        }),
      );
      expect(auditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserLevel2.id,
          eventType: 'EMAIL_CHANGE_REQUESTED',
        }),
      );
      expect(emailService.sendEmailChangeRequestedEmail).toHaveBeenCalledWith(
        mockUserLevel2.email,
        'brandnew@example.com',
        'ticket-ec-1',
      );
    });
  });

  describe('recordAdminDecision', () => {
    const mockPendingReq = {
      id: 'req-1',
      ticket_id: 'ticket-1',
      user_id: 'user-1',
      old_email: 'old@example.com',
      new_email: 'new@example.com',
      status: EmailChangeStatus.PENDING_APPROVAL,
      user: { id: 'user-1', email: 'old@example.com' },
      ticket: { id: 'ticket-1' },
    };

    it('should handle REJECT action: update status, close ticket, log audit', async () => {
      prisma.emailChangeRequest.findUnique.mockResolvedValue(mockPendingReq);
      prisma.emailChangeRequest.update.mockResolvedValue({ ...mockPendingReq, status: EmailChangeStatus.REJECTED });
      prisma.supportTicket.update.mockResolvedValue({ id: 'ticket-1', status: TicketStatus.REJECTED });
      prisma.supportTicketMessage.create.mockResolvedValue({ id: 'msg-rej' });

      const res = await service.recordAdminDecision('ticket-1', 'REJECT', 'Document unreadable', 'admin-1', 'admin@ci.local');

      expect(res.status).toBe(EmailChangeStatus.REJECTED);
      expect(auditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          eventType: 'EMAIL_CHANGE_REJECTED',
        }),
      );
    });

    it('should handle APPROVE action: generate token, update status, send email with verification link', async () => {
      prisma.emailChangeRequest.findUnique.mockResolvedValue(mockPendingReq);
      prisma.emailChangeRequest.update.mockResolvedValue({ ...mockPendingReq, status: EmailChangeStatus.APPROVED });
      prisma.supportTicket.update.mockResolvedValue({ id: 'ticket-1', status: TicketStatus.APPROVED });
      prisma.supportTicketMessage.create.mockResolvedValue({ id: 'msg-app' });

      const res = await service.recordAdminDecision('ticket-1', 'APPROVE', 'Verified by compliance', 'admin-1', 'admin@ci.local');

      expect(res.status).toBe(EmailChangeStatus.APPROVED);
      expect(res.verificationUrl).toContain('/verify-email-change?token=');
      expect(emailService.sendEmailChangeVerificationEmail).toHaveBeenCalledWith(
        mockPendingReq.new_email,
        expect.stringContaining('/verify-email-change?token='),
      );
      expect(auditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          eventType: 'EMAIL_CHANGE_APPROVED',
        }),
      );
    });
  });

  describe('confirmEmailChange', () => {
    const rawToken = 'test-token-12345';
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const mockApprovedReq = {
      id: 'req-1',
      ticket_id: 'ticket-1',
      user_id: 'user-1',
      old_email: 'old@example.com',
      new_email: 'new@example.com',
      status: EmailChangeStatus.APPROVED,
      verification_token_hash: tokenHash,
      token_expires_at: new Date(Date.now() + 100000),
      user: { id: 'user-1', email: 'old@example.com' },
      ticket: { id: 'ticket-1' },
    };

    it('should throw BadRequestException if token is invalid or request is not APPROVED', async () => {
      prisma.emailChangeRequest.findUnique.mockResolvedValue(null);

      await expect(service.confirmEmailChange('invalid-token')).rejects.toThrow(BadRequestException);
    });

    it('should execute email swap, mark COMPLETED, revoke other sessions, and send notification', async () => {
      prisma.emailChangeRequest.findUnique.mockResolvedValue(mockApprovedReq);
      prisma.user.findFirst.mockResolvedValue(null); // No conflict

      prisma.user.update.mockResolvedValue({ id: 'user-1', email: 'new@example.com' });
      prisma.emailChangeRequest.update.mockResolvedValue({ ...mockApprovedReq, status: EmailChangeStatus.COMPLETED });
      prisma.supportTicket.update.mockResolvedValue({ id: 'ticket-1', status: TicketStatus.CLOSED });
      prisma.supportTicketMessage.create.mockResolvedValue({ id: 'msg-done' });
      prisma.userSession.updateMany.mockResolvedValue({ count: 2 });

      const res = await service.confirmEmailChange(rawToken, 'current-session-id');

      expect(res.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({
            email: 'new@example.com',
            email_verified: true,
          }),
        }),
      );

      // Verify sessions revoked excluding current session
      expect(prisma.userSession.updateMany).toHaveBeenCalledWith({
        where: {
          user_id: 'user-1',
          is_revoked: false,
          id: { not: 'current-session-id' },
        },
        data: { is_revoked: true },
      });

      expect(auditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          eventType: 'EMAIL_CHANGED',
        }),
      );

      expect(emailService.sendEmailChangedNotificationEmail).toHaveBeenCalledWith(
        'old@example.com',
        'new@example.com',
      );
    });
  });
});
