import { z } from 'zod';
import { AuthError, requireChartAccess, requireRole, requireUser } from '@/lib/auth/guards';
import { canModifyChart } from '@/lib/auth/permissions';
import type { ChartRecord, SessionUser } from '@/lib/auth/types';
import { prisma } from '@/lib/db';
import {
  ConsultationInputError,
  type ConsultationMessage,
  type MessagePage,
  type SharedChartSummary,
  type ShareSummary,
} from './types';

// Sharing and consultation threads (#21). Every function takes the user from the server session
// and checks access through lib/auth. Anyone outside a thread gets 404, as if it didn't exist.

const MAX_MESSAGE_LENGTH = 2_000; // same limit as /api/interpret messages (#5)
const MAX_MESSAGES_PER_PAGE = 200;

// One message for "unknown email" and "not a practitioner", so the form can't be used to
// find out who has an account.
const NO_PRACTITIONER = 'No practitioner with that email';

const emailSchema = z.string({ error: 'Enter an email address' }).trim().toLowerCase().pipe(z.email('Enter a valid email address'));

const messageBodySchema = z
  .string({ error: 'Message must be text' })
  .trim()
  .min(1, 'Message must not be empty')
  .max(MAX_MESSAGE_LENGTH, `Message must be at most ${MAX_MESSAGE_LENGTH.toLocaleString('en-US')} characters`);

const SHARE_SELECT = { id: true, chartId: true, practitionerId: true, createdAt: true, revokedAt: true } as const;

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new ConsultationInputError(parsed.error.issues[0].message);
  return parsed.data;
}

interface Thread {
  share: ShareSummary;
  chart: ChartRecord;
}

// Owner of the chart, or the practitioner of THIS share while it is active. Passing only this
// share to the check means another practitioner's share of the same chart never opens this thread.
async function loadThread(user: SessionUser, shareId: string): Promise<Thread> {
  const row = await prisma.share.findUnique({
    where: { id: shareId },
    select: { ...SHARE_SELECT, chart: { select: { id: true, ownerId: true } } },
  });
  const chart: ChartRecord | null = row ? { id: row.chart.id, ownerId: row.chart.ownerId } : null;
  requireChartAccess(user, chart, row ? [row] : []);
  const { chart: _chart, ...share } = row as NonNullable<typeof row>;
  return { share, chart: chart as ChartRecord };
}

function toMessage(
  row: { id: string; shareId: string; authorId: string; body: string; createdAt: Date },
  ownerId: string,
): ConsultationMessage {
  return {
    id: row.id,
    shareId: row.shareId,
    authorId: row.authorId,
    authorRole: row.authorId === ownerId ? 'owner' : 'practitioner',
    body: row.body,
    createdAt: row.createdAt,
  };
}

/** The owner shares their chart with a practitioner, found by email. Sharing again is a no-op. */
export async function shareChart(
  sessionUser: SessionUser | null,
  chartId: string,
  practitionerEmail: string,
): Promise<ShareSummary> {
  const user = requireUser(sessionUser);
  const chart = await prisma.chart.findUnique({
    where: { id: chartId },
    select: { id: true, ownerId: true, shares: { select: { chartId: true, practitionerId: true, revokedAt: true } } },
  });
  requireChartAccess(user, chart, chart?.shares ?? []);
  // A practitioner who can see the chart through a share knows it exists: 403, not 404.
  if (!canModifyChart(user, chart as ChartRecord)) throw new AuthError(403, 'Only the owner can share this chart');

  const email = parseOrThrow(emailSchema, practitionerEmail);
  const practitioner = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true, role: true },
  });
  if (!practitioner || practitioner.role !== 'practitioner' || practitioner.id === user.id) {
    throw new ConsultationInputError(NO_PRACTITIONER);
  }

  return prisma.share.upsert({
    where: { chartId_practitionerId: { chartId, practitionerId: practitioner.id } },
    create: { chartId, practitionerId: practitioner.id },
    update: { revokedAt: null },
    select: SHARE_SELECT,
  });
}

