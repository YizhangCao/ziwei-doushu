import { prisma } from '@/lib/db';

// Every table in prisma/schema.prisma. Truncating them gives each test a clean
// test database (setup.ts guarantees DATABASE_URL points at DATABASE_URL_TEST).
const TABLES = ['Message', 'Conversation', 'ConsultMessage', 'Share', 'Chart', 'ApiKey', 'Setting', 'User'];

export async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${TABLES.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`);
}
