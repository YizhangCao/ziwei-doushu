/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview POST /api/interpret with a model that thinks first (#103). Only the Anthropic
 * client is mocked (AGENTS.md); the route, the request validator and the stream encoder are real.
 * The route touches no database, so these tests leave the test database alone.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/interpret/route';
import { generateChart } from '@/lib/ziwei/algorithm';

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create };
  },
}));

// Synthetic birth data, not a real person.
const post = () =>
  POST(
    new Request('http://localhost/api/interpret', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chart: generateChart({ year: 1990, month: 6, day: 15, hour: 6, gender: 'female' }),
        messages: [{ role: 'user', content: '请生成命格总览' }],
      }),
    }),
  );

/** The event shape a thinking model streams: a thinking block, then the text. */
async function* thinkingThenText() {
  yield { type: 'message_start', message: { id: 'msg_test', usage: { input_tokens: 1, output_tokens: 0 } } };
  yield { type: 'content_block_start', index: 0, content_block: { type: 'thinking', thinking: '', signature: '' } };
  yield { type: 'content_block_delta', index: 0, delta: { type: 'signature_delta', signature: 'sig' } };
  yield { type: 'content_block_stop', index: 0 };
  yield { type: 'content_block_start', index: 1, content_block: { type: 'text', text: '' } };
  yield { type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: '命格总览' } };
  yield { type: 'content_block_stop', index: 1 };
  yield { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 3 } };
  yield { type: 'message_stop' };
}

beforeEach(() => {
  create.mockReset();
  vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
  vi.stubEnv('ANTHROPIC_MODEL', 'test-model');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/interpret with a thinking model (#103)', () => {
  it('streams the text that follows the thinking block, with room and the configured effort', async () => {
    vi.stubEnv('ANTHROPIC_EFFORT', 'low');
    create.mockResolvedValue(thinkingThenText());

    const response = await post();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(await response.text()).toBe('data: {"delta":{"text":"命格总览"}}\n\ndata: [DONE]\n\n');
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0]).toMatchObject({
      model: 'test-model',
      max_tokens: 16000,
      stream: true,
      output_config: { effort: 'low' },
    });
  });

  it('sends no effort when ANTHROPIC_EFFORT is empty', async () => {
    vi.stubEnv('ANTHROPIC_EFFORT', '');
    create.mockResolvedValue(thinkingThenText());

    const response = await post();
    await response.text();

    expect(response.status).toBe(200);
    expect(create.mock.calls[0][0]).not.toHaveProperty('output_config');
  });

  it('returns 500 with { error } for an unknown effort, without calling the API', async () => {
    vi.stubEnv('ANTHROPIC_EFFORT', 'turbo');

    const response = await post();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: expect.any(String) });
    expect(create).not.toHaveBeenCalled();
  });
});
