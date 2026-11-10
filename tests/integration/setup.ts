import { existsSync } from 'node:fs';

// Locally the URL comes from .env.local; in CI it is already in the environment.
// loadEnvFile never overrides variables that are already set, so CI values win.
if (existsSync('.env.local')) process.loadEnvFile('.env.local');

const testUrl = process.env.DATABASE_URL_TEST;
if (!testUrl) {
  throw new Error('DATABASE_URL_TEST is not set. Add it to .env.local (see .env.example).');
}

// Prisma and every other client read DATABASE_URL. Pointing it at the test database here,
// before any test file loads, means integration tests can never reach dev or production.
process.env.DATABASE_URL = testUrl;
