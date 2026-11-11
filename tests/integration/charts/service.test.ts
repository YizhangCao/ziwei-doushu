import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { AuthError } from '@/lib/auth/guards';
import type { AuthErrorStatus, Role, SessionUser } from '@/lib/auth/types';
import { createChart, deleteChart, getChart, listCharts, renameChart } from '@/lib/charts/service';
import { ChartInputError } from '@/lib/charts/types';
import { prisma } from '@/lib/db';
import type { BirthInfo } from '@/lib/ziwei/types';
import { resetDatabase } from '../helpers/reset';

// CI's DATA_ENCRYPTION_KEY is a placeholder, so these tests bring their own test-only key.
const TEST_KEY = '00112233445566778899aabbccddeeff';

// Fake people only (AGENTS.md: no real birth data in tests).
const BIRTH: BirthInfo = { year: 1990, month: 6, day: 15, hour: 6, gender: 'female', city: '测试市' };
const OTHER_BIRTH: BirthInfo = { year: 1985, month: 3, day: 2, hour: 11, gender: 'male' };

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

beforeEach(async () => {
  vi.stubEnv('DATA_ENCRYPTION_KEY', TEST_KEY);
  await resetDatabase();
});
afterEach(() => vi.unstubAllEnvs());
afterAll(() => prisma.$disconnect());

describe('createChart', () => {
  it('saves a chart for the user and returns a summary without birth data', async () => {
    const owner = await makeUser('owner@example.test');
    const summary = await createChart(owner, { name: '  Mum  ', birthInfo: BIRTH });

    expect(summary).toEqual({ id: expect.any(String), name: 'Mum', createdAt: expect.any(Date), updatedAt: expect.any(Date) });
    const row = await prisma.chart.findUniqueOrThrow({ where: { id: summary.id } });
    expect(row.ownerId).toBe(owner.id);
  });

  it('stores birth data encrypted: the raw row never contains it', async () => {
    const owner = await makeUser('owner@example.test');
    const { id } = await createChart(owner, { name: 'Mum', birthInfo: BIRTH });

    const [raw] = await prisma.$queryRaw<Record<string, unknown>[]>`SELECT * FROM "Chart" WHERE id = ${id}`;
    const rowText = JSON.stringify(raw);
    for (const fragment of ['1990', '"year"', '"month"', 'female', '测试市']) {
      expect(rowText).not.toContain(fragment);
    }
    expect(String(raw.encryptedBirthInfo)).toMatch(/^v1\./);
  });

  it('rejects an empty or over-long name', async () => {
    const owner = await makeUser('owner@example.test');
    await expect(createChart(owner, { name: '   ', birthInfo: BIRTH })).rejects.toBeInstanceOf(ChartInputError);
    await expect(createChart(owner, { name: 'x'.repeat(81), birthInfo: BIRTH })).rejects.toBeInstanceOf(ChartInputError);
    expect(await prisma.chart.count()).toBe(0);
  });

  it('requires a signed-in user (401)', async () => {
    expect(await statusOf(() => createChart(null, { name: 'Mum', birthInfo: BIRTH }))).toBe(401);
  });
});

describe('listCharts', () => {
  it('lists only the user\'s own charts, newest first, without birth data', async () => {
    const owner = await makeUser('owner@example.test');
    const other = await makeUser('other@example.test');
    const first = await createChart(owner, { name: 'First', birthInfo: BIRTH });
    const second = await createChart(owner, { name: 'Second', birthInfo: OTHER_BIRTH });
    await createChart(other, { name: 'Not yours', birthInfo: BIRTH });

    const charts = await listCharts(owner);
    expect(charts.map((c) => c.id)).toEqual([second.id, first.id]);
    for (const chart of charts) expect(Object.keys(chart).sort()).toEqual(['createdAt', 'id', 'name', 'updatedAt']);
  });

  it('returns an empty list for a user with no charts', async () => {
    expect(await listCharts(await makeUser('new@example.test'))).toEqual([]);
  });
});

