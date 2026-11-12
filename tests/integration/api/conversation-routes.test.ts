/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview GET and POST /api/charts/[id]/conversation (#22): a saved chart's AI conversation,
 * for its owner only. Messages are stored encrypted, kept in order, and go with the chart when it
 * is deleted. Runs against the Postgres test database; no AI call is made.
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest';
import type { Role } from '@/lib/auth/types';
import { decryptString, encryptBirthInfo } from '@/lib/crypto';
import { prisma } from '@/lib/db';
import type { BirthInfo } from '@/lib/ziwei/types';
import { resetDatabase } from '../helpers/reset';
import { apiRequest, routeContext, sessionCookie } from '../helpers/session';

// CI's DATA_ENCRYPTION_KEY is a placeholder, so these tests bring their own low-entropy test key.
const TEST_KEY = 'e'.repeat(64);

// Made-up birth data (AGENTS.md: no real people's birth data in tests).
const BIRTH: BirthInfo = { year: 1990, month: 6, day: 15, hour: 6, gender: 'female' };

const PROMPT = { role: 'user', content: '请生成命格总览', hidden: true } as const;
const READING = { role: 'assistant', content: '命宫天同，福德太阳。' } as const;
const QUESTION = { role: 'user', content: '事业怎么样？' } as const;
const ANSWER = { role: 'assistant', content: '官禄天机，宜专不宜杂。' } as const;

type ConversationRoute = typeof import('@/app/api/charts/[id]/conversation/route');
type ItemRoute = typeof import('@/app/api/charts/[id]/route');
let conversation: ConversationRoute;
let item: ItemRoute;

beforeAll(async () => {
  conversation = await import('@/app/api/charts/[id]/conversation/route');
  item = await import('@/app/api/charts/[id]/route');
});
beforeEach(async () => {
  vi.stubEnv('DATA_ENCRYPTION_KEY', TEST_KEY);
  await resetDatabase();
});
afterEach(() => vi.unstubAllEnvs());
afterAll(() => prisma.$disconnect());

async function signedIn(email: string, role: Role = 'member') {
  const user = await prisma.user.create({ data: { email, role } });
  return { id: user.id, cookie: await sessionCookie({ id: user.id, role: user.role }) };
}

async function chartOf(ownerId: string) {
  const chart = await prisma.chart.create({ data: { ownerId, name: 'Mum', encryptedBirthInfo: encryptBirthInfo(BIRTH) } });
  return chart.id;
}

const asResponse = (res: unknown): Response => {
  if (!(res instanceof Response)) throw new Error('route returned no Response');
  return res;
};

const readVia = async (id: string, cookie?: string) =>
  asResponse(await conversation.GET(apiRequest(`/api/charts/${id}/conversation`, { cookie }), routeContext({ id })));
const appendVia = async (id: string, cookie: string | undefined, body: unknown) =>
  asResponse(
    await conversation.POST(apiRequest(`/api/charts/${id}/conversation`, { method: 'POST', cookie, body }), routeContext({ id })),
  );

async function messagesOf(res: Response) {
  expect(res.status).toBe(200);
  return ((await res.json()) as { messages: { role: string; content: string; hidden: boolean }[] }).messages;
}

async function errorOf(res: Response): Promise<string> {
  const json = (await res.json()) as { error?: unknown };
  expect(typeof json.error).toBe('string');
  return json.error as string;
}

describe('logged out → 401 { error }', () => {
  it('rejects reading and appending without a session', async () => {
    for (const res of [await readVia('any'), await appendVia('any', undefined, { messages: [QUESTION] })]) {
      expect(res.status).toBe(401);
      await errorOf(res);
    }
  });
});

describe('the owner', () => {
  it('reads an empty conversation before anything is saved', async () => {
    const me = await signedIn('me@example.test');
    const id = await chartOf(me.id);
    expect(await messagesOf(await readVia(id, me.cookie))).toEqual([]);
  });

  it('appends exchanges and reads them back in order, with hidden prompts marked', async () => {
    const me = await signedIn('me@example.test');
    const id = await chartOf(me.id);

    expect((await appendVia(id, me.cookie, { messages: [PROMPT, READING] })).status).toBe(204);
    expect((await appendVia(id, me.cookie, { messages: [QUESTION, ANSWER] })).status).toBe(204);

    expect(await messagesOf(await readVia(id, me.cookie))).toEqual([
      { role: 'user', content: PROMPT.content, hidden: true },
      { role: 'assistant', content: READING.content, hidden: false },
      { role: 'user', content: QUESTION.content, hidden: false },
      { role: 'assistant', content: ANSWER.content, hidden: false },
    ]);
    // One conversation per chart, however many exchanges.
    expect(await prisma.conversation.count({ where: { chartId: id } })).toBe(1);
  });

  it('stores every message encrypted, never in plain text', async () => {
    const me = await signedIn('me@example.test');
    const id = await chartOf(me.id);
    await appendVia(id, me.cookie, { messages: [QUESTION, ANSWER] });

    const stored = await prisma.message.findMany({ orderBy: { createdAt: 'asc' } });
    expect(stored).toHaveLength(2);
    for (const [row, plain] of stored.map((row, i) => [row, [QUESTION, ANSWER][i].content] as const)) {
      expect(row.content).not.toContain(plain);
      expect(decryptString(row.content)).toBe(plain);
    }
  });

  it('cannot pass 30 messages in one conversation (400), and nothing is written', async () => {
    const me = await signedIn('me@example.test');
    const id = await chartOf(me.id);
    const exchange = [QUESTION, ANSWER];
    for (let i = 0; i < 14; i++) await appendVia(id, me.cookie, { messages: exchange });

    const res = await appendVia(id, me.cookie, { messages: [QUESTION, ANSWER, QUESTION, ANSWER] });
    expect(res.status).toBe(400);
    await errorOf(res);
    expect(await prisma.message.count()).toBe(28);
  });

  it('gets 400 { error } for a body that is not a list of messages', async () => {
    const me = await signedIn('me@example.test');
    const id = await chartOf(me.id);
    for (const body of [{ messages: [] }, { messages: [{ role: 'system', content: 'x' }] }, 'not json']) {
      const res = await appendVia(id, me.cookie, body);
      expect(res.status).toBe(400);
      await errorOf(res);
    }
    expect(await prisma.message.count()).toBe(0);
  });
});

describe('anyone else', () => {
  it('another member gets 404 for a chart that is not theirs, and nothing is written', async () => {
    const owner = await signedIn('owner@example.test');
    const other = await signedIn('other@example.test');
    const id = await chartOf(owner.id);

    expect((await readVia(id, other.cookie)).status).toBe(404);
    expect((await appendVia(id, other.cookie, { messages: [QUESTION] })).status).toBe(404);
    expect((await readVia('no-such-chart', other.cookie)).status).toBe(404);
    expect(await prisma.message.count()).toBe(0);
  });

  it('a practitioner the chart is shared with gets 403: the conversation is the owner’s', async () => {
    const owner = await signedIn('owner@example.test');
    const prac = await signedIn('prac@example.test', 'practitioner');
    const id = await chartOf(owner.id);
    await prisma.share.create({ data: { chartId: id, practitionerId: prac.id } });

    expect((await readVia(id, prac.cookie)).status).toBe(403);
    expect((await appendVia(id, prac.cookie, { messages: [QUESTION] })).status).toBe(403);
  });
});

describe('deleting the chart', () => {
  it('deletes its conversation and every message in it', async () => {
    const me = await signedIn('me@example.test');
    const id = await chartOf(me.id);
    await appendVia(id, me.cookie, { messages: [PROMPT, READING, QUESTION, ANSWER] });

    const res = asResponse(await item.DELETE(apiRequest(`/api/charts/${id}`, { method: 'DELETE', cookie: me.cookie }), routeContext({ id })));
    expect(res.status).toBe(204);
    expect(await prisma.conversation.count()).toBe(0);
    expect(await prisma.message.count()).toBe(0);
  });
});
