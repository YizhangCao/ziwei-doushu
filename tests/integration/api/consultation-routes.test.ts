import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest';
import type { Role } from '@/lib/auth/types';
import { createChart } from '@/lib/charts/service';
import { prisma } from '@/lib/db';
import type { BirthInfo } from '@/lib/ziwei/types';
import { resetDatabase } from '../helpers/reset';
import { apiRequest, routeContext, sessionCookie } from '../helpers/session';

// The consultation routes (#21): sharing a saved chart, the practitioner's list, the thread's
// messages and its SSE stream. Each route checks the session before it reads anything.

// CI's DATA_ENCRYPTION_KEY is a placeholder, so these tests bring their own low-entropy test key.
const TEST_KEY = 'f'.repeat(64);

// Made-up birth data (AGENTS.md: no real people's birth data in tests).
const BIRTH: BirthInfo = { year: 1990, month: 6, day: 15, hour: 6, gender: 'female' };

type SharesRoute = typeof import('@/app/api/charts/[id]/shares/route');
type ShareRoute = typeof import('@/app/api/shares/[id]/route');
type MessagesRoute = typeof import('@/app/api/shares/[id]/messages/route');
type StreamRoute = typeof import('@/app/api/shares/[id]/stream/route');
type ConsultationsRoute = typeof import('@/app/api/consultations/route');
let shares: SharesRoute;
let share: ShareRoute;
let messages: MessagesRoute;
let stream: StreamRoute;
let consultations: ConsultationsRoute;

beforeAll(async () => {
  shares = await import('@/app/api/charts/[id]/shares/route');
  share = await import('@/app/api/shares/[id]/route');
  messages = await import('@/app/api/shares/[id]/messages/route');
  stream = await import('@/app/api/shares/[id]/stream/route');
  consultations = await import('@/app/api/consultations/route');
});
beforeEach(async () => {
  vi.stubEnv('DATA_ENCRYPTION_KEY', TEST_KEY);
  await resetDatabase();
});
afterEach(() => vi.unstubAllEnvs());
afterAll(() => prisma.$disconnect());

interface Person {
  id: string;
  role: Role;
  cookie: string;
}

async function person(email: string, role: Role = 'member'): Promise<Person> {
  const user = await prisma.user.create({ data: { email, role } });
  return { id: user.id, role: user.role, cookie: await sessionCookie({ id: user.id, role: user.role }) };
}

async function world() {
  const owner = await person('owner@example.test');
  const practitioner = await person('prac@example.test', 'practitioner');
  const stranger = await person('stranger@example.test');
  const { id: chartId } = await createChart({ id: owner.id, role: owner.role }, { name: 'Mum', birthInfo: BIRTH });
  return { owner, practitioner, stranger, chartId };
}

const asResponse = (res: unknown): Response => {
  if (!(res instanceof Response)) throw new Error('route returned no Response');
  return res;
};

const shareVia = async (chartId: string, cookie: string | undefined, body: unknown) =>
  asResponse(
    await shares.POST(apiRequest(`/api/charts/${chartId}/shares`, { method: 'POST', cookie, body }), routeContext({ id: chartId })),
  );
const listSharesVia = async (chartId: string, cookie?: string) =>
  asResponse(await shares.GET(apiRequest(`/api/charts/${chartId}/shares`, { cookie }), routeContext({ id: chartId })));
const threadVia = async (id: string, cookie?: string) =>
  asResponse(await share.GET(apiRequest(`/api/shares/${id}`, { cookie }), routeContext({ id })));
const revokeVia = async (id: string, cookie?: string) =>
  asResponse(await share.DELETE(apiRequest(`/api/shares/${id}`, { method: 'DELETE', cookie }), routeContext({ id })));
const messagesVia = async (id: string, cookie?: string) =>
  asResponse(await messages.GET(apiRequest(`/api/shares/${id}/messages`, { cookie }), routeContext({ id })));
const postVia = async (id: string, cookie: string | undefined, body: unknown) =>
  asResponse(await messages.POST(apiRequest(`/api/shares/${id}/messages`, { method: 'POST', cookie, body }), routeContext({ id })));
const consultationsVia = async (cookie?: string) =>
  asResponse(await consultations.GET(apiRequest('/api/consultations', { cookie }), routeContext({})));
const streamVia = async (id: string, cookie?: string, headers: Record<string, string> = {}) =>
  asResponse(await stream.GET(apiRequest(`/api/shares/${id}/stream`, { cookie, headers }), routeContext({ id })));

