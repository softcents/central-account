import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import * as crypto from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('OAuth 2.0 / OIDC SSO Provider E2E Flow', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testUser = {
    email: `oidc_e2e_${Date.now()}@example.com`,
    password: 'SuperSecret123!',
    confirmPassword: 'SuperSecret123!',
    countryCode: 'US',
    termsAccepted: true,
  };

  let accessToken: string;
  let userId: string;
  let clientId: string;
  let clientSecret: string;
  const redirectUri = 'https://clientapp.local/callback';

  // PKCE Generation
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  let authorizationCode: string;
  let oauthAccessToken: string;
  let oauthRefreshToken: string;

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
      if (clientId) {
        await prisma.oAuthRefreshToken.deleteMany({ where: { client_id: clientId } });
        await prisma.oAuthAccessToken.deleteMany({ where: { client_id: clientId } });
        await prisma.oAuthAuthorizationCode.deleteMany({ where: { client_id: clientId } });
        await prisma.connectedApplication.deleteMany({ where: { client_id: clientId } });
        await prisma.oAuthClient.deleteMany({ where: { client_id: clientId } });
      }
      if (userId) {
        await prisma.userSession.deleteMany({ where: { user_id: userId } });
        await prisma.user.delete({ where: { id: userId } });
      }
    } catch {
      // Ignore cleanup error
    }
    await app.close();
  });

  it('1. GET /api/.well-known/openid-configuration - OIDC Discovery Document', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/.well-known/openid-configuration')
      .expect(200);

    expect(res.body.issuer).toBeDefined();
    expect(res.body.authorization_endpoint).toBeDefined();
    expect(res.body.token_endpoint).toBeDefined();
    expect(res.body.jwks_uri).toBeDefined();
    expect(res.body.code_challenge_methods_supported).toContain('S256');
  });

  it('2. GET /api/v1/oauth/jwks - Public JSON Web Key Set', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/oauth/jwks')
      .expect(200);

    expect(res.body.keys).toBeDefined();
    expect(Array.isArray(res.body.keys)).toBe(true);
    expect(res.body.keys[0].kty).toBe('RSA');
    expect(res.body.keys[0].alg).toBe('RS256');
    expect(res.body.keys[0].use).toBe('sig');
  });

  it('3. POST /api/internal/oauth/clients - Register a new client application', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/internal/oauth/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Automated E2E Test App',
        description: 'Test OAuth application for SSO integration',
        redirectUris: [redirectUri],
        allowedScopes: ['openid', 'profile', 'email'],
        requiredVerificationLevel: 'LEVEL_0',
      })
      .expect(201);

    expect(res.body.clientId).toBeDefined();
    expect(res.body.clientSecret).toBeDefined(); // Plaintext returned once
    expect(res.body.redirectUris).toContain(redirectUri);

    clientId = res.body.clientId;
    clientSecret = res.body.clientSecret;
  });

  it('4. GET /api/v1/oauth/authorize - Request authorization with PKCE S256', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/oauth/authorize')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid profile email',
        state: 'xyz_state_123',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      })
      .expect(200);

    expect(res.body.requiresConsent).toBe(true);
    expect(res.body.client.id).toBe(clientId);
  });

  it('5. POST /api/v1/oauth/consent - User grants consent and receives auth code', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/oauth/consent')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        clientId,
        redirectUri,
        scopes: ['openid', 'profile', 'email'],
        state: 'xyz_state_123',
        codeChallenge,
        codeChallengeMethod: 'S256',
        granted: true,
      })
      .expect(200);

    expect(res.body.redirectUrl).toBeDefined();
    const parsedUrl = new URL(res.body.redirectUrl);
    authorizationCode = parsedUrl.searchParams.get('code')!;
    expect(authorizationCode).toBeDefined();
    expect(parsedUrl.searchParams.get('state')).toBe('xyz_state_123');
  });

  it('6. POST /api/v1/oauth/token - Exchange code + PKCE verifier for tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/oauth/token')
      .send({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: authorizationCode,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      })
      .expect(200);

    expect(res.body.access_token).toBeDefined();
    expect(res.body.id_token).toBeDefined();
    expect(res.body.refresh_token).toBeDefined();
    expect(res.body.token_type).toBe('Bearer');

    oauthAccessToken = res.body.access_token;
    oauthRefreshToken = res.body.refresh_token;

    // Verify ID Token structure (3 parts)
    const idTokenParts = res.body.id_token.split('.');
    expect(idTokenParts).toHaveLength(3);

    // Decode payload
    const payload = JSON.parse(Buffer.from(idTokenParts[1], 'base64url').toString('utf8'));
    expect(payload.email).toBe(testUser.email.toLowerCase());
    expect(payload.sub).toBe(userId);
    // Strict privacy guarantee: no sensitive biometrics or raw docs
    expect(payload.document_number).toBeUndefined();
    expect(payload.selfie_url).toBeUndefined();
  });

  it('7. GET /api/v1/oauth/userinfo - Fetch UserInfo using access token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/oauth/userinfo')
      .set('Authorization', `Bearer ${oauthAccessToken}`)
      .expect(200);

    expect(res.body.sub).toBe(userId);
    expect(res.body.email).toBe(testUser.email.toLowerCase());
    expect(res.body.email_verified).toBe(true);
  });

  it('8. POST /api/v1/oauth/token - Rotate refresh token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/oauth/token')
      .send({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: oauthRefreshToken,
      })
      .expect(200);

    expect(res.body.access_token).toBeDefined();
    expect(res.body.refresh_token).toBeDefined();
    expect(res.body.refresh_token).not.toBe(oauthRefreshToken); // Rotated!

    // Save previous token for replay test
    const oldRefreshToken = oauthRefreshToken;
    oauthRefreshToken = res.body.refresh_token;

    // 9. Replay Attack Protection: Submitting old used refresh token MUST fail
    await request(app.getHttpServer())
      .post('/api/v1/oauth/token')
      .send({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: oldRefreshToken, // Old used token!
      })
      .expect(401);
  });

  it('10. GET /api/oauth/applications & DELETE - User manages and revokes application', async () => {
    // List connected apps
    const listRes = await request(app.getHttpServer())
      .get('/api/oauth/applications')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(listRes.body)).toBe(true);
    const appEntry = listRes.body.find((a: any) => a.clientId === clientId);
    expect(appEntry).toBeDefined();

    // Revoke application
    const revokeRes = await request(app.getHttpServer())
      .delete(`/api/oauth/applications/${clientId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(revokeRes.body.success).toBe(true);
  });
});
