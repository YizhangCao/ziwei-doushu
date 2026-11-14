/**
 * /library/[book] — 单部古籍目录页
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { ALL_BOOKS, getBookBySlug } from '@/lib/classics';
import { bookLabels, chapterLabels } from '@/lib/classics/localize';

export async function generateStaticParams() {
  return ALL_BOOKS.map(b => ({ book: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ book: string }> }) {
  const { book: slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) return {};
  const t = await getTranslations('library.meta');
  const labels = bookLabels(book, await getLocale());
  return {
    title: t('bookTitle', { title: labels.title, dynasty: labels.dynasty }),
    description: labels.intro,
  };
}

export default async function BookPage({ params }: { params: Promise<{ book: string }> }) {
  const { book: slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) notFound();
  const t = await getTranslations('library');
  const locale = await getLocale();
  const labels = bookLabels(book, locale);

  return (
    <main className="page" style={{ paddingTop: 48, paddingBottom: 96 }}>
      <div style={{ maxWidth: 720 }}>
        <nav aria-label={t('breadcrumb')} className="breadcrumb">
          <Link href="/library">{t('home')}</Link>
          <span aria-hidden="true">/</span>
          <span style={{ color: 'var(--tx-0)' }}>{t('bookTitle', { title: labels.title })}</span>
        </nav>

        {/* 书名信息 */}
        <header className="mt-8">
          <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>{labels.dynasty} · {labels.author}</p>
          <h1 className="mt-2" style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.25, color: 'var(--tx-0)' }}>{t('bookTitle', { title: labels.title })}</h1>
          <p className="mt-3" style={{ lineHeight: 1.8, color: 'var(--tx-2)' }}>{labels.intro}</p>
        </header>

        {/* 章节目录：每章一行，1px 细线分隔 */}
        <section aria-label={t('chapters')} className="mt-10" style={{ borderBottom: '1px solid var(--bdr)' }}>
          <h2 className="pb-3" style={{ fontSize: 'var(--fs-small)', color: 'var(--tx-2)' }}>{t('chapters')}</h2>
          {book.chapters.map((chapter, i) => {
            const ch = chapterLabels(book, i, locale);
            return (
            <Link key={i} href={`/library/${book.slug}/${i}`} className="list-row">
              <span className="tabular-nums" style={{ minWidth: 32, fontSize: 'var(--fs-small)', color: 'var(--tx-2)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 'var(--fs-body)', color: 'var(--tx-0)' }}>{ch.title}</span>
                {ch.subtitle && (
                  <span style={{ display: 'block', fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>{ch.subtitle}</span>
                )}
              </span>
              <span className="tabular-nums" style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>{t('paragraphCount', { n: chapter.paragraphs.length })}</span>
              <span aria-hidden="true">→</span>
            </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
