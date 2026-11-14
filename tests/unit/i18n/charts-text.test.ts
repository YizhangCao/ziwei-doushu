/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Saved charts (#18) read their text from the message files (after #59):
 * the save panel on /chart, the /charts page and its list, and the chart page's load
 * error. Chinese stays word for word; English has the same keys and no Chinese.
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

describe('saved chart text', () => {
  it('keeps the Chinese word for word', () => {
    const { charts, chart } = MESSAGES.zh;
    expect(charts.title).toBe('我的命盘');
    expect(charts.save.signInToSave).toBe('登录后保存命盘');
    expect(charts.save.namePlaceholder).toBe('例如：妈妈');
    expect(charts.save.saved).toBe('已保存。<link>查看我的命盘</link>');
    expect(charts.list.empty).toBe('还没有保存的命盘。<link>去排一张</link>');
    expect(charts.list.confirmQuestion).toBe('确定删除这个命盘？');
    expect(chart.loadError).toBe('没有找到这个命盘，或者你需要先登录。');
  });

  it('has English with no Chinese', () => {
    for (const text of [...values(MESSAGES.en.charts), MESSAGES.en.chart.loadError]) {
      expect(text.trim()).toBeTruthy();
      expect(HAN.test(text), text).toBe(false);
    }
  });

  it('is not hardcoded in the saved chart pages and components', () => {
    for (const file of ['app/chart/page.tsx', 'app/charts/page.tsx', 'components/SaveChartPanel.tsx', 'components/SavedChartsList.tsx']) {
      expect(code(file).split('\n').filter((l) => HAN.test(l)), file).toEqual([]);
    }
  });

  it('documents the encryption key in .env.example in English', () => {
    const lines = readFileSync('.env.example', 'utf8').split('\n');
    const start = lines.findIndex((l) => l.includes('lib/crypto.ts'));
    const end = lines.findIndex((l) => l.startsWith('DATA_ENCRYPTION_KEY='));
    expect(start).toBeGreaterThanOrEqual(0);
    expect(lines.slice(start, end + 1).filter((l) => HAN.test(l))).toEqual([]);
  });
});
