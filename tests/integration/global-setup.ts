import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

// Runs once before the integration suite: applies any pending migrations to the test
// database with `prisma migrate deploy` (non-destructive). Each test then starts from empty
// tables via resetDatabase() in tests/integration/helpers/reset.ts.
export default function setup(): void {
  const local = existsSync('.env.local') ? parseEnv(readFileSync('.env.local', 'utf8')) : {};
  const testUrl = process.env.DATABASE_URL_TEST ?? local.DATABASE_URL_TEST;
  if (!testUrl) throw new Error('DATABASE_URL_TEST is not set. Add it to .env.local (see .env.example).');

  // The tests truncate every table. Refuse if the "test" URL is really the app database
  // from .env.local (the shared Vercel DATABASE_URL).
  if (local.DATABASE_URL && testUrl === local.DATABASE_URL) {
    throw new Error('DATABASE_URL_TEST equals DATABASE_URL in .env.local; refusing to run integration tests.');
  }

  execFileSync('npx', ['--no-install', 'prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: ['ignore', 'ignore', 'inherit'],
    shell: process.platform === 'win32',
  });
}
