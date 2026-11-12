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
import { createMemoryStore, createRedisStore, type RateLimitStore } from './limiter';

let store: RateLimitStore | undefined;

/** Reads REDIS_URL; an unset or empty value means "no Redis". */
function redisUrl(): string | null {
  const value = process.env.REDIS_URL?.trim();
  if (!value) return null;
  let protocol: string;
  try {
    protocol = new URL(value).protocol;
  } catch {
    protocol = '';
  }
  // The message names the variable only: the value holds a password.
  if (protocol !== 'redis:' && protocol !== 'rediss:') throw new Error('REDIS_URL must be a redis:// or rediss:// URL');
  return value;
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
