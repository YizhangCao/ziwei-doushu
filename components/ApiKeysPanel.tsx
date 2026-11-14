'use client';
import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

interface ApiKeySummary {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

const button = {
  padding: '6px 14px', borderRadius: 8, border: '1px solid var(--t-border)',
  background: 'transparent', color: 'var(--t-gold)', cursor: 'pointer', fontSize: 13,
} as const;

/** Create API keys (the plain key is shown once, in memory only) and revoke them. */
export default function ApiKeysPanel() {
  const t = useTranslations('settings.keys');
  const locale = useLocale();
  // Dates follow the visitor's language (#59)
  const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString(locale === 'en' ? 'en-US' : 'zh-CN') : t('never'));
  const [keys, setKeys] = useState<ApiKeySummary[] | null>(null);
  const [name, setName] = useState('');
  // Lives only in this component's state: never stored, and gone after a reload.
  const [newKey, setNewKey] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/keys');
      if (!res.ok) throw new Error(String(res.status));
      setKeys(((await res.json()) as { keys: ApiKeySummary[] }).keys);
    } catch {
      setMessage(t('loadFailed'));
    }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  async function create() {
    setMessage('');
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const body = (await res.json().catch(() => ({}))) as { plainKey?: string; error?: string };
    if (res.status !== 201 || !body.plainKey) {
      return setMessage(res.status === 400 && body.error ? body.error : t('createFailed'));
    }
    setNewKey(body.plainKey);
    setName('');
    await load();
  }

  async function revoke(id: string) {
    const res = await fetch(`/api/keys/${id}`, { method: 'DELETE' });
    setConfirming(null);
    if (!res.ok) return setMessage(t('revokeFailed'));
    setMessage(t('revoked'));
    await load();
  }

  return (
    <section className="card-glass" style={{ padding: 20, borderRadius: 12, border: '1px solid var(--t-border)' }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--t-gold)' }}>{t('heading')}</h2>
      <p style={{ fontSize: 13, color: 'var(--t-faint)', marginBottom: 16, lineHeight: 1.7 }}>
        {t.rich('intro', {
          code: (chunks) => <code>{chunks}</code>,
          link: (chunks) => <a href="/api-docs" style={{ color: 'var(--t-gold)' }}>{chunks}</a>,
        })}
      </p>

      <form
        style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 16 }}
        onSubmit={(e) => { e.preventDefault(); void create(); }}
      >
        <label htmlFor="api-key-name" style={{ fontSize: 13, color: 'var(--t-faint)' }}>{t('nameLabel')}</label>
        <input
          id="api-key-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={60}
          placeholder={t('namePlaceholder')}
          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--t-border)', background: 'transparent', color: 'inherit' }}
        />
        <button type="submit" style={button}>{t('create')}</button>
      </form>

      {newKey && (
        <div role="alert" style={{ padding: 12, borderRadius: 8, border: '1px solid var(--t-gold)', marginBottom: 16 }}>
          <p style={{ fontSize: 13, marginBottom: 8 }}>{t('newKey')}</p>
          <code data-testid="new-api-key" style={{ display: 'block', wordBreak: 'break-all', userSelect: 'all', fontSize: 13 }}>{newKey}</code>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button type="button" style={button} onClick={() => void navigator.clipboard?.writeText(newKey)}>{t('copy')}</button>
            <button type="button" style={button} onClick={() => setNewKey(null)}>{t('done')}</button>
          </div>
        </div>
      )}

      <p role="status" aria-live="polite" style={{ minHeight: 20, fontSize: 13, color: 'var(--t-faint)' }}>{message}</p>

      {keys?.length === 0 && <p style={{ color: 'var(--t-faint)' }}>{t('empty')}</p>}
      {keys && keys.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 10 }}>
          {keys.map((k) => (
            <li key={k.id} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--t-border)', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <div style={{ marginRight: 'auto' }}>
                <div style={{ fontWeight: 600 }}>{k.name}</div>
                <div style={{ fontSize: 12, color: 'var(--t-faint)' }}>
                  <code>{k.prefix}…</code> · {t('dates', { created: formatDate(k.createdAt), lastUsed: formatDate(k.lastUsedAt) })}
                </div>
              </div>
              {k.revokedAt ? (
                <span style={{ fontSize: 13, color: 'var(--t-faint)' }}>{t('revokedBadge')}</span>
              ) : confirming === k.id ? (
                <>
                  <span style={{ fontSize: 13 }}>{t('confirmText')}</span>
                  <button type="button" style={button} onClick={() => void revoke(k.id)}>{t('confirm')}</button>
                  <button type="button" style={button} onClick={() => setConfirming(null)}>{t('cancel')}</button>
                </>
              ) : (
                <button type="button" style={button} onClick={() => setConfirming(k.id)}>{t('revoke')}</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
