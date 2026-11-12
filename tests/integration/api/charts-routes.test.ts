import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest';
import type { Role } from '@/lib/auth/types';
import { prisma } from '@/lib/db';
import type { BirthInfo } from '@/lib/ziwei/types';
import { resetDatabase } from '../helpers/reset';
import { apiRequest, routeContext, sessionCookie } from '../helpers/session';

// CI's DATA_ENCRYPTION_KEY is a placeholder, so these tests bring their own low-entropy test key.
const TEST_KEY = 'e'.repeat(64);

// Made-up birth data (AGENTS.md: no real people's birth data in tests).
const BIRTH: BirthInfo = { year: 1990, month: 6, day: 15, hour: 6, gender: 'female', city: '测试市' };

type ListRoute = typeof import('@/app/api/charts/route');
type ItemRoute = typeof import('@/app/api/charts/[id]/route');
let list: ListRoute;
let item: ItemRoute;

beforeAll(async () => {
  list = await import('@/app/api/charts/route');
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
  return { id: user.id, role: user.role, cookie: await sessionCookie({ id: user.id, role: user.role }) };
}

const asResponse = (res: unknown): Response => {
  if (!(res instanceof Response)) throw new Error('route returned no Response');
  return res;
};

const createVia = async (cookie: string | undefined, body: unknown) =>
  asResponse(await list.POST(apiRequest('/api/charts', { method: 'POST', cookie, body }), routeContext({})));
const listVia = async (cookie?: string) => asResponse(await list.GET(apiRequest('/api/charts', { cookie }), routeContext({})));
const getVia = async (id: string, cookie?: string) =>
  asResponse(await item.GET(apiRequest(`/api/charts/${id}`, { cookie }), routeContext({ id })));
const renameVia = async (id: string, cookie: string | undefined, body: unknown) =>
  asResponse(await item.PATCH(apiRequest(`/api/charts/${id}`, { method: 'PATCH', cookie, body }), routeContext({ id })));
const deleteVia = async (id: string, cookie?: string) =>
  asResponse(await item.DELETE(apiRequest(`/api/charts/${id}`, { method: 'DELETE', cookie }), routeContext({ id })));

async function errorOf(res: Response): Promise<string> {
  const json = (await res.json()) as { error?: unknown };
  expect(typeof json.error).toBe('string');
  return json.error as string;
}

describe('logged out → 401 { error } on every chart route', () => {
  it('rejects list, create, read, rename and delete without a session', async () => {
    for (const res of [
      await listVia(),
      await createVia(undefined, { name: 'Mum', birthInfo: BIRTH }),
      await getVia('any'),
      await renameVia('any', undefined, { name: 'x' }),
      await deleteVia('any'),
    ]) {
      expect(res.status).toBe(401);
      await errorOf(res);
    }
  });
});

describe('POST /api/charts', () => {
  it('saves a chart and returns 201 with a summary, never the birth data', async () => {
    const me = await signedIn('me@example.test');
    const res = await createVia(me.cookie, { name: ' Mum ', birthInfo: BIRTH });
    expect(res.status).toBe(201);
    const { chart } = (await res.json()) as { chart: Record<string, unknown> };
    expect(chart).toMatchObject({ id: expect.any(String), name: 'Mum' });
    expect(Object.keys(chart).sort()).toEqual(['createdAt', 'id', 'name', 'updatedAt']);
    expect((await prisma.chart.findUniqueOrThrow({ where: { id: chart.id as string } })).ownerId).toBe(me.id);
  });

  it('returns 400 { error } for a body that is not JSON', async () => {
    const me = await signedIn('me@example.test');
    const res = await createVia(me.cookie, '{not json');
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toMatch(/json/i);
  });

  it('returns 400 { error } for a missing name or invalid birth data, and saves nothing', async () => {
    const me = await signedIn('me@example.test');
    for (const body of [{ birthInfo: BIRTH }, { name: 'Mum' }, { name: '  ', birthInfo: BIRTH }, { name: 'Mum', birthInfo: { ...BIRTH, hour: 12 } }, []]) {
      const res = await createVia(me.cookie, body);
      expect(res.status, JSON.stringify(body)).toBe(400);
      await errorOf(res);
    }
    expect(await prisma.chart.count()).toBe(0);
  });
});

describe('GET /api/charts', () => {
  it('lists only my charts', async () => {
    const me = await signedIn('me@example.test');
    const other = await signedIn('other@example.test');
    await createVia(me.cookie, { name: 'Mine', birthInfo: BIRTH });
    await createVia(other.cookie, { name: 'Theirs', birthInfo: BIRTH });

    const res = await listVia(me.cookie);
    expect(res.status).toBe(200);
    const { charts } = (await res.json()) as { charts: { name: string }[] };
    expect(charts.map((c) => c.name)).toEqual(['Mine']);
  });
});

describe('/api/charts/[id]', () => {
  async function setup() {
    const me = await signedIn('me@example.test');
    const other = await signedIn('other@example.test');
    const res = await createVia(me.cookie, { name: 'Mum', birthInfo: BIRTH });
    const { chart } = (await res.json()) as { chart: { id: string } };
    return { me, other, id: chart.id };
  }

  it('GET returns my chart with its birth data', async () => {
    const { me, id } = await setup();
    const res = await getVia(id, me.cookie);
    expect(res.status).toBe(200);
    const { chart } = (await res.json()) as { chart: { id: string; name: string; birthInfo: BirthInfo } };
    expect(chart).toMatchObject({ id, name: 'Mum', birthInfo: BIRTH });
  });

  it('GET returns 404 for another user\'s chart, the same as a missing one', async () => {
    const { other, id } = await setup();
    const theirs = await getVia(id, other.cookie);
    const missing = await getVia('no-such-chart', other.cookie);
    expect(theirs.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(await errorOf(theirs)).toBe(await errorOf(missing));
  });

  it('PATCH renames my chart', async () => {
    const { me, id } = await setup();
    const res = await renameVia(id, me.cookie, { name: 'Mother' });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { chart: { name: string } }).chart.name).toBe('Mother');
    expect((await prisma.chart.findUniqueOrThrow({ where: { id } })).name).toBe('Mother');
  });

  it('PATCH returns 400 for a bad body and 404 for another user\'s chart', async () => {
    const { me, other, id } = await setup();
    expect((await renameVia(id, me.cookie, { name: '' })).status).toBe(400);
    expect((await renameVia(id, me.cookie, '{oops')).status).toBe(400);
    expect((await renameVia(id, me.cookie, { title: 'x' })).status).toBe(400);
    expect((await renameVia(id, other.cookie, { name: 'Hacked' })).status).toBe(404);
    expect((await prisma.chart.findUniqueOrThrow({ where: { id } })).name).toBe('Mum');
  });

  it('DELETE removes my chart (204) and returns 404 for another user\'s', async () => {
    const { me, other, id } = await setup();
    expect((await deleteVia(id, other.cookie)).status).toBe(404);
    expect(await prisma.chart.count()).toBe(1);

    const res = await deleteVia(id, me.cookie);
    expect(res.status).toBe(204);
    expect(await prisma.chart.count()).toBe(0);
  });

  it('a practitioner the chart is shared with can read it but not change it (403)', async () => {
    const { me, id } = await setup();
    const prac = await signedIn('prac@example.test', 'practitioner');
    await prisma.share.create({ data: { chartId: id, practitionerId: prac.id } });

    expect((await getVia(id, prac.cookie)).status).toBe(200);
    expect((await renameVia(id, prac.cookie, { name: 'x' })).status).toBe(403);
    expect((await deleteVia(id, prac.cookie)).status).toBe(403);
    expect((await getVia(id, me.cookie)).status).toBe(200);
  });
});
