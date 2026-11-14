/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Saves the visitor's language choice (#59). The switch in SiteNav calls
 * this Server Action, then refreshes the route so server components re-render.
 */

'use server';

import { cookies } from 'next/headers';
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, isLocale } from './locale';

/**
 * Stores the locale for a year. Anything that isn't a supported locale is rejected.
 * See #59: zod isn't a dependency on main yet (it arrives with #42), so this uses the
 * same strict guard the request config uses.
 */
export async function setLocale(value: unknown): Promise<void> {
  if (!isLocale(value)) throw new Error('Unsupported locale');
  (await cookies()).set(LOCALE_COOKIE, value, { path: '/', maxAge: LOCALE_COOKIE_MAX_AGE, sameSite: 'lax' });
}
