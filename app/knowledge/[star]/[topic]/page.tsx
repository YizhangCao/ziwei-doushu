/**
 * /knowledge/[star]/[topic]: one main star in one palace, as a search landing page.
 *
 * 14 main stars × 13 topics. A page exists only when STAR_DB has content for it (empty
 * upstream, so none today). Each page carries the four parts of a STAR_DB entry (the
 * one-line verdict, the core reading, the basis in the chart, the classical source), a
 * JSON-LD Article, and links to the same star in other palaces and to other stars in
 * the same palace.
 *
 * Every user-visible string comes from messages/{zh,en}/knowledge.json (#88). The STAR_DB
 * content itself is Chinese data and is marked lang="zh-Hans".
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import type { TopicKey } from '@/lib/ziwei/db-analysis';
import {
  ALL_STARS,
  ALL_TOPICS,
  getKnowledge,
  getAllKnowledgeRoutes,
  STAR_BRIEF_SEO,
  STAR_TO_SLUG,
  SLUG_TO_STAR,
} from '@/lib/seo/knowledge';
import { STAR_BRIEF_EN } from '@/lib/i18n/knowledge-en';
import { termLabel } from '@/lib/i18n/glossary';
import { palaceName } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n/locale';
import { SITE_URL } from '@/lib/site';

// Only the generated pages exist; any other star/topic is a 404.
export const dynamicParams = false;

export async function generateStaticParams() {
  // Pinyin slugs in the URL instead of Chinese, to avoid CDN edge cases with encoded paths
  return getAllKnowledgeRoutes().map(r => ({ star: r.slug, topic: r.topic }));
}

/** The names a page's text is built from, in the visitor's language. */
function names(star: string, engineTopic: TopicKey, locale: Locale, topicLabel: string) {
  const { palaceName: enginePalace } = getKnowledge(star, engineTopic);
  return {
    star: termLabel(star, locale),
    palace: palaceName(enginePalace, locale),
    // Chinese links and keywords use the engine's short name ("夫妻"); English uses the full one
    palaceShort: locale === 'en' ? palaceName(enginePalace, locale) : enginePalace,
    topic: topicLabel,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ star: string; topic: string }> }) {
  const { star: slug, topic } = await params;
  const star = SLUG_TO_STAR[slug];
  if (!star) return {};
  const data = getKnowledge(star, topic as TopicKey);
  if (!data.exists) return {};

  const t = await getTranslations('knowledge');
  const locale = (await getLocale()) as Locale;
  const n = names(star, topic as TopicKey, locale, t(`topics.${topic as TopicKey}`));
  const title = t('topic.metaTitle', n);
  const description = data.parsed.dingdiao || t('topic.metaDescription', n);

  return {
    title,
    description,
    openGraph: { title, description, type: 'article', url: `${SITE_URL}/knowledge/${slug}/${topic}` },
    alternates: { canonical: `${SITE_URL}/knowledge/${slug}/${topic}` },
    keywords: t('topic.keywords', { ...n, palace: n.palaceShort }).split(','),
  };
}

