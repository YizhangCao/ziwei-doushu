/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.3
 * Created: November 10, 2026 · San Francisco, California, USA
 * Last Edited: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Integration tests for the member-only check on POST /api/interpret.
 * The route checks auth before the body, so every request sends an invalid body:
 * a guest gets 401, and a signed-in member gets past auth to the 400 body check.
 * Sessions are checked against the User table. No request reaches Anthropic.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { encode } from 'next-auth/jwt';
import { prisma } from '@/lib/db';
import { resetDatabase } from './helpers/reset';

// Fallbacks so the suite also runs without a configured environment.
process.env.AUTH_SECRET ??= 'integration-test-auth-secret-not-real';
process.env.AUTH_TRUST_HOST ??= 'true';

const URL = 'http://localhost:3000/api/interpret';
// Auth.js v5 session cookie name on plain http (https adds the __Secure- prefix).
const SESSION_COOKIE = 'authjs.session-token';

type RouteModule = typeof import('@/app/api/interpret/route');
let POST: RouteModule['POST'];

beforeAll(async () => {
  ({ POST } = await import('@/app/api/interpret/route'));
});
beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

/** Builds a POST /api/interpret request with an invalid body and an optional cookie. */
function interpretRequest(cookie?: string): NextRequest {
  return new NextRequest(URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      // Next.js sets these on real requests. Without them Auth.js assumes https and
      // looks for the __Secure- cookie name.
      host: 'localhost:3000',
      'x-forwarded-proto': 'http',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify({ chart: null, messages: [] }),
  });
}

/** Returns a Cookie header value holding a session JWT encoded the way Auth.js does. */
async function sessionCookie(token: Record<string, unknown>, secret = process.env.AUTH_SECRET!): Promise<string> {
  const value = await encode({ token, secret, salt: SESSION_COOKIE });
  return `${SESSION_COOKIE}=${value}`;
}

/** Calls the route handler as Next.js does; /api/interpret has no route params. */
async function post(cookie?: string): Promise<Response> {
  const res = await POST(interpretRequest(cookie), { params: Promise.resolve({}) });
  if (!(res instanceof Response)) throw new Error('route returned no Response');
  return res;
}

describe('POST /api/interpret auth', () => {
  it('returns 401 with { error } when there is no session', async () => {
    const res = await post();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: expect.any(String) });
  });

  it('returns 401 for a session cookie signed with the wrong secret', async () => {
    const res = await post(await sessionCookie({ sub: 'user-1', role: 'member' }, 'some-other-secret-not-ours'));
    expect(res.status).toBe(401);
  });

  it('lets a signed-in member past auth (invalid body then gives 400, not 401)', async () => {
    const { id } = await prisma.user.create({ data: { githubId: '3001' }, select: { id: true } });
    const res = await post(await sessionCookie({ sub: id, role: 'member' }));
    expect(res.status).toBe(400);
  });

  it('returns 401 when the session belongs to a user that no longer exists', async () => {
    const res = await post(await sessionCookie({ sub: 'deleted-user', role: 'member' }));
    expect(res.status).toBe(401);
  });
});
