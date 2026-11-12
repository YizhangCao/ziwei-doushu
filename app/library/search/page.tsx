/**
 * /library/search?q=xxx — 搜索结果页
 *
 * 版式随全站设计系统（#57）：面包屑 + 30px 标题 + 结果列表（1px 细线分隔）。
 * 命中词用中性高亮（.search-snippet mark，见 globals.css）；没有结果时，
 * 推荐词直接就是可点的搜索链接。
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { searchClassics, getParagraphById, getBookBySlug } from '@/lib/classics';
import { bookLabels, chapterLabels } from '@/lib/classics/localize';
import LibrarySearch from '../LibrarySearch';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('library.meta');
  return { title: t('searchTitle') };
}

// Suggested searches differ by language: Chinese terms match the originals, and the
// English ones match the English renderings (#59).
const SUGGESTIONS = ['s1', 's2', 's3', 's4', 's5', 's6'] as const;

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() || '';
  const locale = await getLocale();
  const t = await getTranslations('library');
  const hits = q ? searchClassics(q, 50, locale) : [];

  return (
    <main className="page" style={{ paddingTop: 48, paddingBottom: 96 }}>
      <div style={{ maxWidth: 720 }}>
        <nav aria-label={t('breadcrumb')} className="breadcrumb">
          <Link href="/library">{t('home')}</Link>
          <span aria-hidden="true">/</span>
          <span style={{ color: 'var(--tx-0)' }}>{t('search.crumb')}</span>
        </nav>

        <header className="mt-8">
          <h1 style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.25, color: 'var(--tx-0)' }}>
            {q ? t('search.query', { q }) : t('search.heading')}
          </h1>
          {q && (
            <p className="mt-2 tabular-nums" style={{ color: 'var(--tx-2)' }}>
              {t('search.found', { n: hits.length })}
            </p>
          )}
        </header>

        <div className="mt-6">
          <LibrarySearch />
        </div>

        {hits.length === 0 ? (
          <section className="mt-10 pt-6" style={{ borderTop: '1px solid var(--bdr)' }}>
            <p style={{ color: 'var(--tx-0)' }}>
              {q ? t('search.none') : t('search.empty')}
            </p>
            {/* After a search that found nothing, the suggestions invite another word; an empty search gets the plain "try" (#94) */}
            <p className="mt-4" style={{ fontSize: 'var(--fs-small)', color: 'var(--tx-2)' }}>{q ? t('search.tryAgain') : t('search.try')}</p>
            <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
              {SUGGESTIONS.map(key => t(`suggestions.${key}`)).map(s => (
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
              const book = getBookBySlug(hit.bookSlug);
              const bookTitle = book ? bookLabels(book, locale).title : hit.bookTitle;
              const chapterTitle = book ? chapterLabels(book, chapterIdx, locale).title : hit.chapterTitle;
              return (
                <li key={i} style={{ borderTop: '1px solid var(--bdr)' }}>
                  <Link href={`/library/${hit.bookSlug}/${chapterIdx}#${hit.paragraphId}`} className="block py-5" style={{ color: 'var(--tx-0)' }}>
                    <span style={{ display: 'block', fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>
                      {t('search.hitMeta', { book: bookTitle, chapter: chapterTitle })}
                    </span>
                    <span
                      className="search-snippet"
                      lang={hit.snippetLang === 'en' ? undefined : 'zh-Hans'}
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
