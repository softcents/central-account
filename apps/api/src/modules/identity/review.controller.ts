import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AdminAuthGuard } from '../admin/guards/admin-auth.guard';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { CurrentAdmin } from '../admin/decorators/current-admin.decorator';
import { AdminRole } from '@prisma/client';
import { EmailService } from '../email/email.service';

@Controller('internal/review')
@UseGuards(AdminAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.KYC_REVIEWER, AdminRole.IDENTITY_ADMIN)
export class ReviewController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  @Get('pending')
  async getPendingReviews() {
    const list = await this.prisma.identityVerification.findMany({
      where: {
        status: { in: ['REVIEW_REQUIRED', 'PROCESSING', 'REJECTED'] },
      },
      include: {
        user: {
          select: { id: true, email: true, profile: true },
        },
        documents: {
          include: {
            ocr_results: true,
            document_type: true,
          },
        },
        face_verifications: true,
        liveness_verifications: true,
        results: true,
      },
      orderBy: { updated_at: 'desc' },
      take: 50,
    });

    return list.map((item) => ({
      id: item.id,
      userId: item.user_id,
      userEmail: item.user.email,
      userProfile: item.user.profile,
      status: item.status,
      currentStep: item.current_step,
      rejectionReasons: item.rejection_reasons,
      documents: item.documents,
      faceMatch: item.face_verifications[0] || null,
      liveness: item.liveness_verifications[0] || null,
      latestResult: item.results[0] || null,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  }

  @Post(':id/decision')
  @HttpCode(HttpStatus.OK)
  async recordDecision(
    @Param('id') verificationId: string,
    @Body('action') action: 'APPROVE' | 'REJECT' | 'REQUEST_REVERIFICATION',
    @Body('notes') notes: string | undefined,
    @CurrentAdmin('id') reviewerId: string,
    @CurrentAdmin('email') reviewerEmail: string,
    @Req() req: Request,
  ) {
    const verification = await this.prisma.identityVerification.findUnique({
      where: { id: verificationId },
      include: { user: true },
    });

    if (!verification) {
      throw new NotFoundException('Verification record not found');
    }

    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    let newStatus: any = 'REVIEW_REQUIRED';
    let newLevel: any = verification.verification_level;

    if (action === 'APPROVE') {
      newStatus = 'VERIFIED';
      newLevel = 'LEVEL_5'; // Manual compliance verified tier
    } else if (action === 'REJECT') {
      newStatus = 'REJECTED';
      newLevel = 'LEVEL_0';
    } else if (action === 'REQUEST_REVERIFICATION') {
      newStatus = 'PENDING';
      newLevel = 'LEVEL_1';
    } else {
      throw new BadRequestException(`Invalid action: ${action}`);
    }

    await this.prisma.$transaction([
      this.prisma.verificationResult.create({
        data: {
          verification_id: verification.id,
          decision: action,
          summary: `Manual Reviewer Action by ${reviewerEmail || reviewerId}: ${action}`,
          reviewer_notes: notes || null,
          reviewed_by: reviewerEmail || reviewerId,
        },
      }),
      this.prisma.identityVerification.update({
        where: { id: verification.id },
        data: {
          status: newStatus,
          verification_level: newLevel,
          current_step: action === 'REQUEST_REVERIFICATION' ? 'DOCUMENT' : 'COMPLETED',
          rejection_reasons: action === 'REJECT' ? [notes || 'Manual compliance review rejected'] : [],
        },
      }),
    ]);

    await this.auditService.logEvent({
      userId: verification.user_id,
      eventType: `KYC_MANUAL_${action}`,
      ipAddress,
      userAgent,
      metadata: {
        verificationId: verification.id,
        action,
        reviewedBy: reviewerEmail || reviewerId,
        notes,
      },
    });

    // Notify user via EmailService
    await this.emailService.sendKycStatusEmail(verification.user.email, {
      status: newStatus,
      level: newLevel,
      rejectionReasons: action === 'REJECT' ? [notes || 'Compliance review rejected'] : [],
    });

    return {
      success: true,
      message: `Verification successfully updated: ${action}`,
      status: newStatus,
      verificationLevel: newLevel,
    };
  }
}
