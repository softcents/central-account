import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantService } from '../tenant/tenant.service';

@Injectable()
export class PublicApiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) { }

  // -------------------------------------------------------------------------
  // KYC — Identity Verification
  // -------------------------------------------------------------------------

  /**
   * Retrieve the full, verified KYC profile for a user by their Central
   * Identity user ID or email address. The calling tenant must have this
   * user as a tenant member.
   */
  async getKycResult(tenantId: string, userId: string) {
    // Accept both UUID and email
    const user = await (this.prisma as any).user.findFirst({
      where: { OR: [{ id: userId }, { email: userId }] },
      include: { profile: true },
    });

    if (!user) throw new NotFoundException(`No user found for identifier: ${userId}`);

    // Require the user to be a member of the calling tenant
    const membership = await (this.prisma as any).tenantMember.findFirst({
      where: { tenant_id: tenantId, user_id: user.id },
    });
    if (!membership) {
      throw new ForbiddenException(
        'The requested user is not a member of your organisation. ' +
        'You may only retrieve KYC data for users who belong to your tenant.',
      );
    }

    // Latest VERIFIED identity verification
    const verification = await (this.prisma as any).identityVerification.findFirst({
      where: { user_id: user.id, status: 'VERIFIED' },
      include: {
        documents: {
          include: {
            document_type: true,
            ocr_results: {
              orderBy: { created_at: 'desc' },
              take: 1,
            },
          },
        },
        face_verifications: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
        liveness_verifications: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
        results: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Meter API call (fire-and-forget)
    this.tenantService
      .recordUsage(tenantId, 'API_CALLS' as any, 1)
      .catch(() => { });

    if (!verification) {
      return {
        verified: false,
        userId: user.id,
        email: user.email,
        message: 'No completed KYC verification found for this user.',
      };
    }

    const latestResult = verification.results[0];
    const faceVerif = verification.face_verifications[0];
    const liveness = verification.liveness_verifications[0];

    return {
      verified: true,
      verificationId: verification.id,
      verificationLevel: verification.verification_level,
      status: verification.status,
      verifiedAt: verification.updated_at,

      // Personal identity — only fields that actually exist on UserProfile
      identity: {
        userId: user.id,
        email: user.email,
        firstName: user.profile?.first_name ?? null,
        lastName: user.profile?.last_name ?? null,
        phone: user.profile?.phone_number ?? null,  // schema: phone_number
        countryCode: user.profile?.country_code ?? null,  // schema: country_code (no nationality / address)
      },

      // Documents submitted
      documents: verification.documents.map((doc: any) => {
        const ocr = doc.ocr_results[0];
        return {
          documentId: doc.id,
          type: doc.document_type.code,
          typeName: doc.document_type.name,
          countryCode: doc.country_code,
          status: doc.status,
          ocr: ocr
            ? {
              fullName: ocr.full_name,
              documentNumber: ocr.document_number,
              dateOfBirth: ocr.date_of_birth,
              expiryDate: ocr.expiry_date,
              nationality: ocr.nationality,   // schema: nationality ✓
              gender: ocr.gender,
              address: ocr.address,       // schema: address ✓
              mrz: ocr.mrz_data,
              confidence: ocr.confidence_score,
              fieldConfidences: ocr.field_confidences,  // schema: field_confidences (not extracted_fields)
            }
            : null,
        };
      }),

      // Biometric face match — schema: is_matched, match_score (no match_method)
      faceMatch: faceVerif
        ? {
          matched: faceVerif.is_matched,    // schema: is_matched
          confidence: faceVerif.match_score,   // schema: match_score
          verifiedAt: faceVerif.created_at,
        }
        : null,

      // Liveness — schema: is_live, passive_liveness_score, challenge_type
      liveness: liveness
        ? {
          passed: liveness.is_live,
          score: liveness.passive_liveness_score,   // schema: passive_liveness_score
          challenge: liveness.challenge_type,
          verifiedAt: liveness.created_at,
        }
        : null,

      // VerificationResult — schema has: decision, scores (Json?), summary
      decisionScores: latestResult?.scores ?? null,
      decisionSummary: latestResult?.summary ?? null,
    };
  }

  // -------------------------------------------------------------------------
  // KYB — Business Verification
  // -------------------------------------------------------------------------

  /**
   * Retrieve the full verified KYB profile for a business entity.
   * The calling tenant must have the business owner as a tenant member.
   */
  async getKybResult(tenantId: string, businessId: string) {
    const business = await (this.prisma as any).business.findUnique({
      where: { id: businessId },
      include: {
        members: {
          include: {
            user: { select: { id: true, email: true, profile: true } },
          },
        },
        documents: {
          include: { document_type: true },
          orderBy: { created_at: 'desc' },
        },
        verifications: {
          include: {
            owner_kyc: {
              select: {
                id: true,
                status: true,
                verification_level: true,
                updated_at: true,
              },
            },
            // BusinessVerificationResult has: id, business_verification_id, rules_evaluated, tenant_id, created_at
            results: {
              orderBy: { created_at: 'desc' },
              take: 1,
            },
          },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    });

    if (!business) throw new NotFoundException(`No business found with ID: ${businessId}`);

    // Confirm the business owner is a tenant member of the calling tenant
    const ownerMember = business.members.find((m: any) => m.role === 'OWNER');
    if (!ownerMember) {
      throw new ForbiddenException('Business has no owner on record');
    }

    const tenantLink = await (this.prisma as any).tenantMember.findFirst({
      where: { tenant_id: tenantId, user_id: ownerMember.user_id },
    });
    if (!tenantLink) {
      throw new ForbiddenException(
        'This business is not associated with your organisation. ' +
        'You may only retrieve KYB data for businesses whose owner is a member of your tenant.',
      );
    }

    // Meter API call
    this.tenantService
      .recordUsage(tenantId, 'API_CALLS' as any, 1)
      .catch(() => { });

    // BusinessVerification: decision (String), score (Float), notes (String?)
    // BusinessVerificationResult: rules_evaluated (Json?) — no scores/summary fields
    const latestVerif = business.verifications[0];
    const latestResult = latestVerif?.results[0];

    return {
      verified: business.status === 'VERIFIED',
      businessId: business.id,
      status: business.status,
      verificationLevel: business.verification_level,

      business: {
        legalName: business.legal_name,
        tradeName: business.trade_name,
        businessType: business.business_type,
        countryCode: business.country_code,
        address: business.address,
        businessEmail: business.business_email,
        website: business.website,
        description: business.description,
      },

      tradeLicense: {
        number: business.trade_license_number,
        issueDate: business.license_issue_date,
        expiryDate: business.license_expiry_date,
        issuingAuthority: business.issuing_authority,
      },

      owner: ownerMember
        ? {
          userId: ownerMember.user_id,
          email: ownerMember.user.email,
          name: ownerMember.user.profile
            ? `${ownerMember.user.profile.first_name ?? ''} ${ownerMember.user.profile.last_name ?? ''}`.trim()
            : null,
          kycStatus: latestVerif?.owner_kyc?.status ?? 'NOT_VERIFIED',
          kycLevel: latestVerif?.owner_kyc?.verification_level ?? null,
          kycVerifiedAt: latestVerif?.owner_kyc?.updated_at ?? null,
        }
        : null,

      documents: business.documents.map((doc: any) => ({
        documentId: doc.id,
        type: doc.document_type.code,
        typeName: doc.document_type.name,
        fileName: doc.file_name,
        status: doc.status,
        uploadedAt: doc.created_at,
      })),

      // BusinessVerification fields: decision, score, notes
      decision: latestVerif?.decision ?? null,
      score: latestVerif?.score ?? null,
      notes: latestVerif?.notes ?? null,
      // BusinessVerificationResult: only rules_evaluated is available
      rulesEvaluated: latestResult?.rules_evaluated ?? null,
      verifiedAt: latestVerif?.updated_at ?? null,
    };
  }

  // -------------------------------------------------------------------------
  // Lookup by email — lightweight status check
  // -------------------------------------------------------------------------

  async lookupUserKycStatus(tenantId: string, email: string) {
    const user = await (this.prisma as any).user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) return { found: false, email, verified: false };

    const membership = await (this.prisma as any).tenantMember.findFirst({
      where: { tenant_id: tenantId, user_id: user.id },
    });
    if (!membership) {
      throw new ForbiddenException(
        'The requested user is not a member of your organisation.',
      );
    }

    const verification = await (this.prisma as any).identityVerification.findFirst({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        status: true,
        verification_level: true,
        created_at: true,
        updated_at: true,
      },
    });

    this.tenantService
      .recordUsage(tenantId, 'API_CALLS' as any, 1)
      .catch(() => { });

    return {
      found: true,
      userId: user.id,
      email: user.email,
      verified: verification?.status === 'VERIFIED',
      verificationStatus: verification?.status ?? 'NOT_STARTED',
      verificationLevel: verification?.verification_level ?? 'LEVEL_0',
      lastUpdated: verification?.updated_at ?? null,
    };
  }

  // -------------------------------------------------------------------------
  // Tenant account info
  // -------------------------------------------------------------------------

  async getTenantAccountInfo(tenantId: string) {
    const tenant = await (this.prisma as any).tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          take: 1,
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');

    const plan = {
      name: 'Enterprise Multi-Domain',
      max_kyc_monthly: 999999,
      max_kyb_monthly: 999999,
      max_api_calls_monthly: 9999999,
    };

    return {
      tenantId: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      plan: {
        name: plan.name,
        limits: {
          kycMonthly: plan.max_kyc_monthly,
          kybMonthly: plan.max_kyb_monthly,
          apiCallsMonthly: plan.max_api_calls_monthly,
        },
      },
    };
  }
}
