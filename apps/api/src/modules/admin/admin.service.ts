import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { AdminRole, UserStatus, VerificationLevel, BusinessLevel } from '@prisma/client';
import { getComputedNidHash } from '../../common/utils/nid.util';
import { AdminLoginDto, CreateAdminUserDto } from './dto/admin-login.dto';
import {
  AdminTicketReplyDto,
  ReviewDecision,
  ReviewKycDto,
  ReviewKybDto,
  UpdateTenantStatusDto,
  UpdateUserStatusDto,
} from './dto/admin-review.dto';

import { JobQueueService } from '../identity/services/job-queue.service';
import { DocumentStorageService } from '../identity/services/document-storage.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly jobQueue: JobQueueService,
    private readonly documentStorage: DocumentStorageService,
  ) {}

  // -------------------------------------------------------------
  // ADMIN AUTHENTICATION
  // -------------------------------------------------------------

  async login(dto: AdminLoginDto, ipAddress?: string, userAgent?: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid administrative credentials');
    }

    if (admin.status !== 'ACTIVE') {
      throw new ForbiddenException('Admin account has been suspended');
    }

    const isMatch = await argon2.verify(admin.password_hash, dto.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid administrative credentials');
    }

    // Update last login
    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { last_login_at: new Date() },
    });

    // Generate Admin JWT
    const payload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      type: 'admin',
    };

    const secret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
      'access_token_secret_key_super_secure_32chars_min',
    );
    const accessToken = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn: '24h',
    });

    const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.adminSession.create({
      data: {
        admin_id: admin.id,
        token_hash: tokenHash,
        ip_address: ipAddress || '127.0.0.1',
        user_agent: userAgent || 'AdminPortal',
        expires_at: expiresAt,
      },
    });

    await this.logAdminAction(admin.id, 'ADMIN_LOGIN', 'admin_users', admin.id, {
      ip: ipAddress,
    });

    return {
      accessToken,
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.first_name,
        lastName: admin.last_name,
        role: admin.role,
      },
    };
  }

  async logout(adminId: string, token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await this.prisma.adminSession.deleteMany({
      where: { admin_id: adminId, token_hash: tokenHash },
    });
    await this.logAdminAction(adminId, 'ADMIN_LOGOUT', 'admin_users', adminId);
    return { success: true };
  }

  async getAdminProfile(adminId: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        status: true,
        last_login_at: true,
        created_at: true,
      },
    });
    if (!admin) throw new NotFoundException('Admin not found');
    return admin;
  }

  // -------------------------------------------------------------
  // DASHBOARD & MONITORING STATS
  // -------------------------------------------------------------

  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      pendingKycCount,
      totalBusinesses,
      verifiedBusinesses,
      pendingKybCount,
      totalTenants,
      totalSubscriptions,
      openTicketsCount,
      recentAuditLogs,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.identityVerification.count({ where: { status: 'VERIFIED' } }),
      this.prisma.identityVerification.count({
        where: { status: { in: ['PENDING', 'PROCESSING', 'REVIEW_REQUIRED'] } },
      }),
      this.prisma.business.count(),
      this.prisma.business.count({ where: { status: 'VERIFIED' } }),
      this.prisma.business.count({
        where: { status: { in: ['PENDING', 'DOCUMENT_PROCESSING', 'UNDER_REVIEW'] } },
      }),
      (this.prisma as any).tenant.count(),
      (this.prisma as any).subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_REVIEW'] } } }),
      (this.prisma as any).adminAuditLog.findMany({
        take: 8,
        orderBy: { created_at: 'desc' },
        include: {
          admin: {
            select: { email: true, first_name: true, last_name: true, role: true },
          },
        },
      }),
    ]);

    // Calculate approximate monthly revenue from subscriptions
    const activeSubs = await (this.prisma as any).subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { plan: true },
    });
    const monthlyRevenue = activeSubs.reduce((acc: number, sub: any) => {
      return acc + (sub.plan?.price_monthly || 0);
    }, 0);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        verified: verifiedUsers,
        pendingKyc: pendingKycCount,
      },
      businesses: {
        total: totalBusinesses,
        verified: verifiedBusinesses,
        pendingKyb: pendingKybCount,
      },
      saas: {
        tenants: totalTenants,
        activeSubscriptions: totalSubscriptions,
        estimatedMrr: monthlyRevenue,
      },
      support: {
        openTickets: openTicketsCount,
      },
      recentActivity: recentAuditLogs,
      systemHealth: {
        database: 'HEALTHY',
        redis: 'HEALTHY',
        faceService: 'READY',
        timestamp: new Date(),
      },
    };
  }

  // -------------------------------------------------------------
  // USER MANAGEMENT
  // -------------------------------------------------------------

  findExistingFile(filePath?: string | null): string | null {
    if (!filePath) return null;
    if (fs.existsSync(filePath)) return filePath;
    const cwd = process.cwd();
    const basename = path.basename(filePath);
    const candidates = [
      path.resolve(cwd, filePath),
      path.resolve(cwd, 'uploads', basename),
      path.resolve(cwd, 'uploads', 'identity', basename),
      path.resolve(cwd, 'uploads', 'business', basename),
      path.resolve(cwd, 'apps', 'api', 'uploads', basename),
      path.resolve(cwd, 'apps', 'api', 'uploads', 'identity', basename),
      path.resolve(cwd, 'apps', 'api', 'uploads', 'business', basename),
    ];
    for (const c of candidates) {
      try {
        if (fs.existsSync(c)) return c;
      } catch {
        // ignore
      }
    }
    return null;
  }

  async getUsers(search?: string, status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search && search.trim()) {
      const q = search.trim();
      const orConditions: any[] = [
        { email: { contains: q, mode: 'insensitive' } },
        { profile: { first_name: { contains: q, mode: 'insensitive' } } },
        { profile: { last_name: { contains: q, mode: 'insensitive' } } },
        { profile: { phone_number: { contains: q, mode: 'insensitive' } } },
        { customer_registration: { nid_passport_number: { contains: q, mode: 'insensitive' } } },
        { customer_registration: { full_name: { contains: q, mode: 'insensitive' } } },
        { customer_registration: { phone_number: { contains: q, mode: 'insensitive' } } },
        { customer_registration: { company_name: { contains: q, mode: 'insensitive' } } },
        { customer_registration: { contact_phone: { contains: q, mode: 'insensitive' } } },
        { customer_registration: { contact_email: { contains: q, mode: 'insensitive' } } },
        { customer_registration: { father_name: { contains: q, mode: 'insensitive' } } },
        { customer_registration: { mother_name: { contains: q, mode: 'insensitive' } } },
        {
          identity_verifications: {
            some: {
              documents: {
                some: {
                  ocr_results: {
                    some: {
                      document_number: { contains: q, mode: 'insensitive' },
                    },
                  },
                },
              },
            },
          },
        },
        {
          identity_verifications: {
            some: {
              documents: {
                some: {
                  ocr_results: {
                    some: {
                      full_name: { contains: q, mode: 'insensitive' },
                    },
                  },
                },
              },
            },
          },
        },
      ];

      // If search query is or contains an NID, match computed blind index HMAC hash as well
      const hmacKey = this.configService.get<string>('NID_HMAC_KEY');
      const nidHash = getComputedNidHash(q, hmacKey);
      if (nidHash) {
        orConditions.push({ customer_registration: { nid_hash: nidHash } });
      }

      where.OR = orConditions;
    }

    if (status) {
      where.status = status;
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          email: true,
          status: true,
          email_verified: true,
          customer_registration_completed: true,
          created_at: true,
          profile: {
            select: {
              first_name: true,
              last_name: true,
              country_code: true,
              phone_number: true,
            },
          },
          customer_registration: {
            select: {
              customer_type: true,
              full_name: true,
              nid_passport_number: true,
              company_name: true,
              phone_number: true,
              gender: true,
              date_of_birth: true,
            },
          },
          identity_verifications: {
            take: 1,
            orderBy: { created_at: 'desc' },
            select: {
              id: true,
              status: true,
              verification_level: true,
            },
          },
          business_memberships: {
            take: 1,
            select: {
              role: true,
              business: { select: { id: true, legal_name: true, status: true } },
            },
          },
        },
      }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        customer_registration: true,
        security: true,
        sessions: {
          orderBy: { created_at: 'desc' },
          take: 25,
        },
        identity_verifications: {
          orderBy: { created_at: 'desc' },
          include: {
            documents: {
              include: {
                ocr_results: true,
                document_type: true,
              },
            },
            face_verifications: true,
            liveness_verifications: true,
            results: {
              orderBy: { created_at: 'desc' },
            },
          },
        },
        business_memberships: {
          include: {
            business: {
              include: {
                documents: {
                  include: { document_type: true },
                },
              },
            },
          },
        },
        support_tickets: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
        audit_logs: {
          orderBy: { created_at: 'desc' },
          take: 25,
        },
        verification_attempts: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
        mfa_methods: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // Build document & face image URLs with file existence checks for all identity verifications
    const formattedVerifications = user.identity_verifications.map((verif) => {
      const documents = verif.documents.map((doc) => {
        const frontResolved = this.findExistingFile(doc.front_image_path);
        const backResolved = this.findExistingFile(doc.back_image_path);
        return {
          ...doc,
          frontImageUrl: `/admin/kyc/documents/${doc.id}/file/front`,
          backImageUrl: doc.back_image_path ? `/admin/kyc/documents/${doc.id}/file/back` : null,
          frontImageExists: Boolean(frontResolved),
          backImageExists: Boolean(backResolved),
        };
      });

      const face_verifications = verif.face_verifications.map((fv) => {
        const portraitResolved = this.findExistingFile(fv.portrait_image_path);
        const liveResolved = this.findExistingFile(fv.live_face_image_path);
        return {
          ...fv,
          portraitImageUrl: fv.portrait_image_path ? `/admin/kyc/${verif.id}/face/portrait` : null,
          liveImageUrl: fv.live_face_image_path ? `/admin/kyc/${verif.id}/face/live` : null,
          portraitImageExists: Boolean(portraitResolved),
          liveImageExists: Boolean(liveResolved),
        };
      });

      return {
        ...verif,
        documents,
        face_verifications,
      };
    });

    return {
      ...user,
      identity_verifications: formattedVerifications,
    };
  }

  async updateUserStatus(id: string, dto: UpdateUserStatusDto, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: dto.status as UserStatus },
    });

    // Invalidate sessions if suspended
    if (dto.status === 'SUSPENDED') {
      await this.prisma.userSession.updateMany({
        where: { user_id: id },
        data: { is_revoked: true },
      });
    }

    await this.logAdminAction(adminId, 'UPDATE_USER_STATUS', 'users', id, {
      oldStatus: user.status,
      newStatus: dto.status,
      reason: dto.reason,
    });

    return updated;
  }

  // -------------------------------------------------------------
  // USER IMPERSONATION (LOGIN AS CUSTOMER)
  // -------------------------------------------------------------

  async impersonateUser(adminId: string, userId: string, ipAddress?: string, userAgent?: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.status !== 'ACTIVE') {
      throw new UnauthorizedException('Active administrative privileges required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        security: true,
        customer_registration: true,
        mfa_methods: { where: { is_enabled: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('Target user account not found');
    }

    // Sign user access token with impersonation claims
    const accessSecret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
      'access_token_secret_key_super_secure_32chars_min',
    );

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        type: 'access',
        is_impersonated: true,
        impersonated_by: admin.id,
        impersonator_email: admin.email,
      },
      {
        secret: accessSecret,
        expiresIn: '4h',
      },
    );

    // Create session record for tracking and auditing
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours

    const session = await this.prisma.userSession.create({
      data: {
        user_id: user.id,
        refresh_token_hash: refreshTokenHash,
        user_agent: `[IMPERSONATION by Admin ${admin.email}] ${userAgent || 'AdminPortal'}`,
        ip_address: ipAddress || '127.0.0.1',
        device_name: `Admin Impersonation (${admin.email})`,
        expires_at: expiresAt,
        is_revoked: false,
      },
    });

    // Audit log in admin audit logs
    await this.logAdminAction(admin.id, 'IMPERSONATE_USER', 'users', user.id, {
      target_email: user.email,
      target_user_id: user.id,
      admin_email: admin.email,
      admin_role: admin.role,
      session_id: session.id,
      ip: ipAddress,
    });

    // Audit log in user audit logs
    try {
      await this.prisma.auditLog.create({
        data: {
          user_id: user.id,
          event_type: 'ADMIN_IMPERSONATION_STARTED' as any,
          ip_address: ipAddress || '127.0.0.1',
          user_agent: userAgent || 'AdminPortal',
          metadata: {
            impersonated_by_admin_id: admin.id,
            admin_email: admin.email,
            admin_role: admin.role,
            session_id: session.id,
          },
        },
      });
    } catch (e) {
      // ignore
    }

    const redirectUrl =
      user.customer_registration_completed === false
        ? '/customer-registration'
        : '/dashboard';

    return {
      success: true,
      message: `Successfully established impersonation session for ${user.email}`,
      accessToken,
      refreshToken: rawRefreshToken,
      sessionId: session.id,
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        emailVerified: user.email_verified,
        customerRegistrationCompleted: user.customer_registration_completed ?? false,
        customerRegistration: user.customer_registration,
        mfaEnabled: (user.mfa_methods || []).length > 0,
        profile: user.profile,
      },
      impersonator: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        firstName: admin.first_name,
        lastName: admin.last_name,
      },
      redirectUrl,
    };
  }

  async leaveImpersonation(adminId: string, userId?: string, ipAddress?: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new UnauthorizedException('Admin session invalid');
    }

    await this.logAdminAction(admin.id, 'LEAVE_IMPERSONATION', 'users', userId, {
      admin_email: admin.email,
      target_user_id: userId,
      ip: ipAddress,
    });

    if (userId) {
      try {
        await this.prisma.auditLog.create({
          data: {
            user_id: userId,
            event_type: 'ADMIN_IMPERSONATION_ENDED' as any,
            ip_address: ipAddress || '127.0.0.1',
            metadata: {
              impersonated_by_admin_id: admin.id,
              admin_email: admin.email,
            },
          },
        });
      } catch (e) {
        // ignore
      }
    }

    return {
      success: true,
      message: 'Impersonation ended successfully',
    };
  }

  // -------------------------------------------------------------
  // KYC QUEUE & MANUAL REVIEW
  // -------------------------------------------------------------

  async getKycQueue(status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status === 'NEEDS_REVIEW') {
      where.status = { in: ['PENDING', 'PROCESSING', 'REVIEW_REQUIRED'] };
    } else if (status === 'ALL') {
      // no status filter
    } else if (status) {
      where.status = status;
    } else {
      // Default: everything an admin may need to act on, including auto-rejections
      where.status = { in: ['PENDING', 'PROCESSING', 'REVIEW_REQUIRED', 'REJECTED'] };
    }

    const [total, items] = await Promise.all([
      this.prisma.identityVerification.count({ where }),
      this.prisma.identityVerification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: true,
            },
          },
          documents: {
            include: { ocr_results: true },
          },
          face_verifications: true,
          liveness_verifications: true,
          results: true,
        },
      }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getKycDetail(id: string) {
    const verification = await this.prisma.identityVerification.findUnique({
      where: { id },
      include: {
        user: {
          include: { profile: true },
        },
        documents: {
          include: { ocr_results: true, document_type: true },
        },
        face_verifications: true,
        liveness_verifications: true,
        results: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!verification) throw new NotFoundException('KYC verification not found');

    // Build document file URLs for admin panel
    const documentsWithUrls = verification.documents.map((doc) => {
      const frontResolved = this.findExistingFile(doc.front_image_path);
      const backResolved = this.findExistingFile(doc.back_image_path);
      return {
        ...doc,
        frontImageUrl: `/admin/kyc/documents/${doc.id}/file/front`,
        backImageUrl: doc.back_image_path ? `/admin/kyc/documents/${doc.id}/file/back` : null,
        frontImageExists: Boolean(frontResolved),
        backImageExists: Boolean(backResolved),
      };
    });

    // Build face image URLs for admin panel
    const faceVerificationsWithUrls = verification.face_verifications.map((fv) => {
      const portraitResolved = this.findExistingFile(fv.portrait_image_path);
      const liveResolved = this.findExistingFile(fv.live_face_image_path);
      return {
        ...fv,
        portraitImageUrl: fv.portrait_image_path ? `/admin/kyc/${id}/face/portrait` : null,
        liveImageUrl: fv.live_face_image_path ? `/admin/kyc/${id}/face/live` : null,
        portraitImageExists: Boolean(portraitResolved),
        liveImageExists: Boolean(liveResolved),
      };
    });

    // Get latest system decision
    const latestResult = verification.results[0] || null;

    return {
      ...verification,
      documents: documentsWithUrls,
      face_verifications: faceVerificationsWithUrls,
      systemDecision: latestResult ? {
        decision: latestResult.decision,
        scores: latestResult.scores,
        summary: latestResult.summary,
        reviewerNotes: (latestResult as any).reviewer_notes || null,
        reviewedBy: (latestResult as any).reviewed_by || null,
        createdAt: latestResult.created_at,
      } : null,
    };
  }

  /**
   * Streams a KYC identity document file (front or back) for admin review.
   */
  async getDocumentFile(documentId: string, side: 'front' | 'back'): Promise<{ buffer: Buffer; mimeType: string; fileName: string }> {
    const doc = await this.prisma.identityDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) throw new NotFoundException('Document not found');

    const rawPath = side === 'front' ? doc.front_image_path : doc.back_image_path;
    if (!rawPath) {
      throw new NotFoundException(`No ${side} image available for this document`);
    }

    const filePath = this.findExistingFile(rawPath);
    if (!filePath) {
      throw new NotFoundException(`Document file not found on disk: ${side}`);
    }

    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
    };
    const mimeType = mimeMap[ext] || 'application/octet-stream';
    const fileName = path.basename(filePath);

    return { buffer, mimeType, fileName };
  }

  /**
   * Streams a face verification photo (portrait or live selfie) for admin review.
   */
  async getFaceFile(verificationId: string, type: 'portrait' | 'live'): Promise<{ buffer: Buffer; mimeType: string; fileName: string }> {
    const faceRecord = await this.prisma.faceVerification.findFirst({
      where: { verification_id: verificationId },
      orderBy: { created_at: 'desc' },
    });

    if (!faceRecord) throw new NotFoundException('Face verification record not found');

    const rawPath = type === 'portrait' ? faceRecord.portrait_image_path : faceRecord.live_face_image_path;
    if (!rawPath) {
      throw new NotFoundException(`No ${type} image available for this verification`);
    }

    const filePath = this.findExistingFile(rawPath);
    if (!filePath) {
      throw new NotFoundException(`Face ${type} file not found on disk`);
    }

    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const mimeType = mimeMap[ext] || 'image/jpeg';
    const fileName = path.basename(filePath);

    return { buffer, mimeType, fileName };
  }

  async reviewKyc(id: string, dto: ReviewKycDto, adminId: string) {
    const verification = await this.prisma.identityVerification.findUnique({
      where: { id },
    });
    if (!verification) throw new NotFoundException('KYC verification not found');

    let newStatus = verification.status;
    let newLevel = verification.verification_level;

    if (dto.decision === ReviewDecision.APPROVE) {
      newStatus = 'VERIFIED';
      newLevel = VerificationLevel.LEVEL_2;
    } else if (dto.decision === ReviewDecision.REJECT) {
      newStatus = 'REJECTED';
      newLevel = VerificationLevel.LEVEL_0;
    } else {
      newStatus = 'REVIEW_REQUIRED';
    }

    const updated = await this.prisma.identityVerification.update({
      where: { id },
      data: {
        status: newStatus,
        verification_level: newLevel,
        rejection_reasons: dto.reason ? [dto.reason] : [],
      },
    });

    await this.logAdminAction(adminId, 'REVIEW_KYC', 'identity_verifications', id, {
      decision: dto.decision,
      reason: dto.reason,
      notes: dto.notes,
    });

    return updated;
  }

  // -------------------------------------------------------------
  // KYB QUEUE & MANUAL REVIEW
  // -------------------------------------------------------------

  async getKybQueue(status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    } else {
      where.status = { in: ['PENDING', 'DOCUMENT_PROCESSING', 'UNDER_REVIEW'] };
    }

    const [total, items] = await Promise.all([
      this.prisma.business.count({ where }),
      this.prisma.business.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          members: {
            where: { is_primary_contact: true },
            include: { user: { select: { email: true, profile: true } } },
          },
          documents: true,
          verifications: { take: 1, orderBy: { created_at: 'desc' } },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getKybDetail(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              include: {
                profile: true,
                identity_verifications: {
                  take: 1,
                  orderBy: { created_at: 'desc' },
                },
              },
            },
          },
        },
        documents: {
          include: { document_type: true },
        },
        verifications: {
          include: { results: true },
        },
      },
    });

    if (!business) throw new NotFoundException('Business KYB not found');
    return business;
  }

  async reviewKyb(id: string, dto: ReviewKybDto, adminId: string) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) throw new NotFoundException('Business not found');

    let newStatus = business.status;
    let newLevel = business.verification_level;

    if (dto.decision === ReviewDecision.APPROVE) {
      newStatus = 'VERIFIED';
      newLevel = BusinessLevel.BUSINESS_LEVEL_2;
    } else if (dto.decision === ReviewDecision.REJECT) {
      newStatus = 'REJECTED';
      newLevel = BusinessLevel.BUSINESS_LEVEL_0;
    } else {
      newStatus = 'UNDER_REVIEW';
    }

    const updated = await this.prisma.business.update({
      where: { id },
      data: {
        status: newStatus,
        verification_level: newLevel,
      },
    });

    await this.logAdminAction(adminId, 'REVIEW_KYB', 'businesses', id, {
      decision: dto.decision,
      reason: dto.reason,
      notes: dto.notes,
    });

    return updated;
  }

  // -------------------------------------------------------------
  // MULTI-TENANT SAAS MANAGEMENT
  // -------------------------------------------------------------

  async getTenants(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, items] = await Promise.all([
      (this.prisma as any).tenant.count(),
      (this.prisma as any).tenant.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          owner: {
            select: { id: true, email: true, profile: true },
          },
          subscriptions: {
            take: 1,
            orderBy: { created_at: 'desc' },
            include: { plan: true },
          },
          _count: {
            select: { members: true, api_keys: true },
          },
        },
      }),
    ]);

    return {
      tenants: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTenantDetail(id: string) {
    const tenant = await (this.prisma as any).tenant.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, email: true, profile: true },
        },
        business: true,
        members: {
          include: {
            user: { select: { id: true, email: true, profile: true } },
          },
        },
        api_keys: true,
        subscriptions: {
          include: { plan: true },
        },
        invoices: {
          take: 10,
          orderBy: { created_at: 'desc' },
        },
        usages: {
          take: 20,
          orderBy: { period_start: 'desc' },
        },
      },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async updateTenantStatus(id: string, dto: UpdateTenantStatusDto, adminId: string) {
    const tenant = await (this.prisma as any).tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const updated = await (this.prisma as any).tenant.update({
      where: { id },
      data: { status: dto.status },
    });

    if (dto.planId) {
      // Update or create active subscription
      await (this.prisma as any).subscription.updateMany({
        where: { tenant_id: id },
        data: { plan_id: dto.planId },
      });
    }

    await this.logAdminAction(adminId, 'UPDATE_TENANT_STATUS', 'tenants', id, dto);
    return updated;
  }

  // -------------------------------------------------------------
  // BILLING & SUBSCRIPTIONS
  // -------------------------------------------------------------

  async getBillingOverview() {
    const [subscriptions, invoices, plans] = await Promise.all([
      (this.prisma as any).subscription.findMany({
        orderBy: { created_at: 'desc' },
        include: {
          tenant: { select: { id: true, name: true, slug: true } },
          plan: true,
        },
      }),
      (this.prisma as any).invoice.findMany({
        orderBy: { created_at: 'desc' },
        include: {
          tenant: { select: { id: true, name: true } },
          payments: true,
        },
      }),
      (this.prisma as any).plan.findMany(),
    ]);

    const totalCollected = invoices
      .filter((i: any) => i.status === 'PAID')
      .reduce((sum: number, i: any) => sum + (i.amount || 0), 0);

    return {
      plans,
      subscriptions,
      invoices,
      totalCollected,
    };
  }

  async markInvoicePaid(invoiceId: string, adminId: string) {
    const invoice = await (this.prisma as any).invoice.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const updated = await (this.prisma as any).invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paid_at: new Date(),
      },
    });

    const txId = 'PAY_' + crypto.randomBytes(8).toString('hex').toUpperCase();
    await (this.prisma as any).payment.create({
      data: {
        invoice_id: invoiceId,
        tenant_id: invoice.tenant_id,
        amount: invoice.amount,
        currency: invoice.currency,
        status: 'COMPLETED',
        payment_method: 'ADMIN_MANUAL',
        provider: 'MANUAL',
        transaction_id: txId,
      },
    });

    await this.logAdminAction(adminId, 'MARK_INVOICE_PAID', 'invoices', invoiceId, {
      amount: invoice.amount,
      txId,
    });

    return updated;
  }

  // -------------------------------------------------------------
  // SUPPORT TICKETS (ADMIN VIEW & RESPONSE)
  // -------------------------------------------------------------

  async getSupportTickets(status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [total, items] = await Promise.all([
      this.prisma.supportTicket.count({ where }),
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { id: true, email: true, profile: true } },
          _count: { select: { messages: true } },
        },
      }),
    ]);

    return {
      tickets: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSupportTicketDetail(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { include: { profile: true } },
        messages: {
          orderBy: { created_at: 'asc' },
          include: { attachments: true },
        },
        attachments: true,
      },
    });

    if (!ticket) throw new NotFoundException('Support ticket not found');
    return ticket;
  }

  async replySupportTicket(id: string, dto: AdminTicketReplyDto, adminId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminId } });

    const message = await this.prisma.supportTicketMessage.create({
      data: {
        ticket_id: id,
        sender_id: adminId,
        sender_type: 'ADMIN',
        message: dto.content,
      },
    });

    const newStatus = dto.status || 'IN_PROGRESS';
    await this.prisma.supportTicket.update({
      where: { id },
      data: { status: newStatus as any },
    });

    await this.logAdminAction(adminId, 'REPLY_SUPPORT_TICKET', 'support_tickets', id, {
      messageId: message.id,
      newStatus,
    });

    return message;
  }

  // -------------------------------------------------------------
  // OAUTH CLIENT MANAGEMENT
  // -------------------------------------------------------------

  async getOAuthClients() {
    return this.prisma.oAuthClient.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        _count: { select: { authorizations: true } },
      },
    });
  }

  async updateOAuthClientStatus(clientId: string, status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED', adminId: string) {
    const client = await this.prisma.oAuthClient.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundException('OAuth client not found');

    const updated = await this.prisma.oAuthClient.update({
      where: { id: clientId },
      data: { status },
    });

    await this.logAdminAction(adminId, 'UPDATE_OAUTH_CLIENT_STATUS', 'oauth_clients', clientId, {
      status,
    });

    return updated;
  }

  // -------------------------------------------------------------
  // AUDIT LOGS & ADMIN USERS
  // -------------------------------------------------------------

  async getAuditLogs(page = 1, limit = 30) {
    const skip = (page - 1) * limit;

    const [adminLogs, systemLogs] = await Promise.all([
      (this.prisma as any).adminAuditLog.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          admin: { select: { email: true, first_name: true, last_name: true, role: true } },
        },
      }),
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { email: true } },
        },
      }),
    ]);

    return {
      adminLogs,
      systemLogs,
    };
  }

  async getAdminTeam() {
    return this.prisma.adminUser.findMany({
      orderBy: { created_at: 'asc' },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        status: true,
        last_login_at: true,
        created_at: true,
      },
    });
  }

  async createAdminUser(dto: CreateAdminUserDto, currentAdminId: string) {
    const existing = await this.prisma.adminUser.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new BadRequestException('Admin user with this email already exists');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const newAdmin = await this.prisma.adminUser.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        password_hash: passwordHash,
        first_name: dto.firstName,
        last_name: dto.lastName,
        role: dto.role as AdminRole,
        status: 'ACTIVE',
      },
    });

    await this.logAdminAction(currentAdminId, 'CREATE_ADMIN_USER', 'admin_users', newAdmin.id, {
      createdEmail: newAdmin.email,
      role: newAdmin.role,
    });

    return {
      id: newAdmin.id,
      email: newAdmin.email,
      firstName: newAdmin.first_name,
      lastName: newAdmin.last_name,
      role: newAdmin.role,
    };
  }

  // -------------------------------------------------------------
  // QUEUE MONITORING & RETRY PROCEDURES
  // -------------------------------------------------------------

  async getQueueMetrics() {
    return this.jobQueue.getQueueMetrics();
  }

  async getFailedJobs(queueName: string) {
    return this.jobQueue.getFailedJobs(queueName);
  }

  async retryFailedJob(adminId: string, queueName: string, jobId: string) {
    const result = await this.jobQueue.retryFailedJob(queueName, jobId);
    await this.logAdminAction(adminId, 'RETRY_JOB', 'QUEUES', jobId, { queueName });
    return result;
  }

  async cleanQueue(adminId: string, queueName: string) {
    const result = await this.jobQueue.cleanQueue(queueName);
    await this.logAdminAction(adminId, 'CLEAN_QUEUE', 'QUEUES', queueName, { queueName });
    return result;
  }

  // -------------------------------------------------------------
  // HELPER: LOG ADMIN ACTION
  // -------------------------------------------------------------

  private async logAdminAction(
    adminId: string,
    action: string,
    resource: string,
    targetId?: string,
    details?: any,
  ) {
    try {
      await (this.prisma as any).adminAuditLog.create({
        data: {
          admin_id: adminId,
          action,
          resource,
          target_id: targetId,
          details: details ? details : undefined,
        },
      });
    } catch (e) {
      console.error('Failed to log admin action:', e);
    }
  }
}
