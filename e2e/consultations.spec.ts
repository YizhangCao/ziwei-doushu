import { test, expect } from '@playwright/test';
import {
  E2E_PRACTITIONER,
  resetConsultationUsers,
  signInAsE2eMember,
  signInAsE2ePractitioner,
} from './helpers/auth';

// #21 main flow, with two browser contexts: a member shares a saved chart with a practitioner
// by email, and both see each other's messages arrive over SSE without reloading.
// Made-up birth data only.

const CHART_NAME = 'E2E 咨询盘';

test.beforeEach(async () => {
  await resetConsultationUsers();
});

test('member shares a chart; member and practitioner see each other’s messages live', async ({ browser, baseURL }) => {
  const memberContext = await browser.newContext();
  const practitionerContext = await browser.newContext();
  await signInAsE2eMember(memberContext, baseURL!);
  await signInAsE2ePractitioner(practitionerContext, baseURL!);
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
  await member.getByRole('listitem').filter({ hasText: CHART_NAME }).getByRole('button', { name: '分享给命理师' }).click();
  await member.getByRole('button', { name: '撤销分享' }).click();
  await practitioner.goto('/consultations');
  await expect(practitioner.getByRole('link', { name: CHART_NAME })).toHaveCount(0);

  await memberContext.close();
  await practitionerContext.close();
});
