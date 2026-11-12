/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Which language a request gets (#59). Pure functions, shared by the
 * next-intl request config and by API routes that read the plain Request.
 *
 * A saved choice in the NEXT_LOCALE cookie always wins. Without one, a browser that
 * lists Chinese anywhere in its languages gets Chinese, and a browser that lists no
 * Chinese gets English (#67). A request with no language preference at all (crawlers,
 * curl) gets Chinese, the site's primary language.
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

/** The language tags an Accept-Language header accepts (q > 0), in the order sent. */
function acceptedLanguages(acceptLanguage: string): string[] {
  const tags: string[] = [];
  for (const part of acceptLanguage.split(',')) {
    const [rawTag, ...params] = part.trim().split(';');
    const tag = rawTag.trim();
    if (!tag || tag === '*') continue;
    const qParam = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
    const q = qParam ? Number(qParam.slice(2)) : 1;
    if (!Number.isFinite(q) || q <= 0) continue;
    tags.push(tag);
  }
  return tags;
}

export function resolveLocale(cookie: string | null | undefined, acceptLanguage: string | null | undefined): Locale {
  if (isLocale(cookie)) return cookie;
  const tags = acceptLanguage ? acceptedLanguages(acceptLanguage) : [];
  if (tags.length === 0) return DEFAULT_LOCALE;
  // Chinese anywhere in the list wins, not only in first place: the site is Chinese-first,
  // and bilingual visitors often keep an English system language ahead of Chinese (#67).
  return tags.some((tag) => tag.toLowerCase().startsWith('zh')) ? 'zh' : 'en';
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
