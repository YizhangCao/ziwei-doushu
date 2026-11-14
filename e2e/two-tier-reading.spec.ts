/**
 * @fileoverview Two-tier reading (#118). Everyone who builds a chart gets the free
 * rule-based reading; signed-in members get the AI reading on top of it. When the AI
 * isn't available, the free reading stays and the AI area says why in plain words.
 *
 * The session and /api/interpret are stubbed with page.route, so no database and no
 * AI is involved: 500s stand in for a missing key and for an Anthropic outage, 429s for
 * the daily limit and for AI readings paused by an admin.
 * Uses made-up birth data.
 */

import { test, expect, type Page } from '@playwright/test';
import { stubMemberSession } from './helpers/session';

const FREE_TITLE = '基础解读（依星曜规则生成）';
const HAN = /[\u3400-\u9fff\uf900-\ufaff]/;
const AI_TITLE = 'AI 个性化解读';

/** Answers every /api/interpret call with the given status and body, and records how many were made. */
async function stubInterpret(page: Page, status: number, headers: Record<string, string> = {}, json: object = { error: 'stubbed' }) {
  const calls = { count: 0 };
  await page.route('**/api/interpret', (route) => {
    calls.count += 1;
    return route.fulfill({ status, headers, json });
  });
  return calls;
}

async function buildChart(page: Page) {
  await page.goto('/chart');
  await page.getByLabel('出生日期（公历）', { exact: true }).selectOption('1990');
  await page.getByLabel('出生月份', { exact: true }).selectOption('6');
  await page.getByLabel('出生日期', { exact: true }).selectOption('15');
  await page.getByLabel('出生时间（北京时间）', { exact: true }).selectOption('10');
  await page.getByRole('button', { name: '女' }).click();
  await page.getByRole('button', { name: '起盘', exact: true }).click();
  await expect(page.getByRole('region', { name: '命盘' })).toBeVisible();
}

/** The free reading: its own labelled region, with the life palace and all 12 palaces. */
async function expectFreeReading(page: Page) {
  const free = page.getByRole('region', { name: FREE_TITLE });
  await expect(free).toBeVisible();
  await expect(free.getByRole('heading', { level: 3 })).toHaveCount(12);
  await expect(free.getByRole('heading', { name: '命宫', exact: true })).toBeVisible();
}

test('signed out: the free reading shows, with a prompt to sign in for the AI reading', async ({ page }) => {
  const calls = await stubInterpret(page, 200);
  await buildChart(page);

  await expectFreeReading(page);
  const ai = page.getByRole('region', { name: AI_TITLE });
  await expect(ai.getByText('登录后可获得 AI 个性化解读，并能继续追问。')).toBeVisible();
  await expect(ai.getByRole('link', { name: '登录' })).toHaveAttribute('href', /\/login/);
  // A guest's chart never goes to the AI.
  expect(calls.count).toBe(0);
});

test('signed in, AI not set up: the free reading stays and the AI area says so, with no retry', async ({ page }) => {
  await stubMemberSession(page);
  const calls = await stubInterpret(page, 500, {}, { error: 'AI service is not configured' });
  await buildChart(page);

  const ai = page.getByRole('region', { name: AI_TITLE });
  await expect(ai.getByText('AI 解读暂时不可用。下方的基础解读不受影响。')).toBeVisible();
  await expect(ai.getByRole('button', { name: '重试' })).toHaveCount(0);
  await expectFreeReading(page);
  expect(calls.count).toBe(1);
});

test('signed in, AI request failing: the free reading stays and the AI area offers a retry', async ({ page }) => {
  // An Anthropic outage or a database timeout also answers 500, and those can pass.
  await stubMemberSession(page);
  await stubInterpret(page, 500, {}, { error: 'AI service request failed' });
  await buildChart(page);

  const ai = page.getByRole('region', { name: AI_TITLE });
  await expect(ai.getByText('解读没有完成，请稍后重试。')).toBeVisible();
  await expect(ai.getByRole('button', { name: '重试' })).toBeVisible();
  await expectFreeReading(page);
});

// The body names the limit. In the last hour of the UTC day the daily limit's Retry-After is
// under an hour, so the wait alone can't tell it from the hourly limit.
for (const { retryAfter, hours } of [{ retryAfter: 2400, hours: 1 }, { retryAfter: 5 * 3600, hours: 5 }]) {
  test(`signed in, daily limit used up with ${retryAfter} s left: a "daily limit reached" message while the free reading stays`, async ({ page }) => {
    await stubMemberSession(page);
    await stubInterpret(page, 429, { 'Retry-After': String(retryAfter) }, { error: 'Too many AI requests. Try again later.', reason: 'daily' });
    await buildChart(page);

    const ai = page.getByRole('region', { name: AI_TITLE });
    await expect(ai.getByText(`今天的 AI 解读次数已用完，约 ${hours} 小时后可以继续。下方的基础解读不受影响。`)).toBeVisible();
    await expect(ai.getByRole('button', { name: '重试' })).toHaveCount(0);
    await expectFreeReading(page);
  });
}

test('signed in, AI readings paused (a daily limit of 0): the AI area says so, with no wait', async ({ page }) => {
  await stubMemberSession(page);
  await stubInterpret(page, 429, { 'Retry-After': '2400' }, { error: 'Too many AI requests. Try again later.', reason: 'paused' });
  await buildChart(page);

  const ai = page.getByRole('region', { name: AI_TITLE });
  await expect(ai.getByText('AI 解读目前已暂停。下方的基础解读不受影响。')).toBeVisible();
  await expect(ai.getByRole('button', { name: '重试' })).toHaveCount(0);
  await expectFreeReading(page);
});

test.describe('in English', () => {
  test.use({ locale: 'en-US' });

  test('both tiers carry their English labels', async ({ page }) => {
    await stubInterpret(page, 200);
    await page.goto('/chart');
    await page.getByLabel('Date of birth (Gregorian calendar)', { exact: true }).selectOption('1990');
    await page.getByLabel('Month of birth', { exact: true }).selectOption('6');
    await page.getByLabel('Day of birth', { exact: true }).selectOption('15');
    await page.getByLabel('Time of birth (Beijing time)', { exact: true }).selectOption('10');
    await page.getByRole('button', { name: 'Female' }).click();
    await page.getByRole('button', { name: 'Build chart', exact: true }).click();

    const free = page.getByRole('region', { name: 'Basic reading (rule-based)' });
    await expect(free).toBeVisible();
    await expect(page.getByRole('region', { name: 'Personalized AI reading' })).toBeVisible();
    // Star keywords are in English too, so no Chinese is left (#118).
    await expect(free.getByRole('heading', { level: 3 })).toHaveCount(12);
    await expect(free).not.toContainText(HAN);
  });
});
