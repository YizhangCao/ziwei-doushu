/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/** @fileoverview The 404 page (#57), on the design system instead of Next's default white page. */

import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('notFound');
  return { title: t('metaTitle'), robots: { index: false } };
}

/** Says the page is missing and offers the two ways back. */
export default async function NotFound() {
  const t = await getTranslations('notFound');
  return (
    <main className="page" style={{ paddingTop: 96, paddingBottom: 96 }}>
      <p className="tabular-nums" style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>404</p>
      <h1 className="mt-2" style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.25, color: 'var(--tx-0)' }}>{t('title')}</h1>
      <p className="mt-2" style={{ color: 'var(--tx-2)' }}>{t('body')}</p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/chart" className="btn-primary">{t('chart')} <span aria-hidden="true">→</span></Link>
        <Link href="/" className="btn-ghost">{t('home')}</Link>
      </div>
    </main>
  );
}
