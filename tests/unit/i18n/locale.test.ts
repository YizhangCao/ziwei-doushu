/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Which language a request gets (#59, #67). A saved choice (the NEXT_LOCALE
 * cookie) always wins. Without one, a browser that lists Chinese anywhere gets Chinese,
 * a browser that lists no Chinese gets English, and a request with no language
 * preference gets Chinese.
 */

import { describe, it, expect } from 'vitest';
import { HTML_LANG, LOCALE_COOKIE, localeFromRequest, readCookie, resolveLocale } from '@/lib/i18n/locale';

describe('resolveLocale', () => {
  it('uses a saved choice over the browser language', () => {
    expect(resolveLocale('en', 'zh-CN,zh;q=0.9')).toBe('en');
    expect(resolveLocale('zh', 'en-US,en;q=0.9')).toBe('zh');
  });

  it('ignores a cookie value that is not a supported locale', () => {
    expect(resolveLocale('fr', 'zh-CN')).toBe('zh');
    expect(resolveLocale('EN<script>', 'en-US')).toBe('en');
  });

  it('gives Chinese to browsers that prefer any Chinese variant', () => {
    expect(resolveLocale(undefined, 'zh-CN,zh;q=0.9,en;q=0.8')).toBe('zh');
    expect(resolveLocale(undefined, 'zh-TW')).toBe('zh');
    expect(resolveLocale(undefined, 'ZH-hans-cn')).toBe('zh');
  });

  it('gives Chinese to bilingual browsers that list Chinese after another language (#67)', () => {
    // The order macOS sends for an English system with Chinese added as a second language.
    expect(resolveLocale(undefined, 'en-US,en-CN;q=0.9,zh-Hans-CN;q=0.8,zh-Hant-CN;q=0.7')).toBe('zh');
    expect(resolveLocale(undefined, 'en-US,en;q=0.9,zh-CN;q=0.8')).toBe('zh');
    expect(resolveLocale(undefined, 'ja-JP,ja;q=0.9,zh;q=0.5')).toBe('zh');
    expect(resolveLocale(undefined, 'en;q=0.5,zh-TW;q=0.9')).toBe('zh');
  });

  it('gives English to browsers that list no Chinese', () => {
    expect(resolveLocale(undefined, 'en-US,en;q=0.9')).toBe('en');
    expect(resolveLocale(undefined, 'ja-JP,en;q=0.8')).toBe('en');
    expect(resolveLocale(undefined, 'fr')).toBe('en');
  });

  it('treats a Chinese tag with q=0 as not listed', () => {
    expect(resolveLocale(undefined, 'zh;q=0,en')).toBe('en');
    expect(resolveLocale(undefined, 'en-US,zh-CN;q=0')).toBe('en');
  });

  it('falls back to Chinese when there is no usable preference', () => {
    expect(resolveLocale(undefined, undefined)).toBe('zh');
    expect(resolveLocale(null, '')).toBe('zh');
    expect(resolveLocale(undefined, '*')).toBe('zh');
  });
});

describe('readCookie and localeFromRequest', () => {
  it('reads one cookie out of a Cookie header', () => {
    expect(readCookie('a=1; NEXT_LOCALE=en; b=2', LOCALE_COOKIE)).toBe('en');
    expect(readCookie('a=1', LOCALE_COOKIE)).toBeUndefined();
    expect(readCookie(null, LOCALE_COOKIE)).toBeUndefined();
  });

  it('resolves the locale from a request', () => {
    const request = (headers: Record<string, string>) => new Request('http://localhost/api/interpret', { headers });
    expect(localeFromRequest(request({ cookie: `${LOCALE_COOKIE}=en`, 'accept-language': 'zh-CN' }))).toBe('en');
    expect(localeFromRequest(request({ 'accept-language': 'en-GB' }))).toBe('en');
    expect(localeFromRequest(request({ 'accept-language': 'en-GB,zh-CN;q=0.5' }))).toBe('zh');
    expect(localeFromRequest(request({}))).toBe('zh');
  });

  it('treats a malformed cookie value as unset, so the browser language decides', () => {
    // %E4 is half a UTF-8 character: decodeURIComponent throws a URIError on it.
    expect(readCookie(`a=1; ${LOCALE_COOKIE}=%E4`, LOCALE_COOKIE)).toBeUndefined();
    const request = new Request('http://localhost/api/interpret', {
      headers: { cookie: `${LOCALE_COOKIE}=%E4`, 'accept-language': 'en-US' },
    });
    expect(localeFromRequest(request)).toBe('en');
  });

  it('maps each locale to its html lang value', () => {
    expect(HTML_LANG).toEqual({ zh: 'zh-CN', en: 'en' });
  });
});
