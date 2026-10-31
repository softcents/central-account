import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Support Ticket System E2E Flow', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testUser = {
    email: `support_e2e_${Date.now()}@example.com`,
    password: 'SuperSecret123!',
    confirmPassword: 'SuperSecret123!',
    countryCode: 'US',
    termsAccepted: true,
  };

  let accessToken: string;
  let userId: string;
  let ticketId: string;

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

    // Register & verify user directly in DB
    const regRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser)
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
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    accessToken = loginRes.body.accessToken;
    userId = loginRes.body.user.id;
  });

  afterAll(async () => {
    try {
      if (ticketId) {
        await prisma.supportTicketAttachment.deleteMany({ where: { ticket_id: ticketId } });
        await prisma.supportTicketMessage.deleteMany({ where: { ticket_id: ticketId } });
        await prisma.supportTicket.deleteMany({ where: { id: ticketId } });
      }
      if (userId) {
        await prisma.user.delete({ where: { id: userId } });
      }
    } catch {
      // Ignore cleanup error if already removed
    }
    await app.close();
  });

  it('1. POST /api/support/tickets - User creates a new ticket', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/support/tickets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        category: 'GENERAL_SUPPORT',
        subject: 'E2E Test Ticket: Assistance Needed',
        description: 'This is an initial inquiry created via E2E automated test.',
        priority: 'NORMAL',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.subject).toBe('E2E Test Ticket: Assistance Needed');
    expect(res.body.status).toBe('OPEN');
    expect(res.body.messages).toHaveLength(1);

    ticketId = res.body.id;
  });

  it('2. GET /api/support/tickets - User lists their tickets', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/support/tickets')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const createdTicket = res.body.find((t: any) => t.id === ticketId);
    expect(createdTicket).toBeDefined();
    expect(createdTicket.status).toBe('OPEN');
  });

  it('3. GET /api/support/tickets/:id - User fetches ticket details', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/support/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.id).toBe(ticketId);
    expect(res.body.category).toBe('GENERAL_SUPPORT');
    expect(res.body.messages).toHaveLength(1);
  });

  it('4. POST /api/support/tickets/:id/messages - User replies to the ticket', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/support/tickets/${ticketId}/messages`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        message: 'Here is additional context requested by support.',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.message).toBe('Here is additional context requested by support.');
    expect(res.body.senderType).toBe('USER');
  });

  it('5. GET /api/internal/support/tickets - Internal admin lists tickets', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/internal/support/tickets')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find((t: any) => t.id === ticketId);
    expect(found).toBeDefined();
  });

  it('6. POST /api/internal/support/tickets/:id/reply - Internal admin replies', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/internal/support/tickets/${ticketId}/reply`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        message: 'Admin response: We are reviewing your inquiry.',
      })
      .expect(201);

    expect(res.body.senderType).toBe('ADMIN');
    expect(res.body.message).toBe('Admin response: We are reviewing your inquiry.');
  });

  it('7. PATCH /api/internal/support/tickets/:id/status - Internal admin closes ticket', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/internal/support/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        status: 'CLOSED',
        notes: 'Issue resolved satisfactorily.',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('CLOSED');
  });
});
