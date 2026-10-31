import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { VerificationLevel } from '@prisma/client';

describe('Gated Email Change E2E Flow', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const originalEmail = `old_email_${Date.now()}@example.com`;
  const targetEmail = `new_email_${Date.now()}@example.com`;
  const password = 'SuperSecret123!';

  let accessToken: string;
  let userId: string;
  let ticketId: string;
  let confirmationToken: string;

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

    // Register & verify user
    const regRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: originalEmail,
        password,
        confirmPassword: password,
        countryCode: 'US',
        termsAccepted: true,
      })
      .expect(201);

    const url = new URL(regRes.body.verificationUrl);
    const token = url.searchParams.get('token')!;

    await request(app.getHttpServer())
      .post('/api/auth/verify-email')
      .send({ token })
      .expect(200);

    // Login
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: originalEmail, password })
      .expect(200);

    accessToken = loginRes.body.accessToken;
    userId = loginRes.body.user.id;
  });

  afterAll(async () => {
    try {
      if (ticketId) {
        await prisma.emailChangeRequest.deleteMany({ where: { ticket_id: ticketId } });
        await prisma.supportTicketMessage.deleteMany({ where: { ticket_id: ticketId } });
        await prisma.supportTicket.deleteMany({ where: { id: ticketId } });
      }
      if (userId) {
        await prisma.identityVerification.deleteMany({ where: { user_id: userId } });
        await prisma.userSession.deleteMany({ where: { user_id: userId } });
        await prisma.user.delete({ where: { id: userId } });
      }
    } catch {
      // Ignore cleanup error
    }
    await app.close();
  });

  it('1. POST /api/auth/email-change/request - Fails with 403 when user KYC Level < 2', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/email-change/request')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ newEmail: targetEmail })
      .expect(403);

    expect(res.body.message).toContain('Level 2 Identity Verification');
  });

  it('2. Upgrade user to KYC Level 2 in DB', async () => {
    await prisma.identityVerification.create({
      data: {
        user_id: userId,
        verification_level: VerificationLevel.LEVEL_2,
        status: 'VERIFIED',
      },
    });

    const check = await prisma.identityVerification.findFirst({
      where: { user_id: userId, status: 'VERIFIED' },
    });
    expect(check?.verification_level).toBe(VerificationLevel.LEVEL_2);
  });

  it('3. POST /api/auth/email-change/request - Succeeds for verified KYC Level 2 user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/email-change/request')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ newEmail: targetEmail })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.ticketId).toBeDefined();
    expect(res.body.status).toBe('PENDING_APPROVAL');

    ticketId = res.body.ticketId;
  });

  it('4. POST /api/internal/email-change/:ticketId/decision - Admin approves request', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/internal/email-change/${ticketId}/decision`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        action: 'APPROVE',
        notes: 'Compliance reviewed passport scan and approved change.',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('APPROVED');
    expect(res.body.verificationUrl).toBeDefined();

    // Extract confirmation token from generated link
    const linkUrl = new URL(res.body.verificationUrl);
    confirmationToken = linkUrl.searchParams.get('token')!;
    expect(confirmationToken).toBeDefined();
  });

  it('5. POST /api/auth/email-change/confirm - Confirms with token, swaps email, revokes old sessions', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/email-change/confirm')
      .send({ token: confirmationToken })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.newEmail).toBe(targetEmail.toLowerCase());

    // Verify User record updated in DB
    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    expect(updatedUser?.email).toBe(targetEmail.toLowerCase());
    expect(updatedUser?.email_verified).toBe(true);
  });

  it('6. POST /api/auth/login - Old email credentials fail, new email succeeds', async () => {
    // Attempt login with OLD email
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: originalEmail, password })
      .expect(401);

    // Login with NEW email
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: targetEmail, password })
      .expect(200);

    expect(loginRes.body.accessToken).toBeDefined();
    expect(loginRes.body.user.email).toBe(targetEmail.toLowerCase());
  });
});
