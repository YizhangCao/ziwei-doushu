import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal');
  return { title: t('privacy.meta.title'), description: t('privacy.meta.description') };
}

const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;

export default async function PrivacyPage() {
  const t = await getTranslations('legal');
  return (
    <>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-0)', borderBottom: '1px solid var(--bdr)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--tx-3)', textDecoration: 'none' }}>
          <span style={{ fontSize: '16px' }}>‹</span>
          <span>{t('privacy.backHome')}</span>
        </a>
        <div style={{ width: '1px', height: '20px', background: 'var(--bdr-med)' }} />
        <span style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em' }}>{t('privacy.brand')}</span>
      </header>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px 80px', color: 'var(--tx-1)', lineHeight: 1.8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>{t('privacy.title')}</h1>
        <p style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 32 }}>{t('privacy.updated')}</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>{t('privacy.collect.heading')}</h2>
      <p>{t('privacy.collect.intro')}</p>
      <ul style={{ paddingLeft: 24 }}>
        <li>{t.rich('privacy.collect.chart', { strong })}</li>
        <li>{t.rich('privacy.collect.account', { strong })}</li>
        <li>{t.rich('privacy.collect.questions', { strong })}</li>
        <li>{t.rich('privacy.collect.analytics', { strong })}</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>{t('privacy.use.heading')}</h2>
      <ul style={{ paddingLeft: 24 }}>
        <li>{t('privacy.use.chart')}</li>
        <li>{t('privacy.use.analytics')}</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>{t('privacy.sharing.heading')}</h2>
      <p>{t('privacy.sharing.intro')}</p>
      <ul style={{ paddingLeft: 24 }}>
        <li>{t('privacy.sharing.hosting')}</li>
        <li>{t('privacy.sharing.ai')}</li>
        <li>{t('privacy.sharing.authorities')}</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>{t('privacy.security.heading')}</h2>
      <p>{t('privacy.security.body')}</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>{t('privacy.rights.heading')}</h2>
      <ul style={{ paddingLeft: 24 }}>
        <li>{t.rich('privacy.rights.local', { strong })}</li>
        <li>{t.rich('privacy.rights.server', { strong })}</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>{t('privacy.cookies.heading')}</h2>
      <p>{t('privacy.cookies.body')}</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>{t('privacy.minors.heading')}</h2>
      <p>{t('privacy.minors.body')}</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>{t('privacy.changes.heading')}</h2>
      <p>{t('privacy.changes.body')}</p>

        <p style={{ marginTop: 48, fontSize: 12, color: 'var(--tx-3)' }}>
          <a href="/terms" style={{ color: 'var(--ac)' }}>{t('privacy.termsLink')}</a> · <a href="/" style={{ color: 'var(--ac)' }}>{t('privacy.backHome')}</a>
        </p>
      </main>
    </>
  );
}
