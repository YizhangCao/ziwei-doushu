import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import { seed } from '@/prisma/seed';
import { resetDatabase } from './helpers/reset';

// Fake people only (AGENTS.md: no real birth data in tests). Birth data is stored as ciphertext.
const makeUser = (email: string, role?: 'member' | 'practitioner' | 'admin') =>
  prisma.user.create({ data: { email, ...(role ? { role } : {}) } });
const makeChart = (ownerId: string) =>
  prisma.chart.create({ data: { ownerId, name: 'Test chart', encryptedBirthInfo: 'ciphertext-not-real' } });

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('User', () => {
  it('defaults role to member', async () => {
    const user = await makeUser('member@example.test');
    expect(user.role).toBe('member');
  });

  it('accepts practitioner and admin roles', async () => {
    expect((await makeUser('p@example.test', 'practitioner')).role).toBe('practitioner');
    expect((await makeUser('a@example.test', 'admin')).role).toBe('admin');
  });

  it('rejects a duplicate email', async () => {
    await makeUser('dup@example.test');
    await expect(makeUser('dup@example.test')).rejects.toThrow();
  });
});

describe('Chart', () => {
  it('belongs to a User', async () => {
    const owner = await makeUser('owner@example.test');
    const chart = await makeChart(owner.id);
    const loaded = await prisma.chart.findUniqueOrThrow({ where: { id: chart.id }, include: { owner: true } });
    expect(loaded.owner.email).toBe('owner@example.test');
  });

  it('is deleted, with its shares, conversations and messages, when the owner is deleted', async () => {
    const owner = await makeUser('owner@example.test');
    const practitioner = await makeUser('prac@example.test', 'practitioner');
    const chart = await makeChart(owner.id);
    await prisma.share.create({ data: { chartId: chart.id, practitionerId: practitioner.id } });
    await prisma.conversation.create({
      data: { chartId: chart.id, userId: owner.id, messages: { create: [{ role: 'user', content: '你好' }] } },
    });

    await prisma.user.delete({ where: { id: owner.id } });

    expect(await prisma.chart.count()).toBe(0);
    expect(await prisma.share.count()).toBe(0);
    expect(await prisma.conversation.count()).toBe(0);
    expect(await prisma.message.count()).toBe(0);
    expect(await prisma.user.count()).toBe(1); // the practitioner stays
  });
});

describe('Share', () => {
  it('links a Chart to a practitioner and can be revoked', async () => {
    const owner = await makeUser('owner@example.test');
    const practitioner = await makeUser('prac@example.test', 'practitioner');
    const chart = await makeChart(owner.id);
    const share = await prisma.share.create({ data: { chartId: chart.id, practitionerId: practitioner.id } });
    expect(share.revokedAt).toBeNull();

    await prisma.share.update({ where: { id: share.id }, data: { revokedAt: new Date() } });
    const active = await prisma.share.findMany({ where: { practitionerId: practitioner.id, revokedAt: null } });
    expect(active).toHaveLength(0);
  });

  it('allows only one share per chart and practitioner', async () => {
    const owner = await makeUser('owner@example.test');
    const practitioner = await makeUser('prac@example.test', 'practitioner');
    const chart = await makeChart(owner.id);
    await prisma.share.create({ data: { chartId: chart.id, practitionerId: practitioner.id } });
    await expect(prisma.share.create({ data: { chartId: chart.id, practitionerId: practitioner.id } })).rejects.toThrow();
  });
});

describe('Conversation and Message', () => {
  it('stores a conversation for a chart with ordered user/assistant messages', async () => {
    const owner = await makeUser('owner@example.test');
    const chart = await makeChart(owner.id);
    const conversation = await prisma.conversation.create({
      data: {
        chartId: chart.id,
        userId: owner.id,
        messages: { create: [{ role: 'user', content: '请解读' }, { role: 'assistant', content: '好的' }] },
      },
    });
    const messages = await prisma.message.findMany({ where: { conversationId: conversation.id }, orderBy: { createdAt: 'asc' } });
    expect(messages.map((m) => m.role)).toEqual(['user', 'assistant']);
  });
});

describe('ConsultMessage', () => {
  it('belongs to a share and an author', async () => {
    const owner = await makeUser('owner@example.test');
    const practitioner = await makeUser('prac@example.test', 'practitioner');
    const share = await prisma.share.create({ data: { chartId: (await makeChart(owner.id)).id, practitionerId: practitioner.id } });
    const msg = await prisma.consultMessage.create({ data: { shareId: share.id, authorId: practitioner.id, body: '命宫有紫微' } });
    expect(msg.shareId).toBe(share.id);
  });
});

describe('ApiKey', () => {
  it('stores only a hash of the key, never the key itself', async () => {
    const user = await makeUser('dev@example.test');
    const key = await prisma.apiKey.create({ data: { userId: user.id, name: 'test', keyHash: 'sha256-of-fake-key', prefix: 'zw_test' } });
    expect(key.keyHash).toBe('sha256-of-fake-key');
    expect(Object.keys(key)).not.toContain('key');
    expect(key.revokedAt).toBeNull();
  });

  it('rejects a duplicate key hash', async () => {
    const user = await makeUser('dev@example.test');
    await prisma.apiKey.create({ data: { userId: user.id, name: 'a', keyHash: 'same-hash', prefix: 'zw_a' } });
    await expect(prisma.apiKey.create({ data: { userId: user.id, name: 'b', keyHash: 'same-hash', prefix: 'zw_b' } })).rejects.toThrow();
  });
});

describe('Setting', () => {
  it('stores a value by key', async () => {
    await prisma.setting.upsert({ where: { key: 'dailyAiLimit' }, create: { key: 'dailyAiLimit', value: '20' }, update: { value: '20' } });
    expect((await prisma.setting.findUniqueOrThrow({ where: { key: 'dailyAiLimit' } })).value).toBe('20');
  });
});

describe('seed', () => {
  it('creates one member, one practitioner and one admin, and is safe to run twice', async () => {
    await seed(prisma);
    await seed(prisma);
    for (const role of ['member', 'practitioner', 'admin'] as const) {
      expect(await prisma.user.count({ where: { role } })).toBe(1);
    }
  });
});