async function errorOf(res: Response): Promise<string> {
  const json = (await res.json()) as { error?: unknown };
  expect(typeof json.error).toBe('string');
  return json.error as string;
}

/** Reads an SSE response until `until` matches the text so far, then cancels it. */
async function readStream(res: Response, until: (text: string) => boolean): Promise<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let text = '';
  const deadline = Date.now() + 5_000;
  while (!until(text) && Date.now() < deadline) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value);
  }
  await reader.cancel();
  return text;
}

describe('logged out → 401 { error } on every consultation route', () => {
  it('rejects every route without a session, before reading anything', async () => {
    for (const res of [
      await shareVia('any', undefined, { email: 'prac@example.test' }),
      await listSharesVia('any'),
      await threadVia('any'),
      await revokeVia('any'),
      await messagesVia('any'),
      await postVia('any', undefined, { body: 'hi' }),
      await consultationsVia(),
      await streamVia('any'),
    ]) {
      expect(res.status).toBe(401);
      await errorOf(res);
    }
  });
});

describe('POST /api/charts/:id/shares — share a saved chart by email', () => {
  it('shares with a practitioner (201) and lists the share for the owner', async () => {
    const w = await world();
    const res = await shareVia(w.chartId, w.owner.cookie, { email: 'PRAC@example.test ' });
    expect(res.status).toBe(201);
    const { share: created } = (await res.json()) as { share: { id: string; chartId: string } };
    expect(created.chartId).toBe(w.chartId);

    const listed = await listSharesVia(w.chartId, w.owner.cookie);
    expect(listed.status).toBe(200);
    const { shares: list } = (await listed.json()) as { shares: { id: string; practitionerEmail: string }[] };
    expect(list).toEqual([expect.objectContaining({ id: created.id, practitionerEmail: 'prac@example.test' })]);
  });

  it('returns 400 { error } for bad JSON, a missing email, or an email that is not a practitioner', async () => {
    const w = await world();
    for (const body of ['{not json', {}, { email: 42 }, { email: 'stranger@example.test' }]) {
      const res = await shareVia(w.chartId, w.owner.cookie, body);
      expect(res.status, JSON.stringify(body)).toBe(400);
      await errorOf(res);
    }
  });

  it("returns 404 for someone else's chart and shares nothing", async () => {
    const w = await world();
    const res = await shareVia(w.chartId, w.stranger.cookie, { email: 'prac@example.test' });
    expect(res.status).toBe(404);
    expect(await prisma.share.count()).toBe(0);
    expect((await listSharesVia(w.chartId, w.stranger.cookie)).status).toBe(404);
  });
});

describe('DELETE /api/shares/:id — revoke', () => {
  it('lets the owner revoke; the practitioner then gets 404 on the thread', async () => {
    const w = await world();
    const { share: created } = (await (await shareVia(w.chartId, w.owner.cookie, { email: 'prac@example.test' })).json()) as {
      share: { id: string };
    };
    expect((await revokeVia(created.id, w.practitioner.cookie)).status).toBe(403);
    expect((await revokeVia(created.id, w.stranger.cookie)).status).toBe(404);

    const res = await revokeVia(created.id, w.owner.cookie);
    expect(res.status).toBe(200);
    const { share: revoked } = (await res.json()) as { share: { revokedAt: string | null } };
    expect(revoked.revokedAt).not.toBeNull();

    expect((await threadVia(created.id, w.practitioner.cookie)).status).toBe(404);
    expect((await streamVia(created.id, w.practitioner.cookie)).status).toBe(404);
    const thread = (await (await threadVia(created.id, w.owner.cookie)).json()) as { thread: { closed: boolean } };
    expect(thread.thread.closed).toBe(true);
  });
});

describe('GET /api/consultations — the practitioner list', () => {
  it('lists charts shared with the practitioner, and 403 for a member', async () => {
    const w = await world();
    const { share: created } = (await (await shareVia(w.chartId, w.owner.cookie, { email: 'prac@example.test' })).json()) as {
      share: { id: string };
    };

    const res = await consultationsVia(w.practitioner.cookie);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { consultations: { shareId: string; chartName: string }[] };
    expect(body.consultations).toEqual([expect.objectContaining({ shareId: created.id, chartName: 'Mum' })]);
    expect(JSON.stringify(body)).not.toContain('1990'); // never birth data

    const member = await consultationsVia(w.owner.cookie);
    expect(member.status).toBe(403);
    await errorOf(member);
  });
});

