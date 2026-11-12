import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { requestUser } from '@/lib/auth/request-user';
import ApiKeysPanel from '@/components/ApiKeysPanel';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('settings');
  return { title: t('metaTitle'), robots: { index: false } };
}

/** Account settings: for now, the member's API keys for the public API (#24). */
export default async function SettingsPage() {
  if (!requestUser(await auth())) redirect('/login?callbackUrl=%2Fsettings');
  const t = await getTranslations('settings');

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>{t('title')}</h1>
      <ApiKeysPanel />
    </main>
  );
}
