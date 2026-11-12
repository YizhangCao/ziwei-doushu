'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
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
  const [name, setName] = useState(birthInfo.name ?? '');
  const [state, setState] = useState<SaveState>({ kind: 'idle' });

  if (savedName) {
    return (
      <div className="card-glass" style={box}>
        <span style={{ color: 'var(--t-faint)' }}>已保存的命盘：</span>
        <strong style={{ color: 'var(--t-gold)' }}>{savedName}</strong>
        <Link href="/charts" style={{ marginLeft: 12, color: 'var(--t-gold)' }}>我的命盘</Link>
      </div>
    );
  }
  if (status === 'loading') return null;
  if (status !== 'authenticated') {
    return (
      <div className="card-glass" style={box}>
        <Link href="/login?callbackUrl=%2Fchart" style={{ color: 'var(--t-gold)' }}>登录后保存命盘</Link>
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
      setState({ kind: 'error', message: res.status === 400 && body.error ? body.error : '保存失败，请稍后重试。' });
    } catch {
      setState({ kind: 'error', message: '保存失败，请检查网络后重试。' });
    }
  }

  return (
    <form
      className="card-glass"
      style={{ ...box, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}
      onSubmit={(e) => { e.preventDefault(); void save(); }}
    >
      <label htmlFor="save-chart-name" style={{ color: 'var(--t-faint)', fontSize: 13 }}>命盘名称</label>
      <input
        id="save-chart-name"
        value={name}
        onChange={(e) => { setName(e.target.value); if (state.kind !== 'saving') setState({ kind: 'idle' }); }}
        maxLength={80}
        required
        placeholder="例如：妈妈"
        style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--t-border)', background: 'transparent', color: 'inherit' }}
      />
      <button type="submit" disabled={state.kind === 'saving'} style={button}>
        {state.kind === 'saving' ? '保存中…' : '保存命盘'}
      </button>
      <span role="status" aria-live="polite" style={{ fontSize: 13, color: 'var(--t-faint)' }}>
        {state.kind === 'saved' && (<>已保存。<Link href="/charts" style={{ color: 'var(--t-gold)' }}>查看我的命盘</Link></>)}
        {state.kind === 'error' && state.message}
      </span>
    </form>
  );
}
