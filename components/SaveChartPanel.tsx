'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import type { BirthInfo } from '@/lib/ziwei/types';

interface SaveChartPanelProps {
  birthInfo: BirthInfo;
  /** Set when the chart was opened from /charts, so saving again isn't offered. */
  savedName?: string;
}

type SaveState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' } | { kind: 'error'; message: string };

const box = { padding: '12px 14px', marginBottom: 16, borderRadius: 12, border: '1px solid var(--t-border)' } as const;
const button = {
  padding: '6px 14px', borderRadius: 8, border: '1px solid var(--t-border)',
  background: 'transparent', color: 'var(--t-gold)', cursor: 'pointer',
} as const;

/** "Save chart" on /chart: a name field and a button for members, a login link for guests. */
export default function SaveChartPanel({ birthInfo, savedName }: SaveChartPanelProps) {
  const { status } = useSession();
  const t = useTranslations('charts.save');
  // Starts empty on purpose: Chart.name is stored in plaintext, while the name typed into the
  // birth form is part of the encrypted birth data, so a real name must not be copied over.
  const [name, setName] = useState('');
  const [state, setState] = useState<SaveState>({ kind: 'idle' });

  if (savedName) {
    return (
      <div className="card-glass" style={box}>
        <span style={{ color: 'var(--t-faint)' }}>{t('savedLabel')}</span>
        <strong style={{ color: 'var(--t-gold)' }}>{savedName}</strong>
        <Link href="/charts" style={{ marginLeft: 12, color: 'var(--t-gold)' }}>{t('myCharts')}</Link>
      </div>
    );
  }
  if (status === 'loading') return null;
  if (status !== 'authenticated') {
    return (
      <div className="card-glass" style={box}>
        <Link href="/login?callbackUrl=%2Fchart" style={{ color: 'var(--t-gold)' }}>{t('signInToSave')}</Link>
      </div>
    );
  }

  async function save() {
    setState({ kind: 'saving' });
    try {
      const res = await fetch('/api/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, birthInfo }),
      });
      if (res.status === 201) return setState({ kind: 'saved' });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setState({ kind: 'error', message: res.status === 400 && body.error ? body.error : t('failed') });
    } catch {
      setState({ kind: 'error', message: t('network') });
    }
  }

  return (
    <form
      className="card-glass"
      style={{ ...box, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}
      onSubmit={(e) => { e.preventDefault(); void save(); }}
    >
      <label htmlFor="save-chart-name" style={{ color: 'var(--t-faint)', fontSize: 13 }}>{t('nameLabel')}</label>
      <input
        id="save-chart-name"
        value={name}
        onChange={(e) => { setName(e.target.value); if (state.kind !== 'saving') setState({ kind: 'idle' }); }}
        maxLength={80}
        required
        placeholder={t('namePlaceholder')}
        style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--t-border)', background: 'transparent', color: 'inherit' }}
      />
      <button type="submit" disabled={state.kind === 'saving'} style={button}>
        {state.kind === 'saving' ? t('saving') : t('save')}
      </button>
      <span role="status" aria-live="polite" style={{ fontSize: 13, color: 'var(--t-faint)' }}>
        {state.kind === 'saved' && t.rich('saved', { link: (chunks) => <Link href="/charts" style={{ color: 'var(--t-gold)' }}>{chunks}</Link> })}
        {state.kind === 'error' && state.message}
      </span>
    </form>
  );
}
