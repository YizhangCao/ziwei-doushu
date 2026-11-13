/**
 * /knowledge: the knowledge base home. Lists the 14 main stars, each with its readings in
 * the 13 palace topics that have content.
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { ALL_STARS, ALL_TOPICS, getAllKnowledgeRoutes, getKnowledge, STAR_BRIEF_SEO, STAR_TO_SLUG } from '@/lib/seo/knowledge';
import { termLabel, withGloss } from '@/lib/i18n/glossary';
import { palaceName } from '@/lib/i18n/format';
import { STAR_BRIEF_EN } from '@/lib/i18n/knowledge-en';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('knowledge.meta');
  return { title: t('title'), description: t('description'), keywords: t('keywords') };
}

export default async function KnowledgeHomePage() {
  const t = await getTranslations('knowledge');
  const locale = await getLocale();
  const brief = (star: string) => (locale === 'en' ? STAR_BRIEF_EN[star] : STAR_BRIEF_SEO[star]);
  // Link only topics that have content: STAR_DB is empty upstream, and all 14 stars used to link to a 404
  const available = getAllKnowledgeRoutes().length;
  const hasOverview = (star: string) => getKnowledge(star, 'overview').exists;

  return (
    <main className="page" style={{ paddingTop: 48, paddingBottom: 96 }}>
      <header style={{ maxWidth: 720 }}>
        <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>{t('kicker')}</p>
        <h1 className="mt-4" style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.25, color: 'var(--tx-0)' }}>{t('title')}</h1>
        {available > 0 ? (
          <p className="mt-2 tabular-nums" style={{ color: 'var(--tx-2)' }}>
            {t('progress', { available, total: ALL_STARS.length * ALL_TOPICS.length })}
          </p>
        ) : (
          <p className="mt-2" style={{ color: 'var(--tx-2)' }}>
            {t.rich('preparing', {
              link: (chunks) => <Link href="/library" style={{ color: 'var(--tx-0)' }}>{chunks} <span aria-hidden="true">→</span></Link>,
            })}
          </p>
        )}
      </header>

      {/* The 14 main stars, each linking to its overview */}
      <section aria-labelledby="stars-heading" className="mt-12">
        <h2 id="stars-heading" style={{ fontSize: 'var(--fs-small)', color: 'var(--tx-2)' }}>{t('starsHeading')}</h2>
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
          {ALL_STARS.map(star => hasOverview(star) ? (
            <Link key={star} href={`/knowledge/${STAR_TO_SLUG[star]}/overview`} className="tile text-center" style={{ padding: '16px 8px', fontSize: 'var(--fs-read)' }}>
              {termLabel(star, locale)}
            </Link>
          ) : (
            <div key={star} className="text-center" style={{ padding: '16px 8px', fontSize: 'var(--fs-read)', border: '1px solid var(--bdr)', color: 'var(--tx-2)' }}>
              {termLabel(star, locale)}
            </div>
          ))}
        </div>
      </section>

      {/* Each main star: its brief, then its palace topics */}
      <section aria-label={t('topicsLabel')} className="mt-14" style={{ borderBottom: '1px solid var(--bdr)' }}>
        {ALL_STARS.map(star => (
          <article key={star} className="py-6" style={{ borderTop: '1px solid var(--bdr)' }}>
            <h2 style={{ fontSize: 'var(--fs-read)', fontWeight: 600, color: 'var(--tx-0)' }}>{t('starHeading', { star: locale === 'en' ? withGloss(star) : star })}</h2>
            {brief(star) && (
              <p className="mt-2" style={{ maxWidth: 720, fontSize: 'var(--fs-small)', lineHeight: 1.8, color: 'var(--tx-2)' }}>{brief(star)}</p>
            )}
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2" style={{ fontSize: 'var(--fs-small)' }}>
              {ALL_TOPICS.map(topic => {
                const k = getKnowledge(star, topic);
                if (!k.exists) return null;
                return (
                  <li key={topic}>
                    <Link href={`/knowledge/${STAR_TO_SLUG[star]}/${topic}`} style={{ color: 'var(--tx-0)' }}>
                      {/* Chinese keeps the engine's short palace name; English reads "In the Marriage Palace" */}
                      {t('topicLink', { palace: locale === 'en' ? palaceName(k.palaceName, locale) : k.palaceName, topic: t(`topics.${topic}`) })}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
