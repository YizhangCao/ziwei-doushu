/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The 403 page. The proxy rewrites to it, with a 403 status, when a
 * signed-in user opens a page their role does not allow.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('forbidden');
  return { title: t('metaTitle'), robots: { index: false } };
}

/** Explains that the page needs another role and links back home. */
export default async function ForbiddenPage() {
  const t = await getTranslations('forbidden');
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card-glass w-full max-w-sm rounded-xl p-8 text-center">
        <h1 className="text-lg font-medium tracking-widest" style={{ color: 'var(--t-gold)' }}>
          {t('title')}
        </h1>
        <p className="mt-3 text-sm" style={{ color: 'var(--t-faint)' }}>
          {t('body')}
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full px-4 py-2 text-sm focus:outline-none focus-visible:ring-2"
          style={{ border: '1px solid var(--t-border)', color: 'var(--t-gold)' }}
        >
          {t('home')}
        </Link>
      </div>
    </main>
  );
}
