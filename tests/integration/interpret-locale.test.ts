/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview POST /api/interpret answers in the visitor's language (#59). The route
 * reads the locale from the NEXT_LOCALE cookie (or Accept-Language), never from the
 * body, so the AGENTS.md 2.3 contract is unchanged. Only the Anthropic client is mocked.
 * The route is members-only (#15), so each request carries a signed-in member's session.
 */

import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { encode } from 'next-auth/jwt';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { prisma } from '@/lib/db';
import { resetDatabase } from './helpers/reset';

// Fallbacks so the suite also runs without a configured environment.
process.env.AUTH_SECRET ??= 'integration-test-auth-secret-not-real';
process.env.AUTH_TRUST_HOST ??= 'true';
const SESSION_COOKIE = 'authjs.session-token';

const { created } = vi.hoisted(() => ({ created: [] as { system?: unknown }[] }));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class FakeAnthropic {
    messages = {
      create: async (params: { system?: unknown }) => {
        created.push(params);
        return (async function* () {
          yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'ok' } };
        })();
      },
    };
  },
}));

import { POST } from '@/app/api/interpret/route';
import { systemPrompt } from '@/lib/ai/interpret';
import { generateChart } from '@/lib/ziwei/algorithm';

// Synthetic birth data, not a real person.
const chart: ZiweiChart = generateChart({ year: 1990, month: 6, day: 15, hour: 6, gender: 'female' });

let session = '';

/** Posts as a signed-in member; `cookie` in `headers` is added next to the session cookie. */
async function post(body: unknown, headers: Record<string, string> = {}): Promise<Response> {
  const { cookie, ...rest } = headers;
  const res = await POST(new NextRequest('http://localhost:3000/api/interpret', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      host: 'localhost:3000',
      'x-forwarded-proto': 'http',
      cookie: [session, cookie].filter(Boolean).join('; '),
      ...rest,
    },
    body: JSON.stringify(body),
  }), { params: Promise.resolve({}) });
  if (!(res instanceof Response)) throw new Error('route returned no Response');
  return res;
}

beforeEach(async () => {
  await resetDatabase();
  const { id } = await prisma.user.create({ data: { githubId: '4001' }, select: { id: true } });
  const value = await encode({ token: { sub: id, role: 'member' }, secret: process.env.AUTH_SECRET!, salt: SESSION_COOKIE });
  session = `${SESSION_COOKIE}=${value}`;
  created.length = 0;
  vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
  vi.stubEnv('ANTHROPIC_MODEL', 'test-model');
});
afterEach(() => vi.unstubAllEnvs());
afterAll(() => prisma.$disconnect());

describe('POST /api/interpret and the visitor language', () => {
  const body = { chart, messages: [{ role: 'user', content: 'Read my chart' }] };

  it('answers in English when the saved locale is English', async () => {
    const response = await post(body, { cookie: 'NEXT_LOCALE=en', 'accept-language': 'zh-CN' });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(created[0]?.system).toBe(systemPrompt('en'));
    const text = await response.text();
    expect(text).toContain('data: {"delta":{"text":"ok"}}');
    expect(text).toContain('data: [DONE]');
  });

  it('answers in English for an English browser with no saved choice', async () => {
    await post(body, { 'accept-language': 'en-US,en;q=0.9' });
    expect(created[0]?.system).toBe(systemPrompt('en'));
  });

  it('answers in Chinese for a Chinese browser with no saved choice', async () => {
    await post(body, { 'accept-language': 'zh-CN,zh;q=0.9' });
    expect(created[0]?.system).toBe(systemPrompt('zh'));
  });

  it('keeps the 2.3 contract: a bad body is still a 400 with { error }, in any language', async () => {
    const response = await post({ chart, messages: 'not a list' }, { cookie: 'NEXT_LOCALE=en' });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: expect.any(String) });
    expect(created).toHaveLength(0);
  });
});
