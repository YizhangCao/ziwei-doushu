/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Unit tests for `safeCallbackUrl`, the login page's open-redirect
 * guard: only same-site paths survive, everything else falls back to `/`.
 */

import { describe, it, expect } from 'vitest';
import { safeCallbackUrl } from '@/lib/auth/callback-url';

describe('safeCallbackUrl(value)', () => {
  it.each([
    ['/charts', '/charts'],
    ['/charts?tab=notes#top', '/charts?tab=notes#top'],
    ['/', '/'],
  ])('keeps the same-site path %s', (value, expected) => {
    expect(safeCallbackUrl(value)).toBe(expected);
  });

  it.each([
    ['//evil.com', 'a protocol-relative URL'],
    ['/\\evil.com', 'a backslash, which browsers read as a slash'],
    ['/\\/evil.com', 'a backslash before a second slash'],
    ['/\t/evil.com', 'a tab, which URL parsing strips'],
    ['https://evil.com', 'an absolute URL'],
    ['javascript:alert(1)', 'a script URL'],
    ['charts', 'a relative path'],
    ['', 'an empty string'],
  ])('rejects %s (%s)', (value) => {
    expect(safeCallbackUrl(value)).toBe('/');
  });

  it('rejects a missing or repeated parameter', () => {
    expect(safeCallbackUrl(undefined)).toBe('/');
    expect(safeCallbackUrl(['/charts', '/admin'])).toBe('/');
  });
});
