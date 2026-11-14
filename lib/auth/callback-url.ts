/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/** @fileoverview Open-redirect guard for the login page's `callbackUrl`. */

// Placeholder origin. It only tells a same-site path apart from anything that would
// leave the site; it never appears in the result.
const SAME_SITE = 'http://same-site.invalid';

/**
 * Returns `value` if it is a path on this site, otherwise `/`, so the login page
 * cannot be used as an open redirect.
 *
 * The value is parsed as a URL rather than prefix-matched, because browsers treat
 * `\` as `/` and drop tabs and newlines: `/\evil.com` and `/<tab>/evil.com` both act
 * like `//evil.com`.
 *
 * Parsing also resolves dot segments, so `/..//evil.com` (or `/%2e%2e//evil.com`) comes
 * back with the path `//evil.com`: same-site to the parser, but a browser reads a path
 * that starts with two slashes as another host. The resolved path is checked for that.
 */
export function safeCallbackUrl(value: string | string[] | undefined): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.includes('\\')) return '/';
  let url: URL;
  try {
    url = new URL(value, SAME_SITE);
  } catch {
    return '/';
  }
  if (url.origin !== SAME_SITE) return '/';
  const path = url.pathname + url.search + url.hash;
  return path.startsWith('//') ? '/' : path;
}
