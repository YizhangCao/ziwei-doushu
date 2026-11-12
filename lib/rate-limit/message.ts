/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.1
 * Created: November 11, 2026 · San Francisco, California, USA
 * Last Edited: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview How long a rate-limited AI request has to wait. No server imports:
 * client components use it. The words live in messages/{zh,en}/insight.json (#59).
 */

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
