import { Injectable, Logger } from '@nestjs/common';

export interface DecisionEngineInput {
  documentAuthenticity: {
    isValid: boolean;
    isExpired: boolean;
    mrzChecksumValid: boolean;
    reasons: string[];
  };
  ocrConsistency: {
    nameMatchRatio: number; // 0.0 to 1.0
    ageYears: number;
    datesValid: boolean;
  };
  faceMatch: {
    isMatched: boolean;
    matchScore: number; // 0.0 to 1.0
  };
  liveness: {
    isLive: boolean;
    activePassed: boolean;
    passiveScore: number;
  };
  isDuplicateDocumentForAnotherUser: boolean;
}

export interface DecisionEngineResult {
  decision: 'VERIFIED' | 'REVIEW_REQUIRED' | 'REJECTED' | 'EXPIRED';
  verificationLevel: 'LEVEL_0' | 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4' | 'LEVEL_5';
  scores: {
    authenticityScore: number;
    ocrScore: number;
    faceMatchScore: number;
    livenessScore: number;
    overallWeightedScore: number;
  };
  reasons: string[];
  summary: string;
}

@Injectable()
export class KycDecisionEngineService {
  private readonly logger = new Logger(KycDecisionEngineService.name);

  evaluate(input: DecisionEngineInput): DecisionEngineResult {
    const reasons: string[] = [];

    // 1. Immediate Disqualifiers
    if (input.isDuplicateDocumentForAnotherUser) {
      return {
        decision: 'REJECTED',
        verificationLevel: 'LEVEL_0',
        scores: { authenticityScore: 0, ocrScore: 0, faceMatchScore: 0, livenessScore: 0, overallWeightedScore: 0 },
        reasons: ['Document is already registered to a different active user account.'],
        summary: 'Duplicate document collision detected.',
      };
    }

    if (input.documentAuthenticity.isExpired) {
      return {
        decision: 'EXPIRED',
        verificationLevel: 'LEVEL_1',
        scores: { authenticityScore: 0, ocrScore: 0.5, faceMatchScore: 0, livenessScore: 0, overallWeightedScore: 0 },
        reasons: ['Government ID has expired.'],
        summary: 'Document validity expired.',
      };
    }

    if (!input.liveness.activePassed && input.liveness.passiveScore < 0.50) {
      return {
        decision: 'REJECTED',
        verificationLevel: 'LEVEL_1',
        scores: { authenticityScore: 0.8, ocrScore: 0.8, faceMatchScore: 0, livenessScore: input.liveness.passiveScore, overallWeightedScore: 0.2 },
        reasons: ['Spoof attempt detected during biometric verification.'],
        summary: 'Facial liveness verification failed.',
      };
    }

    // 2. Score Component Calculation
    const authenticityScore = input.documentAuthenticity.isValid && input.documentAuthenticity.mrzChecksumValid ? 1.0 : 0.6;
    const ocrScore = (input.ocrConsistency.nameMatchRatio * 0.7) + (input.ocrConsistency.datesValid ? 0.3 : 0.0);
    const faceMatchScore = input.faceMatch.matchScore;
    const livenessScore = (input.liveness.activePassed ? 0.5 : 0.0) + (input.liveness.passiveScore * 0.5);

    // Multi-signal Weighted Overall Score:
    // 25% Document Authenticity + 25% OCR Consistency + 25% Face Match + 25% Liveness
    const overallWeightedScore = round(
      authenticityScore * 0.25 +
      ocrScore * 0.25 +
      faceMatchScore * 0.25 +
      livenessScore * 0.25,
      3,
    );

    // 3. Multi-Signal Decision Matrix
    // High-confidence pass: Face match >= 0.70, Liveness >= 0.75, Authenticity = 1.0, OCR >= 0.75
    const isCleanMatch = faceMatchScore >= 0.70;
    const isCleanLiveness = input.liveness.isLive && livenessScore >= 0.70;
    const isCleanOcr = ocrScore >= 0.70;

    if (isCleanMatch && isCleanLiveness && authenticityScore >= 0.9 && isCleanOcr) {
      return {
        decision: 'VERIFIED',
        verificationLevel: 'LEVEL_3',
        scores: { authenticityScore, ocrScore, faceMatchScore, livenessScore, overallWeightedScore },
        reasons: [],
        summary: 'Automated personal identity and biometric verification fully verified.',
      };
    }

    // Face comparison produced nothing usable (e.g. no face detected on the ID image)
    const faceUnavailable = faceMatchScore === 0;
    // A real comparison that came back clearly different is a hard failure
    const faceHardMismatch = !faceUnavailable && faceMatchScore < 0.40;

    if (faceHardMismatch) {
      reasons.push(`Face on the ID does not match the live selfie (similarity ${faceMatchScore}).`);
      return {
        decision: 'REJECTED',
        verificationLevel: 'LEVEL_1',
        scores: { authenticityScore, ocrScore, faceMatchScore, livenessScore, overallWeightedScore },
        reasons,
        summary: 'Biometric face match failed.',
      };
    }

    // Soft failures: a human should look at these
    if (faceUnavailable) {
      reasons.push('Face could not be compared with the ID photo (no usable face detected on the document image).');
    } else if (faceMatchScore < 0.70) {
      reasons.push(`Face similarity score (${faceMatchScore}) is marginal and requires secondary inspection.`);
    }

    if (input.ocrConsistency.nameMatchRatio < 0.70 && input.ocrConsistency.nameMatchRatio >= 0.40) {
      reasons.push('Name on ID document slightly differs from registration profile.');
    }

    if (authenticityScore < 0.9) {
      reasons.push('Document formatting or MRZ check digit requires manual compliance review.');
    }

    // Liveness passed and OCR is clean, so any remaining problem is soft: route to a human.
    const shouldReview = (isCleanLiveness && isCleanOcr) || overallWeightedScore >= 0.65;

    if (shouldReview) {
      return {
        decision: 'REVIEW_REQUIRED',
        verificationLevel: 'LEVEL_2',
        scores: { authenticityScore, ocrScore, faceMatchScore, livenessScore, overallWeightedScore },
        reasons,
        summary: 'Identity proofing flagged for internal compliance review.',
      };
    }

    // Default fallthrough: rejection
    reasons.push(`Overall verification score (${overallWeightedScore}) fell below the acceptable security threshold.`);
    return {
      decision: 'REJECTED',
      verificationLevel: 'LEVEL_1',
      scores: { authenticityScore, ocrScore, faceMatchScore, livenessScore, overallWeightedScore },
      reasons,
      summary: 'Identity verification could not be confirmed.',
    };
  }
}

function round(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}
