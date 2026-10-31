import { encryptSecret, decryptSecret } from './encryption.util';

describe('Encryption Utility (AES-256-GCM)', () => {
  const masterKey = 'test_master_secret_encryption_key_32chars';

  it('should encrypt and decrypt a sensitive provider API key correctly', () => {
    const rawApiKey = 'icc_live_secret_token_1234567890abcdef';
    const encrypted = encryptSecret(rawApiKey, masterKey);

    expect(encrypted).toBeDefined();
    expect(encrypted).not.toEqual(rawApiKey);
    expect(encrypted.split(':')).toHaveLength(3);

    const decrypted = decryptSecret(encrypted, masterKey);
    expect(decrypted).toEqual(rawApiKey);
  });

  it('should produce different ciphertexts for the same plaintext due to random IV', () => {
    const rawApiKey = 'my_super_secret_key';
    const enc1 = encryptSecret(rawApiKey, masterKey);
    const enc2 = encryptSecret(rawApiKey, masterKey);

    expect(enc1).not.toEqual(enc2);
    expect(decryptSecret(enc1, masterKey)).toEqual(rawApiKey);
    expect(decryptSecret(enc2, masterKey)).toEqual(rawApiKey);
  });

  it('should fail authentication if the ciphertext is tampered with', () => {
    const rawApiKey = 'tamper_test_key';
    const encrypted = encryptSecret(rawApiKey, masterKey);
    const parts = encrypted.split(':');

    // Tamper with ciphertext by altering last char
    const tamperedCipher =
      parts[2].slice(0, -1) + (parts[2].endsWith('a') ? 'b' : 'a');
    const tamperedPayload = `${parts[0]}:${parts[1]}:${tamperedCipher}`;

    expect(() => decryptSecret(tamperedPayload, masterKey)).toThrow();
  });

  it('should fail authentication if the auth tag is tampered with', () => {
    const rawApiKey = 'auth_tag_tamper_key';
    const encrypted = encryptSecret(rawApiKey, masterKey);
    const parts = encrypted.split(':');

    const tamperedTag =
      parts[1].slice(0, -1) + (parts[1].endsWith('0') ? '1' : '0');
    const tamperedPayload = `${parts[0]}:${tamperedTag}:${parts[2]}`;

    expect(() => decryptSecret(tamperedPayload, masterKey)).toThrow();
  });
});
