/**
 * @fileoverview Two-tier reading (#118). Everyone who builds a chart gets the free
 * rule-based reading; signed-in members get the AI reading on top of it. When the AI
 * isn't available, the free reading stays and the AI area says why in plain words.
 *
 * The session and /api/interpret are stubbed with page.route, so no database and no
 * AI is involved: a 500 stands in for CI's missing key, a 429 for the daily limit.
 * Uses made-up birth data.
 */

import { test, expect, type Page } from '@playwright/test';
import { stubMemberSession } from './helpers/session';

const FREE_TITLE = '基础解读（依星曜规则生成）';
const AI_TITLE = 'AI 个性化解读';

/** Answers every /api/interpret call with the given status and records how many were made. */
async function stubInterpret(page: Page, status: number, headers: Record<string, string> = {}) {
  const calls = { count: 0 };
  await page.route('**/api/interpret', (route) => {
    calls.count += 1;
    return route.fulfill({ status, headers, json: { error: 'stubbed' } });
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

test('signed in, AI failing: the free reading stays and the AI area says so, with no retry', async ({ page }) => {
  await stubMemberSession(page);
  const calls = await stubInterpret(page, 500);
  await buildChart(page);

  const ai = page.getByRole('region', { name: AI_TITLE });
  await expect(ai.getByText('AI 解读暂时不可用。下方的基础解读不受影响。')).toBeVisible();
  await expect(ai.getByRole('button', { name: '重试' })).toHaveCount(0);
  await expectFreeReading(page);
  expect(calls.count).toBe(1);
});

test('signed in, daily limit used up: a "daily limit reached" message while the free reading stays', async ({ page }) => {
  await stubMemberSession(page);
  // The daily window resets at 00:00 UTC, so its Retry-After runs past the hourly limit's hour.
  await stubInterpret(page, 429, { 'Retry-After': String(5 * 3600) });
  await buildChart(page);

  const ai = page.getByRole('region', { name: AI_TITLE });
  await expect(ai.getByText(/今天的 AI 解读次数已用完/)).toBeVisible();
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

    await expect(page.getByRole('region', { name: 'Basic reading (rule-based)' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Personalized AI reading' })).toBeVisible();
  });
});
