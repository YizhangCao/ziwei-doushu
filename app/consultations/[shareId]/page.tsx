import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { AuthError } from '@/lib/auth/guards';
import { requestUser } from '@/lib/auth/request-user';
import { getThread } from '@/lib/consultations/service';
import type { ThreadSummary } from '@/lib/consultations/types';
import ConsultationThread from '@/components/ConsultationThread';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('consultations.thread');
  return { title: t('metaTitle'), robots: { index: false } };
}

type Params = Promise<{ shareId: string }>;

/** One consultation thread, for the chart's owner or the practitioner it is shared with (#21). */
export default async function ConsultationThreadPage({ params }: { params: Params }) {
  const { shareId } = await params;
  const user = requestUser(await auth());
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(`/consultations/${shareId}`)}`);

  let thread: ThreadSummary;
  try {
    thread = await getThread(user, shareId);
  } catch (error) {
    // Outside the thread looks the same as a missing one (AGENTS.md: 404, never reveal it).
    if (error instanceof AuthError) notFound();
    throw error;
  }
  const t = await getTranslations('consultations.thread');

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px' }}>
      <p style={{ fontSize: 13 }}>
        <Link href={thread.viewerRole === 'owner' ? '/charts' : '/consultations'} style={{ color: 'var(--t-gold)' }}>
          {t('back')}
        </Link>
      </p>
      <p style={{ marginTop: 16, fontSize: 13, color: 'var(--t-faint)' }}>
        {thread.viewerRole === 'owner' ? t('asOwner') : t('asPractitioner')}
      </p>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '4px 0 20px' }}>{thread.chartName}</h1>
      <ConsultationThread shareId={thread.shareId} viewerRole={thread.viewerRole} closed={thread.closed} />
    </main>
  );
}
