import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { E2E_CONSULT_MEMBER, E2E_PRACTITIONER, resetConsultationUsers, signInAs } from './helpers/auth';

// #21 main flow, with two browser contexts: a member shares a saved chart with a practitioner
// by email, and both see each other's messages arrive over SSE without reloading.
// Made-up birth data only.

const CHART_NAME = 'E2E 咨询盘';

test.beforeEach(async () => {
  await resetConsultationUsers();
});

test('member shares a chart; member and practitioner see each other’s messages live', async ({ browser, baseURL }) => {
  // Two browsers, two pages each and two live updates: more than the default 30 s on a cold dev server.
  test.setTimeout(90_000);
  const memberContext = await browser.newContext();
  const practitionerContext = await browser.newContext();
  await signInAs(memberContext, baseURL!, E2E_CONSULT_MEMBER, 'member');
  await signInAs(practitionerContext, baseURL!, E2E_PRACTITIONER, 'practitioner');
  const member = await memberContext.newPage();
  const practitioner = await practitionerContext.newPage();

  // The member saves a chart (through the API the Save button uses) and shares it on /charts.
  const saved = await member.request.post('/api/charts', {
    data: { name: CHART_NAME, birthInfo: { year: 1992, month: 3, day: 8, hour: 5, gender: 'male' } },
  });
  expect(saved.status()).toBe(201);

  await member.goto('/charts');
  const row = member.getByRole('listitem').filter({ hasText: CHART_NAME });
  await row.getByRole('button', { name: '分享给命理师' }).click();
  await row.getByLabel('命理师邮箱').fill(E2E_PRACTITIONER.email);
  await row.getByRole('button', { name: '分享', exact: true }).click();
  await expect(row.getByRole('status')).toContainText('已分享');
  await row.getByRole('link', { name: '打开对话' }).click();
  await expect(member.getByRole('heading', { name: CHART_NAME })).toBeVisible();

  // The practitioner finds it on /consultations and opens the same thread.
  await practitioner.goto('/consultations');
  await practitioner.getByRole('link', { name: CHART_NAME }).click();
  await expect(practitioner.getByRole('heading', { name: CHART_NAME })).toBeVisible();

  // Member → practitioner, live.
  await member.getByLabel('消息').fill('你好，请帮我看看命宫');
  await member.getByRole('button', { name: '发送' }).click();
  await expect(practitioner.getByRole('log')).toContainText('你好，请帮我看看命宫', { timeout: 15_000 });

  // Practitioner → member, live.
  await practitioner.getByLabel('消息').fill('收到，我先看三方四正');
  await practitioner.getByRole('button', { name: '发送' }).click();
  await expect(member.getByRole('log')).toContainText('收到，我先看三方四正', { timeout: 15_000 });

  // Each message shows once on each side, even though polls overlap.
  await expect(member.getByRole('log').getByText('你好，请帮我看看命宫')).toHaveCount(1);
  await expect(practitioner.getByRole('log').getByText('收到，我先看三方四正')).toHaveCount(1);

  // After the member revokes the share, the practitioner's list is empty again.
  await member.goto('/charts');
  const sharedRow = member.getByRole('listitem').filter({ hasText: CHART_NAME });
  await sharedRow.getByRole('button', { name: '分享给命理师' }).click();
  await sharedRow.getByRole('button', { name: '撤销分享' }).click();
  await expect(sharedRow.getByRole('status')).toContainText('已撤销分享');
  await practitioner.goto('/consultations');
  await expect(practitioner.getByRole('link', { name: CHART_NAME })).toHaveCount(0);

  await memberContext.close();
  await practitionerContext.close();
});

// ─── The live stream (#21 review) ───
// #21 review: how the thread page manages its live stream. A hidden tab closes it and a
// visible tab reopens it from the newest message; a closed thread opens none; when the stream
// ends, the page checks the thread and either shows the closed note or reconnects.
// EventSource is wrapped in the page so the spec can see each stream open and close.
// Made-up birth data only.

const LIVE_CHART_NAME = 'E2E 实时盘';
const CLOSED_NOTE = '这个咨询已关闭，不能再发消息。';

type StreamRecord = { url: string; closed: boolean };

