import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, Job } from 'bullmq';
import * as crypto from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { InternalPythonProvider } from '../providers/internal-python.provider';
import { KycDecisionEngineService } from './kyc-decision-engine.service';
import { DocumentStorageService } from './document-storage.service';
import { AuditService } from '../../audit/audit.service';
import { RedisService } from '../../../common/redis/redis.service';
import { EmailService } from '../../email/email.service';
import { decryptSecret } from '../../../common/utils/encryption.util';

export interface ProcessDocumentJob {
  verificationId: string;
  documentId: string;
  imageBase64: string;
  documentType: string;
  countryCode: string;
}

export interface ProcessBiometricJob {
  verificationId: string;
  userId: string;
  idImageBase64: string;
  liveImageBase64: string;
  sessionId: string;
  challengeType: string;
  clientResponse?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface ProcessBusinessKybJob {
  businessId: string;
  documentId: string;
  imageBase64: string;
  countryCode: string;
  ownerUserId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ProcessWebhookDeliveryJob {
  endpointId: string;
  event: string;
  payload: any;
}

export interface ProcessEmailNotificationJob {
  toEmail: string;
  subject: string;
  html: string;
  text: string;
}

export interface QueueMetricSummary {
  id: string;
  title: string;
  status: 'HEALTHY' | 'PAUSED' | 'OFFLINE' | 'ERROR';
  counts: Record<string, number>;
  error?: string;
}

@Injectable()
export class JobQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobQueueService.name);

  // BullMQ Queues
  private documentOcrQueue: Queue | null = null;
  private biometricsQueue: Queue | null = null;
  private kybQueue: Queue | null = null;
  private webhookQueue: Queue | null = null;
  private emailQueue: Queue | null = null;

  // BullMQ Workers
  private documentOcrWorker: Worker | null = null;
  private biometricsWorker: Worker | null = null;
  private kybWorker: Worker | null = null;
  private webhookWorker: Worker | null = null;
  private emailWorker: Worker | null = null;

