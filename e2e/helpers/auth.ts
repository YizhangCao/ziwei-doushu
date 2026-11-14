import { existsSync } from 'node:fs';
import type { BrowserContext } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import { Client } from 'pg';

// Locally the dev server reads .env.local, so the spec must sign cookies with the same
// AUTH_SECRET and write to the same database. In CI both are already in the environment;
// loadEnvFile never overrides variables that are set.
if (existsSync('.env.local')) process.loadEnvFile('.env.local');

const SESSION_COOKIE = 'authjs.session-token';

export interface E2eMember {
  id: string;
  email: string;
}

/** A fake member used only by E2E specs (no real person). */
export const E2E_MEMBER: E2eMember = { id: 'e2e-member-charts', email: 'e2e-charts@ziweihub.test' };

/** A second fake member, so specs that run in parallel never see each other's saved charts. */
export const E2E_CONVERSATION_MEMBER: E2eMember = { id: 'e2e-member-conversations', email: 'e2e-conversations@ziweihub.test' };

async function withDb<T>(fn: (db: Client) => Promise<T>): Promise<T> {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    return await fn(db);
  } finally {
    await db.end();
  }
}

/** Creates (or resets) an E2E member and removes their charts, so each run starts clean. */
export async function resetE2eMember(member: E2eMember = E2E_MEMBER): Promise<void> {
  await withDb(async (db) => {
    await db.query(
      `INSERT INTO "User" (id, email, name, role, "createdAt", "updatedAt")
       VALUES ($1, $2, 'E2E Member', 'member', now(), now())
       ON CONFLICT (id) DO UPDATE SET role = 'member', "updatedAt" = now()`,
      [member.id, member.email],
    );
    await db.query(`DELETE FROM "Chart" WHERE "ownerId" = $1`, [member.id]);
    await db.query(`DELETE FROM "ApiKey" WHERE "userId" = $1`, [member.id]);
  });
}

/** Signs the browser context in as an E2E member, as Auth.js would after a GitHub login. */
export async function signInAsE2eMember(
  context: BrowserContext,
  baseURL: string,
  member: E2eMember = E2E_MEMBER,
): Promise<void> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set (see .env.example)');
  const token = { sub: member.id, role: 'member', name: 'E2E Member', roleCheckedAt: Date.now() };
  const value = await encode({ token, secret, salt: SESSION_COOKIE });
  const { hostname } = new URL(baseURL);
  await context.addCookies([{ name: SESSION_COOKIE, value, domain: hostname, path: '/', httpOnly: true, sameSite: 'Lax' }]);
}

/**
 * Fake users for the consultation spec (#21). The member is not E2E_MEMBER: charts.spec resets
 * that member's charts in parallel, which would delete the chart this spec shares.
 */
export const E2E_CONSULT_MEMBER = { id: 'e2e-consult-member', email: 'e2e-consult-member@ziweihub.test', name: 'E2E Consult Member' };
export const E2E_PRACTITIONER = { id: 'e2e-practitioner', email: 'e2e-practitioner@ziweihub.test', name: 'E2E Practitioner' };

/**
 * Creates (or resets) the consultation spec's member and practitioner, and removes the member's
 * charts; their shares and messages go with them (onDelete: Cascade).
 */
export async function resetConsultationUsers(): Promise<void> {
  await withDb(async (db) => {
    for (const [user, role] of [[E2E_CONSULT_MEMBER, 'member'], [E2E_PRACTITIONER, 'practitioner']] as const) {
      await db.query(
        `INSERT INTO "User" (id, email, name, role, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, now(), now())
         ON CONFLICT (id) DO UPDATE SET role = $4, email = $2, "updatedAt" = now()`,
        [user.id, user.email, user.name, role],
      );
    }
    await db.query(`DELETE FROM "Chart" WHERE "ownerId" = $1`, [E2E_CONSULT_MEMBER.id]);
  });
}

/** Signs the browser context in as one of the consultation spec's users. */
export async function signInAs(
  context: BrowserContext,
  baseURL: string,
  user: { id: string; name: string },
  role: 'member' | 'practitioner',
): Promise<void> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set (see .env.example)');
  const token = { sub: user.id, role, name: user.name, roleCheckedAt: Date.now() };
  const value = await encode({ token, secret, salt: SESSION_COOKIE });
  const { hostname } = new URL(baseURL);
  await context.addCookies([{ name: SESSION_COOKIE, value, domain: hostname, path: '/', httpOnly: true, sameSite: 'Lax' }]);
}
