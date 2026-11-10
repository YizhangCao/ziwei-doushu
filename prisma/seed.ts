import type { PrismaClient } from '../lib/generated/prisma/client';

// Fake demo accounts, one per role (#14). Upserts make the seed safe to run more than once.
const SEED_USERS = [
  { email: 'member@ziweihub.test', name: 'Demo Member', role: 'member' },
  { email: 'practitioner@ziweihub.test', name: 'Demo Practitioner', role: 'practitioner' },
  { email: 'admin@ziweihub.test', name: 'Demo Admin', role: 'admin' },
] as const;

export async function seed(prisma: PrismaClient): Promise<void> {
  for (const user of SEED_USERS) {
    await prisma.user.upsert({ where: { email: user.email }, update: { role: user.role }, create: user });
  }
}

// `prisma db seed` runs this file directly with tsx.
if (process.argv[1]?.replace(/\\/g, '/').endsWith('prisma/seed.ts')) {
  void import('../lib/db').then(async ({ prisma }) => {
    try {
      await seed(prisma);
      console.log(`Seeded ${SEED_USERS.length} users`);
    } finally {
      await prisma.$disconnect();
    }
  });
}