describe('/api/shares/:id/messages — the thread', () => {
  it('lets both sides post (201) and read the same thread, oldest first', async () => {
    const w = await world();
    const { share: created } = (await (await shareVia(w.chartId, w.owner.cookie, { email: 'prac@example.test' })).json()) as {
      share: { id: string };
    };
    expect((await postVia(created.id, w.owner.cookie, { body: 'Hello' })).status).toBe(201);
    const reply = await postVia(created.id, w.practitioner.cookie, { body: 'Hi, I am reading it' });
    expect(reply.status).toBe(201);
    const { message } = (await reply.json()) as { message: { authorRole: string } };
    expect(message.authorRole).toBe('practitioner');

    for (const cookie of [w.owner.cookie, w.practitioner.cookie]) {
      const res = await messagesVia(created.id, cookie);
      const { messages: list } = (await res.json()) as { messages: { body: string }[] };
      expect(list.map((m) => m.body)).toEqual(['Hello', 'Hi, I am reading it']);
    }
  });

  it('returns 400 for an empty or missing body, 404 for a stranger, and 403 once the thread is closed', async () => {
    const w = await world();
    const { share: created } = (await (await shareVia(w.chartId, w.owner.cookie, { email: 'prac@example.test' })).json()) as {
      share: { id: string };
    };
    for (const body of [{}, { body: '   ' }, { body: 'x'.repeat(2001) }]) {
      expect((await postVia(created.id, w.owner.cookie, body)).status).toBe(400);
    }
    expect((await postVia(created.id, w.stranger.cookie, { body: 'hi' })).status).toBe(404);
    expect((await messagesVia(created.id, w.stranger.cookie)).status).toBe(404);

    await revokeVia(created.id, w.owner.cookie);
    expect((await postVia(created.id, w.owner.cookie, { body: 'still there?' })).status).toBe(403);
  });
});

describe('GET /api/shares/:id/stream — new messages over SSE', () => {
  it('checks access before the stream opens: 404 { error } for a stranger, not an event stream', async () => {
    const w = await world();
    const { share: created } = (await (await shareVia(w.chartId, w.owner.cookie, { email: 'prac@example.test' })).json()) as {
      share: { id: string };
    };
    const res = await streamVia(created.id, w.stranger.cookie);
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toContain('application/json');
    await errorOf(res);
  });

  it('streams the thread as SSE events with ids, so EventSource can resume', async () => {
    const w = await world();
    const { share: created } = (await (await shareVia(w.chartId, w.owner.cookie, { email: 'prac@example.test' })).json()) as {
      share: { id: string };
    };
    const first = (await (await postVia(created.id, w.owner.cookie, { body: 'one' })).json()) as { message: { id: string } };

    const res = await streamVia(created.id, w.practitioner.cookie);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    const text = await readStream(res, (t) => t.includes(`id: ${first.message.id}\n`));
    expect(text.startsWith('retry: ')).toBe(true);
    expect(text).toContain(`id: ${first.message.id}\nevent: message\n`);
    expect(text).toContain('"body":"one"');
  });

  it('resumes after Last-Event-ID: only messages after it are new', async () => {
    const w = await world();
    const { share: created } = (await (await shareVia(w.chartId, w.owner.cookie, { email: 'prac@example.test' })).json()) as {
      share: { id: string };
    };
    // Far enough apart that "one" is outside the overlap window behind "two".
    const t = Date.parse('2026-11-13T12:00:00Z');
    await prisma.consultMessage.create({ data: { shareId: created.id, authorId: w.owner.id, body: 'one', createdAt: new Date(t) } });
    const two = await prisma.consultMessage.create({
      data: { shareId: created.id, authorId: w.owner.id, body: 'two', createdAt: new Date(t + 60_000) },
    });
    const three = await prisma.consultMessage.create({
      data: { shareId: created.id, authorId: w.practitioner.id, body: 'three', createdAt: new Date(t + 120_000) },
    });

    const res = await streamVia(created.id, w.owner.cookie, { 'last-event-id': two.id });
    const text = await readStream(res, (s) => s.includes(`id: ${three.id}\n`));
    expect(text).toContain('"body":"three"');
    expect(text).not.toContain('"body":"one"');
    expect(text).not.toContain(`id: ${two.id}\n`);
  });
});
