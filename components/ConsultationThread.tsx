'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

// A consultation thread (#21): messages stream in over SSE from /api/shares/:id/stream, and
// the form posts to /api/shares/:id/messages. EventSource reconnects by itself and sends
// Last-Event-ID; every reconnect re-sends a short overlap window, so messages are merged by id
// and kept in createdAt order.

interface ThreadMessage {
  id: string;
  authorRole: 'owner' | 'practitioner';
  body: string;
  createdAt: string;
}

const MAX_LENGTH = 2_000; // the service's limit (#5)

/** Adds messages that are new by id, keeping the thread oldest first (ties by id, like the server). */
function merge(current: ThreadMessage[], incoming: ThreadMessage[]): ThreadMessage[] {
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) =>
    a.createdAt === b.createdAt ? (a.id < b.id ? -1 : 1) : a.createdAt < b.createdAt ? -1 : 1,
  );
}

export default function ConsultationThread({
  shareId,
  viewerRole,
  closed,
}: {
  shareId: string;
  viewerRole: 'owner' | 'practitioner';
  closed: boolean;
}) {
  const t = useTranslations('consultations.thread');
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const source = new EventSource(`/api/shares/${encodeURIComponent(shareId)}/stream`);
    source.addEventListener('message', (event) => {
      try {
        setMessages((current) => merge(current, [JSON.parse((event as MessageEvent<string>).data) as ThreadMessage]));
      } catch {
        // A malformed event is skipped; the next poll or reconnect brings the thread back in sync.
      }
    });
    // The server ends the stream with this when a poll fails (for example, the share was revoked).
    source.addEventListener('stream-error', () => {
      setStatus(t('streamError'));
      source.close();
    });
    return () => source.close();
  }, [shareId, t]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setStatus('');
    try {
      const res = await fetch(`/api/shares/${encodeURIComponent(shareId)}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) return setStatus(res.status === 403 ? t('closed') : t('sendFailed'));
      const { message } = (await res.json()) as { message: ThreadMessage };
      setMessages((current) => merge(current, [message]));
      setDraft('');
    } catch {
      setStatus(t('sendFailed'));
    } finally {
      setSending(false);
    }
  }

  const label = (m: ThreadMessage) => (m.authorRole === viewerRole ? t('you') : t(m.authorRole));

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      <ul role="log" aria-live="polite" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
        {messages.length === 0 && <li style={{ color: 'var(--t-faint)' }}>{t('empty')}</li>}
        {messages.map((m) => (
          <li
            key={m.id}
            className="card-glass"
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid var(--t-border)',
              justifySelf: m.authorRole === viewerRole ? 'end' : 'start',
              maxWidth: '85%',
            }}
          >
            <p style={{ fontSize: 12, color: 'var(--t-faint)', marginBottom: 4 }}>{label(m)}</p>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{m.body}</p>
          </li>
        ))}
      </ul>

      {closed ? (
        <p style={{ color: 'var(--t-faint)' }}>{t('closed')}</p>
      ) : (
        <form
          style={{ display: 'grid', gap: 8 }}
          onSubmit={(e) => { e.preventDefault(); void send(); }}
        >
          <label htmlFor="consultation-message" style={{ fontSize: 13, color: 'var(--t-faint)' }}>{t('messageLabel')}</label>
          <textarea
            id="consultation-message"
            required
            rows={3}
            maxLength={MAX_LENGTH}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Ctrl/Cmd + Enter sends; Enter alone makes a new line.
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void send(); }
            }}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--t-border)', background: 'transparent', color: 'inherit', resize: 'vertical' }}
          />
          <div>
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid var(--t-border)', background: 'transparent', color: 'var(--t-gold)', cursor: 'pointer' }}
            >
              {sending ? t('sending') : t('send')}
            </button>
          </div>
        </form>
      )}
      <p role="status" aria-live="polite" style={{ minHeight: 18, fontSize: 13, color: 'var(--t-faint)' }}>{status}</p>
    </section>
  );
}
