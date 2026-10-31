import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Customer Registration (KYC Form) E2E Flow', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testUser = {
    email: `kyc_user_${Date.now()}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
    countryCode: 'BD',
    termsAccepted: true,
  };

  let verificationToken: string;
  let accessToken: string;
  let userId: string;

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
  });

  afterAll(async () => {
    try {
      const user = await prisma.user.findUnique({ where: { email: testUser.email } });
      if (user) {
        await prisma.customerRegistration.deleteMany({ where: { user_id: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    } catch {
      // ignore
    }
    await app.close();
  });

  it('1. POST /api/auth/register - Register user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.verificationUrl).toBeDefined();

    const url = new URL(res.body.verificationUrl);
    verificationToken = url.searchParams.get('token')!;
    expect(verificationToken).toBeDefined();
  });

  it('2. POST /api/auth/verify-email - Verify email returns session & customerRegistrationCompleted=false', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/verify-email')
      .send({ token: verificationToken })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.customerRegistrationCompleted).toBe(false);
    expect(res.body.nextStep).toBe('/customer-registration');

    accessToken = res.body.accessToken;
    userId = res.body.user.id;
  });

  it('3. GET /api/users/me/customer-registration - Initial status is uncompleted', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/users/me/customer-registration')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.isCompleted).toBe(false);
    expect(res.body.data).toBeNull();
  });

  it('4. POST /api/users/me/customer-registration - Fails if declaration not confirmed', async () => {
    const invalidPayload = {
      customerType: 'INDIVIDUAL',
      fullName: 'Rahim Ahmed',
      nidPassportNumber: '1990123456789',
      phoneNumber: '+8801700000000',
      email: testUser.email,
      dateOfBirth: '1990-01-01',
      gender: 'MALE',
      presentStreet: '123 Test St',
      presentCity: 'Dhaka',
      presentPostalCode: '1205',
      presentCountry: 'Bangladesh',
      sameAsPresentAddress: true,
      permanentStreet: '123 Test St',
      permanentCity: 'Dhaka',
      permanentPostalCode: '1205',
      permanentCountry: 'Bangladesh',
      fatherName: 'Robert Doe',
      motherName: 'Mary Doe',
      contactPhone: '+8801700000000',
      contactEmail: testUser.email,
      declarationConfirmed: false, // Invalid
    };

    const res = await request(app.getHttpServer())
      .post('/api/users/me/customer-registration')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(invalidPayload)
      .expect(400);

    const errorMessage = Array.isArray(res.body.message)
      ? res.body.message.join(' ')
      : res.body.message;
    expect(errorMessage).toMatch(/declaration|National ID/i);
  });

  it('5. POST /api/users/me/customer-registration - Fails if Company selected but company fields missing', async () => {
    const invalidCompanyPayload = {
      customerType: 'COMPANY',
      fullName: 'Rahim Ahmed',
      nidPassportNumber: '1990123456789',
      phoneNumber: '+8801700000000',
      email: testUser.email,
      dateOfBirth: '1990-01-01',
      gender: 'MALE',
      presentStreet: '123 Test St',
      presentCity: 'Dhaka',
      presentPostalCode: '1205',
      presentCountry: 'Bangladesh',
      sameAsPresentAddress: true,
      permanentStreet: '123 Test St',
      permanentCity: 'Dhaka',
      permanentPostalCode: '1205',
      permanentCountry: 'Bangladesh',
      fatherName: 'Robert Doe',
      motherName: 'Mary Doe',
      contactPhone: '+8801700000000',
      contactEmail: testUser.email,
      declarationConfirmed: true,
      // Missing companyName, authorizedPersonName, companyPosition
    };

    const res = await request(app.getHttpServer())
      .post('/api/users/me/customer-registration')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(invalidCompanyPayload)
      .expect(400);

    const errorMessage = Array.isArray(res.body.message)
      ? res.body.message.join(' ')
      : res.body.message;
    expect(errorMessage).toMatch(/Company/i);
  });

  it('6. POST /api/users/me/customer-registration - Successfully submits valid Individual registration', async () => {
    const validIndividualPayload = {
      customerType: 'INDIVIDUAL',
      fullName: 'Rahim Ahmed',
      nidPassportNumber: '19925678901234',
      phoneNumber: '+8801712345678',
      email: testUser.email,
      dateOfBirth: '1992-05-15',
      gender: 'MALE',
      presentStreet: 'House 42, Road 11, Banani',
      presentCity: 'Dhaka',
      presentPostalCode: '1213',
      presentCountry: 'Bangladesh',
      sameAsPresentAddress: true,
      permanentStreet: 'House 42, Road 11, Banani',
      permanentCity: 'Dhaka',
      permanentPostalCode: '1213',
      permanentCountry: 'Bangladesh',
      fatherName: 'Karim Ahmed',
      motherName: 'Fatema Begum',
      contactPhone: '+8801712345678',
      contactEmail: testUser.email,
      declarationConfirmed: true,
    };

    const res = await request(app.getHttpServer())
      .post('/api/users/me/customer-registration')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validIndividualPayload)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.customerRegistrationCompleted).toBe(true);
    expect(res.body.data.full_name).toBe('Rahim Ahmed');
    expect(res.body.data.customer_type).toBe('INDIVIDUAL');
    expect(res.body.data.nid_passport_number).toBe('19925678901234');
    expect(res.body.data.father_name).toBe('Karim Ahmed');
    expect(res.body.data.mother_name).toBe('Fatema Begum');
    expect(res.body.data.same_as_present_address).toBe(true);
  });

  it('7. GET /api/users/me - User profile now indicates customer_registration_completed=true', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.customer_registration_completed).toBe(true);
    expect(res.body.customer_registration).toBeDefined();
    expect(res.body.customer_registration.full_name).toBe('Rahim Ahmed');
    expect(res.body.customer_registration.father_name).toBe('Karim Ahmed');
  });

  it('8. POST /api/users/me/customer-registration - Updates registration as Company customer', async () => {
    const companyPayload = {
      customerType: 'COMPANY',
      companyName: 'Acme Corporation Ltd.',
      authorizedPersonName: 'Rahim Ahmed',
      companyPosition: 'MANAGING_DIRECTOR',
      fullName: 'Rahim Ahmed',
      nidPassportNumber: '19925678901234',
      phoneNumber: '+8801712345678',
      email: testUser.email,
      dateOfBirth: '1992-05-15',
      gender: 'MALE',
      presentStreet: 'Gulshan 2, Plot 14',
      presentCity: 'Dhaka',
      presentPostalCode: '1212',
      presentCountry: 'Bangladesh',
      sameAsPresentAddress: false,
      permanentStreet: 'Village Barisal, Sadar',
      permanentCity: 'Barisal',
      permanentPostalCode: '8200',
      permanentCountry: 'Bangladesh',
      fatherName: 'Karim Ahmed',
      motherName: 'Fatema Begum',
      contactPhone: '+8801712345678',
      contactEmail: testUser.email,
      declarationConfirmed: true,
    };

    const res = await request(app.getHttpServer())
      .post('/api/users/me/customer-registration')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(companyPayload)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.customer_type).toBe('COMPANY');
    expect(res.body.data.company_name).toBe('Acme Corporation Ltd.');
    expect(res.body.data.company_position).toBe('MANAGING_DIRECTOR');
    expect(res.body.data.authorized_person_name).toBe('Rahim Ahmed');
    expect(res.body.data.permanent_city).toBe('Barisal');
  });
});
