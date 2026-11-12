import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { requestUser } from '@/lib/auth/request-user';
import SavedChartsList from '@/components/SavedChartsList';

export const metadata: Metadata = {
  title: '我的命盘 · 紫微命盘',
  robots: { index: false },
};

/** The signed-in member's saved charts. proxy.ts redirects guests too; this checks again. */
export default async function ChartsPage() {
  if (!requestUser(await auth())) redirect('/login?callbackUrl=%2Fcharts');

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>我的命盘</h1>
      <SavedChartsList />
    </main>
  );
}
