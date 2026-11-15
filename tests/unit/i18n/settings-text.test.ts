/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The settings page and its API key panel (#24) read their text from the
 * message files (after #59), and dates follow the visitor's language instead of always
 * zh-CN. Chinese stays word for word; English has the same keys and no Chinese.
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

describe('settings text', () => {
  it('keeps the Chinese word for word', () => {
    const { settings } = MESSAGES.zh;
    expect(settings.title).toBe('设置');
    expect(settings.keys.newKey).toBe('这是你的新 API key，只显示这一次。请现在复制并妥善保存，之后无法再查看。');
    expect(settings.keys.confirmText).toBe('撤销后这个 key 立即失效，无法恢复。');
    expect(settings.keys.never).toBe('从未');
    expect(settings.keys.dates).toBe('创建于 {created} · 最近使用 {lastUsed}');
  });

  it('has English with no Chinese', () => {
    for (const text of values(MESSAGES.en.settings)) {
      expect(text.trim()).toBeTruthy();
      expect(HAN.test(text), text).toBe(false);
    }
  });

  it('is not hardcoded, and dates follow the locale', () => {
    for (const file of ['app/settings/page.tsx', 'components/ApiKeysPanel.tsx']) {
      expect(code(file).split('\n').filter((l) => HAN.test(l)), file).toEqual([]);
    }
    expect(code('components/ApiKeysPanel.tsx')).not.toContain("toLocaleString('zh-CN')");
  });
});
