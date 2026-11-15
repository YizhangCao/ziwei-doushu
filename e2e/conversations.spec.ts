/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.1
 * Created: November 12, 2026 · San Francisco, California, USA
 * Last Edited: November 14, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview #22 main flow: a saved chart keeps its AI conversation. The reading that came
 * before saving is kept too, a follow-up after saving is added, and reopening the chart shows
 * them all without asking the AI again. The AI route is mocked; uses made-up birth data.
 */

import { test, expect, type Page } from '@playwright/test';
import { E2E_CONVERSATION_MEMBER, resetE2eMember, signInAsE2eMember } from './helpers/auth';

const stream = (text: string) => `data: ${JSON.stringify({ delta: { text } })}\n\ndata: [DONE]\n\n`;

const QUESTION = '事业怎么样？';
const READING = '命宫天同，这是命格总览。';
const ANSWER = '官禄天机，这是事业的回答。';

async function buildChart(page: Page) {
  await page.goto('/chart');
  const selects = page.locator('form select');
  await selects.nth(0).selectOption('1992');
  await selects.nth(1).selectOption('3');
  await selects.nth(2).selectOption('8');
  await page.locator('#bf-hour').selectOption('9');
  await page.getByRole('button', { name: '男', exact: true }).click();
  await page.getByRole('button', { name: '起盘', exact: true }).click();
}

/** Mocks the AI route and counts its calls: the overview gets READING, the question gets ANSWER. */
async function mockReadings(page: Page) {
  const calls = { count: 0 };
  await page.route('**/api/interpret', async (route) => {
    calls.count++;
    const { messages } = route.request().postDataJSON() as { messages: { content: string }[] };
    const text = messages.at(-1)?.content === QUESTION ? ANSWER : READING;
    await route.fulfill({ status: 200, contentType: 'text/event-stream', body: stream(text) });
  });
  return calls;
}

test('a guest’s chart is never read by the AI, so nothing is saved', async ({ page }) => {
  // Since #118 a guest gets the free reading and a sign-in prompt in place of the AI panel.
  const saves: string[] = [];
  page.on('request', (req) => { if (req.url().includes('/conversation')) saves.push(req.url()); });
  const calls = await mockReadings(page);

  await buildChart(page);
  await expect(page.getByText('登录后可获得 AI 个性化解读，并能继续追问。')).toBeVisible();
  expect(calls.count).toBe(0);
  expect(saves).toEqual([]);
});

test.describe('signed in', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    // Its own member: charts.spec runs alongside and expects an empty list after its delete.
    await resetE2eMember(E2E_CONVERSATION_MEMBER);
    await signInAsE2eMember(context, baseURL!, E2E_CONVERSATION_MEMBER);
  });

  test('a saved chart keeps its reading and follow-ups, and shows them again when reopened', async ({ page }) => {
    const calls = await mockReadings(page);
    // Messages the server has stored, counted from the panel's successful saves.
    const stored = { count: 0 };
    page.on('response', (res) => {
      if (res.url().includes('/conversation') && res.request().method() === 'POST' && res.status() === 204) {
        stored.count += (res.request().postDataJSON() as { messages: unknown[] }).messages.length;
      }
    });

    // Read first, then save: the reading so far is kept too.
    await buildChart(page);
    await expect(page.getByText(READING)).toBeVisible();
    await page.getByLabel('命盘名称').fill('E2E 对话盘');
    await page.getByRole('button', { name: '保存命盘' }).click();
    await expect(page.getByRole('status')).toContainText('已保存');

    // A follow-up after saving.
    await page.getByRole('textbox', { name: '继续追问' }).fill(QUESTION);
    await page.getByRole('button', { name: '追问', exact: true }).click();
    await expect(page.getByText(ANSWER)).toBeVisible();
    // Both exchanges are stored before leaving: the overview from before saving, then the follow-up.
    await expect.poll(() => stored.count).toBe(4);
    const asked = calls.count;

    // Reopen it from /charts.
    await page.goto('/charts');
    const row = page.getByRole('listitem').filter({ hasText: 'E2E 对话盘' });
    const restored = page.waitForResponse((res) => res.url().includes('/conversation') && res.request().method() === 'GET');
    await row.getByRole('link', { name: 'E2E 对话盘' }).click();
    await expect(page).toHaveURL(/\/chart\?id=/);
    expect((await restored).status()).toBe(200);

    await expect(page.getByText(READING)).toBeVisible();
    await expect(page.getByText(QUESTION)).toBeVisible();
    await expect(page.getByText(ANSWER)).toBeVisible();
    // The overview prompt stays hidden, and the AI was not asked again.
    await expect(page.getByText(/请生成命格总览/)).toHaveCount(0);
    await page.waitForTimeout(300); // time for a stray overview request to show up, if one were sent
    expect(calls.count).toBe(asked);
  });
});
