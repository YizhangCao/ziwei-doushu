import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { AuthError } from '@/lib/auth/guards';
import type { AuthErrorStatus, Role, SessionUser } from '@/lib/auth/types';
import { createChart, getChart } from '@/lib/charts/service';
import {
  listMessages,
  listMessagesSince,
  listSharedWithMe,
  postMessage,
  revokeShare,
  shareChart,
} from '@/lib/consultations/service';
import { ConsultationInputError, type MessagePage } from '@/lib/consultations/types';
import { prisma } from '@/lib/db';
import type { BirthInfo } from '@/lib/ziwei/types';
import { resetDatabase } from '../helpers/reset';

// CI's DATA_ENCRYPTION_KEY is a placeholder, so these tests bring their own low-entropy test key.
const TEST_KEY = 'd'.repeat(64);

// Fake person (AGENTS.md: no real birth data in tests).
const BIRTH: BirthInfo = { year: 1990, month: 6, day: 15, hour: 6, gender: 'female' };

async function makeUser(email: string, role: Role = 'member'): Promise<SessionUser> {
  const user = await prisma.user.create({ data: { email, role } });
  return { id: user.id, role: user.role };
}

// Runs fn and returns the HTTP status of the AuthError it rejects with.
async function statusOf(fn: () => Promise<unknown>): Promise<AuthErrorStatus> {
  try {
    await fn();
  } catch (err) {
    expect(err).toBeInstanceOf(AuthError);
    return (err as AuthError).status;
  }
  throw new Error('expected an AuthError, but nothing was thrown');
}

interface World {
  owner: SessionUser;
  practitioner: SessionUser;
  otherPractitioner: SessionUser;
  stranger: SessionUser;
  chartId: string;
}

async function world(): Promise<World> {
  const owner = await makeUser('owner@example.test');
  const practitioner = await makeUser('prac@example.test', 'practitioner');
  const otherPractitioner = await makeUser('prac2@example.test', 'practitioner');
  const stranger = await makeUser('stranger@example.test');
  const { id: chartId } = await createChart(owner, { name: 'Mum', birthInfo: BIRTH });
  return { owner, practitioner, otherPractitioner, stranger, chartId };
}

beforeEach(async () => {
  vi.stubEnv('DATA_ENCRYPTION_KEY', TEST_KEY);
  await resetDatabase();
});
afterEach(() => vi.unstubAllEnvs());
afterAll(() => prisma.$disconnect());

describe('shareChart — owner shares a chart with a practitioner by email', () => {
  it('creates an active share the practitioner can use to read the chart', async () => {
    const w = await world();
    const share = await shareChart(w.owner, w.chartId, 'prac@example.test');

    expect(share).toMatchObject({ chartId: w.chartId, practitionerId: w.practitioner.id, revokedAt: null });
    expect((await getChart(w.practitioner, w.chartId)).birthInfo).toEqual(BIRTH);
  });

  it('matches the email case-insensitively and ignores surrounding spaces', async () => {
    const w = await world();
    const share = await shareChart(w.owner, w.chartId, '  PRAC@Example.Test ');
    expect(share.practitionerId).toBe(w.practitioner.id);
  });

  it('is idempotent: sharing twice returns the same share', async () => {
    const w = await world();
    const first = await shareChart(w.owner, w.chartId, 'prac@example.test');
    const second = await shareChart(w.owner, w.chartId, 'prac@example.test');
    expect(second.id).toBe(first.id);
    expect(await prisma.share.count()).toBe(1);
  });

  it('rejects a member or an unknown email with the same message, so emails cannot be probed', async () => {
    const w = await world();
    const errors: string[] = [];
    for (const email of ['stranger@example.test', 'nobody@example.test']) {
      try {
        await shareChart(w.owner, w.chartId, email);
        throw new Error('expected a ConsultationInputError');
      } catch (err) {
        expect(err).toBeInstanceOf(ConsultationInputError);
        errors.push((err as Error).message);
      }
    }
    expect(errors[0]).toBe(errors[1]);
    expect(await prisma.share.count()).toBe(0);
  });

  it('rejects an invalid email', async () => {
    const w = await world();
    await expect(shareChart(w.owner, w.chartId, 'not-an-email')).rejects.toBeInstanceOf(ConsultationInputError);
  });

  it('returns 404 when sharing someone else\'s chart, and creates nothing', async () => {
    const w = await world();
    expect(await statusOf(() => shareChart(w.stranger, w.chartId, 'prac@example.test'))).toBe(404);
    expect(await statusOf(() => shareChart(w.owner, 'no-such-chart', 'prac@example.test'))).toBe(404);
    expect(await prisma.share.count()).toBe(0);
  });

  it('returns 403 when the practitioner it is shared with tries to re-share it', async () => {
    const w = await world();
    await shareChart(w.owner, w.chartId, 'prac@example.test');
    expect(await statusOf(() => shareChart(w.practitioner, w.chartId, 'prac2@example.test'))).toBe(403);
  });

  it('requires a signed-in user (401)', async () => {
    const w = await world();
    expect(await statusOf(() => shareChart(null, w.chartId, 'prac@example.test'))).toBe(401);
  });
});

