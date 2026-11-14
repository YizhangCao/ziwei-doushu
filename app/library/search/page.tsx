/**
 * /library/search?q=xxx — 搜索结果页
 *
 * 版式随全站设计系统（#57）：面包屑 + 30px 标题 + 结果列表（1px 细线分隔）。
 * 命中词用中性高亮（.search-snippet mark，见 globals.css）；没有结果时，
 * 推荐词直接就是可点的搜索链接。
 */

import Link from 'next/link';
import { searchClassics, getParagraphById } from '@/lib/classics';
import LibrarySearch from '../LibrarySearch';

export const metadata = {
  title: '搜索 · 古籍原典库',
};

const SUGGESTIONS = ['七杀朝斗', '双禄朝垣', '化忌', '紫微', '命宫', '机月同梁'];

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() || '';
  const hits = q ? searchClassics(q, 50) : [];

  return (
    <main className="page" style={{ paddingTop: 48, paddingBottom: 96 }}>
      <div style={{ maxWidth: 720 }}>
        <nav aria-label="面包屑" className="breadcrumb">
          <Link href="/library">古籍库</Link>
          <span aria-hidden="true">/</span>
          <span style={{ color: 'var(--tx-0)' }}>搜索</span>
        </nav>

        <header className="mt-8">
          <h1 style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.25, color: 'var(--tx-0)' }}>
            {q ? `「${q}」` : '搜索古籍原文'}
          </h1>
          {q && (
            <p className="mt-2 tabular-nums" style={{ color: 'var(--tx-2)' }}>
              共找到 {hits.length} 条古籍原文匹配
            </p>
          )}
        </header>

        <div className="mt-6">
          <LibrarySearch />
        </div>

        {hits.length === 0 ? (
          <section className="mt-10 pt-6" style={{ borderTop: '1px solid var(--bdr)' }}>
            <p style={{ color: 'var(--tx-0)' }}>
              {q ? '暂未在已收录古籍中找到这个关键词。' : '输入要搜索的关键词。'}
            </p>
            <p className="mt-4" style={{ fontSize: 'var(--fs-small)', color: 'var(--tx-2)' }}>可以试试：</p>
            <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
              {SUGGESTIONS.map(s => (
                <li key={s}>
                  <Link href={`/library/search?q=${encodeURIComponent(s)}`} style={{ color: 'var(--tx-0)' }}>
                    {s} <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <ol className="mt-10" style={{ borderBottom: '1px solid var(--bdr)' }}>
            {hits.map((hit, i) => {
              const ctx = getParagraphById(hit.paragraphId);
              const chapterIdx = ctx?.chapterIdx ?? 0;
              return (
                <li key={i} style={{ borderTop: '1px solid var(--bdr)' }}>
                  <Link href={`/library/${hit.bookSlug}/${chapterIdx}#${hit.paragraphId}`} className="block py-5" style={{ color: 'var(--tx-0)' }}>
                    <span style={{ display: 'block', fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>
                      《{hit.bookTitle}》 · {hit.chapterTitle}
                    </span>
                    <span
                      className="search-snippet"
                      style={{ display: 'block', marginTop: 6, fontSize: 'var(--fs-body)', lineHeight: 1.9 }}
                      dangerouslySetInnerHTML={{ __html: hit.snippet }}
                    />
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </main>
  );
}
