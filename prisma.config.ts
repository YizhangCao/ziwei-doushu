import { defineConfig } from 'prisma/config';

// Deliberately does NOT load .env.local: there, DATABASE_URL is the shared Vercel database,
// so a stray local `prisma migrate` must not reach it. Commands get DATABASE_URL from the
// environment: Vercel and CI set it, and the integration tests point it at DATABASE_URL_TEST.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
