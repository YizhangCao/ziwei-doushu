/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.1
 * Created: November 11, 2026 · San Francisco, California, USA
 * Last Edited: November 13, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Unit tests for the AI routes' hourly limits (per user and per IP),
 * the 429 response, and the message the reading panels show for it.
 */

import { describe, it, expect } from 'vitest';
import { AI_HOURLY_LIMIT, AI_IP_HOURLY_LIMIT, limitAiRequest, tooManyRequests } from '@/lib/rate-limit/ai-limit';
import { createMemoryStore, type RateLimitStore } from '@/lib/rate-limit/limiter';
import { aiLimitReason, rateLimitWait } from '@/lib/rate-limit/message';

const NOW = Date.UTC(2026, 10, 12, 10, 15, 0);

/** Sends `count` requests and returns the last result. */
async function send(store: RateLimitStore, caller: { userId: string; ip: string }, count: number) {
  let last = await limitAiRequest(store, caller, NOW);
  for (let i = 1; i < count; i++) last = await limitAiRequest(store, caller, NOW);
  return last;
}

describe('limitAiRequest(store, { userId, ip }, now)', () => {
  it('allows 20 requests an hour per user, and refuses the 21st', async () => {
    const store = createMemoryStore(() => NOW);
    expect(AI_HOURLY_LIMIT).toBe(20);

    expect((await send(store, { userId: 'u1', ip: '203.0.113.1' }, 20)).allowed).toBe(true);
    expect(await limitAiRequest(store, { userId: 'u1', ip: '203.0.113.1' }, NOW)).toMatchObject({
      allowed: false,
      retryAfterSeconds: 45 * 60,
    });
  });

  it('lets other accounts on a shared IP keep reading after one reaches its limit', async () => {
    // A demo room or campus wifi puts many people behind one address.
    const store = createMemoryStore(() => NOW);
    await send(store, { userId: 'u1', ip: '203.0.113.1' }, 20);

    expect((await limitAiRequest(store, { userId: 'u2', ip: '203.0.113.1' }, NOW)).allowed).toBe(true);
  });

  it('limits an IP shared by many accounts to 100 requests an hour', async () => {
    const store = createMemoryStore(() => NOW);
    expect(AI_IP_HOURLY_LIMIT).toBe(100);
    for (let u = 0; u < 5; u++) await send(store, { userId: `u${u}`, ip: '203.0.113.1' }, 20);

    expect((await limitAiRequest(store, { userId: 'u5', ip: '203.0.113.1' }, NOW)).allowed).toBe(false);
  });

  it('limits one account across several IPs', async () => {
    const store = createMemoryStore(() => NOW);
    for (let i = 0; i < 20; i++) await limitAiRequest(store, { userId: 'u1', ip: `203.0.113.${i}` }, NOW);

    expect((await limitAiRequest(store, { userId: 'u1', ip: '198.51.100.1' }, NOW)).allowed).toBe(false);
  });

  it('applies the admin-set daily limit per user, resetting at 00:00 UTC', async () => {
    const store = createMemoryStore(() => NOW);
    const caller = { userId: 'u1', ip: '203.0.113.1', dailyLimit: 2 };
    await limitAiRequest(store, caller, NOW);
    await limitAiRequest(store, caller, NOW);

    const third = await limitAiRequest(store, caller, NOW);
    expect(third.allowed).toBe(false);
    // 10:15 UTC: 13 h 45 min until the next UTC day.
    expect(third.retryAfterSeconds).toBe((13 * 60 + 45) * 60);
    expect((await limitAiRequest(store, caller, Date.UTC(2026, 10, 13, 0, 0, 1))).allowed).toBe(true);
  });

  it('refuses every AI request when the daily limit is 0', async () => {
    const store = createMemoryStore(() => NOW);

    expect((await limitAiRequest(store, { userId: 'u1', ip: '203.0.113.1', dailyLimit: 0 }, NOW)).allowed).toBe(false);
  });

  it('says which limit refused a request: hourly, daily, or paused when the daily limit is 0 (#118)', async () => {
    const store = createMemoryStore(() => NOW);
    await send(store, { userId: 'u1', ip: '203.0.113.1' }, 20);
    expect((await limitAiRequest(store, { userId: 'u1', ip: '203.0.113.1' }, NOW)).reason).toBe('hourly');

    for (let u = 2; u < 7; u++) await send(store, { userId: `u${u}`, ip: '203.0.113.2' }, 20);
    expect((await limitAiRequest(store, { userId: 'u7', ip: '203.0.113.2' }, NOW)).reason).toBe('hourly');

    const daily = { userId: 'u8', ip: '203.0.113.3', dailyLimit: 1 };
    await limitAiRequest(store, daily, NOW);
    expect((await limitAiRequest(store, daily, NOW)).reason).toBe('daily');

    expect((await limitAiRequest(store, { userId: 'u9', ip: '203.0.113.4', dailyLimit: 0 }, NOW)).reason).toBe('paused');
  });

  it('lets the request through when the store fails, so a Redis outage does not stop readings', async () => {
    const broken: RateLimitStore = { increment: () => Promise.reject(new Error('connection refused')) };

    expect((await limitAiRequest(broken, { userId: 'u1', ip: '203.0.113.1' }, NOW)).allowed).toBe(true);
  });
});

describe('tooManyRequests(result)', () => {
  it('returns 429 with a JSON { error } and a Retry-After header in seconds', async () => {
    const res = tooManyRequests({ allowed: false, limit: 20, remaining: 0, retryAfterSeconds: 2700 });

    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('2700');
    expect(await res.json()).toEqual({ error: expect.stringMatching(/too many/i), reason: 'hourly' });
  });

  it('names the limit in the body, so the panel can tell the daily limit from the hourly one (#118)', async () => {
    // 23:20 UTC: the daily limit's wait is under an hour, so Retry-After alone can't tell them apart.
    const daily = tooManyRequests({ allowed: false, limit: 50, remaining: 0, retryAfterSeconds: 2400, reason: 'daily' });
    expect(await daily.json()).toEqual({ error: expect.stringMatching(/too many/i), reason: 'daily' });

    const paused = tooManyRequests({ allowed: false, limit: 0, remaining: 0, retryAfterSeconds: 2400, reason: 'paused' });
    expect(await paused.json()).toEqual({ error: expect.any(String), reason: 'paused' });
  });
});

describe('aiLimitReason(body)', () => {
  it('reads which limit a 429 body names', () => {
    expect(aiLimitReason({ error: 'x', reason: 'hourly' })).toBe('hourly');
    expect(aiLimitReason({ error: 'x', reason: 'daily' })).toBe('daily');
    expect(aiLimitReason({ error: 'x', reason: 'paused' })).toBe('paused');
  });

  it('treats a body without a known reason as the hourly limit', () => {
    for (const body of [null, undefined, 'text', { error: 'x' }, { reason: 'weekly' }, { reason: 1 }]) {
      expect(aiLimitReason(body)).toBe('hourly');
    }
  });
});

describe('rateLimitWait(retryAfterSeconds)', () => {
  // The words live in messages/{zh,en}/insight.json (#9 after #59); this only works out the wait.
  it('says how long to wait, in minutes or hours', () => {
    expect(rateLimitWait(2700)).toEqual({ minutes: 45 });
    expect(rateLimitWait(20)).toEqual({ minutes: 1 });
    expect(rateLimitWait(5 * 3600 + 60)).toEqual({ hours: 6 });
  });

  it('has no wait to give when the header is missing or invalid', () => {
    expect(rateLimitWait(Number.NaN)).toBeNull();
    expect(rateLimitWait(0)).toBeNull();
  });
});
