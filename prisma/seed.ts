import { z } from 'zod';
import { apiKeyRecordFor } from '../lib/api/keys';
import type { PrismaClient } from '../lib/generated/prisma/client';

// Fake demo accounts, one per role (#14). Upserts make the seed safe to run more than once.
const SEED_USERS = [
  { email: 'member@ziweihub.test', name: 'Demo Member', role: 'member' },
  { email: 'practitioner@ziweihub.test', name: 'Demo Practitioner', role: 'practitioner' },
  { email: 'admin@ziweihub.test', name: 'Demo Admin', role: 'admin' },
] as const;

/** The seeded member who owns the E2E API key (#26). */
export const E2E_API_KEY_OWNER = 'member@ziweihub.test';
export const E2E_API_KEY_NAME = 'E2E test key';

export interface SeedOptions {
  /** Plain E2E API key. Only its hash and prefix are stored. */
  e2eApiKey?: string;
}

// Same shape generateApiKey() produces: zwk_ + 32 bytes in base64url (43 characters).
const e2eKeySchema = z.string().regex(/^zwk_[A-Za-z0-9_-]{43}$/);

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

function isLocalDatabase(databaseUrl: string | undefined): boolean {
  if (!databaseUrl) return false;
  try {
    return LOCAL_HOSTS.has(new URL(databaseUrl).hostname);
  } catch {
    return false;
  }
}

/**
 * Reads E2E_API_KEY from the environment. Unset → no key is seeded. The key is public (it's in
 * ci.yml, and the repo is public), so seeding it into a real database would create a working key
 * there. It is seeded only into a database on this machine; CI's Postgres is localhost too. There
 * is no CI exception on purpose: Vercel sets CI=1 during builds, so if the seed ever ran in a
 * build, that exception would skip the guard against the production database.
 */
export function e2eApiKeyFromEnv(env: Record<string, string | undefined>): string | undefined {
  const value = env.E2E_API_KEY;
  if (!value) return undefined;
  // Neither message repeats the key or the database URL.
  if (!e2eKeySchema.safeParse(value).success) {
    throw new Error('E2E_API_KEY must look like a Ziwei Natal Chart API key: "zwk_" followed by 43 base64url characters');
  }
  if (!isLocalDatabase(env.DATABASE_URL)) {
    throw new Error('Refusing to seed E2E_API_KEY: only into a localhost database');
  }
  return value;
}

export async function seed(prisma: PrismaClient, options: SeedOptions = {}): Promise<void> {
  for (const user of SEED_USERS) {
    await prisma.user.upsert({ where: { email: user.email }, update: { role: user.role }, create: user });
  }

  if (options.e2eApiKey) {
    const owner = await prisma.user.findUniqueOrThrow({ where: { email: E2E_API_KEY_OWNER } });
    const record = apiKeyRecordFor(options.e2eApiKey);
    await prisma.apiKey.upsert({
      where: { keyHash: record.keyHash },
      create: { userId: owner.id, name: E2E_API_KEY_NAME, ...record },
      update: { userId: owner.id, revokedAt: null },
    });
  }
}

// `prisma db seed` runs this file directly with tsx.
if (process.argv[1]?.replace(/\\/g, '/').endsWith('prisma/seed.ts')) {
  const e2eApiKey = e2eApiKeyFromEnv(process.env);
  void import('../lib/db').then(async ({ prisma }) => {
    try {
      await seed(prisma, { e2eApiKey });
      console.log(`Seeded ${SEED_USERS.length} users${e2eApiKey ? ' and the E2E API key' : ''}`);
    } finally {
      await prisma.$disconnect();
    }
  });
}
