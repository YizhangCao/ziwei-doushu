'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

// Share one saved chart with a practitioner by email, see who it is shared with, open each
// consultation thread, and stop sharing (#21). Shown under a row on /charts.

interface ChartShare {
  id: string;
  practitionerEmail: string;
  createdAt: string;
}

const button = {
  padding: '4px 12px', borderRadius: 8, border: '1px solid var(--t-border)',
  background: 'transparent', color: 'var(--t-gold)', cursor: 'pointer', fontSize: 13,
} as const;

export default function SharePanel({ chartId }: { chartId: string }) {
  const t = useTranslations('consultations.share');
  const [shares, setShares] = useState<ChartShare[] | null>(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/charts/${encodeURIComponent(chartId)}/shares`);
      if (!res.ok) throw new Error(String(res.status));
      setShares(((await res.json()) as { shares: ChartShare[] }).shares);
    } catch {
      setStatus(t('failed'));
    }
  }, [chartId, t]);

  useEffect(() => { void load(); }, [load]);

  async function share() {
    setBusy(true);
    try {
      const res = await fetch(`/api/charts/${encodeURIComponent(chartId)}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // 400 covers an invalid email and "no practitioner with that email" alike, on purpose.
      if (!res.ok) return setStatus(res.status === 400 ? t('noPractitioner') : t('failed'));
      setStatus(t('shared', { email: email.trim() }));
      setEmail('');
      await load();
    } catch {
      setStatus(t('failed'));
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/shares/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setStatus(res.ok ? t('revoked') : t('revokeFailed'));
      await load();
    } catch {
      setStatus(t('revokeFailed'));
    } finally {
      setBusy(false);
    }
  }

  const inputId = `share-email-${chartId}`;
  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--t-border)', display: 'grid', gap: 8 }}>
      <form
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}
        onSubmit={(e) => { e.preventDefault(); if (!busy) void share(); }}
      >
        <label htmlFor={inputId} style={{ fontSize: 13, color: 'var(--t-faint)' }}>{t('emailLabel')}</label>
        <input
          id={inputId}
          type="email"
          required
          maxLength={320}
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid var(--t-border)', background: 'transparent', color: 'inherit' }}
        />
        <button type="submit" style={button} disabled={busy}>{busy ? t('sharing') : t('submit')}</button>
      </form>
      <p role="status" aria-live="polite" style={{ minHeight: 18, fontSize: 13, color: 'var(--t-faint)' }}>{status}</p>
      {shares === null && <p style={{ fontSize: 13, color: 'var(--t-faint)' }}>{t('loading')}</p>}
      {shares?.length === 0 && <p style={{ fontSize: 13, color: 'var(--t-faint)' }}>{t('none')}</p>}
      {shares && shares.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 6 }}>
          {shares.map((s) => (
            <li key={s.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', fontSize: 13 }}>
              <span style={{ marginRight: 'auto' }}>{s.practitionerEmail}</span>
              <Link href={`/consultations/${encodeURIComponent(s.id)}`} style={{ color: 'var(--t-gold)' }}>{t('openThread')}</Link>
              <button type="button" style={button} disabled={busy} onClick={() => void revoke(s.id)}>{t('revoke')}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
