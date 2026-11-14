/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/** @fileoverview The admin-set daily AI limit, stored in the Setting table. */

import type { PrismaClient } from '@/lib/generated/prisma/client';

/** AI requests per user per UTC day until an admin sets a value. */
export const DEFAULT_DAILY_AI_LIMIT = 50;

const KEY = 'dailyAiLimit';

/** Reads the daily AI limit; an unset or unreadable value gives the default. */
export async function getDailyAiLimit(db: Pick<PrismaClient, 'setting'>): Promise<number> {
  const row = await db.setting.findUnique({ where: { key: KEY }, select: { value: true } });
  const value = row ? Number(row.value) : Number.NaN;
  return Number.isInteger(value) && value >= 0 ? value : DEFAULT_DAILY_AI_LIMIT;
}

/** Stores the daily AI limit. Callers validate it first (lib/validation/admin.ts). */
export async function setDailyAiLimit(db: Pick<PrismaClient, 'setting'>, limit: number): Promise<number> {
  await db.setting.upsert({ where: { key: KEY }, update: { value: String(limit) }, create: { key: KEY, value: String(limit) } });
  return limit;
}
