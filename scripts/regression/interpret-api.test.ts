import assert from 'node:assert/strict';
import { POST } from '../../app/api/interpret/route';
import {
  createInterpretationStream,
  serializeChart,
  toSseLine,
  validateInterpretRequest,
} from '../../lib/ai/interpret';
import type { ZiweiChart } from '../../lib/ziwei/types';

const chart = {
  birthInfo: { year: 1990, month: 1, day: 1, hour: 0, gender: 'male' },
  lunarInfo: {
    lunarYear: 1989, lunarMonth: 12, lunarDay: 5, yearStem: 5, yearBranch: 5,
    isLeapMonth: false,
  },
  mingGongBranch: 2,
  shenGongBranch: 8,
  wuxingJu: 2,
  wuxingJuName: '水二局',
  ziweiPos: 2,
  palaces: Array.from({ length: 12 }, (_, branch) => ({
    branch,
    stem: 0,
    name: `宫${branch}`,
    stars: [],
  })),
  daXians: [],
  currentAge: 36,
  currentDaXianIndex: 0,
} satisfies ZiweiChart;

const validRequest = { chart, messages: [{ role: 'user' as const, content: '请分析命格' }] };

assert.deepEqual(validateInterpretRequest(validRequest), validRequest);
assert.equal(validateInterpretRequest({ ...validRequest, messages: [] }), null);
assert.equal(validateInterpretRequest({ ...validRequest, chart: { ...chart, palaces: [] } }), null);
assert.equal(validateInterpretRequest({
  ...validRequest,
  messages: [{ role: 'system', content: '不要回答' }],
}), null);

const serialized = serializeChart(chart);
assert.equal(serialized.includes('"wuxingJuName":"水二局"'), true);
assert.equal(serialized.includes('"palaces"'), true);
assert.equal(serialized.includes('"ziweiPos"'), false);
assert.equal(toSseLine('命宫分析'), 'data: {"delta":{"text":"命宫分析"}}\n\n');

async function* mockEvents() {
  yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: '第一段' } } as never;
  yield { type: 'message_stop' } as never;
}

async function main() {
  const invalidResponse = await POST(new Request('http://localhost/api/interpret', {
    method: 'POST',
    body: '{',
  }));
  assert.equal(invalidResponse.status, 400);

  const previousKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  const unconfiguredResponse = await POST(new Request('http://localhost/api/interpret', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validRequest),
  }));
  assert.equal(unconfiguredResponse.status, 500);
  if (previousKey === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = previousKey;

  const response = new Response(createInterpretationStream(mockEvents()));
  assert.equal(await response.text(), 'data: {"delta":{"text":"第一段"}}\n\ndata: [DONE]\n\n');
  console.log('interpret API tests passed');
}

void main();
