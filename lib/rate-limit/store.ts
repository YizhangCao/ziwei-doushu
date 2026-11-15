/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The process-wide rate-limit store: Redis when REDIS_URL is set,
 * otherwise the in-memory fallback. Server only.
 */

import Redis from 'ioredis';
import { z } from 'zod';
import { createMemoryStore, createRedisStore, type RateLimitStore } from './limiter';

let store: RateLimitStore | undefined;

// REDIS_URL, parsed with zod like every env variable (AGENTS.md). Unset or empty means "no Redis".
// The error names the variable only, never the value: the value holds a password.
const redisUrlSchema = z
  .string()
  .trim()
  .transform((value) => value || null)
  .pipe(z.url({ protocol: /^rediss?$/, error: 'REDIS_URL must be a redis:// or rediss:// URL' }).nullable());

/** Reads REDIS_URL; an unset or empty value means "no Redis". */
function redisUrl(): string | null {
  const parsed = redisUrlSchema.safeParse(process.env.REDIS_URL ?? '');
  if (!parsed.success) throw new Error('REDIS_URL must be a redis:// or rediss:// URL');
  return parsed.data;
}

/** Returns the shared store, creating it on first use. */
export function getRateLimitStore(): RateLimitStore {
  if (store) return store;
  const url = redisUrl();
  if (!url) return (store = createMemoryStore());

  // lazyConnect: connect on the first command, not at import. One retry keeps a request
  // from hanging when Redis is down; the AI limit then lets it through.
  const redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1, connectTimeout: 2000 });
  // Connection errors also reach the failing command, which is where they are handled.
  // Without a listener ioredis reports each reconnect attempt as an unhandled error.
  redis.on('error', () => {});
  return (store = createRedisStore(redis));
}
