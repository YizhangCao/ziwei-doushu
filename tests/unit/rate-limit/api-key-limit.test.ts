/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The per-key limit on the public API (#9, AGENTS.md: "Rate-limit /api/v1/* ...
 * per key"). Each API key gets 60 requests a minute; the 61st gets 429 with Retry-After.
 */

import { describe, it, expect } from 'vitest';
import { API_KEY_LIMIT_PER_MINUTE, limitApiKeyRequest, tooManyApiRequests } from '@/lib/rate-limit/api-key-limit';
import { createMemoryStore, type RateLimitStore } from '@/lib/rate-limit/limiter';

// 30 seconds into a minute, so a refused request waits 30 seconds.
const NOW = Date.UTC(2026, 10, 12, 12, 0, 30);

async function spend(store: RateLimitStore, key: string, times: number, now = NOW) {
  for (let i = 0; i < times; i++) expect((await limitApiKeyRequest(store, key, now)).allowed).toBe(true);
}

describe('limitApiKeyRequest (#9)', () => {
  it('allows 60 requests a minute per key', () => {
    expect(API_KEY_LIMIT_PER_MINUTE).toBe(60);
  });

  it('refuses the 61st request in a minute, with the seconds left in that minute', async () => {
    const store = createMemoryStore(() => NOW);
    await spend(store, 'key-a', 60);
    const refused = await limitApiKeyRequest(store, 'key-a', NOW);
    expect(refused).toMatchObject({ allowed: false, limit: 60, remaining: 0, retryAfterSeconds: 30 });
  });

  it('counts each key on its own', async () => {
    const store = createMemoryStore(() => NOW);
    await spend(store, 'key-a', 60);
    expect((await limitApiKeyRequest(store, 'key-b', NOW)).allowed).toBe(true);
  });

  it('starts again in the next minute', async () => {
    const store = createMemoryStore(() => NOW);
    await spend(store, 'key-a', 60);
    expect((await limitApiKeyRequest(store, 'key-a', NOW + 30_000)).allowed).toBe(true);
  });

  it('lets the request through when the store fails: an outage must not take the API down', async () => {
    const broken: RateLimitStore = { increment: async () => { throw new Error('connection refused'); } };
    expect((await limitApiKeyRequest(broken, 'key-a', NOW)).allowed).toBe(true);
  });
});

describe('tooManyApiRequests (#9)', () => {
  it('is a 429 with Retry-After in seconds and a JSON { error }', async () => {
    const res = tooManyApiRequests({ allowed: false, limit: 60, remaining: 0, retryAfterSeconds: 30 });
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('30');
    const body = (await res.json()) as { error?: unknown };
    expect(typeof body.error).toBe('string');
  });
});
