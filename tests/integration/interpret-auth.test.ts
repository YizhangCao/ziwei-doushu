import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { encode } from 'next-auth/jwt';

// POST /api/interpret is member-only (AGENTS.md roles table, #15). Auth is checked before
// the body, so these tests send an invalid body: a guest must get 401, and a signed-in user
// must get past auth to the 400 body check. No Anthropic call is ever reached.
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

function interpretRequest(cookie?: string): NextRequest {
  return new NextRequest(URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify({ chart: null, messages: [] }),
  });
}

async function sessionCookie(token: Record<string, unknown>): Promise<string> {
  const value = await encode({ token, secret: process.env.AUTH_SECRET!, salt: SESSION_COOKIE });
  return `${SESSION_COOKIE}=${value}`;
}

// The route handler's second argument (route context); /api/interpret has no params.
const ctx = { params: Promise.resolve({}) };

describe('POST /api/interpret auth', () => {
  it('returns 401 with { error } when there is no session', async () => {
    const res = await POST(interpretRequest(), ctx);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: expect.any(String) });
  });

  it('returns 401 for a session cookie signed with the wrong secret', async () => {
    const forged = await encode({
      token: { sub: 'user-1', role: 'member' },
      secret: 'some-other-secret-not-ours',
      salt: SESSION_COOKIE,
    });
    const res = await POST(interpretRequest(`${SESSION_COOKIE}=${forged}`), ctx);
    expect(res.status).toBe(401);
  });

  it('lets a signed-in member past auth (invalid body then gives 400, not 401)', async () => {
    const res = await POST(interpretRequest(await sessionCookie({ sub: 'user-1', role: 'member' })), ctx);
    expect(res.status).toBe(400);
  });
});
