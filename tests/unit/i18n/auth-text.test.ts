/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The login text comes from the message files (#15, after #59): the login
 * page, the account menu in the site nav, and the reading panel's "sign in first" reply.
 * Chinese stays word for word; English has the same keys and no Chinese.
 */

import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { MESSAGES } from '@/messages';

const HAN = /[\u3400-\u9fff\uf900-\ufaff]/;

/** Source text with block, JSX and line comments removed (URLs in strings are kept). */
function code(path: string): string {
  return readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const values = (o: object): string[] => Object.values(o).flatMap((v) => (typeof v === 'string' ? [v] : values(v)));

describe('login text', () => {
  it('keeps the Chinese word for word', () => {
    expect(MESSAGES.zh.auth.login).toEqual({
      metaTitle: '登录 · 紫微命盘',
      title: '登录紫微命盘',
      lead: '使用 GitHub 账号登录后，可以使用 AI 解读，命盘和对话只保存在你自己的账户里。',
      error: '登录没有成功，请重试。',
      github: '使用 GitHub 登录',
    });
    expect(MESSAGES.zh.auth.menu).toEqual({ signIn: '登录', signedIn: '已登录', settings: '设置', signOut: '退出登录' });
    expect(MESSAGES.zh.insight.errors.loginRequired).toBe('AI 解读需要登录。请点击首页右上角的「登录」，或打开 /login 使用 GitHub 账号登录。');
  });

  it('has English with no Chinese', () => {
    for (const text of [...values(MESSAGES.en.auth), MESSAGES.en.insight.errors.loginRequired]) {
      expect(text.trim()).toBeTruthy();
      expect(HAN.test(text), text).toBe(false);
    }
  });

  it('is not hardcoded in the login page, the account menu or the reading panel', () => {
    for (const file of ['app/login/page.tsx', 'components/UserMenu.tsx']) {
      expect(code(file).split('\n').filter((l) => HAN.test(l)), file).toEqual([]);
    }
    expect(code('components/InsightPanel.tsx')).not.toContain('需要登录');
  });

  it('documents the login settings in .env.example in English', () => {
    const lines = readFileSync('.env.example', 'utf8').split('\n');
    const start = lines.findIndex((l) => l.includes('#15'));
    const end = lines.findIndex((l) => l.startsWith('AUTH_GITHUB_SECRET='));
    expect(start).toBeGreaterThanOrEqual(0);
    expect(lines.slice(start, end + 1).filter((l) => HAN.test(l))).toEqual([]);
  });
});
