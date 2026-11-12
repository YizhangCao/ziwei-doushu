import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { CONTACT } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal');
  return { title: t('terms.meta.title'), description: t('terms.meta.description') };
}

const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;

export default async function TermsPage() {
  const t = await getTranslations('legal');
  return (
      <main className="page" style={{ paddingTop: 48, paddingBottom: 96 }}>
        <article style={{ maxWidth: 720, color: 'var(--tx-1)', lineHeight: 1.8 }}>
        <h1 style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.25, color: 'var(--tx-0)', marginBottom: 8 }}>{t('terms.title')}</h1>
        <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)', marginBottom: 32 }}>{t('terms.updated')}</p>

      <h2 style={{ fontSize: 'var(--fs-small)', fontWeight: 600, color: 'var(--tx-0)', marginTop: 32, marginBottom: 8 }}>{t('terms.overview.heading')}</h2>
      <p>{t.rich('terms.overview.body', { strong })}</p>

      <h2 style={{ fontSize: 'var(--fs-small)', fontWeight: 600, color: 'var(--tx-0)', marginTop: 32, marginBottom: 8 }}>{t('terms.conduct.heading')}</h2>
      <p>{t('terms.conduct.intro')}</p>
      <ul style={{ paddingLeft: 24 }}>
        <li>{t('terms.conduct.lawfulUse')}</li>
        <li>{t('terms.conduct.noRedistribution')}</li>
        <li>{t('terms.conduct.noDisruption')}</li>
        <li>{t('terms.conduct.truthfulBirthInfo')}</li>
      </ul>

      <h2 style={{ fontSize: 'var(--fs-small)', fontWeight: 600, color: 'var(--tx-0)', marginTop: 32, marginBottom: 8 }}>{t('terms.ip.heading')}</h2>
      {/* Plain text like the other sections: no tinted box, a real list instead of line breaks */}
      <p><strong>{t('terms.ip.ownership')}</strong></p>
      <p style={{ marginTop: 8 }}>{t('terms.ip.prohibited')}</p>
      <ul style={{ paddingLeft: 24, listStyle: 'none' }}>
        <li>{t('terms.ip.scraping')}</li>
        <li>{t('terms.ip.training')}</li>
        <li>{t('terms.ip.resale')}</li>
      </ul>
      <p style={{ marginTop: 8 }}>{t.rich('terms.ip.penalty', { strong })}</p>

      <h2 style={{ fontSize: 'var(--fs-small)', fontWeight: 600, color: 'var(--tx-0)', marginTop: 32, marginBottom: 8 }}>{t('terms.disclaimer.heading')}</h2>
      <p>{t.rich('terms.disclaimer.accuracy', { strong })}</p>
      <p>{t('terms.disclaimer.liability')}</p>

      <h2 style={{ fontSize: 'var(--fs-small)', fontWeight: 600, color: 'var(--tx-0)', marginTop: 32, marginBottom: 8 }}>{t('terms.changes.heading')}</h2>
      <p>{t('terms.changes.body')}</p>

      <h2 style={{ fontSize: 'var(--fs-small)', fontWeight: 600, color: 'var(--tx-0)', marginTop: 32, marginBottom: 8 }}>{t('terms.law.heading')}</h2>
      {/* Section 6 (#100): California law and arbitration, in parts (a) to (i), each titled in bold */}
      {(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'] as const).map((part) => (
        <p key={part} style={{ marginTop: part === 'a' ? 0 : 8 }}>{t.rich(`terms.law.${part}`, { strong })}</p>
      ))}

      <h2 style={{ fontSize: 'var(--fs-small)', fontWeight: 600, color: 'var(--tx-0)', marginTop: 32, marginBottom: 8 }}>{t('terms.contact.heading')}</h2>
      <p>{t('terms.contact.body', CONTACT)}</p>

        <p style={{ marginTop: 48, fontSize: 'var(--fs-small)', color: 'var(--tx-2)' }}>
          <a href="/privacy" style={{ color: 'var(--tx-0)' }}>{t('terms.privacyLink')}</a> · <a href="/" style={{ color: 'var(--tx-0)' }}>{t('terms.backHome')}</a>
        </p>
        </article>
      </main>
  );
}
