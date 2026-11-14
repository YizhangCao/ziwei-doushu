/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Unit tests for `getRateLimitStore`: Redis when REDIS_URL is set,
 * the in-memory fallback otherwise. No test opens a Redis connection.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

async function load() {
  return (await import('@/lib/rate-limit/store')).getRateLimitStore;
}

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllEnvs());

describe('getRateLimitStore()', () => {
  it('uses the in-memory store when REDIS_URL is not set, and reuses it', async () => {
    vi.stubEnv('REDIS_URL', '');
    const getRateLimitStore = await load();

    const store = getRateLimitStore();
    expect(store.kind).toBe('memory');
    expect(getRateLimitStore()).toBe(store);
  });

  it('uses Redis when REDIS_URL is a redis:// or rediss:// URL', async () => {
    vi.stubEnv('REDIS_URL', 'rediss://default:not-a-real-password@redis.example.test:6379');
    const getRateLimitStore = await load();

    expect(getRateLimitStore().kind).toBe('redis');
  });

  it('rejects a REDIS_URL that is not a Redis URL, naming the variable but not its value', async () => {
    vi.stubEnv('REDIS_URL', 'https://user:secret-value@example.test');
    const getRateLimitStore = await load();

    expect(() => getRateLimitStore()).toThrow(/REDIS_URL/);
    expect(() => getRateLimitStore()).not.toThrow(/secret-value/);
  });
});
