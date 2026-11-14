import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { hashApiKey } from '@/lib/api/keys';
import { prisma } from '@/lib/db';
import { E2E_API_KEY_NAME, E2E_API_KEY_OWNER, seed } from '@/prisma/seed';
import { resetDatabase } from './helpers/reset';

// Fake, low-entropy key shaped like a real one (zwk_ + 43 base64url characters).
const FAKE_KEY = `zwk_e2e${'0'.repeat(40)}`;

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('seed — the E2E API key', () => {
  it('creates no API key when no E2E key is given', async () => {
    await seed(prisma);
    expect(await prisma.apiKey.count()).toBe(0);
  });

  it('stores only the hash and prefix of the key, for the seeded member', async () => {
    await seed(prisma, { e2eApiKey: FAKE_KEY });

    const keys = await prisma.apiKey.findMany({ include: { user: true } });
    expect(keys).toHaveLength(1);
    expect(keys[0]).toMatchObject({
      name: E2E_API_KEY_NAME,
      keyHash: hashApiKey(FAKE_KEY),
      prefix: FAKE_KEY.slice(0, 12),
      revokedAt: null,
    });
    expect(keys[0].user.email).toBe(E2E_API_KEY_OWNER);

    const [raw] = await prisma.$queryRaw<Record<string, unknown>[]>`SELECT * FROM "ApiKey"`;
    expect(JSON.stringify(raw)).not.toContain(FAKE_KEY);
  });

  it('is idempotent, and re-activates the key if it was revoked', async () => {
    await seed(prisma, { e2eApiKey: FAKE_KEY });
    await prisma.apiKey.updateMany({ data: { revokedAt: new Date() } });
    await seed(prisma, { e2eApiKey: FAKE_KEY });

    const keys = await prisma.apiKey.findMany();
    expect(keys).toHaveLength(1);
    expect(keys[0].revokedAt).toBeNull();
  });
});