describe('getChart', () => {
  it('returns the owner\'s chart with decrypted birth data', async () => {
    const owner = await makeUser('owner@example.test');
    const { id } = await createChart(owner, { name: 'Mum', birthInfo: BIRTH });

    const chart = await getChart(owner, id);
    expect(chart).toMatchObject({ id, name: 'Mum', birthInfo: BIRTH });
  });

  it('returns 404 for another user\'s chart, the same as for a missing one', async () => {
    const owner = await makeUser('owner@example.test');
    const other = await makeUser('other@example.test');
    const { id } = await createChart(owner, { name: 'Mum', birthInfo: BIRTH });

    expect(await statusOf(() => getChart(other, id))).toBe(404);
    expect(await statusOf(() => getChart(other, 'no-such-chart'))).toBe(404);
  });

  it('lets a practitioner read a chart shared with them, until the share is revoked', async () => {
    const owner = await makeUser('owner@example.test');
    const practitioner = await makeUser('prac@example.test', 'practitioner');
    const { id } = await createChart(owner, { name: 'Mum', birthInfo: BIRTH });
    const share = await prisma.share.create({ data: { chartId: id, practitionerId: practitioner.id } });

    expect((await getChart(practitioner, id)).birthInfo).toEqual(BIRTH);

    await prisma.share.update({ where: { id: share.id }, data: { revokedAt: new Date() } });
    expect(await statusOf(() => getChart(practitioner, id))).toBe(404);
  });

  it('requires a signed-in user (401)', async () => {
    expect(await statusOf(() => getChart(null, 'any'))).toBe(401);
  });
});

describe('renameChart', () => {
  it('renames the owner\'s chart', async () => {
    const owner = await makeUser('owner@example.test');
    const { id } = await createChart(owner, { name: 'Mum', birthInfo: BIRTH });

    const renamed = await renameChart(owner, id, ' Mother ');
    expect(renamed).toMatchObject({ id, name: 'Mother' });
    expect((await prisma.chart.findUniqueOrThrow({ where: { id } })).name).toBe('Mother');
  });

  it('returns 404 for another user\'s chart and leaves it unchanged', async () => {
    const owner = await makeUser('owner@example.test');
    const other = await makeUser('other@example.test');
    const { id } = await createChart(owner, { name: 'Mum', birthInfo: BIRTH });

    expect(await statusOf(() => renameChart(other, id, 'Hacked'))).toBe(404);
    expect((await prisma.chart.findUniqueOrThrow({ where: { id } })).name).toBe('Mum');
  });

  it('returns 403 for a practitioner the chart is shared with: a share is view-only', async () => {
    const owner = await makeUser('owner@example.test');
    const practitioner = await makeUser('prac@example.test', 'practitioner');
    const { id } = await createChart(owner, { name: 'Mum', birthInfo: BIRTH });
    await prisma.share.create({ data: { chartId: id, practitionerId: practitioner.id } });

    expect(await statusOf(() => renameChart(practitioner, id, 'Renamed'))).toBe(403);
    expect((await prisma.chart.findUniqueOrThrow({ where: { id } })).name).toBe('Mum');
  });

  it('rejects an empty name', async () => {
    const owner = await makeUser('owner@example.test');
    const { id } = await createChart(owner, { name: 'Mum', birthInfo: BIRTH });
    await expect(renameChart(owner, id, '  ')).rejects.toBeInstanceOf(ChartInputError);
  });
});

describe('deleteChart', () => {
  it('deletes the owner\'s chart', async () => {
    const owner = await makeUser('owner@example.test');
    const { id } = await createChart(owner, { name: 'Mum', birthInfo: BIRTH });

    await deleteChart(owner, id);
    expect(await prisma.chart.count()).toBe(0);
  });

  it('returns 404 for another user\'s chart and leaves it in place', async () => {
    const owner = await makeUser('owner@example.test');
    const other = await makeUser('other@example.test');
    const { id } = await createChart(owner, { name: 'Mum', birthInfo: BIRTH });

    expect(await statusOf(() => deleteChart(other, id))).toBe(404);
    expect(await prisma.chart.count()).toBe(1);
  });

  it('returns 403 for a practitioner the chart is shared with', async () => {
    const owner = await makeUser('owner@example.test');
    const practitioner = await makeUser('prac@example.test', 'practitioner');
    const { id } = await createChart(owner, { name: 'Mum', birthInfo: BIRTH });
    await prisma.share.create({ data: { chartId: id, practitionerId: practitioner.id } });

    expect(await statusOf(() => deleteChart(practitioner, id))).toBe(403);
    expect(await prisma.chart.count()).toBe(1);
  });
});
