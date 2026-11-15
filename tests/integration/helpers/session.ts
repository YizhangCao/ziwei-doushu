import { NextRequest } from 'next/server';
import { encode } from 'next-auth/jwt';
import type { Role } from '@/lib/auth/types';

// Fallbacks so the suite also runs without a configured environment.
process.env.AUTH_SECRET ??= 'integration-test-auth-secret-not-real';
process.env.AUTH_TRUST_HOST ??= 'true';

// Auth.js v5 session cookie name on plain http (https adds the __Secure- prefix).
export const SESSION_COOKIE = 'authjs.session-token';

/** A session cookie for a user, signed with AUTH_SECRET, as Auth.js would set after login. */
export async function sessionCookie(user: { id: string; role: Role }): Promise<string> {
  const token = { sub: user.id, role: user.role, roleCheckedAt: Date.now() };
  const value = await encode({ token, secret: process.env.AUTH_SECRET!, salt: SESSION_COOKIE });
  return `${SESSION_COOKIE}=${value}`;
}

/** A request to a local route, with or without a session cookie. */
export function apiRequest(
  path: string,
  options: { method?: string; cookie?: string; body?: unknown; headers?: Record<string, string> } = {},
): NextRequest {
  const { method = 'GET', cookie, body, headers = {} } = options;
  return new NextRequest(`http://localhost:3000${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      // Next.js sets these on real requests. Without them Auth.js assumes https and looks
      // for the __Secure- cookie name.
      host: 'localhost:3000',
      'x-forwarded-proto': 'http',
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
    ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
  });
}

/** Route handlers wrapped in auth() take a context; this gives them their params. */
export function routeContext<P extends Record<string, string>>(params: P) {
  return { params: Promise.resolve(params) };
}
