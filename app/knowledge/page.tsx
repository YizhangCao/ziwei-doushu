/**
 * /knowledge — 知识库主页
 * 列出 14 主星，每星可看其在 13 宫位的解读
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { ALL_STARS, ALL_TOPICS, getAllKnowledgeRoutes, getKnowledge, STAR_BRIEF_SEO, STAR_TO_SLUG } from '@/lib/seo/knowledge';
import { TOPIC_LABEL } from '@/lib/ziwei/db-analysis';
import { termLabel, withGloss } from '@/lib/i18n/glossary';
import { STAR_BRIEF_EN } from '@/lib/i18n/knowledge-en';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('knowledge.meta');
  return { title: t('title'), description: t('description'), keywords: t('keywords') };
}

export default async function KnowledgeHomePage() {
  const t = await getTranslations('knowledge');
  const locale = await getLocale();
  const brief = (star: string) => (locale === 'en' ? STAR_BRIEF_EN[star] : STAR_BRIEF_SEO[star]);
  // 只链接真的有内容的专题：开源版的 STAR_DB 是空的，以前 14 个主星全都链到 404
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

      {/* 十四主星：直达各星的总论 */}
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

      {/* 每颗主星：简介 + 入各宫的专题 */}
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
                      {t('topicLink', { palace: k.palaceName, topic: TOPIC_LABEL[topic] })}
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
