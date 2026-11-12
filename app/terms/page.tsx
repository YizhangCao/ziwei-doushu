import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal');
  return { title: t('terms.meta.title'), description: t('terms.meta.description') };
}

const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;

export default async function TermsPage() {
  const t = await getTranslations('legal');
  return (
    <>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-0)', borderBottom: '1px solid var(--bdr)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--tx-3)', textDecoration: 'none' }}>
          <span style={{ fontSize: '16px' }}>‹</span>
          <span>{t('terms.backHome')}</span>
        </a>
        <div style={{ width: '1px', height: '20px', background: 'var(--bdr-med)' }} />
        <span style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em' }}>{t('terms.brand')}</span>
      </header>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px 80px', color: 'var(--tx-1)', lineHeight: 1.8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>{t('terms.title')}</h1>
        <p style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 32 }}>{t('terms.updated')}</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>{t('terms.overview.heading')}</h2>
      <p>{t.rich('terms.overview.body', { strong })}</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>{t('terms.conduct.heading')}</h2>
      <p>{t('terms.conduct.intro')}</p>
      <ul style={{ paddingLeft: 24 }}>
        <li>{t('terms.conduct.lawfulUse')}</li>
        <li>{t('terms.conduct.noRedistribution')}</li>
        <li>{t('terms.conduct.noDisruption')}</li>
        <li>{t('terms.conduct.truthfulBirthInfo')}</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>{t('terms.ip.heading')}</h2>
      <p style={{ background: 'rgba(168,50,40,0.06)', border: '1px solid rgba(168,50,40,0.2)', padding: 16, borderRadius: 8 }}>
        <strong>{t('terms.ip.ownership')}</strong><br/><br/>
        {t('terms.ip.prohibited')}<br/>
        {t('terms.ip.scraping')}<br/>
        {t('terms.ip.training')}<br/>
        {t('terms.ip.resale')}<br/>
        {t('terms.ip.cloning')}<br/><br/>
        {t.rich('terms.ip.penalty', { strong })}
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>{t('terms.disclaimer.heading')}</h2>
      <p>{t.rich('terms.disclaimer.accuracy', { strong })}</p>
      <p>{t('terms.disclaimer.liability')}</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>{t('terms.changes.heading')}</h2>
      <p>{t('terms.changes.body')}</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>{t('terms.law.heading')}</h2>
      <p>{t('terms.law.body')}</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>{t('terms.contact.heading')}</h2>
      <p>{t('terms.contact.body')}</p>

        <p style={{ marginTop: 48, fontSize: 12, color: 'var(--tx-3)' }}>
          <a href="/privacy" style={{ color: 'var(--ac)' }}>{t('terms.privacyLink')}</a> · <a href="/" style={{ color: 'var(--ac)' }}>{t('terms.backHome')}</a>
        </p>
      </main>
    </>
  );
}
