/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Integration test for the admin-set daily AI limit (#23) on POST
 * /api/interpret. Requests send an invalid body: allowed ones get 400, and the
 * first one over the limit gets 429. No request reaches Anthropic.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { encode } from 'next-auth/jwt';
import { prisma } from '@/lib/db';
import { setDailyAiLimit } from '@/lib/admin/settings';
import { resetDatabase } from './helpers/reset';

process.env.AUTH_SECRET ??= 'integration-test-auth-secret-not-real';
process.env.AUTH_TRUST_HOST ??= 'true';
process.env.REDIS_URL = '';

const SESSION_COOKIE = 'authjs.session-token';

type RouteModule = typeof import('@/app/api/interpret/route');
let POST: RouteModule['POST'];

beforeAll(async () => {
  ({ POST } = await import('@/app/api/interpret/route'));
});
beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

async function post(cookie: string): Promise<Response> {
  const request = new NextRequest('http://localhost:3000/api/interpret', {
    method: 'POST',
    headers: { 'content-type': 'application/json', host: 'localhost:3000', 'x-forwarded-proto': 'http', 'x-forwarded-for': '203.0.113.50', cookie },
    body: JSON.stringify({ chart: null, messages: [] }),
  });
  const res = await POST(request, { params: Promise.resolve({}) });
  if (!(res instanceof Response)) throw new Error('route returned no Response');
  return res;
}

describe('POST /api/interpret daily limit', () => {
  it('returns 429 once a member has used the daily limit an admin set', async () => {
    const { id } = await prisma.user.create({ data: { githubId: '7001' }, select: { id: true } });
    const cookie = `${SESSION_COOKIE}=${await encode({ token: { sub: id, role: 'member' }, secret: process.env.AUTH_SECRET!, salt: SESSION_COOKIE })}`;
    await setDailyAiLimit(prisma, 2);

    expect((await post(cookie)).status).toBe(400);
    expect((await post(cookie)).status).toBe(400);
    const res = await post(cookie);
    expect(res.status).toBe(429);
    expect(Number(res.headers.get('retry-after'))).toBeGreaterThan(0);
    // The body names the daily limit, so the panel never mistakes it for the hourly one (#118).
    expect(await res.json()).toEqual({ error: expect.any(String), reason: 'daily' });
  });

  it('says AI readings are paused when the daily limit is 0 (#118)', async () => {
    const { id } = await prisma.user.create({ data: { githubId: '7002' }, select: { id: true } });
    const cookie = `${SESSION_COOKIE}=${await encode({ token: { sub: id, role: 'member' }, secret: process.env.AUTH_SECRET!, salt: SESSION_COOKIE })}`;
    await setDailyAiLimit(prisma, 0);

    const res = await post(cookie);
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: expect.any(String), reason: 'paused' });
  });
});
