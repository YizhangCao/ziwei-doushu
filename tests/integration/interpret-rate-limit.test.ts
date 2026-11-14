/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Integration tests for the hourly limit on POST /api/interpret. The
 * limit is checked after auth and before the body, so every request sends an
 * invalid body: allowed requests get 400, and the 21st in an hour gets 429. No
 * request reaches Anthropic. All people are fictional.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { encode } from 'next-auth/jwt';
import { prisma } from '@/lib/db';
import { resetDatabase } from './helpers/reset';

process.env.AUTH_SECRET ??= 'integration-test-auth-secret-not-real';
process.env.AUTH_TRUST_HOST ??= 'true';
// Force the in-memory store, so the test never needs a Redis server.
process.env.REDIS_URL = '';

const URL = 'http://localhost:3000/api/interpret';
const SESSION_COOKIE = 'authjs.session-token';

type RouteModule = typeof import('@/app/api/interpret/route');
let POST: RouteModule['POST'];

beforeAll(async () => {
  ({ POST } = await import('@/app/api/interpret/route'));
});
beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

/** Creates a member and returns a session cookie for them. */
async function memberCookie(githubId: string): Promise<string> {
  const { id } = await prisma.user.create({ data: { githubId }, select: { id: true } });
  const value = await encode({ token: { sub: id, role: 'member' }, secret: process.env.AUTH_SECRET!, salt: SESSION_COOKIE });
  return `${SESSION_COOKIE}=${value}`;
}

/** Posts an invalid body from `ip` with the given session cookie. */
async function post(cookie: string, ip: string): Promise<Response> {
  const request = new NextRequest(URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      host: 'localhost:3000',
      'x-forwarded-proto': 'http',
      'x-forwarded-for': ip,
      cookie,
    },
    body: JSON.stringify({ chart: null, messages: [] }),
  });
  const res = await POST(request, { params: Promise.resolve({}) });
  if (!(res instanceof Response)) throw new Error('route returned no Response');
  return res;
}

describe('POST /api/interpret rate limit', () => {
  it('returns 429 with { error } and Retry-After on the 21st request in an hour', async () => {
    const cookie = await memberCookie('5001');
    for (let i = 0; i < 20; i++) expect((await post(cookie, '203.0.113.10')).status).toBe(400);

    const res = await post(cookie, '203.0.113.10');
    expect(res.status).toBe(429);
    expect(Number(res.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(await res.json()).toEqual({ error: expect.any(String), reason: 'hourly' });
  });

  it('lets other accounts on a shared IP through, and limits the IP at 100 an hour', async () => {
    const accounts: string[] = [];
    for (const githubId of ['5002', '5003', '5006', '5007', '5008', '5009']) accounts.push(await memberCookie(githubId));
    for (let i = 0; i < 20; i++) await post(accounts[0], '203.0.113.20');

    // The first account is at its own limit, but the next one still gets through (400: the body is invalid).
    expect((await post(accounts[1], '203.0.113.20')).status).toBe(400);

    // Five accounts use up the IP's 100 requests; a sixth on the same IP is refused.
    for (let i = 1; i < 20; i++) await post(accounts[1], '203.0.113.20');
    for (const account of accounts.slice(2, 5)) for (let i = 0; i < 20; i++) await post(account, '203.0.113.20');
    expect((await post(accounts[5], '203.0.113.20')).status).toBe(429);
  });

  it('does not limit another account on another IP', async () => {
    const first = await memberCookie('5004');
    const second = await memberCookie('5005');
    for (let i = 0; i < 21; i++) await post(first, '203.0.113.30');

    expect((await post(second, '203.0.113.31')).status).toBe(400);
  });
});
