import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { requestUser } from '@/lib/auth/request-user';
import ApiKeysPanel from '@/components/ApiKeysPanel';

export const metadata: Metadata = {
  title: '设置 · 紫微命盘',
  robots: { index: false },
};

/** Account settings: for now, the member's API keys for the public API (#24). */
export default async function SettingsPage() {
  if (!requestUser(await auth())) redirect('/login?callbackUrl=%2Fsettings');

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>设置</h1>
      <ApiKeysPanel />
    </main>
  );
}
