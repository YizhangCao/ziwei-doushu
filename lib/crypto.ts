import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';
import { z } from 'zod';
import type { BirthInfo } from '@/lib/ziwei/types';

// Encryption at rest for birth data (AGENTS.md "Security"). Server-only: never import from a
// 'use client' file.

/** Thrown when DATA_ENCRYPTION_KEY is missing or malformed. The message never includes the key. */
export class EncryptionKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EncryptionKeyError';
  }
}

const keySchema = z
  .string({ error: 'DATA_ENCRYPTION_KEY is not set' })
  .regex(/^[0-9a-fA-F]{32}$/, 'DATA_ENCRYPTION_KEY must be exactly 32 hex characters');

const VERSION = 'v1';
const IV_BYTES = 12; // the GCM standard nonce size
const TAG_BYTES = 16;
// Binds derived keys to this one purpose, so the same secret can't decrypt anything else.
const HKDF_INFO = 'ziwei-hub birth-info v1';

// Read on every call, not at import: a missing key then fails the request that needs it,
// not `next build`, and tests can switch keys.
function loadKey(): Buffer {
  const parsed = keySchema.safeParse(process.env.DATA_ENCRYPTION_KEY);
  if (!parsed.success) throw new EncryptionKeyError(parsed.error.issues[0].message);
  // The env key is 32 hex chars = 16 bytes; AES-256 needs 32. HKDF-SHA256 stretches it.
  // See #18: a 64-hex key would give a full 256 bits of key material.
  return Buffer.from(hkdfSync('sha256', Buffer.from(parsed.data, 'hex'), Buffer.alloc(0), HKDF_INFO, 32));
}

/** AES-256-GCM with a random IV. Output: "v1.<iv>.<tag>.<ciphertext>", each part base64url. */
export function encryptString(plaintext: string): string {
  const key = loadKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, ...[iv, tag, ciphertext].map((part) => part.toString('base64url'))].join('.');
}

/** Throws on a wrong key or any change to the payload (GCM authenticates it). */
export function decryptString(payload: string): string {
  const key = loadKey();
  const parts = payload.split('.');
  if (parts.length !== 4 || parts[0] !== VERSION) throw new Error('Unrecognised encrypted payload');
  const [iv, tag, ciphertext] = parts.slice(1).map((part) => Buffer.from(part, 'base64url'));
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) throw new Error('Unrecognised encrypted payload');

  const decipher = createDecipheriv('aes-256-gcm', key, iv, { authTagLength: TAG_BYTES });
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

// Only the fields every chart needs; the optional ones (place, original clock time) pass through.
const storedBirthInfoSchema = z.looseObject({
  year: z.number().int(),
  month: z.number().int(),
  day: z.number().int(),
  hour: z.number().int().min(0).max(11),
  gender: z.enum(['male', 'female']),
});

export function encryptBirthInfo(birthInfo: BirthInfo): string {
  return encryptString(JSON.stringify(birthInfo));
}

export function decryptBirthInfo(payload: string): BirthInfo {
  const parsed = storedBirthInfoSchema.safeParse(JSON.parse(decryptString(payload)));
  if (!parsed.success) throw new Error('Decrypted birth data has an unexpected shape');
  return parsed.data as BirthInfo;
}
