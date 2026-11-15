/**
 * @fileoverview Retrying a reading that broke off after it started (#57 review).
 * The reply panel adds an empty reply before the first text arrives, so a stream
 * that drops midway leaves [question, partial reply, error]. Retry must cut back to
 * before the question, or the question is sent and shown twice. /api/interpret is
 * stubbed in the page, so no AI is called. Uses made-up birth data.
 */

import { test, expect, type Page } from '@playwright/test';
import { stubMemberSession } from './helpers/session';

// The AI reading panel is for members (#118); the session is stubbed, like /api/interpret.
test.beforeEach(async ({ page }) => { await stubMemberSession(page); });

const QUESTION = '今年适合换工作吗？';

type Turn = { role: string; content: string };

/** Stubs fetch('/api/interpret'): the 2nd call starts a reply and then drops; the others finish. */
async function stubInterpret(page: Page) {
  await page.addInitScript(() => {
    const encoder = new TextEncoder();
    const sse = (text: string) => `data: ${JSON.stringify({ delta: { text } })}\n\n`;
    const requests: { role: string; content: string }[][] = [];
    (window as unknown as { interpretRequests: typeof requests }).interpretRequests = requests;
    const realFetch = window.fetch.bind(window);

    window.fetch = async (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      if (!url.includes('/api/interpret')) return realFetch(input, init);
      requests.push(JSON.parse(String(init?.body)).messages);
      const call = requests.length;

      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          if (call === 2) {
            controller.enqueue(encoder.encode(sse('先说结论：')));
            setTimeout(() => controller.error(new Error('connection dropped')), 50);
            return;
          }
          const text = call === 1 ? '命盘总览。' : '适合，但最好等到下半年。';
          controller.enqueue(encoder.encode(sse(text) + 'data: [DONE]\n\n'));
          controller.close();
        },
      });
      return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
    };
  });
}

async function buildChart(page: Page) {
  await page.goto('/chart');
  const selects = page.locator('form select');
  await selects.nth(0).selectOption('1990');
  await selects.nth(1).selectOption('6');
  await selects.nth(2).selectOption('15');
  await page.locator('#bf-hour').selectOption('10');
  await page.getByRole('button', { name: '女' }).click();
  await page.getByRole('button', { name: '起盘', exact: true }).click();
  await expect(page.getByRole('region', { name: '命盘' })).toBeVisible();
}

test('retrying a reply that broke off midway sends and shows the question once', async ({ page }) => {
  await stubInterpret(page);
  await buildChart(page);
  await expect(page.getByText('命盘总览。')).toBeVisible();

  await page.getByRole('textbox', { name: '继续追问' }).fill(QUESTION);
  await page.getByRole('textbox', { name: '继续追问' }).press('Enter');
  await page.getByRole('button', { name: '重试' }).click();
  await expect(page.getByText('适合，但最好等到下半年。')).toBeVisible();

  const requests = await page.evaluate(() => (window as unknown as { interpretRequests: Turn[][] }).interpretRequests);
  expect(requests).toHaveLength(3);
  // The retry carries the history up to the question, then the question once.
  expect(requests[2].map((turn) => turn.role)).toEqual(['user', 'assistant', 'user']);
  expect(requests[2].at(-1)?.content).toBe(QUESTION);
  await expect(page.getByText(QUESTION, { exact: true })).toHaveCount(1);
});
