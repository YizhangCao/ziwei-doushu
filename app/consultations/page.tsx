import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { requestUser } from '@/lib/auth/request-user';
import { listSharedWithMe } from '@/lib/consultations/service';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('consultations');
  return { title: t('metaTitle'), robots: { index: false } };
}

/** Practitioners: the charts members shared with them (#21). Members get a pointer to /charts. */
export default async function ConsultationsPage() {
  const user = requestUser(await auth());
  if (!user) redirect('/login?callbackUrl=%2Fconsultations');
  const t = await getTranslations('consultations');
  const format = await getFormatter();
  // Only practitioners have a list (admin includes member, not practitioner: lib/auth/guards.ts).
  const isPractitioner = user.role === 'practitioner';
  const shared = isPractitioner ? await listSharedWithMe(user) : [];

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>{t('title')}</h1>
      {!isPractitioner ? (
        <p style={{ color: 'var(--t-faint)' }}>
          {t.rich('list.memberLead', { link: (chunks) => <Link href="/charts" style={{ color: 'var(--t-gold)' }}>{chunks}</Link> })}
        </p>
      ) : (
        <>
          <p style={{ color: 'var(--t-faint)', marginBottom: 20 }}>{t('list.lead')}</p>
          {shared.length === 0 ? (
            <p style={{ color: 'var(--t-faint)' }}>{t('list.empty')}</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 10 }}>
              {shared.map((s) => (
                <li key={s.shareId} className="card-glass" style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid var(--t-border)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                    <Link href={`/consultations/${encodeURIComponent(s.shareId)}`} style={{ color: 'var(--t-gold)', fontWeight: 600, marginRight: 'auto' }}>
                      {s.chartName}
                    </Link>
                    <span style={{ fontSize: 13, color: 'var(--t-faint)' }}>
                      {t('list.sharedAt', { date: format.dateTime(s.sharedAt, { dateStyle: 'medium' }) })}
                    </span>
                    <Link href={`/chart?id=${encodeURIComponent(s.chartId)}`} style={{ fontSize: 13, color: 'var(--t-gold)' }}>
                      {t('list.viewChart')}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
