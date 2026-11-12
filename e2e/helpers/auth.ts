import { existsSync } from 'node:fs';
import type { BrowserContext } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import { Client } from 'pg';

// Locally the dev server reads .env.local, so the spec must sign cookies with the same
// AUTH_SECRET and write to the same database. In CI both are already in the environment;
// loadEnvFile never overrides variables that are set.
if (existsSync('.env.local')) process.loadEnvFile('.env.local');

const SESSION_COOKIE = 'authjs.session-token';

/** A fake member used only by E2E specs (no real person). */
export const E2E_MEMBER = { id: 'e2e-member-charts', email: 'e2e-charts@ziweihub.test' };

async function withDb<T>(fn: (db: Client) => Promise<T>): Promise<T> {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    return await fn(db);
  } finally {
    await db.end();
  }
}

/** Creates (or resets) the E2E member and removes their charts, so each run starts clean. */
export async function resetE2eMember(): Promise<void> {
  await withDb(async (db) => {
    await db.query(
      `INSERT INTO "User" (id, email, name, role, "createdAt", "updatedAt")
       VALUES ($1, $2, 'E2E Member', 'member', now(), now())
       ON CONFLICT (id) DO UPDATE SET role = 'member', "updatedAt" = now()`,
      [E2E_MEMBER.id, E2E_MEMBER.email],
    );
    await db.query(`DELETE FROM "Chart" WHERE "ownerId" = $1`, [E2E_MEMBER.id]);
    await db.query(`DELETE FROM "ApiKey" WHERE "userId" = $1`, [E2E_MEMBER.id]);
  });
}

/** Signs the browser context in as the E2E member, as Auth.js would after a GitHub login. */
export async function signInAsE2eMember(context: BrowserContext, baseURL: string): Promise<void> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set (see .env.example)');
  const token = { sub: E2E_MEMBER.id, role: 'member', name: 'E2E Member', roleCheckedAt: Date.now() };
  const value = await encode({ token, secret, salt: SESSION_COOKIE });
  const { hostname } = new URL(baseURL);
  await context.addCookies([{ name: SESSION_COOKIE, value, domain: hostname, path: '/', httpOnly: true, sameSite: 'Lax' }]);
}
