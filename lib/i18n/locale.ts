/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Which language a request gets (#59). Pure functions, shared by the
 * next-intl request config and by API routes that read the plain Request.
 *
 * A saved choice in the NEXT_LOCALE cookie always wins. Without one, a browser whose
 * top language is Chinese gets Chinese and any other browser gets English. A request
 * with no language preference at all (crawlers, curl) gets Chinese, the site's
 * primary language.
 */

export const LOCALES = ['zh', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'zh';
export const LOCALE_COOKIE = 'NEXT_LOCALE';
/** One year, so the choice survives between visits. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Value of <html lang> for each locale. */
export const HTML_LANG: Record<Locale, string> = { zh: 'zh-CN', en: 'en' };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** The highest-ranked language tag in an Accept-Language header, or undefined. */
function topLanguage(acceptLanguage: string): string | undefined {
  let best: { tag: string; q: number } | undefined;
  for (const part of acceptLanguage.split(',')) {
    const [rawTag, ...params] = part.trim().split(';');
    const tag = rawTag.trim();
    if (!tag || tag === '*') continue;
    const qParam = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
    const q = qParam ? Number(qParam.slice(2)) : 1;
    if (!Number.isFinite(q) || q <= 0) continue;
    // Ties keep the earlier tag: browsers list their preferences in order.
    if (!best || q > best.q) best = { tag, q };
  }
  return best?.tag;
}

export function resolveLocale(cookie: string | null | undefined, acceptLanguage: string | null | undefined): Locale {
  if (isLocale(cookie)) return cookie;
  const top = acceptLanguage ? topLanguage(acceptLanguage) : undefined;
  if (!top) return DEFAULT_LOCALE;
  return top.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

/** Reads one cookie out of a Cookie header. */
export function readCookie(cookieHeader: string | null | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const pair of cookieHeader.split(';')) {
    const [key, ...rest] = pair.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

/** The locale for a plain Request, for route handlers that run outside next-intl. */
export function localeFromRequest(request: Request): Locale {
  return resolveLocale(readCookie(request.headers.get('cookie'), LOCALE_COOKIE), request.headers.get('accept-language'));
}
