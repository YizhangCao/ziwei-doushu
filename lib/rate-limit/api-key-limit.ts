/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The per-key limit on the public API (AGENTS.md: "Rate-limit /api/v1/* ... per
 * key"). A chart is cheap to build, so the limit is per minute: generous for an integration,
 * short enough to stop a script hammering the server.
 */

import { consume, type RateLimitResult, type RateLimitRule, type RateLimitStore } from './limiter';

/** Requests allowed per minute for each API key. */
export const API_KEY_LIMIT_PER_MINUTE = 60;

const PER_KEY: RateLimitRule = { name: 'api-key', limit: API_KEY_LIMIT_PER_MINUTE, windowMs: 60 * 1000 };

const ALLOWED: RateLimitResult = {
  allowed: true,
  limit: API_KEY_LIMIT_PER_MINUTE,
  remaining: API_KEY_LIMIT_PER_MINUTE,
  retryAfterSeconds: 0,
};

/**
 * Counts one request for an API key. A store failure lets the request through, as on the AI
 * routes: a Redis outage should not take the public API down.
 *
 * @param now The current time in epoch milliseconds.
 */
export async function limitApiKeyRequest(store: RateLimitStore, apiKeyId: string, now: number): Promise<RateLimitResult> {
  try {
    return await consume(store, PER_KEY, apiKeyId, now);
  } catch {
    return ALLOWED;
  }
}

/** The 429 response for a refused request, with Retry-After in seconds. */
export function tooManyApiRequests(result: RateLimitResult): Response {
  return Response.json(
    { error: 'Too many requests for this API key. Try again later.' },
    { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds) } },
  );
}
