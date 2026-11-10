import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// AGENTS.md: "Database access goes through lib/db.ts. Don't create another PrismaClient."
const ROOTS = ['app', 'components', 'lib', 'prisma', 'scripts', 'tests'];
const SKIP = new Set(['node_modules', '.next', 'generated']);

function sourceFiles(dir: string): string[] {
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return []; }
  return entries.flatMap((name) => {
    if (SKIP.has(name)) return [];
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe('lib/db.ts', () => {
  it('is the only file that creates a PrismaClient', () => {
    const creators = ROOTS.flatMap(sourceFiles)
      .filter((f) => !f.endsWith('db-singleton.test.ts'))
      .filter((f) => /new\s+PrismaClient\s*\(/.test(readFileSync(f, 'utf8')))
      .map((f) => relative('.', f).replace(/\\/g, '/'));
    expect(creators).toEqual(['lib/db.ts']);
  });
});
