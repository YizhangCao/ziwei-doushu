'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface ChartSummary {
  id: string;
  name: string;
  createdAt: string;
}

type RowMode = { kind: 'view' } | { kind: 'rename'; draft: string } | { kind: 'confirm-delete' };

const button = {
  padding: '4px 12px', borderRadius: 8, border: '1px solid var(--t-border)',
  background: 'transparent', color: 'var(--t-gold)', cursor: 'pointer', fontSize: 13,
} as const;

/** Lists the member's saved charts, with open, rename and delete (after a confirmation). */
export default function SavedChartsList() {
  const [charts, setCharts] = useState<ChartSummary[] | null>(null);
  const [modes, setModes] = useState<Record<string, RowMode>>({});
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/charts');
      if (!res.ok) throw new Error(String(res.status));
      setCharts(((await res.json()) as { charts: ChartSummary[] }).charts);
    } catch {
      setMessage('命盘列表加载失败，请刷新重试。');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const setMode = (id: string, mode: RowMode) => setModes((m) => ({ ...m, [id]: mode }));

  async function rename(id: string, name: string) {
    const res = await fetch(`/api/charts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      return setMessage(res.status === 400 && body.error ? body.error : '重命名失败，请稍后重试。');
    }
    setMode(id, { kind: 'view' });
    setMessage('已重命名。');
    await load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/charts/${id}`, { method: 'DELETE' });
    if (!res.ok) return setMessage('删除失败，请稍后重试。');
    setMessage('已删除。');
    await load();
  }

  return (
    <section>
      <p role="status" aria-live="polite" style={{ minHeight: 20, fontSize: 13, color: 'var(--t-faint)' }}>{message}</p>
      {charts === null && !message && <p style={{ color: 'var(--t-faint)' }}>加载中…</p>}
      {charts?.length === 0 && (
        <p style={{ color: 'var(--t-faint)' }}>
          还没有保存的命盘。<Link href="/chart" style={{ color: 'var(--t-gold)' }}>去排一张</Link>
        </p>
      )}
      {charts && charts.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 10 }}>
          {charts.map((c) => {
            const mode = modes[c.id] ?? { kind: 'view' };
            return (
              <li key={c.id} className="card-glass" style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid var(--t-border)' }}>
                {mode.kind === 'rename' ? (
                  <form
                    style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}
                    onSubmit={(e) => { e.preventDefault(); void rename(c.id, mode.draft); }}
                    onKeyDown={(e) => { if (e.key === 'Escape') setMode(c.id, { kind: 'view' }); }}
                  >
                    <label htmlFor={`rename-${c.id}`} style={{ fontSize: 13, color: 'var(--t-faint)' }}>新名称</label>
                    <input
                      id={`rename-${c.id}`}
                      autoFocus
                      required
                      maxLength={80}
                      value={mode.draft}
                      onChange={(e) => setMode(c.id, { kind: 'rename', draft: e.target.value })}
                      style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid var(--t-border)', background: 'transparent', color: 'inherit' }}
                    />
                    <button type="submit" style={button}>保存名称</button>
                    <button type="button" style={button} onClick={() => setMode(c.id, { kind: 'view' })}>取消</button>
                  </form>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <Link href={`/chart?id=${encodeURIComponent(c.id)}`} style={{ color: 'var(--t-gold)', fontWeight: 600, marginRight: 'auto' }}>
                      {c.name}
                    </Link>
                    {mode.kind === 'confirm-delete' ? (
                      <>
                        <span style={{ fontSize: 13 }}>确定删除这个命盘？</span>
                        <button type="button" style={button} onClick={() => void remove(c.id)}>确认删除</button>
                        <button type="button" style={button} onClick={() => setMode(c.id, { kind: 'view' })}>取消</button>
                      </>
                    ) : (
                      <>
                        <button type="button" style={button} onClick={() => setMode(c.id, { kind: 'rename', draft: c.name })}>重命名</button>
                        <button type="button" style={button} onClick={() => setMode(c.id, { kind: 'confirm-delete' })}>删除</button>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
