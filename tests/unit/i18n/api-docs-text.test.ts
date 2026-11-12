/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The /api-docs page reads its text from the message files (#25, after #59).
 * Chinese stays word for word; English has the same keys and no Chinese. The OpenAPI
 * document itself is English already; its Chinese is real response data.
 */

import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { MESSAGES } from '@/messages';

const HAN = /[㐀-鿿豈-﫿]/;

/** Source text with block, JSX and line comments removed (URLs in strings are kept). */
function code(path: string): string {
  return readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

describe('API docs page text', () => {
  it('keeps the Chinese word for word', () => {
    expect(MESSAGES.zh.apiDocs).toEqual({
      metaTitle: 'API 文档 · 紫微命盘',
      metaDescription: 'ZiweiHub 公开 API：用出生信息生成紫微斗数命盘 JSON。',
      title: 'API 文档',
      intro: '用出生日期、时辰和性别生成紫微斗数命盘 JSON。每个请求都需要在 <code>Authorization</code> 头里带上<code> Bearer </code>API key；key 在登录后的设置页创建，只显示一次。试用时请用虚构的出生信息。',
      spec: '规范文件：<link>openapi.yaml</link>（OpenAPI 3.1）',
    });
  });

  it('has English with no Chinese', () => {
    for (const text of Object.values(MESSAGES.en.apiDocs)) {
      expect(text.trim()).toBeTruthy();
      expect(HAN.test(text), text).toBe(false);
    }
  });

  it('is not hardcoded in the page', () => {
    expect(code('app/api-docs/page.tsx').split('\n').filter((l) => HAN.test(l))).toEqual([]);
  });
});
