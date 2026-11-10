import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

// The only PrismaClient in the app (AGENTS.md). Reused across hot reloads in development,
// so `next dev` doesn't open a new connection pool on every edit.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
