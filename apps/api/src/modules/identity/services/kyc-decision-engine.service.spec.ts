import { KycDecisionEngineService, DecisionEngineInput } from './kyc-decision-engine.service';

describe('KycDecisionEngineService', () => {
  let engine: KycDecisionEngineService;

  beforeEach(() => {
    engine = new KycDecisionEngineService();
  });

  const baseValidInput: DecisionEngineInput = {
    documentAuthenticity: {
      isValid: true,
      isExpired: false,
      mrzChecksumValid: true,
      reasons: [],
    },
    ocrConsistency: {
      nameMatchRatio: 1.0,
      ageYears: 28,
      datesValid: true,
    },
    faceMatch: {
      isMatched: true,
      matchScore: 0.85,
    },
    liveness: {
      isLive: true,
      activePassed: true,
      passiveScore: 0.90,
    },
    isDuplicateDocumentForAnotherUser: false,
  };

  it('should automatically VERIFY high-confidence identity verification (LEVEL_3)', () => {
    const result = engine.evaluate(baseValidInput);

    expect(result.decision).toBe('VERIFIED');
    expect(result.verificationLevel).toBe('LEVEL_3');
    expect(result.scores.overallWeightedScore).toBeGreaterThanOrEqual(0.85);
    expect(result.reasons).toHaveLength(0);
    expect(result.summary).toContain('fully verified');
  });

  it('should immediately REJECT duplicate document collision (LEVEL_0)', () => {
    const duplicateInput: DecisionEngineInput = {
      ...baseValidInput,
      isDuplicateDocumentForAnotherUser: true,
    };

    const result = engine.evaluate(duplicateInput);

    expect(result.decision).toBe('REJECTED');
    expect(result.verificationLevel).toBe('LEVEL_0');
    expect(result.reasons[0]).toContain('already registered to a different active user');
    expect(result.summary).toContain('Duplicate document');
  });

  it('should immediately flag EXPIRED government ID documents', () => {
    const expiredInput: DecisionEngineInput = {
      ...baseValidInput,
      documentAuthenticity: {
        isValid: false,
        isExpired: true,
        mrzChecksumValid: true,
        reasons: ['Expired on 2023-01-01'],
      },
    };

    const result = engine.evaluate(expiredInput);

    expect(result.decision).toBe('EXPIRED');
    expect(result.verificationLevel).toBe('LEVEL_1');
    expect(result.reasons[0]).toContain('expired');
  });

  it('should immediately REJECT spoof attempts when active liveness fails and passive score is low', () => {
    const spoofInput: DecisionEngineInput = {
      ...baseValidInput,
      liveness: {
        isLive: false,
        activePassed: false,
        passiveScore: 0.25,
      },
    };

    const result = engine.evaluate(spoofInput);

    expect(result.decision).toBe('REJECTED');
    expect(result.reasons[0]).toContain('Spoof attempt detected');
  });

  it('should route marginal face match scores (0.58-0.69) to REVIEW_REQUIRED', () => {
    const marginalInput: DecisionEngineInput = {
      ...baseValidInput,
      faceMatch: {
        isMatched: true,
        matchScore: 0.63,
      },
    };

    const result = engine.evaluate(marginalInput);

    expect(result.decision).toBe('REVIEW_REQUIRED');
    expect(result.verificationLevel).toBe('LEVEL_2');
    expect(result.reasons.some((r) => r.includes('Face similarity score'))).toBe(true);
    expect(result.summary).toContain('compliance review');
  });

  it('should route invalid MRZ checksum with overall score >= 0.65 to REVIEW_REQUIRED', () => {
    const mrzFailInput: DecisionEngineInput = {
      ...baseValidInput,
      documentAuthenticity: {
        isValid: true,
        isExpired: false,
        mrzChecksumValid: false,
        reasons: ['MRZ check digit mismatch'],
      },
    };

    const result = engine.evaluate(mrzFailInput);

    expect(result.decision).toBe('REVIEW_REQUIRED');
    expect(result.reasons.some((r) => r.includes('MRZ check digit'))).toBe(true);
  });

  it('should REJECT low overall weighted scores when below acceptable threshold', () => {
    const lowInput: DecisionEngineInput = {
      documentAuthenticity: {
        isValid: false,
        isExpired: false,
        mrzChecksumValid: false,
        reasons: ['Unrecognized format'],
      },
      ocrConsistency: {
        nameMatchRatio: 0.2,
        ageYears: 22,
        datesValid: false,
      },
      faceMatch: {
        isMatched: false,
        matchScore: 0.35,
      },
      liveness: {
        isLive: true,
        activePassed: true,
        passiveScore: 0.60,
      },
      isDuplicateDocumentForAnotherUser: false,
    };

    const result = engine.evaluate(lowInput);

    expect(result.decision).toBe('REJECTED');
    expect(result.verificationLevel).toBe('LEVEL_1');
    expect(result.reasons.some((r) => r.includes('fell below the acceptable security threshold'))).toBe(true);
  });
});
