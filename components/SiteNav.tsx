/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The one site navigation (#57), after Polestar's header: 72px
 * tall, aligned to the page gutter, a monochrome wordmark with the pole-star
 * mark, 16px text links and the day / night switch. Mounted once in the layout.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';

const LINKS = [
  { href: '/chart', label: '起盘' },
  { href: '/heming', label: '合盘' },
];

/**
 * The day / night switch. Its label and knob position come from CSS
 * ([data-theme]), so the server and the browser render the same HTML.
 */
function ThemeToggle() {
  const { toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="切换日间 / 夜间主题"
      className="flex items-center gap-2"
      style={{ background: 'transparent', border: 'none', padding: 0, minHeight: 44 }}
    >
      <span className="relative w-10 h-5 rounded-full flex-shrink-0" style={{ background: 'var(--bg-2)' }}>
        <span className="theme-toggle-knob absolute top-1 left-0 w-3.5 h-3.5 rounded-full" style={{ background: 'var(--tx-0)' }} />
      </span>
      <span className="select-none" style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>
        <span className="theme-label-night">夜间</span>
        <span className="theme-label-day">日间</span>
      </span>
    </button>
  );
}

/** Renders the sticky site navigation. */
export default function SiteNav() {
  const pathname = usePathname() ?? '/';
  return (
    <nav aria-label="主导航" className="no-print sticky top-0 z-50" style={{ background: 'var(--bg-0)' }}>
      <div className="page flex items-center justify-between gap-4" style={{ height: 'var(--nav-h)' }}>
        <Link href="/" className="flex items-center gap-3 flex-shrink-0" style={{ fontSize: '18px', color: 'var(--tx-0)' }}>
          <span aria-hidden="true" className="pole-mark" />
          紫微命盘
        </Link>
        <div className="flex items-center gap-5 sm:gap-8" style={{ fontSize: 'var(--fs-body)' }}>
          {LINKS.map(({ href, label }) => {
            const current = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={current ? 'page' : undefined}
                style={{ color: 'var(--tx-0)', textDecoration: current ? 'underline' : 'none' }}
              >
                {label}
              </Link>
            );
          })}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
