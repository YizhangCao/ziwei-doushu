import { describe, it, expect } from 'vitest';
import { e2eApiKeyFromEnv } from '@/prisma/seed';

// Fake, low-entropy key shaped like a real one (zwk_ + 43 base64url characters).
const FAKE_KEY = `zwk_e2e${'0'.repeat(40)}`;

describe('e2eApiKeyFromEnv — which API key the seed creates for E2E', () => {
  it('returns nothing when E2E_API_KEY is not set, so a normal seed creates no key', () => {
    expect(e2eApiKeyFromEnv({})).toBeUndefined();
    expect(e2eApiKeyFromEnv({ E2E_API_KEY: '' })).toBeUndefined();
  });

  it('returns the key when it looks like a ZiweiHub API key and the run is CI', () => {
    expect(e2eApiKeyFromEnv({ E2E_API_KEY: FAKE_KEY, CI: 'true' })).toBe(FAKE_KEY);
  });

  it('rejects a malformed key without echoing it', () => {
    for (const bad of ['not-a-key', 'zwk_short', `abc_${'0'.repeat(43)}`, `zwk_${'0'.repeat(42)}`, `zwk_${'0'.repeat(44)}`]) {
      expect(() => e2eApiKeyFromEnv({ E2E_API_KEY: bad }), bad).toThrow(/E2E_API_KEY/);
      try {
        e2eApiKeyFromEnv({ E2E_API_KEY: bad });
      } catch (err) {
        expect((err as Error).message).not.toContain(bad);
      }
    }
  });

  // The key is public (ci.yml, and the repo is public), so seeding it into a real database would
  // create a working key there. It may only go into CI's Postgres or a database on this machine.
  it('seeds when CI is set, whatever the database', () => {
    expect(e2eApiKeyFromEnv({ E2E_API_KEY: FAKE_KEY, CI: 'true', DATABASE_URL: 'postgresql://u:p@db.example.com:5432/app' })).toBe(FAKE_KEY);
  });

  it('seeds outside CI only when the database host is localhost', () => {
    for (const host of ['localhost', '127.0.0.1', '[::1]']) {
      expect(e2eApiKeyFromEnv({ E2E_API_KEY: FAKE_KEY, DATABASE_URL: `postgresql://u:p@${host}:5432/ziwei_dev` }), host).toBe(FAKE_KEY);
    }
  });

  it('refuses a remote database outside CI, without echoing the URL or the key', () => {
    const url = 'postgresql://u:secret-pass@ep-real-db-123.neon.tech/neondb';
    for (const env of [{ DATABASE_URL: url }, { DATABASE_URL: url, VERCEL_ENV: 'production' }, { DATABASE_URL: url, CI: '' }, {}]) {
      let message = '';
      try {
        e2eApiKeyFromEnv({ E2E_API_KEY: FAKE_KEY, ...env });
      } catch (err) {
        message = (err as Error).message;
      }
      expect(message, JSON.stringify(Object.keys(env))).toMatch(/CI|localhost/);
      expect(message).not.toContain('secret-pass');
      expect(message).not.toContain(FAKE_KEY);
    }
  });

  it('does not treat a lookalike host as localhost', () => {
    expect(() => e2eApiKeyFromEnv({ E2E_API_KEY: FAKE_KEY, DATABASE_URL: 'postgresql://u:p@localhost.evil.example/db' })).toThrow();
  });
});
