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
      <main className="page" style={{ paddingTop: 48, paddingBottom: 96 }}>
        <article style={{ maxWidth: 720, color: 'var(--tx-1)', lineHeight: 1.8 }}>
        <h1 style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.25, color: 'var(--tx-0)', marginBottom: 8 }}>{t('privacy.title')}</h1>
        <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)', marginBottom: 32 }}>{t('privacy.updated')}</p>

      <h2 style={{ fontSize: 'var(--fs-small)', fontWeight: 600, color: 'var(--tx-0)', marginTop: 32, marginBottom: 8 }}>{t('privacy.collect.heading')}</h2>
      <p>{t('privacy.collect.intro')}</p>
      <ul style={{ paddingLeft: 24 }}>
        <li>{t.rich('privacy.collect.chart', { strong })}</li>
        <li>{t.rich('privacy.collect.account', { strong })}</li>
        <li>{t.rich('privacy.collect.questions', { strong })}</li>
        <li>{t.rich('privacy.collect.analytics', { strong })}</li>
      </ul>

      <h2 style={{ fontSize: 'var(--fs-small)', fontWeight: 600, color: 'var(--tx-0)', marginTop: 32, marginBottom: 8 }}>{t('privacy.use.heading')}</h2>
      <ul style={{ paddingLeft: 24 }}>
        <li>{t('privacy.use.chart')}</li>
        <li>{t('privacy.use.analytics')}</li>
      </ul>

      <h2 style={{ fontSize: 'var(--fs-small)', fontWeight: 600, color: 'var(--tx-0)', marginTop: 32, marginBottom: 8 }}>{t('privacy.sharing.heading')}</h2>
      <p>{t('privacy.sharing.intro')}</p>
      <ul style={{ paddingLeft: 24 }}>
        <li>{t('privacy.sharing.hosting')}</li>
        <li>{t('privacy.sharing.ai')}</li>
        <li>{t('privacy.sharing.authorities')}</li>
      </ul>

      <h2 style={{ fontSize: 'var(--fs-small)', fontWeight: 600, color: 'var(--tx-0)', marginTop: 32, marginBottom: 8 }}>{t('privacy.security.heading')}</h2>
      <p>{t('privacy.security.body')}</p>

      <h2 style={{ fontSize: 'var(--fs-small)', fontWeight: 600, color: 'var(--tx-0)', marginTop: 32, marginBottom: 8 }}>{t('privacy.rights.heading')}</h2>
      <ul style={{ paddingLeft: 24 }}>
        <li>{t.rich('privacy.rights.local', { strong })}</li>
        <li>{t.rich('privacy.rights.server', { strong })}</li>
      </ul>

      <h2 style={{ fontSize: 'var(--fs-small)', fontWeight: 600, color: 'var(--tx-0)', marginTop: 32, marginBottom: 8 }}>{t('privacy.cookies.heading')}</h2>
      <p>{t('privacy.cookies.body')}</p>

      <h2 style={{ fontSize: 'var(--fs-small)', fontWeight: 600, color: 'var(--tx-0)', marginTop: 32, marginBottom: 8 }}>{t('privacy.minors.heading')}</h2>
      <p>{t('privacy.minors.body')}</p>

      <h2 style={{ fontSize: 'var(--fs-small)', fontWeight: 600, color: 'var(--tx-0)', marginTop: 32, marginBottom: 8 }}>{t('privacy.changes.heading')}</h2>
      <p>{t('privacy.changes.body')}</p>

        <p style={{ marginTop: 48, fontSize: 'var(--fs-small)', color: 'var(--tx-2)' }}>
          <a href="/terms" style={{ color: 'var(--tx-0)' }}>{t('privacy.termsLink')}</a> · <a href="/" style={{ color: 'var(--tx-0)' }}>{t('privacy.backHome')}</a>
        </p>
        </article>
      </main>
  );
}
