/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.2
 * Created: November 11, 2026 · San Francisco, California, USA
 * Last Edited: November 13, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Which limit refused an AI request and how long it has to wait. No server
 * imports: client components use it. The words live in messages/{zh,en}/insight.json (#59).
 */

/**
 * Which limit refused an AI request (#118): an hourly one (per user or per IP), the
 * admin-set daily one, or AI readings paused because the daily limit is 0.
 */
export type AiLimitReason = 'hourly' | 'daily' | 'paused';

const REASONS: readonly AiLimitReason[] = ['hourly', 'daily', 'paused'];

/**
 * Reads the limit a 429 body names. A body without a known one is the hourly limit, the
 * only one an older server had.
 *
 * @param body The parsed JSON body, or null when it wasn't JSON.
 */
export function aiLimitReason(body: unknown): AiLimitReason {
  const reason = typeof body === 'object' && body !== null ? (body as { reason?: unknown }).reason : undefined;
  return REASONS.find((r) => r === reason) ?? 'hourly';
}

/** The wait to tell the user: whole minutes under an hour, otherwise whole hours. */
export type RateLimitWait = { minutes: number } | { hours: number };

/**
 * Turns a 429's Retry-After value into the wait to show, rounded up.
 *
 * @param retryAfterSeconds The response's Retry-After value; NaN or 0 if missing.
 * @returns The wait, or null when there is none to give.
 */
export function rateLimitWait(retryAfterSeconds: number): RateLimitWait | null {
  if (!Number.isFinite(retryAfterSeconds) || retryAfterSeconds <= 0) return null;
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return minutes < 60 ? { minutes } : { hours: Math.ceil(minutes / 60) };
}
