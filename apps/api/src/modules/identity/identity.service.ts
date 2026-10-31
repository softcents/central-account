import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InternalPythonProvider } from './providers/internal-python.provider';
import { DocumentStorageService } from './services/document-storage.service';
import { JobQueueService } from './services/job-queue.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class IdentityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: InternalPythonProvider,
    private readonly storage: DocumentStorageService,
    private readonly jobQueue: JobQueueService,
    private readonly auditService: AuditService,
  ) {}

  async getOrCreateSession(userId: string) {
    let verification = await this.prisma.identityVerification.findFirst({
      where: {
        user_id: userId,
        status: { in: ['PENDING', 'PROCESSING', 'REVIEW_REQUIRED'] },
      },
      include: {
        documents: {
          include: { ocr_results: true, document_type: true },
        },
        face_verifications: true,
        liveness_verifications: true,
        results: true,
      },
      orderBy: { created_at: 'desc' },
    });

    if (!verification) {
      // Check if user already has a VERIFIED verification
      const verified = await this.prisma.identityVerification.findFirst({
        where: { user_id: userId, status: 'VERIFIED' },
        include: {
          documents: { include: { document_type: true } },
          results: true,
        },
      });
      if (verified) return verified;

      // ——————————————————————————————————————————————————————————————
      // PLAN QUOTA ENFORCEMENT: check monthly KYC limit before creating
      // ——————————————————————————————————————————————————————————————
      await this.checkKycQuota(userId);

      // Create new session
      verification = await this.prisma.identityVerification.create({
        data: {
          user_id: userId,
          status: 'PENDING',
          verification_level: 'LEVEL_1',
          current_step: 'DOCUMENT',
        },
        include: {
          documents: {
            include: { ocr_results: true, document_type: true },
          },
          face_verifications: true,
          liveness_verifications: true,
          results: true,
        },
      });
    }

    return verification;
  }

  /**
   * Checks the monthly KYC usage against the user's active subscription plan limit.
   * Looks up the user's ACTIVE tenant(s) and the linked subscription plan.
   * Falls back to FREE plan limits (20/mo) if no tenant/subscription exists.
   */
  private async checkKycQuota(userId: string) {
    // Subscription & billing disabled — unlimited KYC checks
    return;
  }

  async uploadDocument(
    userId: string,
    verificationId: string,
    documentTypeCode: string,
    countryCode: string,
    frontImageBase64: string,
    backImageBase64?: string,
  ) {
    const verification = await this.prisma.identityVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification || verification.user_id !== userId) {
      throw new NotFoundException('Verification session not found');
    }

    if (verification.status === 'VERIFIED') {
      throw new BadRequestException('Identity is already fully verified');
    }

    const docType = await this.prisma.documentType.findUnique({
      where: { code: documentTypeCode.toUpperCase() },
    });

    if (!docType) {
      throw new BadRequestException(`Invalid document type: ${documentTypeCode}`);
    }

    // Save images to private storage
    const frontSaved = this.storage.saveBase64Document(
      frontImageBase64,
      'identity',
      `front_${userId.slice(0, 6)}`,
    );

    let backSavedPath: string | null = null;
    if (backImageBase64) {
      const backSaved = this.storage.saveBase64Document(
        backImageBase64,
        'identity',
        `back_${userId.slice(0, 6)}`,
      );
      backSavedPath = backSaved.filePath;
    }

    // Create Identity Document record
    const document = await this.prisma.identityDocument.create({
      data: {
        verification_id: verification.id,
        document_type_id: docType.id,
        country_code: countryCode.toUpperCase(),
        front_image_path: frontSaved.filePath,
        back_image_path: backSavedPath,
        status: 'UPLOADED',
      },
    });

    // Update Verification status to PROCESSING
    await this.prisma.identityVerification.update({
      where: { id: verification.id },
      data: {
        status: 'PROCESSING',
        current_step: 'DOCUMENT_PROCESSING',
      },
    });

    // Enqueue Document OCR Job asynchronously
    this.jobQueue.enqueueDocumentOcr({
      verificationId: verification.id,
      documentId: document.id,
      imageBase64: frontImageBase64,
      documentType: docType.code,
      countryCode: countryCode.toUpperCase(),
    });

    return {
      success: true,
      documentId: document.id,
      status: 'PROCESSING',
      message: 'Document uploaded. OCR analysis running in background.',
    };
  }

  async startFaceSession(userId: string, verificationId: string) {
    const verification = await this.prisma.identityVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification || verification.user_id !== userId) {
      throw new NotFoundException('Verification session not found');
    }

    return this.provider.createChallenge(userId);
  }

  async checkFaceQuality(imageBase64: string) {
    return this.provider.assessQuality(imageBase64);
  }

  async submitBiometrics(
    userId: string,
    verificationId: string,
    sessionId: string,
    challengeType: string,
    liveFrameBase64: string,
    clientResponse?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const verification = await this.prisma.identityVerification.findUnique({
      where: { id: verificationId },
      include: {
        documents: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    });

    if (!verification || verification.user_id !== userId) {
      throw new NotFoundException('Verification session not found');
    }

    if (verification.documents.length === 0) {
      throw new BadRequestException('Please upload a document first before submitting biometrics');
    }

    const doc = verification.documents[0];
    const idImageBase64 = this.storage.readDocumentBase64(doc.front_image_path);

    if (!idImageBase64) {
      throw new BadRequestException('Uploaded ID document portrait is unreadable');
    }

    // Set status to PROCESSING
    await this.prisma.identityVerification.update({
      where: { id: verification.id },
      data: {
        status: 'PROCESSING',
        current_step: 'BIOMETRIC_PROCESSING',
      },
    });

    // Enqueue Biometric Verification Job asynchronously
    this.jobQueue.enqueueBiometricVerification({
      verificationId: verification.id,
      userId,
      idImageBase64,
      liveImageBase64: liveFrameBase64,
      sessionId,
      challengeType,
      clientResponse,
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      status: 'PROCESSING',
      message: 'Biometric frames submitted. Decision engine evaluating verification in background.',
    };
  }

  async getStatus(userId: string) {
    const verification = await this.prisma.identityVerification.findFirst({
      where: { user_id: userId },
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
          take: 1,
        },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!verification) {
      return {
        hasVerification: false,
        status: 'NOT_STARTED',
        verificationLevel: 'LEVEL_0',
      };
    }

    const latestResult = verification.results[0];

    return {
      hasVerification: true,
      id: verification.id,
      status: verification.status,
      verificationLevel: verification.verification_level,
      currentStep: verification.current_step,
      rejectionReasons: verification.rejection_reasons,
      decision: latestResult?.decision || verification.status,
      scores: latestResult?.scores || null,
      summary: latestResult?.summary || null,
      documents: verification.documents.map((d) => ({
        id: d.id,
        type: d.document_type.name,
        country: d.country_code,
        status: d.status,
        ocr: d.ocr_results[0]
          ? {
              fullName: d.ocr_results[0].full_name,
              documentNumber: d.ocr_results[0].document_number,
              expiryDate: d.ocr_results[0].expiry_date,
              confidence: d.ocr_results[0].confidence_score,
            }
          : null,
      })),
      faceMatch: verification.face_verifications[0] || null,
      liveness: verification.liveness_verifications[0] || null,
      createdAt: verification.created_at,
      updatedAt: verification.updated_at,
    };
  }

  async retryVerification(userId: string) {
    const existing = await this.prisma.identityVerification.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });

    if (!existing) {
      throw new NotFoundException('No previous verification found');
    }

    if (existing.status === 'VERIFIED') {
      throw new BadRequestException('Identity is already verified');
    }

    // Record attempt
    const count = await this.prisma.verificationAttempt.count({ where: { user_id: userId } });
    if (count >= 5) {
      throw new ForbiddenException('Maximum verification retry attempts reached. Please contact support.');
    }

    await this.prisma.verificationAttempt.create({
      data: {
        user_id: userId,
        attempt_number: count + 1,
      },
    });

    // Create fresh session
    return this.prisma.identityVerification.create({
      data: {
        user_id: userId,
        status: 'PENDING',
        verification_level: 'LEVEL_1',
        current_step: 'DOCUMENT',
      },
    });
  }
}
