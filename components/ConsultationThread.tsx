'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

// A consultation thread (#21): messages stream in over SSE from /api/shares/:id/stream, and
// the form posts to /api/shares/:id/messages. EventSource reconnects by itself and sends
// Last-Event-ID; every reconnect re-sends a short overlap window, so messages are merged by id
// and kept in createdAt order.
//
// The stream is open only while it can bring something new (#21 review): a hidden tab closes
// it, so the function and the database can go idle, and a closed thread never opens one. When
// the stream ends, the page asks for the thread before reconnecting, because a revoke and a
// failed poll end it the same way.

interface ThreadMessage {
  id: string;
  authorRole: 'owner' | 'practitioner';
  body: string;
  createdAt: string;
}

const MAX_LENGTH = 2_000; // the service's limit (#5)
/** Wait before reopening a stream that ended while the thread is still open. */
const RECONNECT_MS = 3_000;

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
  const [isClosed, setIsClosed] = useState(closed);
  // The newest message the page has, so a reopened stream starts after it instead of replaying.
  const newestId = useRef<string | null>(null);
  useEffect(() => { newestId.current = messages.at(-1)?.id ?? null; }, [messages]);

  const thread = `/api/shares/${encodeURIComponent(shareId)}`;

  // A closed thread can't change, so one read is enough.
  useEffect(() => {
    if (!isClosed) return;
    let cancelled = false;
    fetch(`${thread}/messages`)
      .then((res) => (res.ok ? (res.json() as Promise<{ messages: ThreadMessage[] }>) : null))
      .then((data) => { if (data && !cancelled) setMessages((current) => merge(current, data.messages)); })
      .catch(() => { /* The note below still says the thread is closed. */ });
    return () => { cancelled = true; };
  }, [isClosed, thread]);

  useEffect(() => {
    if (isClosed) return;
    let source: EventSource | null = null;
    let reconnect: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const close = () => { source?.close(); source = null; };

    const open = () => {
      if (stopped || source || document.visibilityState === 'hidden') return;
      const cursor = newestId.current;
      const es = new EventSource(cursor ? `${thread}/stream?cursor=${encodeURIComponent(cursor)}` : `${thread}/stream`);
      source = es;
      es.addEventListener('message', (event) => {
        try {
          setMessages((current) => merge(current, [JSON.parse((event as MessageEvent<string>).data) as ThreadMessage]));
        } catch {
          // A malformed event is skipped; the next poll or reconnect brings the thread back in sync.
        }
      });
      // The server sends stream-error when a poll fails; EventSource gives up (CLOSED) when a
      // reconnect is refused. Either way, find out why before trying again.
      es.addEventListener('stream-error', () => { void ended(); });
      es.onerror = () => { if (es.readyState === EventSource.CLOSED) void ended(); };
    };

    const ended = async () => {
      close();
      try {
        const res = await fetch(thread);
        if (stopped) return;
        if (res.status === 404) return setIsClosed(true); // revoked, for the practitioner
        if (res.status === 401) return setStatus(t('signedOut'));
        if (res.ok) {
          const data = (await res.json()) as { thread: { closed: boolean } };
          if (data.thread.closed) return setIsClosed(true);
        }
      } catch {
        // Offline or a server hiccup: try again below.
      }
      if (!stopped) reconnect = setTimeout(open, RECONNECT_MS);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        clearTimeout(reconnect);
        close();
      } else {
        open();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    open();
    return () => {
      stopped = true;
      clearTimeout(reconnect);
      document.removeEventListener('visibilitychange', onVisibility);
      close();
    };
  }, [isClosed, thread, t]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setStatus('');
    try {
      const res = await fetch(`${thread}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      // 403: the owner on a revoked share. 404: the practitioner after a revoke, who can no
      // longer see the thread at all. Both mean the thread is closed, not that sending broke.
      if (res.status === 403 || res.status === 404) return setIsClosed(true);
      if (!res.ok) return setStatus(t('sendFailed'));
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
      {/* The log announces new messages; the list stays a list, so each message keeps its list item role. */}
      <div role="log" aria-live="polite">
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
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
      </div>

      {isClosed ? (
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
