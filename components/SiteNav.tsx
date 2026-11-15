/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The one site navigation (#57), after Polestar's header: 72px
 * tall, aligned to the page gutter, a monochrome wordmark with the pole-star
 * mark, 16px text links, the language switch (#59) and the day / night switch.
 * Mounted once in the layout.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from '@/components/ThemeProvider';
import LanguageToggle from '@/components/LanguageToggle';
import UserMenu from '@/components/UserMenu';

const LINKS = [
  { href: '/chart', key: 'chart' },
  // /heming stays out of the menu until its AI analysis is built (#124).
] as const;

/**
 * The day / night switch. Its label and knob position come from CSS
 * ([data-theme]), so the server and the browser render the same HTML.
 */
function ThemeToggle({ compact }: { compact: boolean }) {
  const { toggle } = useTheme();
  const t = useTranslations('nav.theme');
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t('toggle')}
      className="flex items-center gap-2"
      style={{ background: 'transparent', border: 'none', padding: 0, minHeight: 44 }}
    >
      <span className="relative w-10 h-5 rounded-full flex-shrink-0" style={{ background: 'var(--bg-2)' }}>
        <span className="theme-toggle-knob absolute top-1 left-0 w-3.5 h-3.5 rounded-full" style={{ background: 'var(--tx-0)' }} />
      </span>
      {/* On a phone the nav is too wide for the word, so only the switch shows (#59, #15) */}
      <span className={compact ? 'select-none hidden sm:inline' : 'select-none'} style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>
        <span className="theme-label-night">{t('night')}</span>
        <span className="theme-label-day">{t('day')}</span>
      </span>
    </button>
  );
}

/** Renders the sticky site navigation. */
export default function SiteNav() {
  const pathname = usePathname() ?? '/';
  const t = useTranslations('nav');
  // The English wordmark is twice as wide; on a phone it gives way to the links.
  const compactBrand = useLocale() === 'en';
  return (
    <nav aria-label={t('label')} className="no-print sticky top-0 z-50" style={{ background: 'var(--bg-0)' }}>
      <div className="page flex items-center justify-between gap-4" style={{ height: 'var(--nav-h)' }}>
        <Link href="/" aria-label={t('brand')} className="flex items-center gap-3 flex-shrink-0" style={{ fontSize: '18px', color: 'var(--tx-0)' }}>
          <span aria-hidden="true" className="pole-mark" />
          <span className={compactBrand ? 'hidden sm:inline' : undefined}>{t('brand')}</span>
        </Link>
        {/* Below 380px the row (with the account link, #15) only fits at the 14px label size */}
        <div className="flex items-center whitespace-nowrap gap-3 sm:gap-8 text-[length:var(--fs-small)] min-[380px]:text-[length:var(--fs-body)]">
          {LINKS.map(({ href, key }) => {
            const current = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={current ? 'page' : undefined}
                style={{ color: 'var(--tx-0)', textDecoration: current ? 'underline' : 'none' }}
              >
                {t(key)}
              </Link>
            );
          })}
          <UserMenu />
          <LanguageToggle />
          {/* With the account link (#15) the row is full on a phone in both languages: the switch drops its word there */}
          <ThemeToggle compact />
        </div>
      </div>
    </nav>
  );
}
