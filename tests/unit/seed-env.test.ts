import { describe, it, expect } from 'vitest';
import { e2eApiKeyFromEnv } from '@/prisma/seed';

// Fake, low-entropy key shaped like a real one (zwk_ + 43 base64url characters).
const FAKE_KEY = `zwk_e2e${'0'.repeat(40)}`;

describe('e2eApiKeyFromEnv — which API key the seed creates for E2E', () => {
  it('returns nothing when E2E_API_KEY is not set, so a normal seed creates no key', () => {
    expect(e2eApiKeyFromEnv({})).toBeUndefined();
    expect(e2eApiKeyFromEnv({ E2E_API_KEY: '' })).toBeUndefined();
  });

  it('returns the key when it looks like a ZiweiHub API key', () => {
    expect(e2eApiKeyFromEnv({ E2E_API_KEY: FAKE_KEY })).toBe(FAKE_KEY);
  });

  it('rejects a malformed key without echoing it', () => {
    for (const bad of ['not-a-key', 'zwk_short', `abc_${'0'.repeat(43)}`, `zwk_${'0'.repeat(42)}`]) {
      expect(() => e2eApiKeyFromEnv({ E2E_API_KEY: bad }), bad).toThrow(/E2E_API_KEY/);
      try {
        e2eApiKeyFromEnv({ E2E_API_KEY: bad });
      } catch (err) {
        expect((err as Error).message).not.toContain(bad);
      }
    }
  });

  it('refuses to seed a test key into production', () => {
    expect(() => e2eApiKeyFromEnv({ E2E_API_KEY: FAKE_KEY, VERCEL_ENV: 'production' })).toThrow(/production/);
    expect(() => e2eApiKeyFromEnv({ E2E_API_KEY: FAKE_KEY, NODE_ENV: 'production', VERCEL_ENV: 'production' })).toThrow();
  });

  it('allows preview and local runs', () => {
    expect(e2eApiKeyFromEnv({ E2E_API_KEY: FAKE_KEY, VERCEL_ENV: 'preview' })).toBe(FAKE_KEY);
    expect(e2eApiKeyFromEnv({ E2E_API_KEY: FAKE_KEY, NODE_ENV: 'development' })).toBe(FAKE_KEY);
  });
});