export default async function KnowledgePage({ params }: { params: Promise<{ star: string; topic: string }> }) {
  const { star: slug, topic } = await params;
  const star = SLUG_TO_STAR[slug];
  if (!star) notFound();
  const data = getKnowledge(star, topic as TopicKey);
  if (!data.exists) notFound();

  const t = await getTranslations('knowledge');
  const site = await getTranslations('meta');
  const locale = (await getLocale()) as Locale;
  const topicLabel = (key: TopicKey) => t(`topics.${key}`);
  const n = names(star, topic as TopicKey, locale, topicLabel(topic as TopicKey));
  const brief = locale === 'en' ? STAR_BRIEF_EN[star] : STAR_BRIEF_SEO[star];

  // The same star in its other palaces, and other stars in this palace
  const otherTopicsForStar = ALL_TOPICS.filter(k => k !== topic && getKnowledge(star, k).exists);
  const otherStarsForTopic = ALL_STARS.filter(s => s !== star && getKnowledge(s, topic as TopicKey).exists);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: t('topic.heading', n),
    description: data.parsed.dingdiao,
    author: { '@type': 'Organization', name: site('siteName') },
    publisher: { '@type': 'Organization', name: site('siteName'), url: SITE_URL },
    datePublished: '2026-04-28',
    dateModified: '2026-04-28',
    mainEntityOfPage: `${SITE_URL}/knowledge/${slug}/${topic}`,
    articleSection: t('topic.articleSection'),
    keywords: t('topic.articleKeywords', { ...n, palace: n.palaceShort }),
  };

  return (
    <main className="page" style={{ paddingTop: 48, paddingBottom: 96 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article style={{ maxWidth: 720 }}>
        <nav aria-label={t('topic.breadcrumb')} className="breadcrumb">
          <Link href="/knowledge">{t('topic.home')}</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/knowledge/${slug}/overview`}>{n.star}</Link>
          <span aria-hidden="true">/</span>
          <span style={{ color: 'var(--tx-0)' }}>{n.palace}</span>
        </nav>

        <header className="mt-8 mb-10">
          <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>{t('topic.kicker', n)}</p>
          <h1 className="mt-2" style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.25, color: 'var(--tx-0)' }}>
            {t('topic.heading', n)}
          </h1>
          {brief && (
            <p className="mt-3" style={{ lineHeight: 1.8, color: 'var(--tx-2)' }}>{brief}</p>
          )}
        </header>

        {/* The one-line verdict at headline size, like an opening quote */}
        {data.parsed.dingdiao && (
          <Section title={t('topic.dingdiao')}>
            <p lang="zh-Hans" style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.35, color: 'var(--tx-0)' }}>{data.parsed.dingdiao}</p>
          </Section>
        )}

        {data.parsed.lundian && (
          <Section title={t('topic.lundian')}>
            <div lang="zh-Hans" style={{ fontSize: 'var(--fs-read)', lineHeight: 1.9, color: 'var(--tx-0)', whiteSpace: 'pre-wrap' }}>{data.parsed.lundian}</div>
          </Section>
        )}

        {data.parsed.yiju && (
          <Section title={t('topic.yiju')}>
            <div lang="zh-Hans" style={{ fontSize: 'var(--fs-read)', lineHeight: 1.9, color: 'var(--tx-0)', whiteSpace: 'pre-wrap' }}>{data.parsed.yiju}</div>
          </Section>
        )}

        {data.parsed.chuchu && (
          <Section title={t('topic.chuchu')}>
            <div lang="zh-Hans" style={{ fontSize: 'var(--fs-small)', lineHeight: 1.9, color: 'var(--tx-2)', whiteSpace: 'pre-wrap' }}>{data.parsed.chuchu}</div>
          </Section>
        )}

        {/* Building a chart: the page's only primary button */}
        <section className="mt-12 py-8" style={{ borderTop: '1px solid var(--bdr)', borderBottom: '1px solid var(--bdr)' }}>
          <h2 style={{ fontSize: 'var(--fs-read)', color: 'var(--tx-0)' }}>{t('topic.ctaTitle', n)}</h2>
          <p className="mt-1" style={{ fontSize: 'var(--fs-small)', color: 'var(--tx-2)' }}>{t('topic.ctaBody')}</p>
          <Link href="/chart" className="btn-primary mt-5">
            {t('topic.cta')} <span aria-hidden="true">→</span>
          </Link>
        </section>

        <Section title={t('topic.otherPalaces', n)}>
          <ul className="flex flex-wrap gap-x-5 gap-y-2" style={{ fontSize: 'var(--fs-small)' }}>
            {otherTopicsForStar.map(k => (
              <li key={k}>
                <Link href={`/knowledge/${slug}/${k}`} style={{ color: 'var(--tx-0)' }}>
                  {t('topic.link', { star: n.star, palace: names(star, k, locale, topicLabel(k)).palaceShort })}
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t('topic.otherStars', n)}>
          <ul className="flex flex-wrap gap-x-5 gap-y-2" style={{ fontSize: 'var(--fs-small)' }}>
            {otherStarsForTopic.slice(0, 13).map(s => (
              <li key={s}>
                <Link href={`/knowledge/${STAR_TO_SLUG[s]}/${topic}`} style={{ color: 'var(--tx-0)' }}>
                  {t('topic.link', { star: termLabel(s, locale), palace: n.palaceShort })}
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <p className="mt-10" style={{ fontSize: 'var(--fs-small)' }}>
          <Link href="/library" style={{ color: 'var(--tx-0)' }}>
            {t('topic.library')} <span aria-hidden="true">→</span>
          </Link>
        </p>

        <footer className="mt-16 pt-6" style={{ borderTop: '1px solid var(--bdr)', fontSize: 'var(--fs-caption)', lineHeight: 1.8, color: 'var(--tx-2)' }}>
          <p>{t('topic.footerSource')}</p>
          <p>{t('topic.footerAdvice')}</p>
        </footer>
      </article>
    </main>
  );
}

/** One section of a reading: a 14px label, then the content. No boxes, no accent bar. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3" style={{ fontSize: 'var(--fs-small)', color: 'var(--tx-2)' }}>{title}</h2>
      {children}
    </section>
  );
}
