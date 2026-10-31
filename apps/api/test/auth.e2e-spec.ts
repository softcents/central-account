import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { authenticator } from 'otplib';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth Flow E2E (Register -> Verify Email -> Login -> Enable MFA)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testUser = {
    email: `e2e_user_${Date.now()}@example.com`,
    password: 'SuperSecret123!',
    confirmPassword: 'SuperSecret123!',
    countryCode: 'US',
    termsAccepted: true,
  };

  let verificationToken: string;
  let accessToken: string;
  let mfaSecret: string;
  let sessionId: string;

  jest.setTimeout(60000);

  beforeAll(async () => {
    // In mock or unit mode when DB is not running, we provide test mock handlers if needed
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
  });

  afterAll(async () => {
    try {
      // Clean up test data if prisma is connected
      const user = await prisma.user.findUnique({ where: { email: testUser.email } });
      if (user) {
        await prisma.user.delete({ where: { id: user.id } });
      }
    } catch {
      // DB might be mocked or offline during isolated testing
    }
    await app.close();
  });

  it('1. POST /api/auth/register - Register new account', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.verificationUrl).toBeDefined();

    // Extract token from verificationUrl
    const url = new URL(res.body.verificationUrl);
    verificationToken = url.searchParams.get('token')!;
    expect(verificationToken).toBeDefined();
  });

  it('2. POST /api/auth/verify-email - Verify email with signed token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/verify-email')
      .send({ token: verificationToken })
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('3. POST /api/auth/login - Log in with verified credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.user.emailVerified).toBe(true);

    accessToken = res.body.accessToken;

    // Check refresh_token cookie
    const rawCookies = res.headers['set-cookie'];
    const cookies: string[] = Array.isArray(rawCookies) ? rawCookies : [rawCookies || ''];
    expect(cookies.length).toBeGreaterThan(0);
    expect(cookies.some((c: string) => c.includes('refresh_token='))).toBe(true);
  });

  it('4. POST /api/mfa/generate - Generate TOTP secret and QR code', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/mfa/generate')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(res.body.secret).toBeDefined();
    expect(res.body.qrCodeDataUrl).toContain('data:image/png');
    expect(res.body.backupCodes).toHaveLength(10);

    mfaSecret = res.body.secret;
  });

  it('5. POST /api/mfa/enable - Enable TOTP MFA with valid OTP code', async () => {
    const validOtpCode = authenticator.generate(mfaSecret);

    const res = await request(app.getHttpServer())
      .post('/api/mfa/enable')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        secret: mfaSecret,
        code: validOtpCode,
        backupCodes: ['ABCD-12345'],
      })
      .expect(201);

    expect(res.body.success).toBe(true);
  });

  it('6. GET /api/auth/sessions - List active sessions and verify revocation', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    sessionId = res.body[0].id;

    // Revoke session
    const revokeRes = await request(app.getHttpServer())
      .post(`/api/auth/sessions/${sessionId}/revoke`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(revokeRes.body.success).toBe(true);
  });
});
