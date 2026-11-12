/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview POST /api/interpret answers in the visitor's language (#59). The route
 * reads the locale from the NEXT_LOCALE cookie (or Accept-Language), never from the
 * body, so the AGENTS.md 2.3 contract is unchanged. Only the Anthropic client is mocked.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ZiweiChart } from '@/lib/ziwei/types';

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

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(new Request('http://localhost/api/interpret', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  }));
}

beforeEach(() => {
  created.length = 0;
  vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
  vi.stubEnv('ANTHROPIC_MODEL', 'test-model');
});
afterEach(() => vi.unstubAllEnvs());

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
