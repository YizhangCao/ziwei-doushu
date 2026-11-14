'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import InsightPanel from '@/components/InsightPanel';
import type { Palace, ZiweiChart } from '@/lib/ziwei/types';

/**
 * The AI tier (#118): members get the personalized reading and follow-up questions; a guest
 * gets a short prompt to sign in and the chart never goes to the AI. The free reading below
 * this section renders either way.
 */
export default function AiReadingSection({ chart, selectedPalace }: { chart: ZiweiChart; selectedPalace: Palace | null }) {
  const t = useTranslations('reading');
  const { status } = useSession();

  return (
    <section aria-labelledby="ai-reading-title" style={{ display: 'grid', gap: 12 }}>
      <h2 id="ai-reading-title" style={{ fontSize: 'var(--fs-body)', fontWeight: 600, color: 'var(--t-text)' }}>
        {t('aiTitle')}
      </h2>
      {status === 'authenticated' && <InsightPanel chart={chart} selectedPalace={selectedPalace} />}
      {status === 'unauthenticated' && (
        <div className="card-glass" style={{ padding: 20, display: 'grid', gap: 16, justifyItems: 'start' }}>
          <p style={{ fontSize: 'var(--fs-small)', color: 'var(--t-text2)' }}>{t('signInPrompt')}</p>
          <Link href={`/login?callbackUrl=${encodeURIComponent('/chart')}`} className="btn-primary btn-sm">
            {t('signIn')}
          </Link>
        </div>
      )}
    </section>
  );
}
