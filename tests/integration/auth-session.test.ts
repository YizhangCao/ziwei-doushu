/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.2
 * Created: November 10, 2026 · San Francisco, California, USA
 * Last Edited: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Integration tests for `upsertUserFromProfile` on a real database.
 * Users are matched by GitHub account id, never by email. All people and emails
 * are fictional.
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import { upsertUserFromProfile } from '@/lib/auth/session';
import { resetDatabase } from './helpers/reset';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('upsertUserFromProfile(db, profile)', () => {
  it('creates a new user with the member role, keyed by GitHub id', async () => {
    const user = await upsertUserFromProfile(prisma, {
      githubId: '1001',
      email: 'new@example.test',
      name: 'New Person',
      image: 'https://example.test/a.png',
    });

    expect(user.role).toBe('member');
    const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(row).toMatchObject({
      githubId: '1001',
      email: 'new@example.test',
      role: 'member',
      name: 'New Person',
      image: 'https://example.test/a.png',
    });
  });

  it('returns the same user on a second sign-in and refreshes name and image', async () => {
    const first = await upsertUserFromProfile(prisma, { githubId: '1002', email: 'again@example.test', name: 'Old', image: null });
    const second = await upsertUserFromProfile(prisma, {
      githubId: '1002',
      email: 'again@example.test',
      name: 'New',
      image: 'https://example.test/b.png',
    });

    expect(second.id).toBe(first.id);
    expect(await prisma.user.count()).toBe(1);
    const row = await prisma.user.findUniqueOrThrow({ where: { id: first.id } });
    expect(row).toMatchObject({ name: 'New', image: 'https://example.test/b.png' });
  });

  it('never changes the role of an existing user', async () => {
    await prisma.user.create({ data: { githubId: '1003', email: 'boss@example.test', role: 'admin' } });

    const user = await upsertUserFromProfile(prisma, { githubId: '1003', email: 'boss@example.test', name: 'Boss', image: null });

    expect(user.role).toBe('admin');
    expect((await prisma.user.findUniqueOrThrow({ where: { githubId: '1003' } })).role).toBe('admin');
  });

  it('creates the user with no email when GitHub provides none', async () => {
    const user = await upsertUserFromProfile(prisma, { githubId: '1004', email: null, name: 'Private Email', image: null });

    const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(row).toMatchObject({ githubId: '1004', email: null, role: 'member' });
  });

  it('rejects a profile without a GitHub id and creates nothing', async () => {
    await expect(upsertUserFromProfile(prisma, { githubId: '', email: 'x@example.test', name: 'X', image: null })).rejects.toThrow();
    await expect(upsertUserFromProfile(prisma, { githubId: null, email: 'y@example.test', name: 'Y', image: null })).rejects.toThrow();
    expect(await prisma.user.count()).toBe(0);
  });

  it('never links an existing account by email: a taken email is stored as null on the new user', async () => {
    const existing = await prisma.user.create({ data: { email: 'taken@example.test', role: 'admin' } });

    const user = await upsertUserFromProfile(prisma, { githubId: '1005', email: 'taken@example.test', name: 'Someone', image: null });

    expect(user.id).not.toBe(existing.id);
    expect(user.role).toBe('member');
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).email).toBeNull();
    expect(await prisma.user.findUniqueOrThrow({ where: { id: existing.id } })).toMatchObject({
      email: 'taken@example.test',
      githubId: null,
      role: 'admin',
    });
  });
});
