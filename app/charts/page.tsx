import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { requestUser } from '@/lib/auth/request-user';
import SavedChartsList from '@/components/SavedChartsList';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('charts');
  return { title: t('metaTitle'), robots: { index: false } };
}

/** The signed-in member's saved charts. proxy.ts redirects guests too; this checks again. */
export default async function ChartsPage() {
  if (!requestUser(await auth())) redirect('/login?callbackUrl=%2Fcharts');
  const t = await getTranslations('charts');

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>{t('title')}</h1>
      <SavedChartsList />
    </main>
  );
}
