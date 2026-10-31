import assert from 'node:assert/strict';
import { createInterpretHandler } from '../../app/api/interpret/route';

const chart = {
  birthInfo: { year: 1990, month: 1, day: 1, hour: 0, gender: 'male' },
  lunarInfo: { lunarYear: 1990, lunarMonth: 1, lunarDay: 1, yearStem: 0, yearBranch: 0, isLeapMonth: false },
  mingGongBranch: 0,
  shenGongBranch: 0,
  wuxingJu: 2,
  wuxingJuName: '水二局',
  ziweiPos: 0,
  palaces: [],
  daXians: [],
  currentAge: 30,
  currentDaXianIndex: 0,
};

async function readResponse(response: Response) {
  return response.text();
}

async function main() {
  const events = [
    { type: 'message_start' },
    { type: 'content_block_delta', delta: { type: 'text_delta', text: '命盘' } },
    { type: 'content_block_delta', delta: { type: 'text_delta', text: '分析' } },
    { type: 'message_stop' },
  ];
  const calls: unknown[] = [];
  const handler = createInterpretHandler(() => ({
    messages: {
      stream: (params) => {
        calls.push(params);
        return (async function* () {
          for (const event of events) yield event;
        })();
      },
    },
  }));

  const response = await handler(new Request('http://localhost/api/interpret', {
    method: 'POST',
    body: JSON.stringify({ chart, messages: [{ role: 'user', content: '请分析命盘' }] }),
    headers: { 'Content-Type': 'application/json' },
  }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/event-stream; charset=utf-8');
  assert.equal(await readResponse(response), [
    'data: {"delta":{"text":"命盘"}}',
    '',
    'data: {"delta":{"text":"分析"}}',
    '',
    'data: [DONE]',
    '',
    '',
  ].join('\n'));
  assert.equal(calls.length, 1);

  const invalid = await handler(new Request('http://localhost/api/interpret', {
    method: 'POST',
    body: JSON.stringify({ chart, messages: [{ role: 'system', content: 'invalid' }] }),
  }));
  assert.equal(invalid.status, 400);

  const failed = createInterpretHandler(() => {
    throw new Error('missing key');
  });
  const serverError = await failed(new Request('http://localhost/api/interpret', {
    method: 'POST',
    body: JSON.stringify({ chart, messages: [{ role: 'user', content: '请分析命盘' }] }),
  }));
  assert.equal(serverError.status, 500);
  assert.deepEqual(await serverError.json(), { error: 'AI 解读服务暂时不可用' });

  console.log('interpret route tests passed');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
