import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Personal KYC E2E Pipeline', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testUser = {
    email: `kyc_e2e_${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    confirmPassword: 'SecurePassword123!',
    countryCode: 'BD',
    termsAccepted: true,
  };

  let accessToken: string;
  let userId: string;
  let verificationId: string;
  let faceSessionId: string;

  // Minimal 1x1 transparent PNG base64 for test payloads
  const dummyBase64Image =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  jest.setTimeout(60000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // 1. Register test user
    const regRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    // Extract verification token & verify email
    const url = new URL(regRes.body.verificationUrl);
    const token = url.searchParams.get('token')!;
    await request(app.getHttpServer())
      .post('/api/auth/verify-email')
      .send({ token })
      .expect(200);

    // 2. Log in
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    accessToken = loginRes.body.accessToken;
    userId = loginRes.body.user.id;
  });

  afterAll(async () => {
    try {
      if (userId) {
        // Clean up documents, verifications, and user
        await prisma.verificationResult.deleteMany({
          where: { verification: { user_id: userId } },
        });
        await prisma.documentOcrResult.deleteMany({
          where: { document: { verification: { user_id: userId } } },
        });
        await prisma.identityDocument.deleteMany({
          where: { verification: { user_id: userId } },
        });
        await prisma.faceVerification.deleteMany({
          where: { verification: { user_id: userId } },
        });
        await prisma.livenessVerification.deleteMany({
          where: { verification: { user_id: userId } },
        });
        await prisma.identityVerification.deleteMany({
          where: { user_id: userId },
        });
        await prisma.user.delete({
          where: { id: userId },
        });
      }
    } catch {
      // ignore cleanup errors
    }
    await app.close();
  });

  it('1. GET /api/identity/session - Initialize verification session', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/identity/session')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBeDefined();
    expect(res.body.verification_level).toBeDefined();

    verificationId = res.body.id;
  });

  it('2. POST /api/identity/document - Upload identity document', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/identity/document')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        verificationId,
        documentType: 'PASSPORT',
        countryCode: 'BD',
        frontImageBase64: dummyBase64Image,
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.documentId).toBeDefined();
    expect(res.body.status).toBe('PROCESSING');

    // Wait for background OCR job to complete
    await new Promise((r) => setTimeout(r, 800));
  });

  it('3. POST /api/identity/face/session - Start biometric face challenge session', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/identity/face/session')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ verificationId })
      .expect(200);

    expect(res.body.sessionId).toBeDefined();
    expect(res.body.challengeType).toBeDefined();
    expect(res.body.instructions).toBeDefined();

    faceSessionId = res.body.sessionId;
  });

  it('4. POST /api/identity/face/verify - Submit selfie and biometric response', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/identity/face/verify')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        verificationId,
        sessionId: faceSessionId,
        challengeType: 'BLINK',
        liveFrameBase64: dummyBase64Image,
        clientResponse: {
          blinksDetected: 2,
          earValue: 0.18,
          timestamp: Date.now(),
        },
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('PROCESSING');
    expect(res.body.message).toBeDefined();

    // Wait for background biometric verification job to complete
    await new Promise((r) => setTimeout(r, 800));
  });

  it('5. GET /api/identity/status - Retrieve active verification status and scores', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/identity/status')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.id).toBe(verificationId);
    expect(res.body.status).toBeDefined();
    expect(res.body.verificationLevel).toBeDefined();
  });

  it('6. GET /api/internal/review/pending - Compliance reviewer queue', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/internal/review/pending')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('7. POST /api/internal/review/:id/decision - Manual reviewer approval', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/internal/review/${verificationId}/decision`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        action: 'APPROVE',
        notes: 'Compliance manual override: Document and biometric match verified by reviewer.',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('VERIFIED');
    expect(res.body.verificationLevel).toBe('LEVEL_5');
  });
});
