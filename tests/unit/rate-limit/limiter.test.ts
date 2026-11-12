/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Unit tests for the fixed-window limiter and its two stores: the
 * in-memory fallback and the Redis store (against a fake Redis client).
 */

import { describe, it, expect } from 'vitest';
import { consume, createMemoryStore, createRedisStore, type RateLimitRule } from '@/lib/rate-limit/limiter';

const HOUR = 60 * 60 * 1000;
const RULE: RateLimitRule = { name: 'test', limit: 3, windowMs: HOUR };
// 10:15 UTC, a quarter into the hour window that started at 10:00.
const NOW = Date.UTC(2026, 10, 12, 10, 15, 0);

describe('consume(store, rule, id, now) with the memory store', () => {
  it('allows up to the limit in one window, then refuses with the seconds left in it', async () => {
    const store = createMemoryStore(() => NOW);
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await consume(store, RULE, 'user-1', NOW));

    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results.map((r) => r.remaining)).toEqual([2, 1, 0, 0]);
    expect(results[3]).toMatchObject({ limit: 3, retryAfterSeconds: 45 * 60 });
  });

  it('starts counting again in the next window', async () => {
    const store = createMemoryStore(() => NOW);
    for (let i = 0; i < 4; i++) await consume(store, RULE, 'user-1', NOW);

    expect((await consume(store, RULE, 'user-1', NOW + 45 * 60 * 1000)).allowed).toBe(true);
  });

  it('counts each id and each rule separately', async () => {
    const store = createMemoryStore(() => NOW);
    for (let i = 0; i < 4; i++) await consume(store, RULE, 'user-1', NOW);

    expect((await consume(store, RULE, 'user-2', NOW)).allowed).toBe(true);
    expect((await consume(store, { ...RULE, name: 'other' }, 'user-1', NOW)).allowed).toBe(true);
  });

  it('drops counters of past windows instead of keeping them forever', async () => {
    let clock = NOW;
    const store = createMemoryStore(() => clock);
    for (let i = 0; i < 50; i++) await consume(store, RULE, `user-${i}`, NOW);

    clock = NOW + 2 * HOUR;
    await consume(store, RULE, 'late', clock);

    expect(store.size()).toBe(1);
  });
});

describe('createRedisStore(redis)', () => {
  /** A fake ioredis client that records the commands the store sends. */
  function fakeRedis() {
    const counts = new Map<string, number>();
    const calls: string[] = [];
    return {
      calls,
      incr: async (key: string) => {
        calls.push(`incr ${key}`);
        counts.set(key, (counts.get(key) ?? 0) + 1);
        return counts.get(key)!;
      },
      pexpire: async (key: string, ms: number) => {
        calls.push(`pexpire ${key} ${ms}`);
        return 1;
      },
    };
  }

  it('counts with INCR and sets the expiry once, when the window opens', async () => {
    const redis = fakeRedis();
    const store = createRedisStore(redis);

    const first = await consume(store, RULE, 'user-1', NOW);
    const second = await consume(store, RULE, 'user-1', NOW);

    expect([first.remaining, second.remaining]).toEqual([2, 1]);
    const key = `rl:test:user-1:${Math.floor(NOW / HOUR)}`;
    expect(redis.calls).toEqual([`incr ${key}`, `pexpire ${key} ${45 * 60 * 1000}`, `incr ${key}`]);
  });
});
