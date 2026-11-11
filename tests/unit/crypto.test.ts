import { createDecipheriv } from 'node:crypto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { decryptBirthInfo, encryptBirthInfo, EncryptionKeyError } from '@/lib/crypto';
import type { BirthInfo } from '@/lib/ziwei/types';

// Test-only 256-bit keys (64 hex chars): valid, deliberately low-entropy so they never look like real secrets.
const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);

// Fake person (AGENTS.md: no real birth data in tests).
const BIRTH: BirthInfo = {
  year: 1990, month: 6, day: 15, hour: 6, gender: 'female',
  province: '测试省', city: '测试市', longitude: 116.4,
  origInput: { year: 1990, month: 6, day: 15, clockHour: 12, clockMinute: 30 },
};

beforeEach(() => vi.stubEnv('DATA_ENCRYPTION_KEY', KEY_A));
afterEach(() => vi.unstubAllEnvs());

// Flips one character of the payload's segment at `index` (segments are separated by ".").
function tamper(payload: string, index: number): string {
  const parts = payload.split('.');
  const segment = parts[index];
  const flipped = segment[0] === 'A' ? 'B' : 'A';
  parts[index] = flipped + segment.slice(1);
  return parts.join('.');
}

describe('encryptBirthInfo / decryptBirthInfo — AES-256-GCM', () => {
  it('round-trips birth data', () => {
    expect(decryptBirthInfo(encryptBirthInfo(BIRTH))).toEqual(BIRTH);
  });

  it('produces different ciphertext each time (random IV)', () => {
    const first = encryptBirthInfo(BIRTH);
    const second = encryptBirthInfo(BIRTH);
    expect(first).not.toBe(second);
    expect(first.split('.')[1]).not.toBe(second.split('.')[1]);
    expect(decryptBirthInfo(first)).toEqual(decryptBirthInfo(second));
  });

  it('never contains the birth data in readable form', () => {
    const payload = encryptBirthInfo(BIRTH);
    for (const fragment of ['1990', '"year"', 'female', '测试', '116.4']) {
      expect(payload).not.toContain(fragment);
    }
  });

  it('is a versioned "v1.<iv>.<tag>.<ciphertext>" string', () => {
    expect(encryptBirthInfo(BIRTH)).toMatch(/^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  });
});

describe('decryptBirthInfo — rejects anything it did not encrypt with this key', () => {
  it('fails on tampered ciphertext, IV, or auth tag', () => {
    const payload = encryptBirthInfo(BIRTH);
    for (const index of [1, 2, 3]) {
      expect(() => decryptBirthInfo(tamper(payload, index))).toThrow();
    }
  });

  it('fails with a different key', () => {
    const payload = encryptBirthInfo(BIRTH);
    vi.stubEnv('DATA_ENCRYPTION_KEY', KEY_B);
    expect(() => decryptBirthInfo(payload)).toThrow();
  });

  it('fails on a malformed payload or an unknown version', () => {
    const payload = encryptBirthInfo(BIRTH);
    expect(() => decryptBirthInfo('')).toThrow();
    expect(() => decryptBirthInfo('not-a-payload')).toThrow();
    expect(() => decryptBirthInfo(payload.replace(/^v1\./, 'v2.'))).toThrow();
  });
});

describe('DATA_ENCRYPTION_KEY — refuses to run without a valid key', () => {
  it('throws EncryptionKeyError when the key is missing', () => {
    vi.stubEnv('DATA_ENCRYPTION_KEY', undefined);
    expect(() => encryptBirthInfo(BIRTH)).toThrow(EncryptionKeyError);
    expect(() => decryptBirthInfo('v1.a.b.c')).toThrow(EncryptionKeyError);
  });

  it('throws EncryptionKeyError when the key is not exactly 64 hex characters (32 bytes)', () => {
    for (const bad of ['', 'abc123', 'z'.repeat(64), KEY_A.slice(1), `${KEY_A}0`, KEY_A + KEY_A, 'ci-only-32-byte-key-000000000000']) {
      vi.stubEnv('DATA_ENCRYPTION_KEY', bad);
      expect(() => encryptBirthInfo(BIRTH), `key "${bad}"`).toThrow(EncryptionKeyError);
    }
  });

  it('rejects a 32-hex (128-bit) key: AES-256 needs a full 32-byte key', () => {
    vi.stubEnv('DATA_ENCRYPTION_KEY', 'a'.repeat(32));
    expect(() => encryptBirthInfo(BIRTH)).toThrow(EncryptionKeyError);
    expect(() => encryptBirthInfo(BIRTH)).toThrow(/64 hex/);
  });

  it('uses the 32 key bytes directly as the AES-256-GCM key', () => {
    const [, iv, tag, ciphertext] = encryptBirthInfo(BIRTH).split('.').map((part) => Buffer.from(part, 'base64url'));
    const decipher = createDecipheriv('aes-256-gcm', Buffer.from(KEY_A, 'hex'), iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    expect(JSON.parse(plaintext)).toEqual(BIRTH);
  });

  it('never puts the key in the error message', () => {
    const bad = 'q'.repeat(64);
    vi.stubEnv('DATA_ENCRYPTION_KEY', bad);
    expect(() => encryptBirthInfo(BIRTH)).toThrow(/DATA_ENCRYPTION_KEY/);
    try {
      encryptBirthInfo(BIRTH);
    } catch (err) {
      expect((err as Error).message).not.toContain(bad);
    }
  });

  it('accepts upper-case hex', () => {
    vi.stubEnv('DATA_ENCRYPTION_KEY', KEY_A.toUpperCase());
    expect(decryptBirthInfo(encryptBirthInfo(BIRTH))).toEqual(BIRTH);
  });
});
