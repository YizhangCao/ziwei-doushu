/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview next-intl request config (#59), without locale routing: URLs stay the
 * same and the locale comes from the NEXT_LOCALE cookie or Accept-Language
 * (lib/i18n/locale.ts). Reading the request makes pages render per request.
 */

import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { LOCALE_COOKIE, resolveLocale } from '@/lib/i18n/locale';
import { MESSAGES } from '@/messages';

export default getRequestConfig(async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value, headerStore.get('accept-language'));
  return { locale, messages: MESSAGES[locale], timeZone: 'Asia/Shanghai' };
});
