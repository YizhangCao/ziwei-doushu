import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/** Every ZiweiHub API key starts with this, so leaked keys are easy to recognise and scan for. */
export const API_KEY_PREFIX = 'zwk_';

// Characters of the plain key kept as `prefix`: enough to tell keys apart in a list,
// far too few to guess the rest (the key has 256 random bits).
const DISPLAY_PREFIX_LENGTH = 12;

/** What gets stored in the ApiKey table. The plain key is deliberately not part of it. */
export interface ApiKeyRecord {
  keyHash: string;
  prefix: string;
}

export interface GeneratedApiKey {
  /** Shown to the user once, at creation. Never stored or logged. */
  plainKey: string;
  record: ApiKeyRecord;
}

/** The stored fields a verification needs. */
export interface StoredApiKey {
  keyHash: string;
  revokedAt: Date | null;
}

/** SHA-256 hex digest. A fast hash is enough here: keys are random, so there's nothing to brute-force. */
export function hashApiKey(plainKey: string): string {
  return createHash('sha256').update(plainKey).digest('hex');
}

export function generateApiKey(): GeneratedApiKey {
  const plainKey = API_KEY_PREFIX + randomBytes(32).toString('base64url');
  return {
    plainKey,
    record: { keyHash: hashApiKey(plainKey), prefix: plainKey.slice(0, DISPLAY_PREFIX_LENGTH) },
  };
}

/** True only for the key the hash was made from, and only while the key isn't revoked. */
export function verifyApiKey(plainKey: string, stored: StoredApiKey): boolean {
  if (!plainKey || stored.revokedAt) return false;
  const expected = Buffer.from(stored.keyHash, 'hex');
  const actual = Buffer.from(hashApiKey(plainKey), 'hex');
  // A malformed stored hash decodes to the wrong length; timingSafeEqual would throw on it.
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
