import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentStorageService } from '../identity/services/document-storage.service';
import { JobQueueService } from '../identity/services/job-queue.service';
import { AuditService } from '../audit/audit.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UploadBusinessDocumentDto } from './dto/upload-business-document.dto';

@Injectable()
export class BusinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: DocumentStorageService,
    private readonly jobQueue: JobQueueService,
    private readonly auditService: AuditService,
  ) {}

  async createBusiness(
    userId: string,
    dto: CreateBusinessDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.business.findFirst({
      where: {
        trade_license_number: dto.tradeLicenseNumber.trim(),
        country_code: dto.countryCode.toUpperCase().trim(),
      },
    });

    if (existing) {
      throw new ConflictException(
        'A business with this trade license / registration number already exists in this jurisdiction.',
      );
    }

    // ———————————————————————————————————————————
    // PLAN QUOTA ENFORCEMENT: check monthly KYB limit before creating
    // ———————————————————————————————————————————
    await this.checkKybQuota(userId);

    const business = await this.prisma.$transaction(async (tx) => {
      const b = await tx.business.create({
        data: {
          legal_name: dto.legalName.trim(),
          trade_name: dto.tradeName?.trim() || null,
          business_type: dto.businessType.toUpperCase().trim(),
          country_code: dto.countryCode.toUpperCase().trim(),
          address: dto.address.trim(),
          business_email: dto.businessEmail.toLowerCase().trim(),
          website: dto.website?.trim() || null,
          trade_license_number: dto.tradeLicenseNumber.trim(),
          license_issue_date: dto.licenseIssueDate ? new Date(dto.licenseIssueDate) : null,
          license_expiry_date: dto.licenseExpiryDate ? new Date(dto.licenseExpiryDate) : null,
          issuing_authority: dto.issuingAuthority?.trim() || null,
          description: dto.description?.trim() || null,
          status: 'DRAFT',
          verification_level: 'BUSINESS_LEVEL_0',
        },
      });

      // Add creator as OWNER
      await tx.businessUser.create({
        data: {
          business_id: b.id,
          user_id: userId,
          role: 'OWNER',
          is_primary_contact: true,
        },
      });

      return b;
    });

    await this.auditService.logEvent({
      userId,
      eventType: 'BUSINESS_CREATED',
      ipAddress,
      userAgent,
      metadata: {
        businessId: business.id,
        legalName: business.legal_name,
        countryCode: business.country_code,
      },
    });

    return business;
  }

  /**
   * Checks the monthly KYB creation count against the user's active plan limit.
   * Falls back to FREE plan limits (5/mo) if no tenant/subscription found.
   */
  private async checkKybQuota(userId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Find user's ACTIVE tenant with a plan
    const membership = await (this.prisma as any).tenantMember.findFirst({
      where: { user_id: userId },
      include: {
        tenant: {
          include: {
            subscriptions: {
              where: { status: 'ACTIVE' },
              include: { plan: true },
              take: 1,
              orderBy: { created_at: 'desc' },
            },
          },
        },
      },
    });

    const activePlan = membership?.tenant?.subscriptions?.[0]?.plan;
    // Default to FREE plan limits if no subscription found
    const maxKybMonthly: number = activePlan?.max_kyb_monthly ?? 5;
    const planName: string = activePlan?.name ?? 'Free';

    // Count businesses (KYB entities) created this month for this user
    const usedThisMonth = await this.prisma.businessUser.count({
      where: {
        user_id: userId,
        created_at: { gte: startOfMonth },
      },
    });

    if (usedThisMonth >= maxKybMonthly) {
      throw new ForbiddenException(
        `Monthly KYB limit reached (${usedThisMonth}/${maxKybMonthly}) on your current plan (${planName}). ` +
        `Upgrade your subscription to register additional business entities.`,
      );
    }
  }

  async listUserBusinesses(userId: string) {
    const memberships = await this.prisma.businessUser.findMany({
      where: { user_id: userId },
      include: {
        business: {
          include: {
            documents: { select: { id: true, file_name: true, status: true, created_at: true } },
            verifications: {
              orderBy: { created_at: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return memberships.map((m) => ({
      membershipId: m.id,
      role: m.role,
      isPrimaryContact: m.is_primary_contact,
      business: m.business,
    }));
  }

  async getBusiness(businessId: string, userId: string) {
    const membership = await this.prisma.businessUser.findUnique({
      where: {
        business_id_user_id: { business_id: businessId, user_id: userId },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this business');
    }

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        members: {
          include: {
            user: { select: { id: true, email: true, profile: true } },
          },
        },
        documents: {
          include: { document_type: true },
        },
        verifications: {
          include: {
            owner_kyc: {
              select: { id: true, status: true, verification_level: true },
            },
            results: true,
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!business) {
      throw new NotFoundException('Business entity not found');
    }

    // Check primary owner's Personal KYC status
    const ownerMember = business.members.find((m) => m.role === 'OWNER');
    const ownerKyc = ownerMember
      ? await this.prisma.identityVerification.findFirst({
          where: { user_id: ownerMember.user_id, status: 'VERIFIED' },
          orderBy: { created_at: 'desc' },
        })
      : null;

    return {
      ...business,
      currentUserRole: membership.role,
      ownerKycVerified: !!ownerKyc,
      ownerKycDetails: ownerKyc
        ? { id: ownerKyc.id, level: ownerKyc.verification_level, status: ownerKyc.status }
        : null,
    };
  }

  async uploadDocument(
    businessId: string,
    userId: string,
    dto: UploadBusinessDocumentDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const docType = await this.prisma.businessDocumentType.findUnique({
      where: { code: dto.documentTypeCode.toUpperCase() },
    });

    if (!docType) {
      throw new BadRequestException(`Invalid business document type: ${dto.documentTypeCode}`);
    }

    const saved = this.storage.saveBase64Document(
      dto.fileBase64,
      'business',
      `kyb_${businessId.slice(0, 6)}`,
    );

    const doc = await this.prisma.businessDocument.create({
      data: {
        business_id: business.id,
        document_type_id: docType.id,
        file_path: saved.filePath,
        file_name: dto.fileName || saved.fileName,
        file_type: saved.mimeType,
        status: 'UPLOADED',
      },
    });

    await this.prisma.business.update({
      where: { id: business.id },
      data: {
        status: 'DOCUMENT_PROCESSING',
        verification_level: 'BUSINESS_LEVEL_1',
      },
    });

    // Enqueue Business KYB verification asynchronously
    this.jobQueue.enqueueBusinessKyb({
      businessId: business.id,
      documentId: doc.id,
      imageBase64: dto.fileBase64,
      countryCode: business.country_code,
      ownerUserId: userId,
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      documentId: doc.id,
      message: 'Trade license uploaded successfully. Asynchronous OCR and KYB verification running.',
    };
  }

  async getStatus(businessId: string, userId: string) {
    return this.getBusiness(businessId, userId);
  }
}
