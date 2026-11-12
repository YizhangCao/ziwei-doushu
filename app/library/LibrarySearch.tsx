'use client';

/**
 * 古籍库搜索框 — client component
 *
 * 输入 → 回车或点「搜索」→ 跳转 /library/search?q=xxx。
 * 输入框与按钮同为 52px（#57 设计系统的 .input-base / .btn-primary）。
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function LibrarySearch() {
  const [q, setQ] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('library.search');

  const submit = () => {
    const query = q.trim();
    if (!query) return;
    startTransition(() => {
      router.push(`/library/search?q=${encodeURIComponent(query)}`);
    });
  };

  return (
    <div role="search" className="flex gap-2">
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        aria-label={t('aria')}
        placeholder={t('placeholder')}
        className="input-base flex-1"
      />
      <button type="button" className="btn-primary" onClick={submit} disabled={isPending || !q.trim()}>
        {isPending ? t('pending') : t('button')}
      </button>
    </div>
  );
}
