import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Business KYB E2E Pipeline', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testUser = {
    email: `kyb_owner_${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    confirmPassword: 'SecurePassword123!',
    countryCode: 'BD',
    termsAccepted: true,
  };

  const testBusiness = {
    legalName: `Pacific Trading Ltd ${Date.now()}`,
    tradeName: 'Pacific Trading',
    businessType: 'CORPORATION',
    countryCode: 'BD',
    address: '22 Commercial District, Motijheel, Dhaka',
    businessEmail: `office_${Date.now()}@pacifictrading.com`,
    tradeLicenseNumber: `TL-BD-${Date.now()}`,
    issuingAuthority: 'Dhaka City Corporation',
  };

  let accessToken: string;
  let userId: string;
  let businessId: string;

  const dummyPdfOrPng =
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

    // 1. Register test owner
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
      if (businessId) {
        await prisma.businessVerificationResult.deleteMany({
          where: { verification: { business_id: businessId } },
        });
        await prisma.businessVerification.deleteMany({
          where: { business_id: businessId },
        });
        await prisma.businessDocument.deleteMany({
          where: { business_id: businessId },
        });
        await prisma.businessUser.deleteMany({
          where: { business_id: businessId },
        });
        await prisma.business.delete({
          where: { id: businessId },
        });
      }
      if (userId) {
        await prisma.user.delete({
          where: { id: userId },
        });
      }
    } catch {
      // ignore cleanup errors
    }
    await app.close();
  });

  it('1. POST /api/business - Register enterprise and assign creator as OWNER', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/business')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(testBusiness)
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.legal_name).toBe(testBusiness.legalName);
    expect(res.body.status).toBe('DRAFT');
    expect(res.body.verification_level).toBe('BUSINESS_LEVEL_0');

    businessId = res.body.id;
  });

  it('2. GET /api/business - List user businesses with RBAC role', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/business')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find((item: any) => item.business.id === businessId);
    expect(found).toBeDefined();
    expect(found.role).toBe('OWNER');
    expect(found.isPrimaryContact).toBe(true);
  });

  it('3. GET /api/business/:id - Retrieve enterprise details and owner KYC link', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/business/${businessId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.id).toBe(businessId);
    expect(res.body.currentUserRole).toBe('OWNER');
    expect(typeof res.body.ownerKycVerified).toBe('boolean');
  });

  it('4. POST /api/business/:id/document - Upload trade license for automated KYB', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/business/${businessId}/document`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        documentTypeCode: 'TRADE_LICENSE',
        fileBase64: dummyPdfOrPng,
        fileName: 'Dhaka_City_Corp_Trade_License.png',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.documentId).toBeDefined();

    // Wait for background KYB job to complete
    await new Promise((r) => setTimeout(r, 800));
  });

  it('5. GET /api/business/:id/status - Track document processing status', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/business/${businessId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.id).toBe(businessId);
    expect(['DOCUMENT_PROCESSING', 'KYC_PENDING', 'VERIFIED']).toContain(res.body.status);
    expect(res.body.documents.length).toBeGreaterThan(0);
    expect(res.body.documents[0].file_name).toBe('Dhaka_City_Corp_Trade_License.png');
  });
});
