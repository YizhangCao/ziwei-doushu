import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { hashApiKey } from '@/lib/api/keys';
import type { Role } from '@/lib/auth/types';
import { prisma } from '@/lib/db';
import { resetDatabase } from '../helpers/reset';
import { apiRequest, routeContext, sessionCookie } from '../helpers/session';

type ListRoute = typeof import('@/app/api/keys/route');
type ItemRoute = typeof import('@/app/api/keys/[id]/route');
type ChartsRoute = typeof import('@/app/api/v1/charts/route');
let list: ListRoute;
let item: ItemRoute;
let v1: ChartsRoute;

beforeAll(async () => {
  list = await import('@/app/api/keys/route');
  item = await import('@/app/api/keys/[id]/route');
  v1 = await import('@/app/api/v1/charts/route');
});
beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

async function signedIn(email: string, role: Role = 'member') {
  const user = await prisma.user.create({ data: { email, role } });
  return { id: user.id, cookie: await sessionCookie({ id: user.id, role: user.role }) };
}

const asResponse = (res: unknown): Response => {
  if (!(res instanceof Response)) throw new Error('route returned no Response');
  return res;
};
const createVia = async (cookie: string | undefined, body: unknown) =>
  asResponse(await list.POST(apiRequest('/api/keys', { method: 'POST', cookie, body }), routeContext({})));
const listVia = async (cookie?: string) => asResponse(await list.GET(apiRequest('/api/keys', { cookie }), routeContext({})));
const revokeVia = async (id: string, cookie?: string) =>
  asResponse(await item.DELETE(apiRequest(`/api/keys/${id}`, { method: 'DELETE', cookie }), routeContext({ id })));

/** Calls the public API with a key, the way a developer would. */
async function useKey(plainKey: string): Promise<number> {
  const req = new Request('http://localhost/api/v1/charts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${plainKey}` },
    body: JSON.stringify({ date: '1990-06-15', hour: 6, gender: 'female' }),
  });
  return (await v1.POST(req)).status;
}

interface CreatedKey {
  key: { id: string; name: string; prefix: string; createdAt: string; lastUsedAt: string | null; revokedAt: string | null };
  plainKey: string;
}

describe('logged out → 401', () => {
  it('rejects listing, creating and revoking keys without a session', async () => {
    for (const res of [await listVia(), await createVia(undefined, { name: 'x' }), await revokeVia('any')]) {
      expect(res.status).toBe(401);
      expect(typeof ((await res.json()) as { error?: unknown }).error).toBe('string');
    }
  });
});

describe('POST /api/keys', () => {
  it('creates a key and shows the plain key once; only its hash is stored', async () => {
    const me = await signedIn('me@example.test');
    const res = await createVia(me.cookie, { name: ' My script ' });
    expect(res.status).toBe(201);
    const { key, plainKey } = (await res.json()) as CreatedKey;

    expect(plainKey).toMatch(/^zwk_[A-Za-z0-9_-]{43}$/);
    expect(key).toMatchObject({ name: 'My script', prefix: plainKey.slice(0, 12), revokedAt: null });
    expect(Object.keys(key)).not.toContain('keyHash');

    const row = await prisma.apiKey.findUniqueOrThrow({ where: { id: key.id } });
    expect(row).toMatchObject({ userId: me.id, keyHash: hashApiKey(plainKey) });
    const [raw] = await prisma.$queryRaw<Record<string, unknown>[]>`SELECT * FROM "ApiKey" WHERE id = ${key.id}`;
    expect(JSON.stringify(raw)).not.toContain(plainKey);

    expect(await useKey(plainKey)).toBe(200);
  });

  it('returns 400 for bad JSON and an empty or over-long name', async () => {
    const me = await signedIn('me@example.test');
    for (const body of ['{oops', {}, { name: '   ' }, { name: 'x'.repeat(61) }, { name: 'ok', extra: 1 }]) {
      expect((await createVia(me.cookie, body)).status, JSON.stringify(body)).toBe(400);
    }
    expect(await prisma.apiKey.count()).toBe(0);
  });
});

describe('GET /api/keys', () => {
  it('lists only my keys, never the plain key or the hash', async () => {
    const me = await signedIn('me@example.test');
    const other = await signedIn('other@example.test');
    const { plainKey } = (await (await createVia(me.cookie, { name: 'Mine' })).json()) as CreatedKey;
    await createVia(other.cookie, { name: 'Theirs' });

    const res = await listVia(me.cookie);
    expect(res.status).toBe(200);
    const text = await res.text();
    const { keys } = JSON.parse(text) as { keys: { name: string }[] };
    expect(keys.map((k) => k.name)).toEqual(['Mine']);
    expect(text).not.toContain(plainKey);
    expect(text).not.toContain(hashApiKey(plainKey));
  });
});

describe('DELETE /api/keys/[id] (revoke)', () => {
  it('revokes my key: it stops working and is listed as revoked', async () => {
    const me = await signedIn('me@example.test');
    const { key, plainKey } = (await (await createVia(me.cookie, { name: 'Old' })).json()) as CreatedKey;

    const res = await revokeVia(key.id, me.cookie);
    expect(res.status).toBe(204);
    expect(await useKey(plainKey)).toBe(401);

    const { keys } = (await (await listVia(me.cookie)).json()) as { keys: CreatedKey['key'][] };
    expect(keys[0].revokedAt).not.toBeNull();
  });

  it('returns 404 for another user\'s key and leaves it working', async () => {
    const me = await signedIn('me@example.test');
    const other = await signedIn('other@example.test');
    const { key, plainKey } = (await (await createVia(me.cookie, { name: 'Mine' })).json()) as CreatedKey;

    expect((await revokeVia(key.id, other.cookie)).status).toBe(404);
    expect((await revokeVia('no-such-key', other.cookie)).status).toBe(404);
    expect(await useKey(plainKey)).toBe(200);
  });
});
