import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import { upsertUserFromProfile } from '@/lib/auth/session';
import { resetDatabase } from './helpers/reset';

// Sign-in creates or updates the User row from the GitHub profile (#15).
// Fake people only (AGENTS.md).
beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('upsertUserFromProfile(db, profile)', () => {
  it('creates a new user with the member role', async () => {
    const user = await upsertUserFromProfile(prisma, {
      email: 'new@example.test',
      name: 'New Person',
      image: 'https://example.test/a.png',
    });

    expect(user.role).toBe('member');
    const row = await prisma.user.findUniqueOrThrow({ where: { email: 'new@example.test' } });
    expect(row).toMatchObject({ id: user.id, role: 'member', name: 'New Person', image: 'https://example.test/a.png' });
  });

  it('returns the same user on a second sign-in and refreshes name and image', async () => {
    const first = await upsertUserFromProfile(prisma, { email: 'again@example.test', name: 'Old', image: null });
    const second = await upsertUserFromProfile(prisma, { email: 'again@example.test', name: 'New', image: 'https://example.test/b.png' });

    expect(second.id).toBe(first.id);
    expect(await prisma.user.count()).toBe(1);
    const row = await prisma.user.findUniqueOrThrow({ where: { id: first.id } });
    expect(row).toMatchObject({ name: 'New', image: 'https://example.test/b.png' });
  });

  it('never changes the role of an existing user', async () => {
    await prisma.user.create({ data: { email: 'boss@example.test', role: 'admin' } });

    const user = await upsertUserFromProfile(prisma, { email: 'boss@example.test', name: 'Boss', image: null });

    expect(user.role).toBe('admin');
    expect((await prisma.user.findUniqueOrThrow({ where: { email: 'boss@example.test' } })).role).toBe('admin');
  });

  it('rejects a profile without an email and creates nothing', async () => {
    await expect(upsertUserFromProfile(prisma, { email: null, name: 'No Email', image: null })).rejects.toThrow();
    await expect(upsertUserFromProfile(prisma, { email: '', name: 'Empty Email', image: null })).rejects.toThrow();
    expect(await prisma.user.count()).toBe(0);
  });
});