/** Records every EventSource the page opens, and whether it was closed. */
async function recordStreams(page: Page) {
  await page.addInitScript(() => {
    const records: { url: string; closed: boolean }[] = [];
    (window as unknown as { streams: typeof records }).streams = records;
    const Native = window.EventSource;
    class Recorded extends Native {
      constructor(url: string | URL, init?: EventSourceInit) {
        super(url, init);
        const record = { url: String(url), closed: false };
        records.push(record);
        const close = this.close.bind(this);
        this.close = () => { record.closed = true; close(); };
      }
    }
    window.EventSource = Recorded as typeof EventSource;
  });
}

const streams = (page: Page) =>
  page.evaluate(() => (window as unknown as { streams: StreamRecord[] }).streams);

async function setVisibility(page: Page, state: 'hidden' | 'visible') {
  await page.evaluate((value) => {
    Object.defineProperty(document, 'visibilityState', { value, configurable: true });
    Object.defineProperty(document, 'hidden', { value: value === 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);
}

/** Saves a chart as the member and shares it with the practitioner; returns the share id. */
async function shareChart(member: Page): Promise<string> {
  const saved = await member.request.post('/api/charts', {
    data: { name: LIVE_CHART_NAME, birthInfo: { year: 1992, month: 3, day: 8, hour: 5, gender: 'male' } },
  });
  expect(saved.status()).toBe(201);
  const { chart } = (await saved.json()) as { chart: { id: string } };
  const shared = await member.request.post(`/api/charts/${chart.id}/shares`, { data: { email: E2E_PRACTITIONER.email } });
  expect(shared.status()).toBe(201);
  return ((await shared.json()) as { share: { id: string } }).share.id;
}

async function postMessage(page: Page, shareId: string, body: string): Promise<string> {
  const res = await page.request.post(`/api/shares/${shareId}/messages`, { data: { body } });
  expect(res.status()).toBe(201);
  return ((await res.json()) as { message: { id: string } }).message.id;
}

let contexts: BrowserContext[] = [];

test.afterEach(async () => {
  await Promise.all(contexts.map((c) => c.close()));
  contexts = [];
});

async function signedIn(browser: import('@playwright/test').Browser, baseURL: string, who: 'member' | 'practitioner') {
  const context = await browser.newContext();
  contexts.push(context);
  if (who === 'member') await signInAs(context, baseURL, E2E_CONSULT_MEMBER, 'member');
  else await signInAs(context, baseURL, E2E_PRACTITIONER, 'practitioner');
  const page = await context.newPage();
  await recordStreams(page);
  return page;
}

test('a hidden tab closes the stream; a visible tab reopens it from the newest message', async ({ browser, baseURL }) => {
  test.setTimeout(60_000);
  const member = await signedIn(browser, baseURL!, 'member');
  const shareId = await shareChart(member);
  const newest = await postMessage(member, shareId, '第一条消息');

  await member.goto(`/consultations/${shareId}`);
  await expect(member.getByRole('log')).toContainText('第一条消息');
  await expect.poll(async () => (await streams(member)).filter((s) => !s.closed).length).toBe(1);

  await setVisibility(member, 'hidden');
  await expect.poll(async () => (await streams(member)).every((s) => s.closed)).toBe(true);

  await setVisibility(member, 'visible');
  await expect.poll(async () => (await streams(member)).filter((s) => !s.closed).map((s) => s.url))
    .toEqual([expect.stringContaining(`cursor=${newest}`)]);
});

test('a closed thread shows its messages once and opens no stream', async ({ browser, baseURL }) => {
  const member = await signedIn(browser, baseURL!, 'member');
  const shareId = await shareChart(member);
  await postMessage(member, shareId, '撤销前的消息');
  expect((await member.request.delete(`/api/shares/${shareId}`)).ok()).toBe(true);

  await member.goto(`/consultations/${shareId}`);
  await expect(member.getByRole('log')).toContainText('撤销前的消息');
  await expect(member.getByText(CLOSED_NOTE)).toBeVisible();
  // Give a stream time to open if the page were going to open one.
  await member.waitForTimeout(1_000);
  expect(await streams(member)).toEqual([]);
});

test('when a revoke ends the stream, the practitioner sees the closed note and no form', async ({ browser, baseURL }) => {
  test.setTimeout(60_000);
  const member = await signedIn(browser, baseURL!, 'member');
  const practitioner = await signedIn(browser, baseURL!, 'practitioner');
  const shareId = await shareChart(member);

  await practitioner.goto(`/consultations/${shareId}`);
  await expect(practitioner.getByLabel('消息')).toBeVisible();
  expect((await member.request.delete(`/api/shares/${shareId}`)).ok()).toBe(true);

  await expect(practitioner.getByText(CLOSED_NOTE)).toBeVisible({ timeout: 15_000 });
  await expect(practitioner.getByLabel('消息')).toHaveCount(0);
});

test('a send after a revoke (404) shows the closed note instead of "send failed"', async ({ browser, baseURL }) => {
  const member = await signedIn(browser, baseURL!, 'member');
  const practitioner = await signedIn(browser, baseURL!, 'practitioner');
  const shareId = await shareChart(member);
  // Keep the stream quiet, so the send is what finds out about the revoke.
  await practitioner.route('**/stream**', (route) =>
    route.fulfill({ status: 200, headers: { 'Content-Type': 'text/event-stream' }, body: 'retry: 600000\n\n' }),
  );

  await practitioner.goto(`/consultations/${shareId}`);
  expect((await member.request.delete(`/api/shares/${shareId}`)).ok()).toBe(true);
  await practitioner.getByLabel('消息').fill('还在吗？');
  await practitioner.getByRole('button', { name: '发送' }).click();

  await expect(practitioner.getByText(CLOSED_NOTE)).toBeVisible();
  await expect(practitioner.getByText('发送失败，请稍后重试。')).toHaveCount(0);
  await expect(practitioner.getByLabel('消息')).toHaveCount(0);
});

test('a stream-error on an open thread reconnects and keeps live updates', async ({ browser, baseURL }) => {
  test.setTimeout(60_000);
  const member = await signedIn(browser, baseURL!, 'member');
  const shareId = await shareChart(member);
  // The first stream fails at once, like a poll that hit a database timeout.
  let failed = false;
  await member.route('**/stream**', (route) => {
    if (failed) return route.continue();
    failed = true;
    return route.fulfill({ status: 200, headers: { 'Content-Type': 'text/event-stream' }, body: 'event: stream-error\ndata: {}\n\n' });
  });

  await member.goto(`/consultations/${shareId}`);
  await expect.poll(async () => (await streams(member)).length, { timeout: 15_000 }).toBeGreaterThanOrEqual(2);
  await postMessage(member, shareId, '重连后的消息');
  await expect(member.getByRole('log')).toContainText('重连后的消息', { timeout: 15_000 });
  await expect(member.getByText('暂时收不到新消息，请刷新页面。')).toHaveCount(0);
});

test('the thread is a list of messages inside a live log', async ({ browser, baseURL }) => {
  const member = await signedIn(browser, baseURL!, 'member');
  const shareId = await shareChart(member);
  await postMessage(member, shareId, '列表里的第一条');
  await postMessage(member, shareId, '列表里的第二条');

  await member.goto(`/consultations/${shareId}`);
  // The log announces new messages; the list inside keeps each message a list item.
  const log = member.getByRole('log');
  await expect(log).toHaveAttribute('aria-live', 'polite');
  await expect(log.getByRole('list').getByRole('listitem')).toHaveCount(2);
});

test('when the share list fails to load, the panel says so instead of "couldn’t share"', async ({ browser, baseURL }) => {
  const member = await signedIn(browser, baseURL!, 'member');
  await shareChart(member);
  await member.route('**/api/charts/*/shares', (route) =>
    route.request().method() === 'GET' ? route.fulfill({ status: 500, json: { error: 'stubbed' } }) : route.continue(),
  );

  await member.goto('/charts');
  const row = member.getByRole('listitem').filter({ hasText: LIVE_CHART_NAME });
  await row.getByRole('button', { name: '分享给命理师' }).click();
  await expect(row.getByRole('status')).toHaveText('没能加载分享列表，请刷新页面重试。');
  await expect(row.getByText('分享失败，请稍后重试。')).toHaveCount(0);
  await expect(row.getByText('加载中…')).toHaveCount(0);
});
