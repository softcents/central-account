import * as crypto from 'crypto';

/**
 * Validates and normalizes an NID string.
 * Strips whitespace and hyphens.
 * If the resulting string contains strictly digits and is of valid NID length
 * (10, 13, or 17 digits), returns the normalized string.
 * Otherwise returns null (e.g. passport numbers containing letters, bad lengths, invalid types).
 */
export function normalizeNid(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const stripped = raw.replace(/[\s-]/g, '').trim();
  if (/^\d{10}$|^\d{13}$|^\d{17}$/.test(stripped)) {
    return stripped;
  }
  return null;
}

/**
 * Computes the HMAC-SHA256 hash of a normalized NID using the given key.
 */
export function computeNidHmac(normalizedNid: string, hmacKey: string): string {
  return crypto.createHmac('sha256', hmacKey).update(normalizedNid).digest('hex');
}

/**
 * Computes the blind index hash for an NID.
 * Uses normalizeNid to ensure only valid 10, 13, or 17-digit NIDs are hashed.
 * If rawNid does not normalize to 10, 13, or 17 digits, or if hmacKey is missing,
 * returns null.
 *
 * This function NEVER throws, ensuring invalid or passport numbers never fail an operation.
 */
export function getComputedNidHash(
  rawNid: unknown,
  hmacKey: string | null | undefined,
): string | null {
  if (!hmacKey) return null;
  try {
    const normalized = normalizeNid(rawNid);
    if (!normalized) return null;
    return computeNidHmac(normalized, hmacKey);
  } catch {
    return null;
  }
}
