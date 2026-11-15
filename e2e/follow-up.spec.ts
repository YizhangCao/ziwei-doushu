/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Follow-up questions after a long reading (#105). The panel sends the earlier
 * readings back in full, never sends its own failure messages, offers no retry for a request
 * the server refused, and says the conversation is full before it goes over the limits.
 * The AI route is mocked; no request leaves the browser. Uses made-up birth data.
 */

import { test, expect, type Page } from '@playwright/test';
import { stubMemberSession } from './helpers/session';

// The AI reading panel is for members (#118); the session is stubbed, like /api/interpret.
test.beforeEach(async ({ page }) => { await stubMemberSession(page); });

interface SentBody {
  messages: { role: 'user' | 'assistant'; content: string }[];
}

const stream = (text: string) => `data: ${JSON.stringify({ delta: { text } })}\n\ndata: [DONE]\n\n`;

async function buildChart(page: Page) {
  await page.goto('/chart');
  const selects = page.locator('form select');
  await selects.nth(0).selectOption('1990');
  await selects.nth(1).selectOption('6');
  await selects.nth(2).selectOption('15');
  await page.locator('#bf-hour').selectOption('10');
  await page.getByRole('button', { name: '女' }).click();
  await page.getByRole('button', { name: '起盘', exact: true }).click();
}

async function ask(page: Page, question: string) {
  await page.getByRole('textbox', { name: '继续追问' }).fill(question);
  await page.getByRole('button', { name: '追问', exact: true }).click();
}

test('a follow-up after a long reading sends the whole reading back and gets an answer', async ({ page }) => {
  const bodies: SentBody[] = [];
  await page.route('**/api/interpret', async (route) => {
    bodies.push(route.request().postDataJSON() as SentBody);
    const text = bodies.length === 1 ? '命'.repeat(5500) : '这是用中文的回答。';
    await route.fulfill({ status: 200, contentType: 'text/event-stream', body: stream(text) });
  });

  await buildChart(page);
  await ask(page, '用中文再回答一遍');

  await expect(page.getByText('这是用中文的回答。')).toBeVisible();
  const sent = bodies[1].messages;
  expect(sent.find((m) => m.role === 'assistant')?.content).toHaveLength(5500);
  expect(sent.at(-1)).toEqual({ role: 'user', content: '用中文再回答一遍' });
});

test('a failure message stays on screen and is never sent to the model', async ({ page }) => {
  const bodies: SentBody[] = [];
  await page.route('**/api/interpret', async (route) => {
    bodies.push(route.request().postDataJSON() as SentBody);
    if (bodies.length === 1) {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"AI service request failed"}' });
    } else {
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body: stream('这次读完了。') });
    }
  });

  await buildChart(page);
  await expect(page.getByText('解读没有完成，请稍后重试。')).toBeVisible();
  await ask(page, '再说说命宫');

  await expect(page.getByText('这次读完了。')).toBeVisible();
  expect(JSON.stringify(bodies[1].messages)).not.toContain('解读没有完成');
});

test('a refused request says so, with no retry', async ({ page }) => {
  await page.route('**/api/interpret', (route) =>
    route.fulfill({ status: 400, contentType: 'application/json', body: '{"error":"Invalid request body"}' }),
  );

  await buildChart(page);

  await expect(page.getByText('这段对话无法继续。重新起盘，可以从头问起。')).toBeVisible();
  await expect(page.getByText('解读没有完成，请稍后重试。')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '重试' })).toHaveCount(0);
});

test('the panel says the conversation is full before it would go over 100,000 characters', async ({ page }) => {
  // Every reply is 20,000 characters: after the overview and four follow-ups the history
  // passes 100,000, so the next question can't be sent.
  await page.route('**/api/interpret', (route) =>
    route.fulfill({ status: 200, contentType: 'text/event-stream', body: stream('命'.repeat(20000)) }),
  );

  await buildChart(page);
  const full = page.getByText('这次的对话已经很长。重新起盘，可以从头问起。');
  for (const question of ['一', '二', '三']) {
    await ask(page, question);
    await expect(full).toHaveCount(0);
  }
  await ask(page, '四');

  await expect(full).toBeVisible();
  await expect(page.getByRole('button', { name: '追问', exact: true })).toBeDisabled();
});
