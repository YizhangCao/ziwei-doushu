/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Types next-intl against our locales and the Chinese catalog (#59), so an
 * unknown message key is a type error.
 */

import type { Locale } from '@/lib/i18n/locale';
import type { Messages } from '@/messages';

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