describe('revokeShare', () => {
  it('stops the practitioner reading the chart and the thread, and posting', async () => {
    const w = await world();
    const share = await shareChart(w.owner, w.chartId, 'prac@example.test');
    await postMessage(w.owner, share.id, 'Hello');

    const revoked = await revokeShare(w.owner, share.id);
    expect(revoked.revokedAt).toBeInstanceOf(Date);

    expect(await statusOf(() => getChart(w.practitioner, w.chartId))).toBe(404);
    expect(await statusOf(() => listMessages(w.practitioner, share.id))).toBe(404);
    expect(await statusOf(() => listMessagesSince(w.practitioner, share.id, null))).toBe(404);
    expect(await statusOf(() => postMessage(w.practitioner, share.id, 'Still here?'))).toBe(404);
  });

  it('keeps the thread readable for the owner, but closed for new messages', async () => {
    const w = await world();
    const share = await shareChart(w.owner, w.chartId, 'prac@example.test');
    await postMessage(w.owner, share.id, 'Hello');
    await revokeShare(w.owner, share.id);

    expect((await listMessages(w.owner, share.id)).map((m) => m.body)).toEqual(['Hello']);
    expect(await statusOf(() => postMessage(w.owner, share.id, 'Anyone?'))).toBe(403);
  });

  it('can be undone by sharing again, which reactivates the same share and thread', async () => {
    const w = await world();
    const share = await shareChart(w.owner, w.chartId, 'prac@example.test');
    await revokeShare(w.owner, share.id);

    const again = await shareChart(w.owner, w.chartId, 'prac@example.test');
    expect(again.id).toBe(share.id);
    expect(again.revokedAt).toBeNull();
    expect((await getChart(w.practitioner, w.chartId)).id).toBe(w.chartId);
  });

  it('only the owner can revoke: the practitioner gets 403, anyone else 404', async () => {
    const w = await world();
    const share = await shareChart(w.owner, w.chartId, 'prac@example.test');

    expect(await statusOf(() => revokeShare(w.practitioner, share.id))).toBe(403);
    expect(await statusOf(() => revokeShare(w.stranger, share.id))).toBe(404);
    expect(await statusOf(() => revokeShare(w.owner, 'no-such-share'))).toBe(404);
    expect((await prisma.share.findUniqueOrThrow({ where: { id: share.id } })).revokedAt).toBeNull();
  });
});

describe('listSharedWithMe — what a practitioner sees on /consultations', () => {
  it('lists active shares with the chart name, never birth data, and drops revoked ones', async () => {
    const w = await world();
    const share = await shareChart(w.owner, w.chartId, 'prac@example.test');

    const list = await listSharedWithMe(w.practitioner);
    expect(list).toEqual([{ shareId: share.id, chartId: w.chartId, chartName: 'Mum', sharedAt: expect.any(Date) }]);
    expect(await listSharedWithMe(w.otherPractitioner)).toEqual([]);

    await revokeShare(w.owner, share.id);
    expect(await listSharedWithMe(w.practitioner)).toEqual([]);
  });

  it('returns 403 for a user who is not a practitioner', async () => {
    const w = await world();
    expect(await statusOf(() => listSharedWithMe(w.owner))).toBe(403);
  });
});

