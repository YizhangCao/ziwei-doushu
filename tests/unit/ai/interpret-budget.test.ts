/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The output budget of a reading (#103). Current models think before they answer,
 * and thinking counts toward max_tokens, so a 2,048-token cap could end the reading before its
 * first word. Effort is optional and comes from ANTHROPIC_EFFORT, because some older models
 * reject the parameter. No test here calls the Anthropic API.
 */

import { describe, it, expect, vi } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { createAnthropicStream, parseAnthropicEffort, type InterpretRequest } from '@/lib/ai/interpret';
import { generateChart } from '@/lib/ziwei/algorithm';

// Synthetic birth data, not a real person.
const request: InterpretRequest = {
  chart: generateChart({ year: 1990, month: 6, day: 15, hour: 6, gender: 'female' }),
  messages: [{ role: 'user', content: '请生成命格总览' }],
};

/** A client that records the request parameters instead of calling the API. */
function recordingClient() {
  const create = vi.fn().mockResolvedValue((async function* () {})());
  const client = { messages: { create } } as unknown as Pick<Anthropic, 'messages'>;
  return { client, params: () => create.mock.calls[0][0] as Record<string, unknown> };
}

describe('createAnthropicStream leaves room to answer after thinking (#103)', () => {
  it('asks for up to 16,000 output tokens, streamed', async () => {
    const { client, params } = recordingClient();
    await createAnthropicStream(client, request, 'test-model');
    expect(params().max_tokens).toBe(16000);
    expect(params().stream).toBe(true);
  });

  it('sends the configured effort as output_config.effort', async () => {
    const { client, params } = recordingClient();
    await createAnthropicStream(client, request, 'test-model', 'zh', { effort: 'low' });
    expect(params().output_config).toEqual({ effort: 'low' });
  });

  it('sends no effort when none is configured', async () => {
    const { client, params } = recordingClient();
    await createAnthropicStream(client, request, 'test-model');
    expect(params()).not.toHaveProperty('output_config');
  });
});

describe('parseAnthropicEffort reads ANTHROPIC_EFFORT (#103)', () => {
  it.each(['low', 'medium', 'high', 'xhigh', 'max'])('accepts %s', (value) => {
    expect(parseAnthropicEffort(value)).toEqual({ ok: true, effort: value });
  });

  it.each([undefined, ''])('treats %j as not set', (value) => {
    expect(parseAnthropicEffort(value)).toEqual({ ok: true, effort: undefined });
  });

  it.each(['LOW', ' low', 'turbo', 'none'])('rejects %j', (value) => {
    expect(parseAnthropicEffort(value)).toEqual({ ok: false });
  });
});
