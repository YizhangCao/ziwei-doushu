/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Admin area (#23) in the browser: a member gets 403 on /admin, and an
 * admin changes a user's role and the daily AI limit. Signs in by setting a session
 * cookie for the seeded demo accounts (prisma/seed.ts), so no GitHub login runs.
 */

import { test, expect, type BrowserContext } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import { Client } from 'pg';

const SESSION_COOKIE = 'authjs.session-token';

// Plain pg, not lib/db: Playwright loads specs as CommonJS, and the generated Prisma
// client is an ES module.
const db = new Client({ connectionString: process.env.DATABASE_URL });

/** Returns one column of the first row of a query. */
async function one<T>(sql: string, params: unknown[]): Promise<T> {
  const { rows } = await db.query(sql, params);
  return Object.values(rows[0] as Record<string, T>)[0];
}

/** Signs the browser in as the seeded user with `email`. */
async function signInAs(context: BrowserContext, email: string): Promise<void> {
  const id = await one<string>('SELECT id FROM "User" WHERE email = $1', [email]);
  // Only `sub`: the jwt callback reads the role from the database on the first request.
  const value = await encode({ token: { sub: id }, secret: process.env.AUTH_SECRET!, salt: SESSION_COOKIE });
  await context.addCookies([{ name: SESSION_COOKIE, value, domain: 'localhost', path: '/' }]);
}

test.beforeAll(() => db.connect());

test.afterAll(async () => {
  // Put the seeded data back, so the spec can run again on the same database.
  await db.query(`UPDATE "User" SET role = 'member' WHERE email = 'member@ziweihub.test'`);
  await db.query(`DELETE FROM "Setting" WHERE key = 'dailyAiLimit'`);
  await db.end();
});

test('a member gets 403 on /admin', async ({ page, context }) => {
  await signInAs(context, 'member@ziweihub.test');

  const response = await page.goto('/admin');

  expect(response?.status()).toBe(403);
  await expect(page.getByRole('heading', { name: '无权访问' })).toBeVisible();
});

test('an admin changes a role and the daily AI limit', async ({ page, context }) => {
  await signInAs(context, 'admin@ziweihub.test');
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: '管理后台' })).toBeVisible();

  await page.getByLabel('搜索用户').fill('Demo Member');
  await page.getByRole('button', { name: '搜索' }).click();
  await page.getByLabel('Demo Member 的角色', { exact: true }).selectOption('practitioner');
  await page.getByRole('button', { name: '保存 Demo Member 的角色' }).click();
  await expect(page.getByRole('status').filter({ hasText: '已将 Demo Member 设为执业者' })).toBeVisible();
  await expect
    .poll(() => one<string>('SELECT role FROM "User" WHERE email = $1', ['member@ziweihub.test']))
    .toBe('practitioner');

  await page.getByLabel('每位用户每天最多 AI 解读次数').fill('5');
  await page.getByRole('button', { name: '保存上限' }).click();
  await expect(page.getByRole('status').filter({ hasText: '每日上限已设为 5 次' })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('每位用户每天最多 AI 解读次数')).toHaveValue('5');
});
