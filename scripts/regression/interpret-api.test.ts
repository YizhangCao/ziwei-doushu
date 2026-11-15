import type { RawMessageStreamEvent } from '@anthropic-ai/sdk/resources/messages';
import { serializeChartForInterpretation } from '../../lib/ai/chart-context';
import { encodeInterpretationStream, validateInterpretRequest } from '../../lib/ai/interpret';
import type { ZiweiChart } from '../../lib/ziwei/types';

let failures = 0;
const ok = (condition: boolean, name: string) => {
  if (condition) console.log(`  ✓ ${name}`);
  else {
    failures++;
    console.error(`  ✗ ${name}`);
  }
};

const chart = {
  birthInfo: { year: 1990, month: 1, day: 1, hour: 0, gender: 'male' },
  lunarInfo: { lunarYear: 1990, lunarMonth: 1, lunarDay: 1, yearStem: 0, yearBranch: 6, isLeapMonth: false },
  wuxingJuName: '水二局',
  mingZhu: '贪狼',
  shenZhu: '火星',
  currentAge: 36,
  palaces: Array.from({ length: 12 }, (_, branch) => ({
    branch,
    // Real engine palace names: the request validator only accepts names the engine produces (#4).
    name: ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母'][branch],
    stars: [{ name: '紫微', type: 'major' as const, brightnessRaw: '庙' as const }],
  })),
  daXians: [],
} as unknown as ZiweiChart;

const valid = validateInterpretRequest({ chart, messages: [{ role: 'user', content: '请解读命盘' }] });
ok(valid !== null, 'accepts a valid chart and message list');
ok(validateInterpretRequest({ chart: { palaces: [] }, messages: [] }) === null, 'rejects charts without 12 palaces');
ok(validateInterpretRequest({ chart, messages: Array.from({ length: 31 }, () => ({ role: 'user', content: 'x' })) }) === null, 'rejects more than 30 messages');
ok(validateInterpretRequest({ chart, messages: [{ role: 'user', content: 'x'.repeat(2001) }] }) === null, 'rejects messages over 2,000 characters');
ok(validateInterpretRequest({ chart, messages: [{ role: 'system', content: 'x' }] }) === null, 'rejects unsupported message roles');

const serialized = serializeChartForInterpretation(chart);
ok(!serialized.includes('birthInfo') && !serialized.includes('lunarInfo'), 'does not serialize birth or lunar information');
ok(serialized.includes('wuxingJuName') && serialized.includes('palaces'), 'serializes reading fields');

const events: RawMessageStreamEvent[] = [
  { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: '你好' } },
  { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 1 } },
];
(async () => {
  const stream = encodeInterpretationStream((async function* () {
    yield* events;
  })());
  const responseText = await new Response(stream).text();
  ok(responseText.includes('data: {"delta":{"text":"你好"}}'), 'encodes text deltas in the frontend SSE format');
  ok(responseText.endsWith('data: [DONE]\n\n'), 'terminates the SSE stream with [DONE]');

  if (failures) process.exit(1);
})();
