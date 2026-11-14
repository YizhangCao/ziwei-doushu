import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { API_KEY_PREFIX, apiKeyRecordFor, generateApiKey, hashApiKey, verifyApiKey } from '@/lib/api/keys';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

describe('generateApiKey() — the plain key is shown once, only its hash is stored', () => {
  it('returns a plain key with the ZiweiHub prefix', () => {
    const { plainKey } = generateApiKey();
    expect(plainKey.startsWith(API_KEY_PREFIX)).toBe(true);
    // 32 random bytes in base64url after the prefix: long enough that guessing is hopeless.
    expect(plainKey.length).toBeGreaterThanOrEqual(API_KEY_PREFIX.length + 43);
  });

  it('returns a different key every time', () => {
    const keys = new Set(Array.from({ length: 20 }, () => generateApiKey().plainKey));
    expect(keys.size).toBe(20);
  });

  it('gives a record to store: the SHA-256 hash and a short prefix of the key', () => {
    const { plainKey, record } = generateApiKey();
    expect(record.keyHash).toBe(sha256(plainKey));
    expect(record.keyHash).toMatch(/^[0-9a-f]{64}$/);
    expect(plainKey.startsWith(record.prefix)).toBe(true);
    expect(record.prefix.length).toBeGreaterThan(API_KEY_PREFIX.length);
    expect(record.prefix.length).toBeLessThanOrEqual(12);
  });

  it('never puts the plain key in the record that gets stored', () => {
    const { plainKey, record } = generateApiKey();
    expect(Object.keys(record).sort()).toEqual(['keyHash', 'prefix']);
    for (const value of Object.values(record)) expect(value).not.toContain(plainKey);
  });
});

describe('apiKeyRecordFor(plainKey) — the stored record for a key that already exists (seeding)', () => {
  it('is the same record generateApiKey() makes for that key', () => {
    const { plainKey, record } = generateApiKey();
    expect(apiKeyRecordFor(plainKey)).toEqual(record);
  });

  it('never contains the plain key', () => {
    const plainKey = `${API_KEY_PREFIX}${'0'.repeat(43)}`;
    const record = apiKeyRecordFor(plainKey);
    expect(Object.keys(record).sort()).toEqual(['keyHash', 'prefix']);
    expect(record.keyHash).toBe(sha256(plainKey));
    for (const value of Object.values(record)) expect(value).not.toBe(plainKey);
  });
});

describe('hashApiKey(plainKey)', () => {
  it('is the SHA-256 hex digest, so lookups by hash are deterministic', () => {
    expect(hashApiKey('zwk_example')).toBe(sha256('zwk_example'));
    expect(hashApiKey('zwk_example')).toBe(hashApiKey('zwk_example'));
  });
});

describe('verifyApiKey(plainKey, stored)', () => {
  it('accepts the key its hash was made from', () => {
    const { plainKey, record } = generateApiKey();
    expect(verifyApiKey(plainKey, { keyHash: record.keyHash, revokedAt: null })).toBe(true);
  });

  it('rejects a different key', () => {
    const { record } = generateApiKey();
    const other = generateApiKey().plainKey;
    expect(verifyApiKey(other, { keyHash: record.keyHash, revokedAt: null })).toBe(false);
  });

  it('rejects a revoked key, even with the right hash', () => {
    const { plainKey, record } = generateApiKey();
    expect(verifyApiKey(plainKey, { keyHash: record.keyHash, revokedAt: new Date('2026-11-01T00:00:00Z') })).toBe(false);
  });

  it('rejects an empty key and a malformed stored hash without throwing', () => {
    const { plainKey, record } = generateApiKey();
    expect(verifyApiKey('', { keyHash: record.keyHash, revokedAt: null })).toBe(false);
    expect(verifyApiKey(plainKey, { keyHash: 'not-a-hash', revokedAt: null })).toBe(false);
  });
});
