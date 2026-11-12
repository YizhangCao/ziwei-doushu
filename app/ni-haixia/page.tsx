/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview About Ni Haixia (#69). The copy review moved his life, teaching series
 * and approach to learning off the home page; they live here, without the cause of
 * death. The layout follows the library pages (#57): left-aligned, tokens only, no gold.
 */

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about.meta');
  return { title: t('title'), description: t('description') };
}

const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;
const SECTIONS = [
  ['lifeHeading', 'life'],
  ['teachingHeading', 'teaching'],
  ['approachHeading', 'approach'],
] as const;

export default async function NiHaixiaPage() {
  const t = await getTranslations('about');
  const home = await getTranslations('home');
  return (
    <main className="page" style={{ paddingTop: 48, paddingBottom: 96 }}>
      <header style={{ maxWidth: 720 }}>
        <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>{t('eyebrow')}</p>
        <h1 className="mt-4" style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.25, color: 'var(--tx-0)' }}>
          {t('title')}
        </h1>
      </header>

      <div className="mt-10" style={{ maxWidth: 720, display: 'grid', gap: 40 }}>
        {SECTIONS.map(([heading, body]) => (
          <section key={body} style={{ borderTop: '1px solid var(--bdr)', paddingTop: 24 }}>
            <h2 style={{ fontSize: 'var(--fs-small)', color: 'var(--tx-2)' }}>{t(heading)}</h2>
            <p className="mt-3" style={{ color: 'var(--tx-1)', lineHeight: 1.8 }}>{t.rich(body, { strong })}</p>
          </section>
        ))}

        {/* The same disclaimer as the home section, so the two never drift apart */}
        <p style={{ fontSize: 'var(--fs-small)', color: 'var(--tx-2)' }}>{home('ni.disclaimer')}</p>
        <p style={{ fontSize: 'var(--fs-small)' }}>
          <a href="/" style={{ color: 'var(--tx-0)' }}>{t('back')}</a>
        </p>
      </div>
    </main>
  );
}
