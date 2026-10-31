import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class OidcKeysService implements OnModuleInit {
  private readonly logger = new Logger(OidcKeysService.name);
  private privateKey!: crypto.KeyObject;
  private publicKey!: crypto.KeyObject;
  private publicJwk!: any;
  public readonly keyId = 'central-account-key-1';

  async onModuleInit() {
    this.initializeKeys();
  }

  private initializeKeys() {
    try {
      // Generate RSA 2048-bit key pair for RS256 signing
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
      });

      this.privateKey = privateKey;
      this.publicKey = publicKey;

      const jwk = publicKey.export({ format: 'jwk' });
      this.publicJwk = {
        ...jwk,
        kid: this.keyId,
        alg: 'RS256',
        use: 'sig',
      };

      this.logger.log(`[OidcKeysService] RS256 Key Pair generated successfully with kid: ${this.keyId}`);
    } catch (err: any) {
      this.logger.error(`[OidcKeysService] Failed to initialize RSA keys: ${err.message}`, err.stack);
    }
  }

  getPublicJwks() {
    if (!this.publicJwk) {
      this.initializeKeys();
    }
    return {
      keys: [this.publicJwk],
    };
  }

  async signJwt(payload: Record<string, any>, expiresIn: string | number = 3600): Promise<string> {
    if (!this.privateKey) {
      this.initializeKeys();
    }

    const now = Math.floor(Date.now() / 1000);
    const expSeconds = typeof expiresIn === 'number' ? expiresIn : 3600;
    const finalPayload = {
      iat: now,
      exp: now + expSeconds,
      ...payload,
    };

    const headerB64 = Buffer.from(
      JSON.stringify({ alg: 'RS256', kid: this.keyId, typ: 'JWT' }),
    ).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(finalPayload)).toString('base64url');

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(`${headerB64}.${payloadB64}`);
    const signatureB64 = signer.sign(this.privateKey, 'base64url');

    return `${headerB64}.${payloadB64}.${signatureB64}`;
  }

  async verifyJwt(token: string): Promise<{ payload: any; protectedHeader: any }> {
    if (!this.publicKey) {
      this.initializeKeys();
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);

    const isValid = verifier.verify(this.publicKey, signatureB64, 'base64url');
    if (!isValid) {
      throw new Error('JWT signature verification failed');
    }

    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('JWT has expired');
    }

    return { payload, protectedHeader: header };
  }
}
