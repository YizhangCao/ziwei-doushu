import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('../../package.json', import.meta.url)), 'utf8')) as {
  scripts: Record<string, string>;
};

describe('package.json scripts', () => {
  // lib/generated/prisma is git-ignored, so a fresh `npm ci` has to generate it; otherwise
  // typecheck and the Vitest layers fail until someone runs `prisma generate` by hand (#40).
  it('generates the Prisma client on install', () => {
    expect(pkg.scripts.postinstall).toBe('prisma generate');
  });
});
