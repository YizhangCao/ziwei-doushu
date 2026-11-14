/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Integration tests for `refreshTokenRole` on a real database: the
 * session JWT picks up role changes, and a deleted user's session ends. All
 * people are fictional.
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import type { PrismaClient } from '@/lib/generated/prisma/client';
import { ROLE_REFRESH_MS, refreshTokenRole, toSessionUser } from '@/lib/auth/session';
import { resetDatabase } from './helpers/reset';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const NOW = Date.UTC(2026, 10, 11, 12, 0, 0);

/** Creates a user with `role` and returns its id. */
async function userWithRole(role: 'member' | 'practitioner' | 'admin'): Promise<string> {
  return (await prisma.user.create({ data: { githubId: `gh-${role}`, role }, select: { id: true } })).id;
}

describe('refreshTokenRole(db, token, now)', () => {
  it('keeps a recently checked role without reading the database', async () => {
    const id = await userWithRole('practitioner');
    await prisma.user.update({ where: { id }, data: { role: 'member' } });
    const token = { sub: id, role: 'practitioner', roleCheckedAt: NOW - 60_000 };

    expect(await refreshTokenRole(prisma, token, NOW)).toEqual(token);
  });

  it('reads the current role once the last check is older than ROLE_REFRESH_MS', async () => {
    const id = await userWithRole('practitioner');
    await prisma.user.update({ where: { id }, data: { role: 'member' } });
    const token = { sub: id, role: 'practitioner', roleCheckedAt: NOW - ROLE_REFRESH_MS - 1 };

    const refreshed = await refreshTokenRole(prisma, token, NOW);
    expect(refreshed).toMatchObject({ sub: id, role: 'member', roleCheckedAt: NOW });
    expect(toSessionUser(refreshed)).toEqual({ id, role: 'member' });
  });

  it('reads the role right away for a token issued before role checks existed', async () => {
    const id = await userWithRole('admin');

    expect(await refreshTokenRole(prisma, { sub: id, role: 'member' }, NOW)).toMatchObject({ role: 'admin', roleCheckedAt: NOW });
  });

  it('returns null when the user no longer exists, so Auth.js ends the session', async () => {
    expect(await refreshTokenRole(prisma, { sub: 'no-such-user', role: 'member' }, NOW)).toBeNull();
  });

  it('keeps the token if the database read fails, so an outage does not sign everyone out', async () => {
    const failingDb = { user: { findUnique: () => Promise.reject(new Error('database unavailable')) } } as unknown as Pick<PrismaClient, 'user'>;
    const token = { sub: 'user-1', role: 'practitioner' };

    expect(await refreshTokenRole(failingDb, token, NOW)).toEqual(token);
  });
});
