/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Pre-launch states from the copy review (#63): the birth form asks
 * instead of guessing (no 08:00, no default gender, its own messages), and the reading
 * panel always says what is happening: what it is reading, why it failed, and how much
 * room a question has left. The AI route is mocked; no request leaves the browser.
 * Uses made-up birth data.
 */

import { test, expect, type Page } from '@playwright/test';
import { stubMemberSession } from './helpers/session';

// The AI reading panel is for members (#118); the session is stubbed, like /api/interpret.
test.beforeEach(async ({ page }) => { await stubMemberSession(page); });

async function fillBirth(page: Page) {
  await page.goto('/chart');
  const selects = page.locator('form select');
  await selects.nth(0).selectOption('1990');
  await selects.nth(1).selectOption('6');
  await selects.nth(2).selectOption('15');
  await page.locator('#bf-hour').selectOption('10');
  await page.getByRole('button', { name: '女' }).click();
}

test('the birth form asks for the hour and the gender instead of guessing them', async ({ page }) => {
  await page.goto('/chart');
  await expect(page.locator('#bf-hour')).toHaveValue('');
  await expect(page.getByRole('button', { name: '男' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', { name: '女' })).toHaveAttribute('aria-pressed', 'false');

  await page.getByRole('button', { name: '起盘', exact: true }).click();
  // The site's own messages, not the browser's.
  await expect(page.getByText('请选择出生年份')).toBeVisible();
  await expect(page.getByText(/请选择出生时间/)).toBeVisible();
  await expect(page.getByText('请选择性别')).toBeVisible();
});

test('the reading panel says what it is reading while it waits', async ({ page }) => {
  await page.route('**/api/interpret', () => { /* never answers: the panel stays in its loading state */ });
  await fillBirth(page);
  await page.getByRole('button', { name: '起盘', exact: true }).click();
  await expect(page.getByText('正在读命宫与三方四正…')).toBeVisible();
});

for (const { name, respond, message } of [
  { name: 'a used-up daily limit', respond: { status: 429, body: '{"error":"rate limited"}' }, message: '今天的 AI 解读次数已用完，明天可以继续。下方的基础解读不受影响。' },
  { name: 'a missing AI route', respond: { status: 404, body: 'not found' }, message: '解读暂未开放。命盘可以正常查看。' },
  { name: 'an AI that is not set up', respond: { status: 500, body: '{"error":"AI service is not configured"}' }, message: 'AI 解读暂时不可用。下方的基础解读不受影响。' },
  { name: 'a server failure', respond: { status: 500, body: '{"error":"AI service request failed"}' }, message: '解读没有完成，请稍后重试。' },
]) {
  test(`the reading panel explains ${name}`, async ({ page }) => {
    await page.route('**/api/interpret', (route) => route.fulfill({ status: respond.status, contentType: 'application/json', body: respond.body }));
    await fillBirth(page);
    await page.getByRole('button', { name: '起盘', exact: true }).click();
    await expect(page.getByText(message)).toBeVisible();
  });
}

test('the reading panel explains a dropped connection', async ({ page }) => {
  await page.route('**/api/interpret', (route) => route.abort('internetdisconnected'));
  await fillBirth(page);
  await page.getByRole('button', { name: '起盘', exact: true }).click();
  await expect(page.getByText('网络中断，解读没有完成。')).toBeVisible();
});

test('a follow-up question shows how much room is left, and stops at 2,000 characters', async ({ page }) => {
  await page.route('**/api/interpret', (route) => route.fulfill({ status: 200, contentType: 'text/event-stream', body: 'data: {"delta":{"text":"好"}}\n\ndata: [DONE]\n\n' }));
  await fillBirth(page);
  await page.getByRole('button', { name: '起盘', exact: true }).click();
  const input = page.getByRole('textbox', { name: '继续追问' });
  await input.fill('问'.repeat(1900));
  await expect(page.getByText('还可以输入 100 字')).toBeVisible();
  await input.fill('问'.repeat(2001));
  await expect(page.getByText('问题请在 2000 字以内。')).toBeVisible();
  await expect(page.getByRole('button', { name: '追问', exact: true })).toBeDisabled();
});

test('the chart and compatibility pages have their own titles', async ({ page }) => {
  await page.goto('/');
  const home = await page.title();
  await page.goto('/chart');
  await expect(page).toHaveTitle(/起盘/);
  expect(await page.title()).not.toBe(home);
  await page.goto('/heming');
  await expect(page).toHaveTitle(/合盘/);
});
