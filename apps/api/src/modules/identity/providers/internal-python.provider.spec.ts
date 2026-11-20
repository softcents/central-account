import { ConfigService } from '@nestjs/config';
import { InternalPythonProvider } from './internal-python.provider';
import { SAMPLE_FACE_PORTRAIT_B64 } from '../../../../test/fixtures/face-fixtures';

describe('NestJS <-> Python Face Verification Microservice Integration', () => {
  let provider: InternalPythonProvider;
  let configService: ConfigService;

  const sampleFaceB64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  beforeAll(() => {
    jest.setTimeout(25000);
    configService = new ConfigService({
      PYTHON_VERIFICATION_URL: process.env.PYTHON_VERIFICATION_URL || 'http://127.0.0.1:8000',
      INTERNAL_SERVICE_SECRET: process.env.INTERNAL_SERVICE_SECRET || 'internal_kyc_kyb_secret_key_32chars',
    });
    provider = new InternalPythonProvider(configService);

    // Mock fetch to provide isolated unit test coverage matching python microservice contracts
    global.fetch = jest.fn((url: any) => {
      const urlStr = url.toString();
      let responseData: any = {};
      if (urlStr.includes('/face/session')) {
        responseData = {
          sessionId: 'test_session_123',
          challengeType: 'BLINK',
          expiresInSeconds: 300,
        };
      } else if (urlStr.includes('/face/quality')) {
        responseData = {
          is_acceptable: true,
          quality_score: 0.95,
          checks: { has_single_face: true, is_clear: true, good_lighting: true, is_centered: true },
        };
      } else if (urlStr.includes('/face/liveness')) {
        responseData = {
          is_live: true,
          active_passed: true,
          passive_liveness_score: 0.92,
          challenge_type: 'BLINK',
        };
      } else if (urlStr.includes('/face/match')) {
        responseData = {
          is_matched: true,
          match_score: 0.94,
          confidence: 'HIGH',
        };
      } else if (urlStr.includes('/document/ocr')) {
        responseData = {
          success: true,
          document_type: 'PASSPORT',
          country_code: 'BD',
          confidence_score: 0.96,
          fields: {
            document_number: 'A12345678',
            full_name: 'Test User',
          },
          authenticity: {
            is_valid: true,
            is_expired: false,
            mrz_checksum_valid: true,
            reasons: [],
          },
        };
      } else if (urlStr.includes('/business/ocr')) {
        responseData = {
          success: true,
          confidence_score: 0.95,
          fields: {
            trade_license_number: 'TRAD/DNCC/12345/2024',
            legal_name: 'SoftCents Systems',
          },
          is_valid: true,
          is_expired: false,
        };
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(responseData),
        text: () => Promise.resolve(JSON.stringify(responseData)),
      } as any);
    });
  });

  it('1. should create a biometric liveness challenge session', async () => {
    const res = await provider.createChallenge('user_test_roundtrip');
    expect(res).toBeDefined();
    expect(res.sessionId).toBeDefined();
    expect(typeof res.sessionId).toBe('string');
    expect(['LOOK_LEFT', 'LOOK_RIGHT', 'BLINK', 'NOD_HEAD', 'TURN_HEAD']).toContain(res.challengeType);
    expect(res.expiresInSeconds).toBeGreaterThan(0);
  });

  it('2. should perform face quality assessment', async () => {
    const res = await provider.assessQuality(sampleFaceB64);
    expect(res).toBeDefined();
    expect(typeof res.isAcceptable).toBe('boolean');
    expect(typeof res.qualityScore).toBe('number');
    expect(res.checks).toBeDefined();
  });

  it('3. should verify active liveness challenge response', async () => {
    const session = await provider.createChallenge('user_test_liveness');
    const res = await provider.verifyLiveness(session.sessionId, session.challengeType, sampleFaceB64, {
      challenge_type: session.challengeType,
      motion_confirmed: true,
      blink_detected: true,
    });

    expect(res).toBeDefined();
    expect(typeof res.isLive).toBe('boolean');
    expect(typeof res.activePassed).toBe('boolean');
    expect(typeof res.passiveLivenessScore).toBe('number');
  });

  it('4. should match ID document face against live selfie face capture', async () => {
    const res = await provider.matchFaces(SAMPLE_FACE_PORTRAIT_B64, SAMPLE_FACE_PORTRAIT_B64);
    expect(res).toBeDefined();
    expect(typeof res.isMatched).toBe('boolean');
    expect(res.isMatched).toBe(true);
    expect(typeof res.matchScore).toBe('number');
    expect(res.matchScore).toBeGreaterThanOrEqual(0.7);
    expect(res.confidence).toBe('HIGH');
  });

  it('5. should extract and authenticate government ID document OCR', async () => {
    const res = await provider.extractDocumentOcr(sampleFaceB64, 'PASSPORT', 'BD');
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(res.countryCode).toBe('BD');
    expect(res.fields.documentNumber).toBeDefined();
    expect(res.authenticity.isValid).toBe(true);
    expect(res.authenticity.mrzChecksumValid).toBe(true);
  });

  it('6. should extract and verify business trade license OCR', async () => {
    const res = await provider.extractBusinessOcr(sampleFaceB64, 'BD');
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(res.fields.tradeLicenseNumber).toBeDefined();
    expect(res.isValid).toBe(true);
    expect(res.isExpired).toBe(false);
  });
});
