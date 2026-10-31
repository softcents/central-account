import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { RequestEmailChangeDto } from './dto/request-email-change.dto';
import {
  EmailChangeStatus,
  MessageSenderType,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  VerificationLevel,
} from '@prisma/client';

@Injectable()
export class EmailChangeService {
  private readonly logger = new Logger(EmailChangeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Step 1: User requests an email change.
   * Enforces:
   * - Must not match current email
   * - Must not already be taken by another user
   * - User must be verified with KYC Level >= 2 (LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5)
   * - Auto-creates a support_ticket in category EMAIL_CHANGE
   * - Dispatches security notice to OLD email
   */
  async requestEmailChange(
    userId: string,
    dto: RequestEmailChangeDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const newEmail = dto.newEmail.toLowerCase().trim();

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

    if (user.email === newEmail) {
      throw new BadRequestException('New email cannot be the same as your current email');
    }

    // Check if new email is already registered
    const emailInUse = await this.prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (emailInUse) {
      throw new ConflictException('The requested email is already associated with an account');
    }

    // Check for an already pending email change request
    const pendingRequest = await this.prisma.emailChangeRequest.findFirst({
      where: {
        user_id: userId,
        status: { in: [EmailChangeStatus.PENDING_APPROVAL, EmailChangeStatus.APPROVED] },
      },
    });

    if (pendingRequest) {
      throw new BadRequestException(
        'You already have an active email change request under review or awaiting confirmation.',
      );
    }

    // IDENTITY VERIFICATION SECURITY GATE: Must be at least LEVEL_2
    const latestVerifiedKyc = user.identity_verifications[0];
    const allowedLevels: VerificationLevel[] = [
      VerificationLevel.LEVEL_2,
      VerificationLevel.LEVEL_3,
      VerificationLevel.LEVEL_4,
      VerificationLevel.LEVEL_5,
    ];

    if (!latestVerifiedKyc || !allowedLevels.includes(latestVerifiedKyc.verification_level)) {
      const currentLvl = latestVerifiedKyc ? latestVerifiedKyc.verification_level : 'LEVEL_0 / Unverified';
      this.logger.warn(
        `[EmailChange] User ${user.email} denied email change. Required: Level 2+, Current: ${currentLvl}`,
      );
      throw new ForbiddenException(
        `Email change requires at least Level 2 Identity Verification (Current: ${currentLvl}). Please complete identity verification first.`,
      );
    }

    // Create Support Ticket + EmailChangeRequest in transaction
    const { ticket, request } = await this.prisma.$transaction(async (tx) => {
      const newTicket = await tx.supportTicket.create({
        data: {
          user_id: userId,
          category: TicketCategory.EMAIL_CHANGE,
          subject: `Email Change Request: ${user.email} -> ${newEmail}`,
          description: `User requested primary email change from ${user.email} to ${newEmail}. Verified KYC level: ${latestVerifiedKyc.verification_level}.`,
          status: TicketStatus.IN_REVIEW,
          priority: TicketPriority.HIGH,
        },
      });

      await tx.supportTicketMessage.create({
        data: {
          ticket_id: newTicket.id,
          sender_id: userId,
          sender_type: MessageSenderType.USER,
          message: `Requesting email change from ${user.email} to ${newEmail}. Identity verified at ${latestVerifiedKyc.verification_level}.`,
        },
      });

      const newChangeRequest = await tx.emailChangeRequest.create({
        data: {
          user_id: userId,
          ticket_id: newTicket.id,
          old_email: user.email,
          new_email: newEmail,
          status: EmailChangeStatus.PENDING_APPROVAL,
        },
      });

      return { ticket: newTicket, request: newChangeRequest };
    });

    // Write audit log: EMAIL_CHANGE_REQUESTED
    await this.auditService.logEvent({
      userId,
      eventType: 'EMAIL_CHANGE_REQUESTED',
      ipAddress,
      userAgent,
      metadata: {
        ticketId: ticket.id,
        requestId: request.id,
        oldEmail: user.email,
        newEmail,
        kycLevel: latestVerifiedKyc.verification_level,
      },
    });

    // Send security alert to OLD email
    await this.emailService.sendEmailChangeRequestedEmail(user.email, newEmail, ticket.id);

    return {
      success: true,
      message: 'Email change request submitted and sent to compliance review.',
      ticketId: ticket.id,
      requestId: request.id,
      status: request.status,
    };
  }

  /**
   * Step 2: Admin reviews and decides on the email change request.
   */
  async recordAdminDecision(
    ticketId: string,
    action: 'APPROVE' | 'REJECT',
    notes?: string,
    adminId?: string,
    adminEmail?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const request = await this.prisma.emailChangeRequest.findUnique({
      where: { ticket_id: ticketId },
      include: { user: true, ticket: true },
    });

    if (!request) {
      throw new NotFoundException('Email change request not found for this ticket');
    }

    if (request.status !== EmailChangeStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Email change request has already been ${request.status.toLowerCase()}`);
    }

    if (action === 'REJECT') {
      await this.prisma.$transaction([
        this.prisma.emailChangeRequest.update({
          where: { id: request.id },
          data: {
            status: EmailChangeStatus.REJECTED,
            rejection_reason: notes || 'Compliance review rejected email change',
            approved_by: adminEmail || adminId,
          },
        }),
        this.prisma.supportTicket.update({
          where: { id: ticketId },
          data: {
            status: TicketStatus.REJECTED,
            closed_at: new Date(),
          },
        }),
        this.prisma.supportTicketMessage.create({
          data: {
            ticket_id: ticketId,
            sender_id: adminId || 'admin',
            sender_type: MessageSenderType.ADMIN,
            message: `Email change request was rejected. Reason: ${notes || 'Compliance review rejected'}`,
          },
        }),
      ]);

      await this.auditService.logEvent({
        userId: request.user_id,
        eventType: 'EMAIL_CHANGE_REJECTED',
        ipAddress,
        userAgent,
        metadata: {
          requestId: request.id,
          ticketId,
          admin: adminEmail || adminId,
          notes,
        },
      });

      return {
        success: true,
        message: 'Email change request rejected',
        status: EmailChangeStatus.REJECTED,
      };
    }

    // APPROVAL: Generate signed 24h token for NEW address
    const confirmationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(confirmationToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.emailChangeRequest.update({
        where: { id: request.id },
        data: {
          status: EmailChangeStatus.APPROVED,
          verification_token_hash: tokenHash,
          token_expires_at: expiresAt,
          approved_by: adminEmail || adminId,
        },
      }),
      this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: TicketStatus.APPROVED,
        },
      }),
      this.prisma.supportTicketMessage.create({
        data: {
          ticket_id: ticketId,
          sender_id: adminId || 'admin',
          sender_type: MessageSenderType.ADMIN,
          message: `Email change request approved by compliance. A signed verification link has been sent to ${request.new_email}. The change will finalize when the link is clicked.`,
        },
      }),
    ]);

    await this.auditService.logEvent({
      userId: request.user_id,
      eventType: 'EMAIL_CHANGE_APPROVED',
      ipAddress,
      userAgent,
      metadata: {
        requestId: request.id,
        ticketId,
        admin: adminEmail || adminId,
        newEmail: request.new_email,
      },
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const verificationUrl = `${frontendUrl}/verify-email-change?token=${confirmationToken}`;

    this.logger.log(`[EmailChange] Confirmation URL for new address ${request.new_email}: ${verificationUrl}`);

    // Send verification link to the NEW email address
    await this.emailService.sendEmailChangeVerificationEmail(request.new_email, verificationUrl);

    return {
      success: true,
      message: 'Email change approved and verification link dispatched to new email address',
      status: EmailChangeStatus.APPROVED,
      verificationUrl,
    };
  }

  /**
   * Step 3: Confirmation link clicked from the NEW address.
   * Performs the atomic email swap, session invalidation, and notifications.
   */
  async confirmEmailChange(
    token: string,
    currentSessionId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const tokenHash = this.hashToken(token);

    const request = await this.prisma.emailChangeRequest.findUnique({
      where: { verification_token_hash: tokenHash },
      include: { user: true, ticket: true },
    });

    if (!request || request.status !== EmailChangeStatus.APPROVED) {
      throw new BadRequestException('Invalid or expired confirmation token');
    }

    if (!request.token_expires_at || new Date() > request.token_expires_at) {
      await this.prisma.emailChangeRequest.update({
        where: { id: request.id },
        data: { status: EmailChangeStatus.EXPIRED },
      });
      throw new BadRequestException('Confirmation link has expired. Please submit a new email change request.');
    }

    // Verify target new_email has not been claimed by someone else in the interim
    const emailConflict = await this.prisma.user.findFirst({
      where: {
        email: request.new_email,
        id: { not: request.user_id },
      },
    });

    if (emailConflict) {
      throw new ConflictException('The requested email is no longer available');
    }

    const oldEmail = request.old_email;
    const newEmail = request.new_email;

    // Execute atomic update
    await this.prisma.$transaction(async (tx) => {
      // 1. Swap primary email on User
      await tx.user.update({
        where: { id: request.user_id },
        data: {
          email: newEmail,
          email_verified: true,
          email_verified_at: new Date(),
        },
      });

      // 2. Mark request COMPLETED
      await tx.emailChangeRequest.update({
        where: { id: request.id },
        data: {
          status: EmailChangeStatus.COMPLETED,
        },
      });

      // 3. Close the support ticket
      await tx.supportTicket.update({
        where: { id: request.ticket_id },
        data: {
          status: TicketStatus.CLOSED,
          closed_at: new Date(),
        },
      });

      // 4. Add system completion message
      await tx.supportTicketMessage.create({
        data: {
          ticket_id: request.ticket_id,
          sender_id: request.user_id,
          sender_type: MessageSenderType.SYSTEM,
          message: `Email change confirmed and completed. Primary email address is now ${newEmail}.`,
        },
      });

      // 5. Invalidate all active sessions for this user EXCEPT current session
      const revokeCondition: any = {
        user_id: request.user_id,
        is_revoked: false,
      };
      if (currentSessionId) {
        revokeCondition.id = { not: currentSessionId };
      }

      await tx.userSession.updateMany({
        where: revokeCondition,
        data: { is_revoked: true },
      });
    });

    // Write audit log: EMAIL_CHANGED
    await this.auditService.logEvent({
      userId: request.user_id,
      eventType: 'EMAIL_CHANGED',
      ipAddress,
      userAgent,
      metadata: {
        requestId: request.id,
        ticketId: request.ticket_id,
        oldEmail,
        newEmail,
        sessionsRevoked: true,
      },
    });

    // Notify old address and new address
    await this.emailService.sendEmailChangedNotificationEmail(oldEmail, newEmail);

    return {
      success: true,
      message: 'Primary email address successfully updated to ' + newEmail,
      oldEmail,
      newEmail,
    };
  }

  /**
   * Retrieves active email change request for a user if any
   */
  async getActiveRequest(userId: string) {
    return this.prisma.emailChangeRequest.findFirst({
      where: {
        user_id: userId,
        status: { in: [EmailChangeStatus.PENDING_APPROVAL, EmailChangeStatus.APPROVED] },
      },
      include: { ticket: true },
    });
  }
}
