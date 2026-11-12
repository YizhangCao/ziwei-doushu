/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Integration tests for the admin API (#23): user search, role
 * changes and the daily AI limit, on a real database. Only admins get past auth.
 * All people and emails are fictional.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { encode } from 'next-auth/jwt';
import { prisma } from '@/lib/db';
import { DEFAULT_DAILY_AI_LIMIT, getDailyAiLimit } from '@/lib/admin/settings';
import { resetDatabase } from './helpers/reset';

process.env.AUTH_SECRET ??= 'integration-test-auth-secret-not-real';
process.env.AUTH_TRUST_HOST ??= 'true';

const ORIGIN = 'http://localhost:3000';
const SESSION_COOKIE = 'authjs.session-token';

type UsersRoute = typeof import('@/app/api/admin/users/route');
type UserRoute = typeof import('@/app/api/admin/users/[id]/route');
type SettingsRoute = typeof import('@/app/api/admin/settings/route');
let users: UsersRoute;
let user: UserRoute;
let settings: SettingsRoute;

beforeAll(async () => {
  users = await import('@/app/api/admin/users/route');
  user = await import('@/app/api/admin/users/[id]/route');
  settings = await import('@/app/api/admin/settings/route');
});
beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

type Role = 'member' | 'practitioner' | 'admin';

/** Creates a user and returns its id and a session cookie for it. */
async function signedIn(role: Role, githubId: string, name = `${role} ${githubId}`) {
  const { id } = await prisma.user.create({ data: { githubId, role, name, email: `${githubId}@example.test` }, select: { id: true } });
  const value = await encode({ token: { sub: id, role }, secret: process.env.AUTH_SECRET!, salt: SESSION_COOKIE });
  return { id, cookie: `${SESSION_COOKIE}=${value}` };
}

function request(path: string, method: string, cookie?: string, body?: unknown): NextRequest {
  return new NextRequest(`${ORIGIN}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      host: 'localhost:3000',
      'x-forwarded-proto': 'http',
      ...(cookie ? { cookie } : {}),
    },
    ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
  });
}

/** Unwraps the Auth.js-wrapped handler result. */
async function call(result: Promise<unknown>): Promise<Response> {
  const res = await result;
  if (!(res instanceof Response)) throw new Error('route returned no Response');
  return res;
}

const noParams = { params: Promise.resolve({}) };
const searchUsers = (cookie?: string, q = '') => call(users.GET(request(`/api/admin/users?q=${encodeURIComponent(q)}`, 'GET', cookie), noParams));
const changeRole = (id: string, cookie: string | undefined, body: unknown) =>
  call(user.PATCH(request(`/api/admin/users/${id}`, 'PATCH', cookie, body), { params: Promise.resolve({ id }) }));
const readSettings = (cookie?: string) => call(settings.GET(request('/api/admin/settings', 'GET', cookie), noParams));
const writeSettings = (cookie: string | undefined, body: unknown) => call(settings.PUT(request('/api/admin/settings', 'PUT', cookie, body), noParams));

describe('admin API access', () => {
  it('returns 401 to guests and 403 to members and practitioners on every admin route', async () => {
    const member = await signedIn('member', '6001');
    const practitioner = await signedIn('practitioner', '6002');

    for (const cookie of [undefined, member.cookie, practitioner.cookie]) {
      const expected = cookie ? 403 : 401;
      expect((await searchUsers(cookie)).status).toBe(expected);
      expect((await changeRole(member.id, cookie, { role: 'admin' })).status).toBe(expected);
      expect((await readSettings(cookie)).status).toBe(expected);
      expect((await writeSettings(cookie, { dailyAiLimit: 1 })).status).toBe(expected);
    }
    expect(await prisma.user.findUniqueOrThrow({ where: { id: member.id }, select: { role: true } })).toEqual({ role: 'member' });
  });
});

describe('GET /api/admin/users', () => {
  it('finds users by name, email or GitHub id, case-insensitively', async () => {
    const admin = await signedIn('admin', '6010');
    await signedIn('member', '6011', 'Ada Member');
    await signedIn('member', '6012', 'Bo Member');

    const byName = await (await searchUsers(admin.cookie, 'ada')).json();
    expect(byName.users.map((u: { name: string }) => u.name)).toEqual(['Ada Member']);
    const byEmail = await (await searchUsers(admin.cookie, '6012@EXAMPLE')).json();
    expect(byEmail.users.map((u: { name: string }) => u.name)).toEqual(['Bo Member']);
    const all = await (await searchUsers(admin.cookie)).json();
    expect(all.users).toHaveLength(3);
    expect(all.users[0]).toEqual({
      id: expect.any(String),
      name: expect.any(String),
      email: expect.any(String),
      githubId: expect.any(String),
      role: expect.any(String),
      createdAt: expect.any(String),
    });
  });

  it('returns 400 for a query longer than 100 characters', async () => {
    const admin = await signedIn('admin', '6013');

    expect((await searchUsers(admin.cookie, 'x'.repeat(101))).status).toBe(400);
  });
});

describe('PATCH /api/admin/users/:id', () => {
  it("changes another user's role", async () => {
    const admin = await signedIn('admin', '6020');
    const member = await signedIn('member', '6021');

    const res = await changeRole(member.id, admin.cookie, { role: 'practitioner' });

    expect(res.status).toBe(200);
    expect((await res.json()).user).toMatchObject({ id: member.id, role: 'practitioner' });
    expect(await prisma.user.findUniqueOrThrow({ where: { id: member.id }, select: { role: true } })).toEqual({ role: 'practitioner' });
  });

  it('refuses to change your own role, so an admin cannot lock themselves out', async () => {
    const admin = await signedIn('admin', '6022');

    const res = await changeRole(admin.id, admin.cookie, { role: 'member' });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: expect.any(String) });
    expect(await prisma.user.findUniqueOrThrow({ where: { id: admin.id }, select: { role: true } })).toEqual({ role: 'admin' });
  });

  it('returns 404 for an unknown user and 400 for an invalid body', async () => {
    const admin = await signedIn('admin', '6023');
    const member = await signedIn('member', '6024');

    expect((await changeRole('no-such-user', admin.cookie, { role: 'admin' })).status).toBe(404);
    expect((await changeRole(member.id, admin.cookie, { role: 'owner' })).status).toBe(400);
    expect((await changeRole(member.id, admin.cookie, 'not json')).status).toBe(400);
  });
});

describe('GET and PUT /api/admin/settings', () => {
  it('reads the default daily AI limit, then the value an admin sets', async () => {
    const admin = await signedIn('admin', '6030');

    expect(await (await readSettings(admin.cookie)).json()).toEqual({ dailyAiLimit: DEFAULT_DAILY_AI_LIMIT });
    const res = await writeSettings(admin.cookie, { dailyAiLimit: 7 });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ dailyAiLimit: 7 });
    expect(await getDailyAiLimit(prisma)).toBe(7);
  });

  it('returns 400 with { error } for an invalid limit and keeps the old value', async () => {
    const admin = await signedIn('admin', '6031');
    await writeSettings(admin.cookie, { dailyAiLimit: 7 });

    const res = await writeSettings(admin.cookie, { dailyAiLimit: -3 });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: expect.stringMatching(/dailyAiLimit/) });
    expect(await getDailyAiLimit(prisma)).toBe(7);
  });
});