describe('postMessage / listMessages — only the owner and that practitioner', () => {
  it('lets both sides post and read the same thread, oldest first', async () => {
    const w = await world();
    const share = await shareChart(w.owner, w.chartId, 'prac@example.test');
    await postMessage(w.owner, share.id, 'Question about my career palace');
    await postMessage(w.practitioner, share.id, ' Here is what I see ');

    for (const reader of [w.owner, w.practitioner]) {
      const messages = await listMessages(reader, share.id);
      expect(messages.map((m) => [m.authorRole, m.body])).toEqual([
        ['owner', 'Question about my career palace'],
        ['practitioner', 'Here is what I see'],
      ]);
    }
  });

  it('never exposes author emails in messages', async () => {
    const w = await world();
    const share = await shareChart(w.owner, w.chartId, 'prac@example.test');
    await postMessage(w.owner, share.id, 'Hi');
    const [message] = await listMessages(w.owner, share.id);
    expect(Object.keys(message).sort()).toEqual(['authorId', 'authorRole', 'body', 'createdAt', 'id', 'shareId']);
    expect(JSON.stringify(message)).not.toContain('@example.test');
  });

  it('keeps two practitioners on the same chart apart: one cannot use the other\'s share (404)', async () => {
    const w = await world();
    const shareA = await shareChart(w.owner, w.chartId, 'prac@example.test');
    const shareB = await shareChart(w.owner, w.chartId, 'prac2@example.test');
    await postMessage(w.practitioner, shareA.id, 'Thread A');
    await postMessage(w.otherPractitioner, shareB.id, 'Thread B');

    // Both can see the chart, but each only through their own share.
    expect(await statusOf(() => listMessages(w.otherPractitioner, shareA.id))).toBe(404);
    expect(await statusOf(() => listMessagesSince(w.otherPractitioner, shareA.id, null))).toBe(404);
    expect(await statusOf(() => postMessage(w.otherPractitioner, shareA.id, 'Not my thread'))).toBe(404);
    expect(await statusOf(() => listMessages(w.practitioner, shareB.id))).toBe(404);
    expect((await listMessages(w.practitioner, shareA.id)).map((m) => m.body)).toEqual(['Thread A']);
    expect(await prisma.consultMessage.count({ where: { shareId: shareA.id } })).toBe(1);
  });

  it('returns 404 for anyone else: a stranger, another practitioner, a missing share', async () => {
    const w = await world();
    const share = await shareChart(w.owner, w.chartId, 'prac@example.test');
    await postMessage(w.owner, share.id, 'Private');

    for (const outsider of [w.stranger, w.otherPractitioner]) {
      expect(await statusOf(() => listMessages(outsider, share.id))).toBe(404);
      expect(await statusOf(() => listMessagesSince(outsider, share.id, null))).toBe(404);
      expect(await statusOf(() => postMessage(outsider, share.id, 'Let me in'))).toBe(404);
    }
    expect(await statusOf(() => listMessages(w.owner, 'no-such-share'))).toBe(404);
    expect(await prisma.consultMessage.count()).toBe(1);
  });

  it('requires a signed-in user (401)', async () => {
    const w = await world();
    const share = await shareChart(w.owner, w.chartId, 'prac@example.test');
    expect(await statusOf(() => postMessage(null, share.id, 'Hi'))).toBe(401);
    expect(await statusOf(() => listMessages(null, share.id))).toBe(401);
  });

  it('rejects an empty message or one over 2,000 characters', async () => {
    const w = await world();
    const share = await shareChart(w.owner, w.chartId, 'prac@example.test');
    await expect(postMessage(w.owner, share.id, '   ')).rejects.toBeInstanceOf(ConsultationInputError);
    await expect(postMessage(w.owner, share.id, 'x'.repeat(2001))).rejects.toBeInstanceOf(ConsultationInputError);
    await expect(postMessage(w.owner, share.id, 'x'.repeat(2000))).resolves.toMatchObject({ shareId: share.id });
  });
});