  private isBullMqActive = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: InternalPythonProvider,
    private readonly decisionEngine: KycDecisionEngineService,
    private readonly storage: DocumentStorageService,
    private readonly auditService: AuditService,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.initializeBullMq();
  }

  async onModuleDestroy() {
    this.logger.log('[BullMQ] Gracefully closing workers and queues...');
    const entities = [
      this.documentOcrWorker,
      this.biometricsWorker,
      this.kybWorker,
      this.webhookWorker,
      this.emailWorker,
      this.documentOcrQueue,
      this.biometricsQueue,
      this.kybQueue,
      this.webhookQueue,
      this.emailQueue,
    ];

    await Promise.allSettled(
      entities.filter(Boolean).map((entity) => entity!.close()),
    );
    this.logger.log('[BullMQ] All workers and queues closed');
  }

  private getRedisConnectionOptions() {
    const rawUrl = this.configService.get<string>(
      'REDIS_URL',
      'redis://localhost:6379',
    );
    try {
      const parsed = new URL(rawUrl);
      return {
        host: parsed.hostname || '127.0.0.1',
        port: parsed.port ? parseInt(parsed.port, 10) : 6379,
        password: parsed.password || undefined,
        username: parsed.username || undefined,
        maxRetriesPerRequest: null, // Required by BullMQ
      };
    } catch {
      return {
        host: '127.0.0.1',
        port: 6379,
        maxRetriesPerRequest: null,
      };
    }
  }

  private async initializeBullMq() {
    try {
      const conn = this.getRedisConnectionOptions();

      // 1. Initialize BullMQ Queues
      this.documentOcrQueue = new Queue('kyc-document-ocr', {
        connection: conn,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { count: 1000 },
          removeOnFail: { count: 2000 },
        },
      });

      this.biometricsQueue = new Queue('kyc-biometrics', {
        connection: conn,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { count: 1000 },
          removeOnFail: { count: 2000 },
        },
      });

      this.kybQueue = new Queue('kyb-verification', {
        connection: conn,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { count: 1000 },
          removeOnFail: { count: 2000 },
        },
      });

      this.webhookQueue = new Queue('webhook-delivery', {
        connection: conn,
        defaultJobOptions: {
          attempts: 5,
          backoff: { type: 'exponential', delay: 3000 },
          removeOnComplete: { count: 1000 },
          removeOnFail: { count: 2000 },
        },
      });

      this.emailQueue = new Queue('email-notifications', {
        connection: conn,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { count: 1000 },
          removeOnFail: { count: 2000 },
        },
      });

      // 2. Initialize BullMQ Workers with concurrency control
      this.documentOcrWorker = new Worker(
        'kyc-document-ocr',
        async (job: Job<ProcessDocumentJob>) => {
          this.logger.log(`[Worker:OCR] Processing job ${job.id} for verification ${job.data.verificationId}`);
          await this.processDocumentOcr(job.data);
          return { success: true, verificationId: job.data.verificationId };
        },
        { connection: conn, concurrency: 5 },
      );

      this.biometricsWorker = new Worker(
        'kyc-biometrics',
        async (job: Job<ProcessBiometricJob>) => {
          this.logger.log(`[Worker:Biometrics] Processing job ${job.id} for verification ${job.data.verificationId}`);
          await this.processBiometricVerification(job.data);
          return { success: true, verificationId: job.data.verificationId };
        },
        { connection: conn, concurrency: 5 },
      );

      this.kybWorker = new Worker(
        'kyb-verification',
        async (job: Job<ProcessBusinessKybJob>) => {
          this.logger.log(`[Worker:KYB] Processing job ${job.id} for business ${job.data.businessId}`);
          await this.processBusinessKyb(job.data);
          return { success: true, businessId: job.data.businessId };
        },
        { connection: conn, concurrency: 5 },
      );

      this.webhookWorker = new Worker(
        'webhook-delivery',
        async (job: Job<ProcessWebhookDeliveryJob>) => {
          this.logger.log(`[Worker:Webhook] Delivering event ${job.data.event} to endpoint ${job.data.endpointId}`);
          await this.processWebhookDelivery(job.data);
          return { success: true };
        },
        { connection: conn, concurrency: 10 },
      );

      this.emailWorker = new Worker(
        'email-notifications',
        async (job: Job<ProcessEmailNotificationJob>) => {
          this.logger.log(`[Worker:Email] Sending email "${job.data.subject}" to ${job.data.toEmail}`);
          await this.processEmailNotification(job.data);
          return { success: true };
        },
        { connection: conn, concurrency: 5 },
      );

      // Attach lifecycle monitoring listeners
      const workers = [
        { name: 'DocumentOCR', worker: this.documentOcrWorker },
        { name: 'Biometrics', worker: this.biometricsWorker },
        { name: 'BusinessKYB', worker: this.kybWorker },
        { name: 'Webhook', worker: this.webhookWorker },
        { name: 'Email', worker: this.emailWorker },
      ];

      for (const { name, worker } of workers) {
        worker.on('completed', (job) => {
          this.logger.log(`[BullMQ:${name}] Job ${job.id} COMPLETED`);
        });
        worker.on('failed', (job, err) => {
          this.logger.warn(`[BullMQ:${name}] Job ${job?.id} FAILED: ${err.message} (Attempts: ${job?.attemptsMade})`);
        });
        worker.on('error', (err) => {
          this.logger.error(`[BullMQ:${name}] Worker internal error: ${err.message}`);
        });
      }

      this.isBullMqActive = true;
      this.logger.log('[BullMQ] High-performance queues and workers successfully initialized with Redis');
    } catch (err: any) {
      this.isBullMqActive = false;
      this.logger.warn(
        `[BullMQ] Could not initialize Redis BullMQ (${err.message}). Queue fallback mode enabled.`,
      );
    }
  }

  // -------------------------------------------------------------
  // PUBLIC ENQUEUE PROCEDURES
  // -------------------------------------------------------------

  /**
   * Enqueues document OCR and authenticity verification job.
   */
  async enqueueDocumentOcr(job: ProcessDocumentJob) {
    const jobId = `doc_${job.documentId}`;
    this.logger.log(`[JobQueue] Enqueueing Document OCR: verification ${job.verificationId} (Job: ${jobId})`);

    // Track in Redis list/store
    await this.redisService.pushJob('kyc-document-ocr', jobId, {
      verificationId: job.verificationId,
      documentId: job.documentId,
      documentType: job.documentType,
      countryCode: job.countryCode,
    });

    if (this.isBullMqActive && this.documentOcrQueue) {
      try {
        await this.documentOcrQueue.add('ocr', job, { jobId });
        await this.redisService.updateJobStatus(jobId, 'PROCESSING');
        return;
      } catch (err: any) {
        this.logger.warn(`[BullMQ] Queue add failed, invoking fallback: ${err.message}`);
      }
    }

    // Resilient async fallback
    setImmediate(async () => {
      try {
        await this.redisService.updateJobStatus(jobId, 'PROCESSING');
        await this.processDocumentOcr(job);
        await this.redisService.updateJobStatus(jobId, 'COMPLETED', { verificationId: job.verificationId });
      } catch (err: any) {
        this.logger.error(`[JobQueue] Document OCR job failed: ${err.message}`, err.stack);
        await this.redisService.updateJobStatus(jobId, 'FAILED', { error: err.message });
        await this.prisma.identityVerification.update({
          where: { id: job.verificationId },
          data: {
            status: 'REVIEW_REQUIRED',
            rejection_reasons: [`Document processing error: ${err.message}`],
          },
        });
      }
    });
  }

  /**
   * Enqueues biometric verification & KYC decision computation job.
   */
  async enqueueBiometricVerification(job: ProcessBiometricJob) {
    const jobId = `bio_${job.verificationId}`;
    this.logger.log(`[JobQueue] Enqueueing Biometrics: verification ${job.verificationId} (Job: ${jobId})`);

    await this.redisService.pushJob('kyc-biometrics', jobId, {
      verificationId: job.verificationId,
      userId: job.userId,
      challengeType: job.challengeType,
    });

    if (this.isBullMqActive && this.biometricsQueue) {
      try {
        await this.biometricsQueue.add('biometrics', job, { jobId });
        await this.redisService.updateJobStatus(jobId, 'PROCESSING');
        return;
      } catch (err: any) {
        this.logger.warn(`[BullMQ] Queue add failed, invoking fallback: ${err.message}`);
      }
    }

    // Resilient async fallback
    setImmediate(async () => {
      try {
        await this.redisService.updateJobStatus(jobId, 'PROCESSING');
        await this.processBiometricVerification(job);
        await this.redisService.updateJobStatus(jobId, 'COMPLETED', { verificationId: job.verificationId });
      } catch (err: any) {
        this.logger.error(`[JobQueue] Biometrics job failed: ${err.message}`, err.stack);
        await this.redisService.updateJobStatus(jobId, 'FAILED', { error: err.message });
        await this.prisma.identityVerification.update({
          where: { id: job.verificationId },
          data: {
            status: 'REVIEW_REQUIRED',
            rejection_reasons: [`Biometric processing error: ${err.message}`],
          },
        });
      }
    });
  }

  /**
   * Enqueues Business KYB Trade License Verification Job.
   */
  async enqueueBusinessKyb(job: ProcessBusinessKybJob) {
    const jobId = `kyb_${job.businessId}`;
    this.logger.log(`[JobQueue] Enqueueing Business KYB: business ${job.businessId} (Job: ${jobId})`);

    await this.redisService.pushJob('kyb-verification', jobId, {
      businessId: job.businessId,
      documentId: job.documentId,
      countryCode: job.countryCode,
      ownerUserId: job.ownerUserId,
    });

    if (this.isBullMqActive && this.kybQueue) {
      try {
        await this.kybQueue.add('kyb', job, { jobId });
        await this.redisService.updateJobStatus(jobId, 'PROCESSING');
        return;
      } catch (err: any) {
        this.logger.warn(`[BullMQ] Queue add failed, invoking fallback: ${err.message}`);
      }
    }

    // Resilient async fallback
    setImmediate(async () => {
      try {
        await this.redisService.updateJobStatus(jobId, 'PROCESSING');
        await this.processBusinessKyb(job);
        await this.redisService.updateJobStatus(jobId, 'COMPLETED', { businessId: job.businessId });
      } catch (err: any) {
        this.logger.error(`[JobQueue] Business KYB failed: ${err.message}`);
        await this.redisService.updateJobStatus(jobId, 'FAILED', { error: err.message });
        await this.prisma.business.update({
          where: { id: job.businessId },
          data: { status: 'UNDER_REVIEW' },
        });
      }
    });
  }

  /**
   * Enqueues tenant webhook delivery job with BullMQ 5x retry.
   */
  async enqueueWebhookDelivery(job: ProcessWebhookDeliveryJob) {
    const jobId = `wh_${job.endpointId}_${Date.now()}`;
    if (this.isBullMqActive && this.webhookQueue) {
      try {
        await this.webhookQueue.add('webhook', job, { jobId });
        return;
      } catch (err: any) {
        this.logger.warn(`[BullMQ] Webhook queue add failed: ${err.message}`);
      }
    }

    setImmediate(async () => {
      try {
        await this.processWebhookDelivery(job);
      } catch (err: any) {
        this.logger.error(`[Fallback] Webhook delivery failed: ${err.message}`);
      }
    });
  }

  /**
   * Enqueues transactional email notification job with BullMQ 3x retry.
   */
  async enqueueEmailNotification(job: ProcessEmailNotificationJob) {
    const jobId = `mail_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    if (this.isBullMqActive && this.emailQueue) {
      try {
        await this.emailQueue.add('email', job, { jobId });
        return;
      } catch (err: any) {
        this.logger.warn(`[BullMQ] Email queue add failed: ${err.message}`);
      }
    }

    setImmediate(async () => {
      try {
        await this.processEmailNotification(job);
      } catch (err: any) {
        this.logger.error(`[Fallback] Email notification failed: ${err.message}`);
      }
    });
  }

  // -------------------------------------------------------------
  // INTERNAL JOB PROCESSORS
  // -------------------------------------------------------------

  private async processDocumentOcr(job: ProcessDocumentJob) {
    const verificationRecord = await this.prisma.identityVerification.findUnique({
      where: { id: job.verificationId },
      select: { tenant_id: true },
    });

    if (verificationRecord?.tenant_id) {
      try {
        const customConfig = await (this.prisma as any).tenantProviderConfig.findFirst({
          where: { tenant_id: verificationRecord.tenant_id, is_enabled: true },
          orderBy: { is_primary: 'desc' },
        });
        if (customConfig) {
          const tenantApiKey = decryptSecret(customConfig.api_key_encrypted);
          this.logger.log(
            `[JobQueue] Verification ${job.verificationId} using tenant custom provider [${customConfig.provider_code}] (key prefix: ${tenantApiKey.substring(0, 4)}...)`,
          );
        }
      } catch (err: any) {
        this.logger.warn(`[JobQueue] Could not resolve tenant custom provider key: ${err.message}. Using default.`);
      }
    }

    const ocrResult = await this.provider.extractDocumentOcr(
      job.imageBase64,
      job.documentType,
      job.countryCode,
    );

    const docNumber = ocrResult.fields.documentNumber || `DOC-${Date.now()}`;
    const docHash = this.storage.computeDocumentHash(
      job.countryCode,
      job.documentType,
      docNumber,
    );

    // Check if document classifier flagged this as FAKE
    const isFakeDocument = ocrResult.documentClassification?.classification === 'FAKE';
    const isSuspiciousDocument = ocrResult.documentClassification?.classification === 'SUSPICIOUS';

    if (isFakeDocument) {
      this.logger.warn(
        `[JobQueue] FAKE DOCUMENT DETECTED for verification ${job.verificationId}. ` +
        `Authenticity score: ${ocrResult.documentClassification?.authenticityScore}. ` +
        `Reasons: ${ocrResult.documentClassification?.reasons?.join('; ')}`,
      );

      const classificationReasons = ocrResult.documentClassification?.reasons || [];
      const rejectionReasons = [
        'Document verification DECLINED: The uploaded image was identified as a non-genuine document by our automated scanning system.',
        ...(ocrResult.documentClassification?.recommendation
          ? [ocrResult.documentClassification.recommendation]
          : []),
        ...classificationReasons,
      ];

      await this.prisma.$transaction([
        this.prisma.identityDocument.update({
          where: { id: job.documentId },
          data: {
            document_hash: docHash,
            status: 'REJECTED',
          },
        }),
        this.prisma.documentOcrResult.create({
          data: {
            document_id: job.documentId,
            full_name: ocrResult.fields.fullName,
            first_name: ocrResult.fields.firstName,
            last_name: ocrResult.fields.lastName,
            document_number: docNumber,
            date_of_birth: ocrResult.fields.dateOfBirth ? new Date(ocrResult.fields.dateOfBirth) : null,
            issue_date: ocrResult.fields.issueDate ? new Date(ocrResult.fields.issueDate) : null,
            expiry_date: ocrResult.fields.expiryDate ? new Date(ocrResult.fields.expiryDate) : null,
            nationality: ocrResult.fields.nationality,
            gender: ocrResult.fields.gender,
            address: ocrResult.fields.address,
            mrz_data: ocrResult.mrzData,
            confidence_score: ocrResult.confidenceScore,
            field_confidences: ocrResult.fieldConfidences,
          },
        }),
        this.prisma.verificationResult.create({
          data: {
            verification_id: job.verificationId,
            decision: 'REJECTED',
            scores: {
              authenticityScore: ocrResult.documentClassification?.authenticityScore || 0,
              documentClassification: ocrResult.documentClassification?.classification || 'FAKE',
              classificationSignals: ocrResult.documentClassification?.signals || {},
              ocrConfidence: ocrResult.confidenceScore,
            },
            summary: `Document verification DECLINED — automated scanning detected a non-genuine document (score: ${ocrResult.documentClassification?.authenticityScore?.toFixed(2) || '0.00'}).`,
          },
        }),
        this.prisma.identityVerification.update({
          where: { id: job.verificationId },
          data: {
            status: 'REJECTED',
            verification_level: 'LEVEL_0',
            current_step: 'DECLINED',
            rejection_reasons: rejectionReasons,
          },
        }),
      ]);

      await this.auditService.logEvent({
        userId: undefined,
        eventType: 'KYC_DOCUMENT_DECLINED',
        metadata: {
          verificationId: job.verificationId,
          documentId: job.documentId,
          classification: ocrResult.documentClassification?.classification,
          authenticityScore: ocrResult.documentClassification?.authenticityScore,
          reasons: classificationReasons,
        },
      });

      return;
    }

    let documentStatus = ocrResult.authenticity.isValid ? 'PARSED' : 'REJECTED';
    const additionalReasons: string[] = [];
    if (isSuspiciousDocument) {
      additionalReasons.push(
        `Document flagged as SUSPICIOUS by automated scanning (score: ${ocrResult.documentClassification?.authenticityScore?.toFixed(2)}). Manual review recommended.`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.identityDocument.update({
        where: { id: job.documentId },
        data: {
          document_hash: docHash,
          status: documentStatus,
        },
      }),
      this.prisma.documentOcrResult.create({
        data: {
          document_id: job.documentId,
          full_name: ocrResult.fields.fullName,
          first_name: ocrResult.fields.firstName,
          last_name: ocrResult.fields.lastName,
          document_number: docNumber,
          date_of_birth: ocrResult.fields.dateOfBirth ? new Date(ocrResult.fields.dateOfBirth) : null,
          issue_date: ocrResult.fields.issueDate ? new Date(ocrResult.fields.issueDate) : null,
          expiry_date: ocrResult.fields.expiryDate ? new Date(ocrResult.fields.expiryDate) : null,
          nationality: ocrResult.fields.nationality,
          gender: ocrResult.fields.gender,
          address: ocrResult.fields.address,
          mrz_data: ocrResult.mrzData,
          confidence_score: ocrResult.confidenceScore,
          field_confidences: ocrResult.fieldConfidences,
        },
      }),
      this.prisma.identityVerification.update({
        where: { id: job.verificationId },
        data: {
          current_step: 'FACE_LIVENESS',
          status: 'PENDING',
          ...(additionalReasons.length > 0 ? { rejection_reasons: additionalReasons } : {}),
        },
      }),
    ]);
  }

  private async processBiometricVerification(job: ProcessBiometricJob) {
    const livenessResult = await this.provider.verifyLiveness(
      job.sessionId,
      job.challengeType,
      job.liveImageBase64,
      job.clientResponse,
    );

    const matchResult = await this.provider.matchFaces(
      job.idImageBase64,
      job.liveImageBase64,
    );

    const verification = await this.prisma.identityVerification.findUnique({
      where: { id: job.verificationId },
      include: {
        documents: {
          include: { ocr_results: true },
        },
        user: {
          include: { profile: true },
        },
      },
    });

    if (!verification || verification.documents.length === 0) {
      throw new Error('Verification or documents not found');
    }

    const doc = verification.documents[0];
    const ocr = doc.ocr_results[0];

    const existingOtherDoc = doc.document_hash
      ? await this.prisma.identityDocument.findFirst({
          where: {
            document_hash: doc.document_hash,
            verification: {
              user_id: { not: job.userId },
              status: 'VERIFIED',
            },
          },
        })
      : null;

    const profileFirstName = verification.user?.profile?.first_name?.trim().toLowerCase() || '';
    const profileLastName = verification.user?.profile?.last_name?.trim().toLowerCase() || '';
    const profileFullName = `${profileFirstName} ${profileLastName}`.trim();
    const ocrFullName = (ocr?.full_name || `${ocr?.first_name || ''} ${ocr?.last_name || ''}`).trim().toLowerCase();

    let nameMatchRatio = 0.95;
    if (profileFullName && ocrFullName) {
      if (profileFullName === ocrFullName || (profileFirstName && ocrFullName.includes(profileFirstName))) {
        nameMatchRatio = 1.0;
      } else {
        const profileTokens = profileFullName.split(/\s+/);
        const ocrTokens = ocrFullName.split(/\s+/);
        const common = profileTokens.filter((t) => ocrTokens.includes(t));
        nameMatchRatio = common.length > 0 ? common.length / profileTokens.length : 0.50;
      }
    }

    let ageYears = 30;
    if (ocr?.date_of_birth) {
      ageYears = Math.floor((Date.now() - new Date(ocr.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000));
    }
    const datesValid = ageYears >= 18 && (!ocr?.issue_date || !ocr?.expiry_date || ocr.expiry_date > ocr.issue_date);

    const decisionResult = this.decisionEngine.evaluate({
      documentAuthenticity: {
        isValid: doc.status === 'PARSED',
        isExpired: ocr?.expiry_date ? ocr.expiry_date < new Date() : false,
        mrzChecksumValid: Boolean((ocr?.mrz_data as any)?.checksum_valid ?? true),
        reasons: [],
      },
      ocrConsistency: {
        nameMatchRatio,
        ageYears,
        datesValid,
      },
      faceMatch: {
        isMatched: matchResult.isMatched,
        matchScore: matchResult.matchScore,
      },
      liveness: {
        isLive: livenessResult.isLive,
        activePassed: livenessResult.activePassed,
        passiveScore: livenessResult.passiveLivenessScore,
      },
      isDuplicateDocumentForAnotherUser: !!existingOtherDoc,
    });

    // Persist live selfie and ID portrait to private storage for admin review
    let portraitImagePath: string | null = null;
    let liveFaceImagePath: string | null = null;

    try {
      const portraitSaved = this.storage.saveBase64Document(
        job.idImageBase64,
        'identity',
        `portrait_${job.userId.slice(0, 6)}`,
      );
      portraitImagePath = portraitSaved.filePath;
    } catch (err: any) {
      this.logger.warn(`[Biometrics] Failed to save portrait image: ${err.message}`);
    }

    try {
      const liveSaved = this.storage.saveBase64Document(
        job.liveImageBase64,
        'identity',
        `live_${job.userId.slice(0, 6)}`,
      );
      liveFaceImagePath = liveSaved.filePath;
    } catch (err: any) {
      this.logger.warn(`[Biometrics] Failed to save live selfie image: ${err.message}`);
    }

    await this.prisma.$transaction([
      this.prisma.faceVerification.create({
        data: {
          verification_id: job.verificationId,
          match_score: matchResult.matchScore,
          is_matched: matchResult.isMatched,
          portrait_image_path: portraitImagePath,
          live_face_image_path: liveFaceImagePath,
        },
      }),
      this.prisma.livenessVerification.create({
        data: {
          verification_id: job.verificationId,
          challenge_type: job.challengeType,
          challenge_token: job.sessionId,
          is_active_passed: livenessResult.activePassed,
          passive_liveness_score: livenessResult.passiveLivenessScore,
          is_live: livenessResult.isLive,
        },
      }),
      this.prisma.verificationResult.create({
        data: {
          verification_id: job.verificationId,
          decision: decisionResult.decision,
          scores: decisionResult.scores,
          summary: decisionResult.summary,
        },
      }),
      this.prisma.identityVerification.update({
        where: { id: job.verificationId },
        data: {
          status: decisionResult.decision,
          verification_level: decisionResult.verificationLevel,
          current_step: 'COMPLETED',
          rejection_reasons: decisionResult.reasons,
        },
      }),
    ]);

    await this.auditService.logEvent({
      userId: job.userId,
      eventType: `KYC_${decisionResult.decision}`,
      ipAddress: job.ipAddress,
      userAgent: job.userAgent,
      metadata: {
        verificationId: job.verificationId,
        level: decisionResult.verificationLevel,
        score: decisionResult.scores.overallWeightedScore,
      },
    });
  }

  private async processBusinessKyb(job: ProcessBusinessKybJob) {
    const ocrRes = await this.provider.extractBusinessOcr(job.imageBase64, job.countryCode);

    const ownerKyc = await this.prisma.identityVerification.findFirst({
      where: {
        user_id: job.ownerUserId,
        status: 'VERIFIED',
      },
      orderBy: { created_at: 'desc' },
    });

    const isOwnerKycVerified = !!ownerKyc;
    const isDocValid = ocrRes.isValid && !ocrRes.isExpired;

    let decision = 'VERIFIED';
    let status: any = 'VERIFIED';
    let level: any = 'BUSINESS_LEVEL_2';

    if (!isDocValid) {
      decision = 'REJECTED';
      status = 'REJECTED';
      level = 'BUSINESS_LEVEL_0';
    } else if (!isOwnerKycVerified) {
      decision = 'KYC_PENDING';
      status = 'KYC_PENDING';
      level = 'BUSINESS_LEVEL_1';
    } else if (ocrRes.confidenceScore < 0.80) {
      decision = 'UNDER_REVIEW';
      status = 'UNDER_REVIEW';
      level = 'BUSINESS_LEVEL_1';
    }

    await this.prisma.$transaction([
      this.prisma.businessDocument.update({
        where: { id: job.documentId },
        data: {
          ocr_data: ocrRes.fields,
          status: isDocValid ? 'VERIFIED' : 'REJECTED',
        },
      }),
      this.prisma.business.update({
        where: { id: job.businessId },
        data: {
          status,
          verification_level: level,
          trade_license_number: ocrRes.fields.tradeLicenseNumber || undefined,
          license_expiry_date: ocrRes.fields.expiryDate ? new Date(ocrRes.fields.expiryDate) : undefined,
        },
      }),
      this.prisma.businessVerification.create({
        data: {
          business_id: job.businessId,
          owner_kyc_id: ownerKyc?.id || null,
          decision,
          score: ocrRes.confidenceScore,
          notes: isOwnerKycVerified ? 'Owner KYC linked and verified' : 'Awaiting primary owner KYC verification',
        },
      }),
    ]);

    await this.auditService.logEvent({
      userId: job.ownerUserId,
      eventType: `KYB_${decision}`,
      ipAddress: job.ipAddress,
      userAgent: job.userAgent,
      metadata: {
        businessId: job.businessId,
        decision,
        level,
      },
    });
  }

  private async processWebhookDelivery(data: ProcessWebhookDeliveryJob) {
    const endpoint = await (this.prisma as any).webhookEndpoint.findUnique({
      where: { id: data.endpointId },
    });
    if (!endpoint || !endpoint.is_active) {
      return;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const bodyStr = JSON.stringify(data.payload);
    const signature = crypto
      .createHmac('sha256', endpoint.secret)
      .update(`${timestamp}.${bodyStr}`)
      .digest('hex');

    let responseStatus: number | null = null;
    let responseBody = '';
    let success = false;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Central-Identity-Event': data.event,
          'X-Central-Identity-Timestamp': String(timestamp),
          'X-Central-Identity-Signature': `t=${timestamp},v1=${signature}`,
        },
        body: bodyStr,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      responseStatus = res.status;
      responseBody = (await res.text()).substring(0, 500);
      success = res.ok;
    } catch (err: any) {
      responseBody = err.message || 'Network error';
    }

    await (this.prisma as any).webhookDelivery.create({
      data: {
        endpoint_id: endpoint.id,
        event: data.event,
        payload: data.payload,
        response_status: responseStatus,
        response_body: responseBody,
        success,
      },
    });

    if (!success) {
      throw new Error(`Webhook delivery to ${endpoint.url} failed (status: ${responseStatus}): ${responseBody}`);
    }
  }

  private async processEmailNotification(data: ProcessEmailNotificationJob) {
    await this.emailService.sendDirectMail(data.toEmail, data.subject, data.html, data.text);
  }

  // -------------------------------------------------------------
  // ADMIN MONITORING & QUEUE MANAGEMENT PROCEDURES
  // -------------------------------------------------------------

  /**
   * Retrieves telemetry metrics across all BullMQ queues.
   */
  async getQueueMetrics(): Promise<QueueMetricSummary[]> {
    const queueList = [
      { id: 'kyc-document-ocr', title: 'KYC Document OCR & Tampering Detection', queue: this.documentOcrQueue },
      { id: 'kyc-biometrics', title: 'KYC Biometrics & Liveness Processing', queue: this.biometricsQueue },
      { id: 'kyb-verification', title: 'Business KYB & Trade License Verification', queue: this.kybQueue },
      { id: 'webhook-delivery', title: 'Tenant Webhook Dispatching (HMAC-SHA256)', queue: this.webhookQueue },
      { id: 'email-notifications', title: 'Transactional Email Notifications', queue: this.emailQueue },
    ];

    const results: QueueMetricSummary[] = [];

    for (const q of queueList) {
      if (!q.queue) {
        results.push({
          id: q.id,
          title: q.title,
          status: 'OFFLINE',
          counts: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, paused: 0 },
        });
        continue;
      }

      try {
        const counts = await q.queue.getJobCounts();
        const isPaused = await q.queue.isPaused();
        results.push({
          id: q.id,
          title: q.title,
          status: isPaused ? 'PAUSED' : 'HEALTHY',
          counts,
        });
      } catch (err: any) {
        results.push({
          id: q.id,
          title: q.title,
          status: 'ERROR',
          error: err.message,
          counts: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, paused: 0 },
        });
      }
    }

    return results;
  }

  private getQueueByName(queueName: string): Queue | null {
    switch (queueName) {
      case 'kyc-document-ocr':
        return this.documentOcrQueue;
      case 'kyc-biometrics':
        return this.biometricsQueue;
      case 'kyb-verification':
        return this.kybQueue;
      case 'webhook-delivery':
        return this.webhookQueue;
      case 'email-notifications':
        return this.emailQueue;
      default:
        return null;
    }
  }

  /**
   * Retrieves failed jobs for inspection by administrators.
   */
  async getFailedJobs(queueName: string, start = 0, end = 20) {
    const queue = this.getQueueByName(queueName);
    if (!queue) {
      throw new NotFoundException(`Queue '${queueName}' not found or inactive`);
    }

    const failed = await queue.getFailed(start, end);
    return failed.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      timestamp: job.timestamp,
      attemptsMade: job.attemptsMade,
    }));
  }

  /**
   * Retries a specific failed job in a BullMQ queue.
   */
  async retryFailedJob(queueName: string, jobId: string) {
    const queue = this.getQueueByName(queueName);
    if (!queue) {
      throw new NotFoundException(`Queue '${queueName}' not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new NotFoundException(`Job '${jobId}' not found in queue '${queueName}'`);
    }

    await job.retry();
    this.logger.log(`[BullMQ] Administrator manually retried job ${jobId} in queue ${queueName}`);
    return { success: true, message: `Job ${jobId} successfully re-enqueued` };
  }

  /**
   * Cleans old completed and failed jobs from a queue.
   */
  async cleanQueue(queueName: string, graceMs = 0) {
    const queue = this.getQueueByName(queueName);
    if (!queue) {
      throw new NotFoundException(`Queue '${queueName}' not found`);
    }

    await queue.clean(graceMs, 1000, 'completed');
    await queue.clean(graceMs, 1000, 'failed');
    this.logger.log(`[BullMQ] Cleaned queue ${queueName}`);
    return { success: true, message: `Queue ${queueName} cleaned successfully` };
  }
}
