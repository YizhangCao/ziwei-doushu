/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 13, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The product has one English name, the site's own: Ziwei Natal Chart (#120).
 * The old working name must not come back in the site, the public docs, or the code that
 * names the product. The Chinese name doesn't change.
 *
 * Two things are left as they are on purpose: the made-up `@<old name>.test` email addresses
 * in seeds and E2E fixtures, which nobody sees, and the AGENTS.md changelog line (v3) that
 * records the original name.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { MESSAGES } from '@/messages';

const OLD_NAME = /ziwei\s*hub/i;
const NEW_NAME = 'Ziwei Natal Chart';

const ROOT_FILES = ['README.md', 'README.zh-CN.md', 'AGENTS.md', 'prisma/schema.prisma', 'prisma/seed.ts'];
const DIRS = ['app', 'components', 'lib', 'messages', 'docs', '.github', 'e2e', 'tests'];
const TEXT = /\.(ts|tsx|md|json|ya?ml|css)$/;
const THIS_FILE = join('tests', 'unit', 'product-name.test.ts');

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'node_modules' ? [] : filesUnder(path);
    return TEXT.test(name) ? [path] : [];
  });
}

/** Lines that still use the old name, other than the two kept on purpose. */
function oldNameLines(path: string): string[] {
  return readFileSync(path, 'utf8')
    .split('\n')
    .map((line, i) => ({ line: line.replace(/[\w.+-]*@ziweihub\.test/gi, ''), n: i + 1 }))
    .filter(({ line }) => OLD_NAME.test(line))
    .filter(({ line }) => !(path === 'AGENTS.md' && line.startsWith('- v3 (11/01/2026)')))
    .map(({ line, n }) => `${path}:${n}: ${line.trim().slice(0, 100)}`);
}

describe('the product name (#120)', () => {
  it('never uses the old working name in the site, the public docs, or the code', () => {
    const files = [...ROOT_FILES, ...DIRS.flatMap(filesUnder)].filter((f) => f !== THIS_FILE);
    expect(files.length).toBeGreaterThan(100);
    expect(files.flatMap(oldNameLines)).toEqual([]);
  });

  it('heads both READMEs with the English name, and the Chinese README keeps its Chinese name', () => {
    expect(readFileSync('README.md', 'utf8')).toMatch(new RegExp(`^<div align="center">\\n\\n# ${NEW_NAME}\\n`));
    expect(readFileSync('README.zh-CN.md', 'utf8')).toContain(`# 紫微命盘 · ${NEW_NAME}\n`);
  });

  it('names the public API after the site, in the spec and on the API docs page', () => {
    expect(readFileSync('docs/openapi.yaml', 'utf8')).toContain(`title: ${NEW_NAME} public API`);
    expect(MESSAGES.en.apiDocs.metaDescription).toContain(`The ${NEW_NAME} public API`);
    // The Chinese page uses the Chinese name, as the rest of the Chinese site does.
    expect(MESSAGES.zh.apiDocs.metaDescription).toContain('紫微命盘公开 API');
  });
});
