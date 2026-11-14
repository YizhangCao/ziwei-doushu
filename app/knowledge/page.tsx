/**
 * /knowledge — 知识库主页
 * 列出 14 主星，每星可看其在 13 宫位的解读
 */

import Link from 'next/link';
import { ALL_STARS, ALL_TOPICS, getAllKnowledgeRoutes, getKnowledge, STAR_BRIEF_SEO, STAR_TO_SLUG } from '@/lib/seo/knowledge';
import { TOPIC_LABEL } from '@/lib/ziwei/db-analysis';

export const metadata = {
  title: '紫微斗数知识库 · 14 主星 × 13 宫位 · 倪海厦正宗体系',
  description: '基于倪海厦《天纪》体系与古籍《紫微斗数全集》《骨髓赋》编纂的紫微斗数知识库。覆盖 14 主星在 13 个宫位的完整论断，含一句话定调、核心论断、命盘依据、经典出处。',
  keywords: ['紫微斗数', '倪海厦', '倪海厦紫微斗数', '紫微斗数全集', '紫微斗数全书', '14 主星', '12 宫位'],
};

export default function KnowledgeHomePage() {
  // 只链接真的有内容的专题：开源版的 STAR_DB 是空的，以前 14 个主星全都链到 404
  const available = getAllKnowledgeRoutes().length;
  const hasOverview = (star: string) => getKnowledge(star, 'overview').exists;

  return (
    <main className="page" style={{ paddingTop: 48, paddingBottom: 96 }}>
      <header style={{ maxWidth: 720 }}>
        <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>倪海厦《天纪》体系 · 含古籍引证</p>
        <h1 className="mt-4" style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.25, color: 'var(--tx-0)' }}>紫微斗数知识库</h1>
        {available > 0 ? (
          <p className="mt-2 tabular-nums" style={{ color: 'var(--tx-2)' }}>
            14 主星 × 13 宫位，已上线 {available} / {ALL_STARS.length * ALL_TOPICS.length} 项专题。
          </p>
        ) : (
          <p className="mt-2" style={{ color: 'var(--tx-2)' }}>
            专题内容整理中。先从古籍原典读起：<Link href="/library" style={{ color: 'var(--tx-0)' }}>古籍原典库 <span aria-hidden="true">→</span></Link>
          </p>
        )}
      </header>

      {/* 十四主星：直达各星的总论 */}
      <section aria-labelledby="stars-heading" className="mt-12">
        <h2 id="stars-heading" style={{ fontSize: 'var(--fs-small)', color: 'var(--tx-2)' }}>十四主星</h2>
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
          {ALL_STARS.map(star => hasOverview(star) ? (
            <Link key={star} href={`/knowledge/${STAR_TO_SLUG[star]}/overview`} className="tile text-center" style={{ padding: '16px 8px', fontSize: 'var(--fs-read)' }}>
              {star}
            </Link>
          ) : (
            <div key={star} className="text-center" style={{ padding: '16px 8px', fontSize: 'var(--fs-read)', border: '1px solid var(--bdr)', color: 'var(--tx-2)' }}>
              {star}
            </div>
          ))}
        </div>
      </section>

      {/* 每颗主星：简介 + 入各宫的专题 */}
      <section aria-label="主星专题" className="mt-14" style={{ borderBottom: '1px solid var(--bdr)' }}>
        {ALL_STARS.map(star => (
          <article key={star} className="py-6" style={{ borderTop: '1px solid var(--bdr)' }}>
            <h2 style={{ fontSize: 'var(--fs-read)', fontWeight: 600, color: 'var(--tx-0)' }}>{star}星</h2>
            {STAR_BRIEF_SEO[star] && (
              <p className="mt-2" style={{ maxWidth: 720, fontSize: 'var(--fs-small)', lineHeight: 1.8, color: 'var(--tx-2)' }}>{STAR_BRIEF_SEO[star]}</p>
            )}
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2" style={{ fontSize: 'var(--fs-small)' }}>
              {ALL_TOPICS.map(t => {
                const k = getKnowledge(star, t);
                if (!k.exists) return null;
                return (
                  <li key={t}>
                    <Link href={`/knowledge/${STAR_TO_SLUG[star]}/${t}`} style={{ color: 'var(--tx-0)' }}>
                      入{k.palaceName} · {TOPIC_LABEL[t]}
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
