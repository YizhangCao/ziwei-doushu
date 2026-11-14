/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Integration tests for `resolveToken`, the Auth.js `jwt` callback:
 * a GitHub sign-in puts our user id, role and check time into the token, and every
 * later read goes through the role refresh. All people are fictional.
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import { ROLE_REFRESH_MS, resolveToken } from '@/lib/auth/session';
import { resetDatabase } from './helpers/reset';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const NOW = Date.UTC(2026, 10, 11, 12, 0, 0);
const GITHUB = { provider: 'github', providerAccountId: '4001' };
const PROFILE = { email: 'jwt@example.test', name: 'Token Person', image: null };

describe('resolveToken(db, { token, user, account }, now)', () => {
  it('on GitHub sign-in, sets sub, role and roleCheckedAt from the upserted user', async () => {
    const token = await resolveToken(prisma, { token: { sub: 'github-sub' }, user: PROFILE, account: GITHUB }, NOW);

    const row = await prisma.user.findUniqueOrThrow({ where: { githubId: '4001' } });
    expect(token).toMatchObject({ sub: row.id, role: 'member', roleCheckedAt: NOW });
  });

  it('on sign-in of an existing admin, carries the admin role', async () => {
    const admin = await prisma.user.create({ data: { githubId: '4001', role: 'admin' } });

    const token = await resolveToken(prisma, { token: {}, user: PROFILE, account: GITHUB }, NOW);

    expect(token).toMatchObject({ sub: admin.id, role: 'admin', roleCheckedAt: NOW });
  });

  it('on a later read, keeps a recently checked token as it is', async () => {
    const token = { sub: 'user-1', role: 'member', roleCheckedAt: NOW - 1000 };

    expect(await resolveToken(prisma, { token }, NOW)).toEqual(token);
  });

  it('on a later read, ends the session when the user no longer exists', async () => {
    const token = { sub: 'gone', role: 'member', roleCheckedAt: NOW - ROLE_REFRESH_MS };

    expect(await resolveToken(prisma, { token }, NOW)).toBeNull();
  });
});
