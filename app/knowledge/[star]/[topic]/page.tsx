/**
 * /knowledge/[star]/[topic] — SEO 落地页
 *
 * 14 主星 × 13 topic = 182 个独立 URL
 * 每页含完整的 STAR_DB 4 段论断（一句话定调/核心论断/命盘依据/经典出处）
 *
 * SEO 要点：
 *  - title 含主关键词（如"紫微入命宫·倪海厦体系详解"）
 *  - description 用 dingdiao（一句话定调）
 *  - JSON-LD Article 结构化数据
 *  - 内链：同主星其他 12 宫 + 同宫其他 13 主星
 *  - generateStaticParams 静态生成，零运行时开销
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
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
import { SITE_URL } from '@/lib/site';

// 允许动态参数：如果某个 star/topic 组合不在 generateStaticParams 列表中
// 也允许运行时按需渲染，避免中文 URL 编码问题导致 404
export const dynamicParams = false;

export async function generateStaticParams() {
  const routes = getAllKnowledgeRoutes();
  // URL 用拼音 slug 替代中文，避开 Vercel/CDN 中文路由边界问题
  return routes.map(r => ({ star: r.slug, topic: r.topic }));
}

export async function generateMetadata({ params }: { params: Promise<{ star: string; topic: string }> }) {
  const { star: slug, topic } = await params;
  const star = SLUG_TO_STAR[slug];
  if (!star) return {};
  const data = getKnowledge(star, topic as TopicKey);
  if (!data.exists) return {};

  const title = `${star}入${data.palaceName}宫 · ${data.topicLabel} · 倪海厦体系详解`;
  const description = data.parsed.dingdiao
    || `${star}入${data.palaceName}宫的紫微斗数解读 — 基于倪海厦《天纪》体系与古籍《紫微斗数全集》《骨髓赋》。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${SITE_URL}/knowledge/${slug}/${topic}`,
    },
    alternates: {
      canonical: `${SITE_URL}/knowledge/${slug}/${topic}`,
    },
    keywords: [
      '紫微斗数', '倪海厦', star, data.palaceName, data.topicLabel,
      `${star}${data.palaceName}`, `${star}入${data.palaceName}`,
      `紫微斗数 ${star}`, '倪海厦紫微斗数', '紫微斗数全集',
    ],
  };
}

export default async function KnowledgePage({ params }: { params: Promise<{ star: string; topic: string }> }) {
  const { star: slug, topic } = await params;
  const star = SLUG_TO_STAR[slug];
  if (!star) notFound();
  const data = getKnowledge(star, topic as TopicKey);
  if (!data.exists) notFound();

  // 同主星其他 topic
  const otherTopicsForStar = ALL_TOPICS.filter(t => t !== topic && getKnowledge(star, t).exists);
  // 同 topic 其他主星
  const otherStarsForTopic = ALL_STARS.filter(s => s !== star && getKnowledge(s, topic as TopicKey).exists);

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${star}入${data.palaceName}宫 · ${data.topicLabel}`,
    description: data.parsed.dingdiao,
    author: { '@type': 'Organization', name: '紫微命盘' },
    publisher: {
      '@type': 'Organization',
      name: '紫微命盘',
      url: SITE_URL,
    },
    datePublished: '2026-04-28',
    dateModified: '2026-04-28',
    mainEntityOfPage: `${SITE_URL}/knowledge/${slug}/${topic}`,
    articleSection: '紫微斗数 · 倪海厦体系',
    keywords: [`紫微斗数`, star, data.palaceName, data.topicLabel].join(', '),
  };

  return (
    <main className="page" style={{ paddingTop: 48, paddingBottom: 96 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article style={{ maxWidth: 720 }}>
        <nav aria-label="面包屑" className="breadcrumb">
          <Link href="/knowledge">知识库</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/knowledge/${slug}/overview`}>{star}</Link>
          <span aria-hidden="true">/</span>
          <span style={{ color: 'var(--tx-0)' }}>{data.palaceName}宫</span>
        </nav>

        {/* 标题区 */}
        <header className="mt-8 mb-10">
          <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>{data.topicLabel} · 倪海厦体系详解</p>
          <h1 className="mt-2" style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.25, color: 'var(--tx-0)' }}>
            {star}入{data.palaceName}宫
          </h1>
          {STAR_BRIEF_SEO[star] && (
            <p className="mt-3" style={{ lineHeight: 1.8, color: 'var(--tx-2)' }}>{STAR_BRIEF_SEO[star]}</p>
          )}
        </header>

        {/* 一句话定调：标题级字号，像一句引言 */}
        {data.parsed.dingdiao && (
          <Section title="一句话定调">
            <p style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.35, color: 'var(--tx-0)' }}>{data.parsed.dingdiao}</p>
          </Section>
        )}

        {data.parsed.lundian && (
          <Section title="核心论断">
            <div style={{ fontSize: 'var(--fs-read)', lineHeight: 1.9, color: 'var(--tx-0)', whiteSpace: 'pre-wrap' }}>{data.parsed.lundian}</div>
          </Section>
        )}

        {data.parsed.yiju && (
          <Section title="命盘依据">
            <div style={{ fontSize: 'var(--fs-read)', lineHeight: 1.9, color: 'var(--tx-0)', whiteSpace: 'pre-wrap' }}>{data.parsed.yiju}</div>
          </Section>
        )}

        {data.parsed.chuchu && (
          <Section title="经典出处">
            <div style={{ fontSize: 'var(--fs-small)', lineHeight: 1.9, color: 'var(--tx-2)', whiteSpace: 'pre-wrap' }}>{data.parsed.chuchu}</div>
          </Section>
        )}

        {/* 起盘：页面里唯一的主按钮 */}
        <section className="mt-12 py-8" style={{ borderTop: '1px solid var(--bdr)', borderBottom: '1px solid var(--bdr)' }}>
          <h2 style={{ fontSize: 'var(--fs-read)', color: 'var(--tx-0)' }}>想看你自己命盘的{data.topicLabel}？</h2>
          <p className="mt-1" style={{ fontSize: 'var(--fs-small)', color: 'var(--tx-2)' }}>输入出生年月日时起盘，AI 按倪海厦体系逐宫解读。</p>
          <Link href="/chart" className="btn-primary mt-5">
            起盘 <span aria-hidden="true">→</span>
          </Link>
        </section>

        {/* 内链：同主星其他宫位 */}
        <Section title={`${star}星的其他宫位`}>
          <ul className="flex flex-wrap gap-x-5 gap-y-2" style={{ fontSize: 'var(--fs-small)' }}>
            {otherTopicsForStar.map(t => {
              const d = getKnowledge(star, t);
              return (
                <li key={t}>
                  <Link href={`/knowledge/${slug}/${t}`} style={{ color: 'var(--tx-0)' }}>{star}入{d.palaceName}</Link>
                </li>
              );
            })}
          </ul>
        </Section>

        {/* 内链：同宫位其他主星 */}
        <Section title={`其他主星入${data.palaceName}宫`}>
          <ul className="flex flex-wrap gap-x-5 gap-y-2" style={{ fontSize: 'var(--fs-small)' }}>
            {otherStarsForTopic.slice(0, 13).map(s => (
              <li key={s}>
                <Link href={`/knowledge/${STAR_TO_SLUG[s]}/${topic}`} style={{ color: 'var(--tx-0)' }}>{s}入{data.palaceName}</Link>
              </li>
            ))}
          </ul>
        </Section>

        <p className="mt-10" style={{ fontSize: 'var(--fs-small)' }}>
          <Link href="/library" style={{ color: 'var(--tx-0)' }}>
            查阅古籍原典库：紫微斗数全集 / 全书 / 骨髓赋 <span aria-hidden="true">→</span>
          </Link>
        </p>

        <footer className="mt-16 pt-6" style={{ borderTop: '1px solid var(--bdr)', fontSize: 'var(--fs-caption)', lineHeight: 1.8, color: 'var(--tx-2)' }}>
          <p>紫微命盘 · 基于倪海厦正宗体系 · 仅供学习参考</p>
          <p>本平台不构成任何医疗、投资、法律或重大决策建议</p>
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
