/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Fixed-window rate limiter with two stores: Redis (shared by every
 * server instance) and an in-memory fallback for local development and tests.
 */

/** Where hit counters live. */
export interface RateLimitStore {
  readonly kind?: 'memory' | 'redis';
  /** Adds one hit to `key` and returns its new count; the key may be dropped after `ttlMs`. */
  increment(key: string, ttlMs: number): Promise<number>;
}

/** A named limit: at most `limit` hits per id in each `windowMs` window. */
export interface RateLimitRule {
  name: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the window resets; 0 when allowed. */
  retryAfterSeconds: number;
}

/**
 * Counts one hit for `id` under `rule` and says whether it is within the limit.
 *
 * Windows are aligned to the epoch (an hourly window resets on the hour, a daily one
 * at 00:00 UTC), and the window index is part of the key. A counter therefore never
 * has to be reset: the next window simply uses a new key.
 *
 * @param now The current time in epoch milliseconds.
 */
export async function consume(store: RateLimitStore, rule: RateLimitRule, id: string, now: number): Promise<RateLimitResult> {
  const window = Math.floor(now / rule.windowMs);
  const msLeft = (window + 1) * rule.windowMs - now;
  const count = await store.increment(`rl:${rule.name}:${id}:${window}`, msLeft);
  const allowed = count <= rule.limit;
  return {
    allowed,
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - count),
    retryAfterSeconds: allowed ? 0 : Math.ceil(msLeft / 1000),
  };
}

/** The in-memory store. `size()` is for tests. */
export interface MemoryStore extends RateLimitStore {
  readonly kind: 'memory';
  size(): number;
}

/**
 * Creates a store that keeps counters in this process. Each serverless instance
 * has its own, so it is a fallback for local development, not a production limit.
 *
 * @param clock Returns the current time; injected so tests control expiry.
 */
export function createMemoryStore(clock: () => number = Date.now): MemoryStore {
  const counters = new Map<string, { count: number; expiresAt: number }>();
  return {
    kind: 'memory',
    async increment(key, ttlMs) {
      const now = clock();
      // Drop finished windows, so the map holds only live counters.
      for (const [k, entry] of counters) if (entry.expiresAt <= now) counters.delete(k);
      const entry = counters.get(key) ?? { count: 0, expiresAt: now + ttlMs };
      entry.count += 1;
      counters.set(key, entry);
      return entry.count;
    },
    size: () => counters.size,
  };
}

/** The two ioredis commands the Redis store needs. */
export interface RedisCounter {
  incr(key: string): Promise<number>;
  pexpire(key: string, ms: number): Promise<number>;
}

/** Creates a store backed by Redis, shared by every server instance. */
export function createRedisStore(redis: RedisCounter): RateLimitStore & { readonly kind: 'redis' } {
  return {
    kind: 'redis',
    async increment(key, ttlMs) {
      const count = await redis.incr(key);
      // Only the first hit sets the expiry. If that call is lost the key just lingers:
      // it holds a past window, which no later request reads.
      if (count === 1) await redis.pexpire(key, ttlMs);
      return count;
    },
  };
}
