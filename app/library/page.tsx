/**
 * 古籍原典查询库 · 主页
 *
 * 列出所有收录古籍 + 全局搜索入口。版式随全站设计系统（#57）：左对齐、
 * 30px 标题、1px 细线方块，不用金色。
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { ALL_BOOKS, TOTAL_PARAGRAPHS } from '@/lib/classics';
import { bookLabels } from '@/lib/classics/localize';
import LibrarySearch from './LibrarySearch';
import { CONTACT } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('library.meta');
  return { title: t('title'), description: t('description') };
}

export default async function LibraryHomePage() {
  const t = await getTranslations('library');
  const locale = await getLocale();
  return (
    <main className="page" style={{ paddingTop: 48, paddingBottom: 96 }}>
      <header style={{ maxWidth: 720 }}>
        <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>{t('kicker')}</p>
        <h1 className="mt-4" style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.25, color: 'var(--tx-0)' }}>
          {t('title')}
        </h1>
        <p className="mt-2" style={{ color: 'var(--tx-2)' }}>
          {t('count', { books: ALL_BOOKS.length, paragraphs: TOTAL_PARAGRAPHS })}
        </p>
      </header>

      {/* 搜索 */}
      <div className="mt-8" style={{ maxWidth: 720 }}>
        <LibrarySearch />
      </div>

      {/* 古籍列表 */}
      <section aria-label={t('booksLabel')} className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_BOOKS.map(book => {
          const labels = bookLabels(book, locale);
          return (
          <Link key={book.slug} href={`/library/${book.slug}`} className="tile">
            <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>
              {labels.dynasty} · {labels.authorShort}
            </div>
            <h2 className="mt-2" style={{ fontSize: 'var(--fs-read)', fontWeight: 600, color: 'var(--tx-0)' }}>
              {t('bookTitle', { title: labels.title })}
            </h2>
            <p className="mt-2" style={{ fontSize: 'var(--fs-small)', lineHeight: 1.7, color: 'var(--tx-2)' }}>
              {labels.intro}
            </p>
            <div className="mt-4 tabular-nums" style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>
              {t('bookStats', { chapters: book.chapters.length, paragraphs: book.chapters.reduce((s, c) => s + c.paragraphs.length, 0) })}
            </div>
            <div className="mt-4" style={{ fontSize: 'var(--fs-small)', color: 'var(--tx-0)' }}>
              {t('open')} <span aria-hidden="true">→</span>
            </div>
          </Link>
          );
        })}
      </section>

      {/* 底部说明 */}
      <section className="mt-16 pt-6" style={{ maxWidth: 720, borderTop: '1px solid var(--bdr)' }}>
        <h2 style={{ fontSize: 'var(--fs-small)', fontWeight: 600, color: 'var(--tx-0)' }}>{t('aboutTitle')}</h2>
        <p className="mt-2" style={{ fontSize: 'var(--fs-small)', lineHeight: 1.8, color: 'var(--tx-2)' }}>
          {t('about', CONTACT)}
        </p>
      </section>
    </main>
  );
}
