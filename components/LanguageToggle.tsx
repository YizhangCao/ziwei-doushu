/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The language switch in SiteNav (#59). It shows the other language's
 * name in that language ("EN" on the Chinese site, "中文" on the English one), so its
 * visible text is its accessible name and each name carries its own lang attribute.
 */

'use client';

import { useTransition } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { setLocale } from '@/lib/i18n/actions';

export default function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = locale === 'en' ? 'zh' : 'en';

  return (
    <button
      type="button"
      onClick={() => startTransition(async () => {
        await setLocale(next);
        router.refresh();
      })}
      disabled={pending}
      className="select-none"
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        minHeight: 44,
        minWidth: 32,
        fontSize: 'var(--fs-small)',
        color: 'var(--tx-0)',
        opacity: pending ? 0.6 : 1,
      }}
    >
      {next === 'en' ? <span lang="en">EN</span> : <span lang="zh-Hans">中文</span>}
    </button>
  );
}
