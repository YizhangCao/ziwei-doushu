/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The admin area and the 403 page read their text from the message files
 * (#23, after #59). Chinese stays word for word; English has the same keys and no Chinese.
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

describe('admin and 403 text', () => {
  it('keeps the Chinese word for word', () => {
    const { admin, forbidden } = MESSAGES.zh;
    expect(admin.title).toBe('管理后台');
    expect(admin.roles).toEqual({ member: '会员', practitioner: '执业者', admin: '管理员' });
    expect(admin.users.found).toBe('找到 {count} 位用户');
    expect(admin.users.saved).toBe('已将 {name} 设为{role}');
    expect(admin.limit.note).toBe('按 UTC 自然日计算；设为 0 会暂停所有 AI 解读。另有每人、每个 IP 每小时 20 次的限制。');
    expect(admin.limit.saved).toBe('每日上限已设为 {limit} 次');
    expect(forbidden).toEqual({
      metaTitle: '无权访问 · 紫微命盘',
      title: '无权访问',
      body: '这个页面只对管理员开放。如果你需要权限，请联系管理员。',
      home: '返回首页',
    });
  });

  it('has English with no Chinese', () => {
    for (const text of [...values(MESSAGES.en.admin), ...values(MESSAGES.en.forbidden)]) {
      expect(text.trim()).toBeTruthy();
      expect(HAN.test(text), text).toBe(false);
    }
  });

  it('is not hardcoded in the admin pages', () => {
    for (const file of ['components/AdminPanel.tsx', 'app/forbidden/page.tsx', 'app/(app)/admin/page.tsx']) {
      expect(code(file).split('\n').filter((l) => HAN.test(l)), file).toEqual([]);
    }
  });
});
