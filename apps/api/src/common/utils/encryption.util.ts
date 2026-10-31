import * as crypto from 'crypto';

/**
 * AES-256-GCM Authenticated Encryption Utility for Sensitive Credentials.
 * Used for encrypting tenant-level external KYC/KYB provider API keys & secrets.
 *
 * Wire format: <iv_hex>:<auth_tag_hex>:<ciphertext_hex>
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM

/**
 * Derives a deterministic 32-byte key from the provided master secret string.
 */
function deriveKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

/**
 * Resolves the master encryption key from the environment or fallback key.
 * Never throws unless no master key is supplied.
 */
export function getMasterKey(customKey?: string): Buffer {
  const secret =
    customKey ||
    process.env.ENCRYPTION_KEY ||
    process.env.JWT_ACCESS_SECRET ||
    'central_identity_default_master_encryption_key_32chars';
  return deriveKey(secret);
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 *
 * @param plaintext The sensitive string to encrypt (e.g. API key)
 * @param masterKey Optional master secret string
 * @returns Serialized format: "ivHex:authTagHex:ciphertextHex"
 */
export function encryptSecret(plaintext: string, masterKey?: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty plaintext');
  }

  const key = getMasterKey(masterKey);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts an AES-256-GCM encrypted payload.
 *
 * @param payload Serialized string in "ivHex:authTagHex:ciphertextHex" format
 * @param masterKey Optional master secret string
 * @returns Original plaintext string
 */
export function decryptSecret(payload: string, masterKey?: string): string {
  if (!payload || typeof payload !== 'string') {
    throw new Error('Invalid encryption payload format');
  }

  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Encrypted payload must contain IV, Auth Tag, and Ciphertext');
  }

  const [ivHex, authTagHex, cipherHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const ciphertext = Buffer.from(cipherHex, 'hex');

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length. Expected ${IV_LENGTH} bytes.`);
  }

  const key = getMasterKey(masterKey);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
