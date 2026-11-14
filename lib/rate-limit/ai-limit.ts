/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.1
 * Created: November 11, 2026 · San Francisco, California, USA
 * Last Edited: November 13, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Hourly limits for the AI routes, per user and per IP, so one person
 * cannot run up the Anthropic bill (AGENTS.md security rules).
 */

import { consume, type RateLimitResult, type RateLimitRule, type RateLimitStore } from './limiter';
import type { AiLimitReason } from './message';

/** A limit check's result; a refusal also says which limit refused it (#118). */
export interface AiLimitResult extends RateLimitResult {
  reason?: AiLimitReason;
}

/** AI requests allowed per hour for each user. */
export const AI_HOURLY_LIMIT = 20;

/**
 * AI requests allowed per hour for each IP. Several times the user limit, because a demo room
 * or campus wifi puts many people behind one address; it only stops abuse across many accounts.
 */
export const AI_IP_HOURLY_LIMIT = 100;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const PER_USER: RateLimitRule = { name: 'ai-user', limit: AI_HOURLY_LIMIT, windowMs: HOUR_MS };
const PER_IP: RateLimitRule = { name: 'ai-ip', limit: AI_IP_HOURLY_LIMIT, windowMs: HOUR_MS };

const ALLOWED: RateLimitResult = { allowed: true, limit: AI_HOURLY_LIMIT, remaining: AI_HOURLY_LIMIT, retryAfterSeconds: 0 };

/**
 * Counts one AI request against the hourly limits and, when given, the admin-set
 * daily limit (#23). The IP limit catches several accounts behind one address; the
 * user limits catch one account across addresses. The daily window resets at
 * 00:00 UTC, and a daily limit of 0 refuses every request.
 *
 * A store failure lets the request through, so a Redis outage does not stop
 * readings.
 *
 * @param caller.dailyLimit The admin-set requests per user per day; omit to skip it.
 * @param now The current time in epoch milliseconds.
 * @return The first limit that refused the request, with its reason, or an allowed result.
 */
export async function limitAiRequest(
  store: RateLimitStore,
  caller: { userId: string; ip: string; dailyLimit?: number },
  now: number,
): Promise<AiLimitResult> {
  try {
    const byIp = await consume(store, PER_IP, caller.ip, now);
    if (!byIp.allowed) return { ...byIp, reason: 'hourly' };
    const byUser = await consume(store, PER_USER, caller.userId, now);
    if (!byUser.allowed) return { ...byUser, reason: 'hourly' };
    if (caller.dailyLimit !== undefined) {
      const daily = await consume(store, { name: 'ai-daily', limit: caller.dailyLimit, windowMs: DAY_MS }, caller.userId, now);
      if (!daily.allowed) return { ...daily, reason: caller.dailyLimit === 0 ? 'paused' : 'daily' };
    }
    return { ...byUser, remaining: Math.min(byIp.remaining, byUser.remaining) };
  } catch {
    return ALLOWED;
  }
}

/**
 * The 429 response for a refused request, with Retry-After in seconds. The body names the
 * limit, because Retry-After alone can't tell them apart: in the last hour of the UTC day the
 * daily limit's wait is under an hour too (#118).
 */
export function tooManyRequests(result: AiLimitResult): Response {
  return Response.json(
    { error: 'Too many AI requests. Try again later.', reason: result.reason ?? 'hourly' },
    { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds) } },
  );
}