/** Owner only. The practitioner loses access to the chart and the thread at once. */
export async function revokeShare(sessionUser: SessionUser | null, shareId: string): Promise<ShareSummary> {
  const user = requireUser(sessionUser);
  const { share, chart } = await loadThread(user, shareId);
  if (!canModifyChart(user, chart)) throw new AuthError(403, 'Only the owner can revoke this share');
  // Revoking twice keeps the first revocation time.
  if (share.revokedAt) return share;
  return prisma.share.update({ where: { id: share.id }, data: { revokedAt: new Date() }, select: SHARE_SELECT });
}

/** Active shares with the signed-in practitioner, newest first. */
export async function listSharedWithMe(sessionUser: SessionUser | null): Promise<SharedChartSummary[]> {
  const user = requireRole(sessionUser, 'practitioner');
  const rows = await prisma.share.findMany({
    where: { practitionerId: user.id, revokedAt: null },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: { id: true, chartId: true, createdAt: true, chart: { select: { name: true } } },
  });
  return rows.map((row) => ({ shareId: row.id, chartId: row.chartId, chartName: row.chart.name, sharedAt: row.createdAt }));
}

export async function postMessage(
  sessionUser: SessionUser | null,
  shareId: string,
  body: string,
): Promise<ConsultationMessage> {
  const user = requireUser(sessionUser);
  const { share, chart } = await loadThread(user, shareId);
  // Only the owner gets this far on a revoked share; the thread stays readable but closed.
  if (share.revokedAt) throw new AuthError(403, 'This consultation is closed');
  const text = parseOrThrow(messageBodySchema, body);
  const row = await prisma.consultMessage.create({ data: { shareId: share.id, authorId: user.id, body: text } });
  return toMessage(row, chart.ownerId);
}

/**
 * How far behind the cursor's timestamp each poll re-reads. createdAt is set when a row is
 * written, but rows become visible when they commit, so a message can appear after a newer one
 * was already polled. Re-reading this window catches it, unless it commits more than this late.
 */
export const CURSOR_OVERLAP_MS = 5_000;

type Keyset = { id: string; createdAt: Date };

/**
 * One poll of a thread: the whole thread (up to one page) for a null cursor. For a cursor (a
 * message id), two queries:
 * - forward: a strict (createdAt, id) > cursor page, oldest first. This alone decides the next
 *   cursor, so the cursor only ever moves forward and more than a page of new messages is read
 *   over several polls instead of stalling.
 * - overlap: up to a page of the messages just behind the cursor, within CURSOR_OVERLAP_MS. These
 *   catch a late commit; most are repeats the client drops by id.
 * The cursor itself is never returned. A cursor that isn't in this thread is treated as null.
 */
export async function listMessagesSince(
  sessionUser: SessionUser | null,
  shareId: string,
  cursor: string | null,
): Promise<MessagePage> {
  const user = requireUser(sessionUser);
  const { share, chart } = await loadThread(user, shareId);

  const at: Keyset | null = cursor
    ? await prisma.consultMessage.findFirst({ where: { id: cursor, shareId: share.id }, select: { id: true, createdAt: true } })
    : null;

  const [overlap, forward] = await Promise.all([
    at
      ? prisma.consultMessage.findMany({
          where: {
            shareId: share.id,
            OR: [
              { createdAt: { gte: new Date(at.createdAt.getTime() - CURSOR_OVERLAP_MS), lt: at.createdAt } },
              { createdAt: at.createdAt, id: { lt: at.id } },
            ],
          },
          // Newest first so the cap keeps the rows nearest the cursor; reversed below.
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: MAX_MESSAGES_PER_PAGE,
        })
      : Promise.resolve([]),
    prisma.consultMessage.findMany({
      where: {
        shareId: share.id,
        ...(at ? { OR: [{ createdAt: { gt: at.createdAt } }, { createdAt: at.createdAt, id: { gt: at.id } }] } : {}),
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: MAX_MESSAGES_PER_PAGE,
    }),
  ]);

  const rows = [...overlap.reverse(), ...forward];
  const newest = forward.length > 0 ? forward[forward.length - 1].id : (at?.id ?? null);
  return { messages: rows.map((row) => toMessage(row, chart.ownerId)), cursor: newest };
}

/** The whole thread (up to one page), oldest first. */
export async function listMessages(sessionUser: SessionUser | null, shareId: string): Promise<ConsultationMessage[]> {
  return (await listMessagesSince(sessionUser, shareId, null)).messages;
}
