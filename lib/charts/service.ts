import { z } from 'zod';
import { AuthError, requireChartAccess, requireUser } from '@/lib/auth/guards';
import { canModifyChart } from '@/lib/auth/permissions';
import type { ChartRecord, SessionUser } from '@/lib/auth/types';
import { decryptBirthInfo, encryptBirthInfo } from '@/lib/crypto';
import { prisma } from '@/lib/db';
import { parseBirthInfo } from '@/lib/validation/birth-info';
import { ChartInputError, type ChartSummary, type CreateChartInput, type SavedChart } from './types';

// Saved charts (#18). Every function takes the user from the server session (never a client-sent
// id) and checks access through lib/auth before touching a chart. Not theirs → 404, same as missing.

const MAX_NAME_LENGTH = 80;

const chartNameSchema = z
  .string({ error: 'Chart name must be text' })
  .trim()
  .min(1, 'Chart name must not be empty')
  .max(MAX_NAME_LENGTH, `Chart name must be at most ${MAX_NAME_LENGTH} characters`);

const SUMMARY_SELECT = { id: true, name: true, createdAt: true, updatedAt: true } as const;

function parseName(name: unknown): string {
  const parsed = chartNameSchema.safeParse(name);
  if (!parsed.success) throw new ChartInputError(parsed.error.issues[0].message);
  return parsed.data;
}

// Loads what the access checks need. The 404 for "missing" and "not yours" comes from
// requireChartAccess, so both look identical to the caller.
async function loadForAccess(user: SessionUser, chartId: string) {
  const chart = await prisma.chart.findUnique({
    where: { id: chartId },
    include: { shares: { select: { chartId: true, practitionerId: true, revokedAt: true } } },
  });
  const record: ChartRecord | null = chart ? { id: chart.id, ownerId: chart.ownerId } : null;
  requireChartAccess(user, record, chart?.shares ?? []);
  // requireChartAccess threw unless the chart exists and the user may view it.
  return chart as NonNullable<typeof chart>;
}

// View access first (404 if none), then edit access: a practitioner with a share knows the
// chart exists, so they get 403 rather than 404.
async function requireModifiable(sessionUser: SessionUser | null, chartId: string): Promise<SessionUser> {
  const user = requireUser(sessionUser);
  const chart = await loadForAccess(user, chartId);
  if (!canModifyChart(user, chart)) throw new AuthError(403, 'Only the owner can change this chart');
  return user;
}

export async function createChart(sessionUser: SessionUser | null, input: CreateChartInput): Promise<ChartSummary> {
  const user = requireUser(sessionUser);
  const name = parseName(input.name);
  // Validate before encrypting: a bad write would make the chart unreadable for good.
  const birth = parseBirthInfo(input.birthInfo);
  if (!birth.ok) throw new ChartInputError(birth.error);
  return prisma.chart.create({
    data: { ownerId: user.id, name, encryptedBirthInfo: encryptBirthInfo(birth.birthInfo) },
    select: SUMMARY_SELECT,
  });
}

/** The user's own charts, newest first. Shared charts are listed separately (#21). */
export async function listCharts(sessionUser: SessionUser | null): Promise<ChartSummary[]> {
  const user = requireUser(sessionUser);
  return prisma.chart.findMany({
    where: { ownerId: user.id },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: SUMMARY_SELECT,
  });
}

/** Owner, or a practitioner with an active share. */
export async function getChart(sessionUser: SessionUser | null, chartId: string): Promise<SavedChart> {
  const user = requireUser(sessionUser);
  const chart = await loadForAccess(user, chartId);
  return {
    id: chart.id,
    ownerId: chart.ownerId,
    name: chart.name,
    createdAt: chart.createdAt,
    updatedAt: chart.updatedAt,
    birthInfo: decryptBirthInfo(chart.encryptedBirthInfo),
  };
}

// The chart can disappear between the access check and the write (a double click on delete, or
// a rename racing a delete). Prisma reports that as P2025; it means the chart is gone, so it gets
// the same 404 as any missing chart instead of a 500.
const isRecordNotFound = (error: unknown) => (error as { code?: unknown } | null)?.code === 'P2025';

export async function renameChart(sessionUser: SessionUser | null, chartId: string, name: string): Promise<ChartSummary> {
  const user = await requireModifiable(sessionUser, chartId);
  const newName = parseName(name);
  try {
    return await prisma.chart.update({ where: { id: chartId, ownerId: user.id }, data: { name: newName }, select: SUMMARY_SELECT });
  } catch (error) {
    if (isRecordNotFound(error)) throw new AuthError(404, 'Chart not found');
    throw error;
  }
}

export async function deleteChart(sessionUser: SessionUser | null, chartId: string): Promise<void> {
  const user = await requireModifiable(sessionUser, chartId);
  // deleteMany reports how many rows went instead of throwing, so the request that lost the race
  // sees 0 and gets the same 404 as a missing chart.
  const { count } = await prisma.chart.deleteMany({ where: { id: chartId, ownerId: user.id } });
  if (count === 0) throw new AuthError(404, 'Chart not found');
}
