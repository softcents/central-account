import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentVerificationProviderInterface, DocumentAuthenticityResult } from './interfaces/document-provider.interface';
import { FaceVerificationProviderInterface, FaceQualityResult, FaceMatchResult } from './interfaces/face-provider.interface';
import { LivenessProviderInterface, LivenessChallengeResult, LivenessVerificationResult } from './interfaces/liveness-provider.interface';
import { OCRProviderInterface, DocumentOcrResultData, BusinessTradeLicenseOcrResultData } from './interfaces/ocr-provider.interface';

@Injectable()
export class InternalPythonProvider
  implements
    DocumentVerificationProviderInterface,
    FaceVerificationProviderInterface,
    LivenessProviderInterface,
    OCRProviderInterface
{
  private readonly logger = new Logger(InternalPythonProvider.name);
  private readonly baseUrl: string;
  private readonly sharedSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('PYTHON_VERIFICATION_URL', 'http://127.0.0.1:8000');
    this.sharedSecret = this.configService.get<string>(
      'INTERNAL_SERVICE_SECRET',
      'internal_kyc_kyb_secret_key_32chars',
    );
  }

  private async postToService<T>(endpoint: string, body: Record<string, any>): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': this.sharedSecret,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Internal Python Service Error [${response.status}] ${endpoint}: ${errorText}`);
        throw new Error(`Verification service returned status ${response.status}: ${errorText}`);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      this.logger.error(`Failed to reach Python service at ${url}: ${err.message}`);
      throw err;
    }
  }

  async verifyDocumentAuthenticity(
    imageBase64: string,
    documentType: string,
    countryCode: string,
  ): Promise<DocumentAuthenticityResult> {
    const res = await this.extractDocumentOcr(imageBase64, documentType, countryCode);
    return {
      isValid: res.authenticity.isValid,
      isExpired: res.authenticity.isExpired,
      mrzChecksumValid: res.authenticity.mrzChecksumValid,
      reasons: res.authenticity.reasons,
    };
  }

  async assessQuality(imageBase64: string): Promise<FaceQualityResult> {
    const res = await this.postToService<any>('/face/quality', { imageBase64 });
    return {
      isAcceptable: res.is_acceptable,
      qualityScore: res.quality_score,
      checks: {
        hasSingleFace: res.checks?.has_single_face ?? true,
        isClear: res.checks?.is_clear ?? true,
        goodLighting: res.checks?.good_lighting ?? true,
        isCentered: res.checks?.is_centered ?? true,
      },
      issues: res.issues || [],
    };
  }

  async matchFaces(idImageBase64: string, liveImageBase64: string): Promise<FaceMatchResult> {
    const res = await this.postToService<any>('/face/match', {
      idImageBase64,
      liveImageBase64,
    });
    return {
      isMatched: res.is_matched,
      matchScore: res.match_score,
      confidence: res.confidence,
      threshold: res.threshold,
    };
  }

  async createChallenge(userId: string): Promise<LivenessChallengeResult> {
    const res = await this.postToService<any>('/face/session', { userId });
    return {
      sessionId: res.sessionId,
      challengeType: res.challengeType,
      instructions: res.instructions,
      expiresInSeconds: res.expiresInSeconds,
    };
  }

  async verifyLiveness(
    sessionId: string,
    challengeType: string,
    frameBase64: string,
    clientResponse?: Record<string, any>,
  ): Promise<LivenessVerificationResult> {
    const res = await this.postToService<any>('/face/liveness', {
      sessionId,
      challengeType,
      frameBase64,
      clientResponse,
    });
    return {
      isLive: res.is_live,
      activePassed: res.active_passed,
      passiveLivenessScore: res.passive_liveness_score,
      challengeType: res.challenge_type,
      reasons: res.reasons || [],
    };
  }

  async extractDocumentOcr(
    imageBase64: string,
    documentType: string,
    countryCode: string,
  ): Promise<DocumentOcrResultData> {
    const res = await this.postToService<any>('/document/ocr', {
      imageBase64,
      documentType,
      countryCode,
    });
    return {
      success: res.success,
      documentType: res.document_type,
      countryCode: res.country_code,
      confidenceScore: res.confidence_score,
      fieldConfidences: res.field_confidences || {},
      fields: {
        fullName: res.fields?.full_name,
        firstName: res.fields?.first_name,
        lastName: res.fields?.last_name,
        documentNumber: res.fields?.document_number,
        dateOfBirth: res.fields?.date_of_birth,
        issueDate: res.fields?.issue_date,
        expiryDate: res.fields?.expiry_date,
        nationality: res.fields?.nationality,
        gender: res.fields?.gender,
        address: res.fields?.address,
      },
      mrzData: res.mrz_data,
      authenticity: {
        isValid: res.authenticity?.is_valid ?? true,
        isExpired: res.authenticity?.is_expired ?? false,
        mrzChecksumValid: res.authenticity?.mrz_checksum_valid ?? true,
        reasons: res.authenticity?.reasons || [],
      },
      documentClassification: res.document_classification
        ? {
            classification: res.document_classification.classification,
            isAuthenticDocument: res.document_classification.is_authentic_document,
            authenticityScore: res.document_classification.authenticity_score,
            signals: res.document_classification.signals || {},
            reasons: res.document_classification.reasons || [],
            recommendation: res.document_classification.recommendation || '',
          }
        : undefined,
    };
  }

  async extractBusinessOcr(
    imageBase64: string,
    countryCode: string,
  ): Promise<BusinessTradeLicenseOcrResultData> {
    const res = await this.postToService<any>('/business/ocr', {
      imageBase64,
      countryCode,
    });
    return {
      success: res.success,
      confidenceScore: res.confidence_score,
      fieldConfidences: res.field_confidences || {},
      fields: {
        legalName: res.fields?.legal_name,
        tradeLicenseNumber: res.fields?.trade_license_number,
        issuingAuthority: res.fields?.issuing_authority,
        issueDate: res.fields?.issue_date,
        expiryDate: res.fields?.expiry_date,
        address: res.fields?.address,
      },
      isValid: res.is_valid,
      isExpired: res.is_expired,
    };
  }
}