describe('listMessagesSince(user, shareId, cursor) — what the SSE stream polls', () => {
  const bodies = (page: MessagePage) => page.messages.map((m) => m.body);

  // Messages with explicit timestamps relative to the cursor, so the overlap window is testable.
  async function at(shareId: string, authorId: string, body: string, ms: number) {
    return prisma.consultMessage.create({ data: { shareId, authorId, body, createdAt: new Date(ms) } });
  }

  // `count` messages one millisecond apart starting at `fromMs`, inserted in one statement.
  async function many(shareId: string, authorId: string, prefix: string, fromMs: number, count: number) {
    await prisma.consultMessage.createMany({
      data: Array.from({ length: count }, (_, i) => ({ shareId, authorId, body: `${prefix}${i}`, createdAt: new Date(fromMs + i) })),
    });
  }

  it('returns the whole thread for a null cursor, with the last message as the next cursor', async () => {
    const w = await world();
    const share = await shareChart(w.owner, w.chartId, 'prac@example.test');
    await postMessage(w.owner, share.id, 'one');
    const two = await postMessage(w.practitioner, share.id, 'two');

    const page = await listMessagesSince(w.owner, share.id, null);
    expect(bodies(page)).toEqual(['one', 'two']);
    expect(page.cursor).toBe(two.id);
  });

  it('returns an empty page and a null cursor for an empty thread', async () => {
    const w = await world();
    const share = await shareChart(w.owner, w.chartId, 'prac@example.test');

    expect(await listMessagesSince(w.owner, share.id, null)).toEqual({ messages: [], cursor: null });
  });

  it('returns the overlap window behind the cursor, then the messages after it, in order', async () => {
    const w = await world();
    const share = await shareChart(w.owner, w.chartId, 'prac@example.test');
    const t = Date.parse('2026-11-12T12:00:00Z');
    await at(share.id, w.owner.id, 'before', t - 1_000);
    const cursor = await at(share.id, w.owner.id, 'cursor', t);
    await at(share.id, w.practitioner.id, 'two', t + 1_000);
    const three = await at(share.id, w.owner.id, 'three', t + 2_000);

    const page = await listMessagesSince(w.practitioner, share.id, cursor.id);
    // The cursor itself is never returned; 'before' is a repeat the client drops by id.
    expect(bodies(page)).toEqual(['before', 'two', 'three']);
    expect(page.cursor).toBe(three.id);
  });

  it('re-reads only the ~5 s overlap window behind the cursor, never older messages', async () => {
    const w = await world();
    const share = await shareChart(w.owner, w.chartId, 'prac@example.test');
    const t = Date.parse('2026-11-12T12:00:00Z');
    await at(share.id, w.owner.id, 'old', t - 60_000);
    await at(share.id, w.owner.id, 'recent', t - 3_000);
    const cursor = await at(share.id, w.owner.id, 'cursor', t);

    expect(bodies(await listMessagesSince(w.owner, share.id, cursor.id))).toEqual(['recent']);
  });

  it('never moves the cursor back when only overlap messages come back', async () => {
    const w = await world();
    const share = await shareChart(w.owner, w.chartId, 'prac@example.test');
    const t = Date.parse('2026-11-12T12:00:00Z');
    await at(share.id, w.owner.id, 'recent', t - 3_000);
    const cursor = await at(share.id, w.owner.id, 'cursor', t);

    const page = await listMessagesSince(w.owner, share.id, cursor.id);
    expect(bodies(page)).toEqual(['recent']);
    expect(page.cursor).toBe(cursor.id);
  });

  it('delivers a late-committing message without moving the cursor back to it', async () => {
    const w = await world();
    const share = await shareChart(w.owner, w.chartId, 'prac@example.test');
    const t = Date.parse('2026-11-12T12:00:00Z');

    // B is committed and polled first; A has an earlier timestamp but commits afterwards.
    const b = await at(share.id, w.practitioner.id, 'B', t);
    const firstPoll = await listMessagesSince(w.owner, share.id, null);
    expect(bodies(firstPoll)).toEqual(['B']);
    expect(firstPoll.cursor).toBe(b.id);
    const a = await at(share.id, w.owner.id, 'A', t - 1_500);

    const nextPoll = await listMessagesSince(w.owner, share.id, firstPoll.cursor);
    expect(nextPoll.messages.map((m) => m.id)).toEqual([a.id]);
    expect(nextPoll.cursor).toBe(b.id);
  });

  it('still delivers new messages when more than 200 sit in the overlap window', async () => {
    const w = await world();
    const share = await shareChart(w.owner, w.chartId, 'prac@example.test');
    const t = Date.parse('2026-11-12T12:00:00Z');
    // 250 messages in the 5 s before the cursor, e.g. from a script (postMessage has no rate limit).
    await many(share.id, w.owner.id, 'flood', t - 4_000, 250);
    const cursor = await at(share.id, w.owner.id, 'cursor', t);
    const fresh = await at(share.id, w.practitioner.id, 'fresh', t + 1_000);

    const page = await listMessagesSince(w.owner, share.id, cursor.id);
    expect(bodies(page)).toContain('fresh');
    expect(page.cursor).toBe(fresh.id);
  });

  it('pages forward through more than 200 new messages without stalling', async () => {
    const w = await world();
    const share = await shareChart(w.owner, w.chartId, 'prac@example.test');
    const t = Date.parse('2026-11-12T12:00:00Z');
    const cursor = await at(share.id, w.owner.id, 'cursor', t);
    await many(share.id, w.owner.id, 'new', t + 1, 250);

    const first = await listMessagesSince(w.owner, share.id, cursor.id);
    const second = await listMessagesSince(w.owner, share.id, first.cursor);
    const third = await listMessagesSince(w.owner, share.id, second.cursor);

    // The overlap may also repeat 'cursor' itself on the second poll; count only the new ones.
    const delivered = new Set([...first.messages, ...second.messages].map((m) => m.body).filter((b) => b.startsWith('new')));
    expect(delivered.size).toBe(250);
    expect(bodies(second)).toContain('new249');
    // Each poll's cursor moves ahead of the last one, and stays put once there is nothing new.
    expect(first.cursor).not.toBe(cursor.id);
    expect(second.cursor).not.toBe(first.cursor);
    expect(third.cursor).toBe(second.cursor);
  });

  it('keeps the order for messages with the same timestamp', async () => {
    const w = await world();
    const share = await shareChart(w.owner, w.chartId, 'prac@example.test');
    const sameTime = new Date('2026-11-11T12:00:00Z');
    const rows = [];
    for (const body of ['a', 'b', 'c']) {
      rows.push(await prisma.consultMessage.create({ data: { shareId: share.id, authorId: w.owner.id, body, createdAt: sameTime } }));
    }
    const sorted = [...rows].sort((x, y) => (x.id < y.id ? -1 : 1));

    const all = await listMessagesSince(w.owner, share.id, null);
    expect(all.messages.map((m) => m.id)).toEqual(sorted.map((r) => r.id));
    const page = await listMessagesSince(w.owner, share.id, sorted[1].id);
    // sorted[0] has the cursor's timestamp but sorts before it, so it comes back in the overlap.
    expect(page.messages.map((m) => m.id)).toEqual([sorted[0].id, sorted[2].id]);
    expect(page.cursor).toBe(sorted[2].id);
  });

  it('ignores a cursor from another thread instead of leaking it', async () => {
    const w = await world();
    const share = await shareChart(w.owner, w.chartId, 'prac@example.test');
    const { id: otherChartId } = await createChart(w.owner, { name: 'Dad', birthInfo: BIRTH });
    const otherShare = await shareChart(w.owner, otherChartId, 'prac2@example.test');
    const foreign = await postMessage(w.owner, otherShare.id, 'other thread');
    await postMessage(w.owner, share.id, 'this thread');

    expect(bodies(await listMessagesSince(w.owner, share.id, foreign.id))).toEqual(['this thread']);
  });
});
