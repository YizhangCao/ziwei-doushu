'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { rateLimitWait } from '@/lib/rate-limit/message';
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import type { TimeView } from './TimeNav';
import AiContent from './AiContent';
import { useLocale, useTranslations } from 'next-intl';
import { termLabel } from '@/lib/i18n/glossary';
import { formatList } from '@/lib/i18n/format';
import { savableMessages } from '@/lib/conversations/savable';
// The server's limits, checked here too so the panel can say why a question can't be sent.
import { MAX_USER_CHARS, fitsInterpretLimits, toInterpretHistory } from '@/lib/ai/interpret-limits';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  hidden?: boolean; // don't show user bubble for auto/topic messages
  /** Why the request failed (#63); the panel offers a retry when trying again can help. */
  error?: ReadingError;
}

/**
 * Each cause has its own message, so a used-up limit never reads like a bug (#63). A refused
 * request (400) is not retryable: sending the same request again gets the same answer.
 */
type ReadingError = 'network' | 'apiMissing' | 'loginRequired' | 'rateLimited' | 'rejected' | 'failed';
const RETRYABLE: ReadonlySet<ReadingError> = new Set(['network', 'failed']);

/** The character counter appears once a question gets this long. */
const COUNTER_FROM = 1800;

interface SelectedSiHua {
  starName: string;
  siHua: string;
  view: TimeView;
}

interface InsightPanelProps {
  chart: ZiweiChart;
  selectedPalace?: Palace | null;
  selectedSiHua?: SelectedSiHua | null;
  /** A saved chart's id: the conversation is kept there and shown again when it is reopened (#22). */
  chartId?: string;
}

// Labels and prompts live in messages/{zh,en}/insight.json (#59); the Chinese is verbatim.
const TOPICS = ['overview', 'love', 'career', 'wealth', 'health', 'personality'] as const;
type Topic = (typeof TOPICS)[number];

/** What the panel is reading while it waits; kept as data so the line follows a language switch (#63). */
type Reading =
  | { kind: 'overview' }
  | { kind: 'topic'; topic: Exclude<Topic, 'overview'> }
  | { kind: 'palace'; palace: string }
  | { kind: 'sihua'; star: string; sihua: string }
  | { kind: 'answer' };

// Palace → role key in messages/*/insight.json. The keys mirror today's lookup exactly,
// including its 宫-suffix mismatch with the engine's palace names (fixed in its own PR).
const PALACE_ROLE_KEYS = {
  '命宫': 'life', '兄弟宫': 'brothers', '夫妻宫': 'marriage', '子女宫': 'children',
  '财帛宫': 'wealth', '疾厄宫': 'illness', '迁移宫': 'travel', '交友宫': 'companions',
  '官禄宫': 'office', '田宅宫': 'estate', '福德宫': 'fortune', '父母宫': 'parents',
} as const;
type RoleKey = (typeof PALACE_ROLE_KEYS)[keyof typeof PALACE_ROLE_KEYS];
const roleKeyFor = (palaceName: string): RoleKey | undefined =>
  (PALACE_ROLE_KEYS as Record<string, RoleKey>)[palaceName];

/** The saved conversation of a chart, or null when it couldn't be read (#22). */
async function loadConversation(chartId: string): Promise<Message[] | null> {
  try {
    const res = await fetch(`/api/charts/${encodeURIComponent(chartId)}/conversation`);
    if (!res.ok) return null;
    const { messages } = (await res.json()) as { messages: { role: Message['role']; content: string; hidden: boolean }[] };
    return messages.map(({ role, content, hidden }) => ({ role, content, hidden }));
  } catch {
    return null;
  }
}

export default function InsightPanel({ chart, selectedPalace, selectedSiHua, chartId }: InsightPanelProps) {
  const t = useTranslations('insight');
  const locale = useLocale();
  const term = (zh: string) => termLabel(zh, locale);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState<Topic>('overview');
  const [reading, setReading] = useState<Reading>({ kind: 'overview' });
  const messagesRef = useRef<Message[]>([]); // always-current copy for closures
  const loadingRef = useRef(false);
  const autoLoaded = useRef(false);
  const lastPalaceBranch = useRef<number | undefined>(undefined);
  const lastSiHuaKey = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  // The saved conversation (#22): how many savable messages are already stored, whether a save
  // is in flight, and whether saving is off because the stored conversation couldn't be read.
  const chartIdRef = useRef(chartId);
  const savedCount = useRef(0);
  const saving = useRef(false);
  const savingOff = useRef(false);

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);
  useEffect(() => { chartIdRef.current = chartId; }, [chartId]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-generate 命格总览 on mount. A reopened saved chart shows its saved conversation instead,
  // without asking the AI again (#22). No cleanup: with autoLoaded set, a StrictMode re-run would
  // skip the load, so the first run must finish.
  useEffect(() => {
    if (autoLoaded.current) return;
    autoLoaded.current = true;
    const overview = () => sendMessage(t('prompts.overview'), true, { kind: 'overview' });
    if (!chartId) { overview(); return; }
    void (async () => {
      const stored = await loadConversation(chartId);
      if (stored === null) savingOff.current = true; // never append to a conversation we couldn't read
      if (!stored?.length) return overview();
      savedCount.current = stored.length;
      setMessages(stored);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Saves finished exchanges to a saved chart's conversation (#22): after each reply, and once the
  // chart is saved mid-conversation, so the reading from before saving is kept too. Reads refs, so
  // a save that finishes can check again for anything that finished meanwhile.
  const saveFinished = () => {
    const id = chartIdRef.current;
    if (!id || loadingRef.current || saving.current || savingOff.current) return;
    const unsaved = savableMessages(messagesRef.current).slice(savedCount.current);
    if (unsaved.length === 0) return;
    saving.current = true;
    fetch(`/api/charts/${encodeURIComponent(id)}/conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: unsaved }),
    })
      .then((res) => { if (res.ok) savedCount.current += unsaved.length; return res.ok; })
      .catch(() => false) // a failed save is tried again after the next reply
      .then((saved) => { saving.current = false; if (saved) saveFinished(); });
  };
  useEffect(saveFinished, [chartId, loading, messages]); // eslint-disable-line react-hooks/exhaustive-deps

  // Inject palace analysis when palace selected
  useEffect(() => {
    if (!selectedPalace || selectedPalace.branch === lastPalaceBranch.current) return;

    const majorStars = selectedPalace.stars.filter(s => s.type === 'major');
    const starDesc = majorStars.length > 0
      ? formatList(majorStars.map(s => s.siHua ? t('starWithSihua', { star: term(s.name), sihua: term(`化${s.siHua}`) }) : term(s.name)), locale)
      : t('emptyPalace');
    const roleKey = roleKeyFor(selectedPalace.name);
    const role = roleKey ? t(`roles.${roleKey}`) : '';

    const prompt = t('prompts.palace', { palace: term(selectedPalace.name), role, stars: starDesc });

    if (sendMessage(prompt, true, { kind: 'palace', palace: selectedPalace.name })) lastPalaceBranch.current = selectedPalace.branch;
  }, [selectedPalace]); // eslint-disable-line react-hooks/exhaustive-deps

  // 注入四化飞化分析
  useEffect(() => {
    if (!selectedSiHua) return;
    const key = `${selectedSiHua.starName}-${selectedSiHua.siHua}-${selectedSiHua.view}`;
    if (key === lastSiHuaKey.current) return;

    // 找出该星所在宫位
    const palaceOfStar = chart.palaces.find(p =>
      p.stars.some(s => s.name === selectedSiHua.starName)
    );
    const palaceName = palaceOfStar ? term(palaceOfStar.name) : t('unknownPalace');
    const viewLabel = selectedSiHua.view === 'daxian' ? t('view.daxian') : t('view.liunian');

    const prompt = t('prompts.sihua', {
      view: viewLabel,
      star: term(selectedSiHua.starName),
      sihua: term(`化${selectedSiHua.siHua}`),
      palace: palaceName,
    });

    if (sendMessage(prompt, true, { kind: 'sihua', star: selectedSiHua.starName, sihua: selectedSiHua.siHua })) lastSiHuaKey.current = key;
  }, [selectedSiHua]); // eslint-disable-line react-hooks/exhaustive-deps

  const fail = (cause: ReadingError) => {
    // The developer note only shows in `next dev`; visitors see the plain message.
    const devNote = cause === 'apiMissing' && process.env.NODE_ENV === 'development' ? `\n\n${t('errors.apiMissingDev')}` : '';
    setMessages(prev => [...prev, { role: 'assistant', content: t(`errors.${cause}`) + devNote, error: cause }]);
  };

  const streamResponse = async (apiMessages: { role: 'user' | 'assistant'; content: string }[]) => {
    try {
      let res: Response;
      try {
        res = await fetch('/api/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chart, messages: apiMessages }),
        });
      } catch {
        return fail('network'); // fetch rejects only when no answer came back
      }
      if (res.status === 404) return fail('apiMissing');
      if (res.status === 401) return fail('loginRequired'); // AI readings are for members (#15)
      if (res.status === 429) {
        // With Retry-After (the hourly limit, #9) the reply says how long to wait;
        // without it, the plain used-up message (#63)
        const wait = rateLimitWait(Number(res.headers.get('retry-after') ?? ''));
        if (!wait) return fail('rateLimited');
        const content = 'minutes' in wait ? t('errors.rateLimitedMinutes', wait) : t('errors.rateLimitedHours', wait);
        setMessages(prev => [...prev, { role: 'assistant', content, error: 'rateLimited' }]);
        return;
      }
      if (res.status === 400) return fail('rejected');
      if (!res.ok || !res.body) return fail('failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const delta = JSON.parse(data).delta?.text ?? '';
            assistantText += delta;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content: assistantText };
              return updated;
            });
          } catch { /* skip */ }
        }
      }
    } catch {
      fail('network'); // reading the stream rejects when the connection drops mid-reply
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const lastRequest = useRef<{ text: string; hidden: boolean; what: Reading } | null>(null);

  /**
   * Sends a message; returns false when it was not sent: empty, a reply still streaming,
   * or over the server's limits (the input area then says which).
   */
  const sendMessage = (text: string, hidden: boolean, what: Reading): boolean => {
    if (!text.trim() || loadingRef.current) return false;
    const userMsg: Message = { role: 'user', content: text, hidden };
    // Read the history through the ref (a closure could be stale). It leaves the panel's own
    // failure messages out, and the whole request must fit the server's limits (#105).
    const apiMessages = [...toInterpretHistory(messagesRef.current), { role: userMsg.role, content: text }];
    if (text.length > MAX_USER_CHARS || !fitsInterpretLimits(apiMessages)) return false;
    loadingRef.current = true;
    setLoading(true);
    setReading(what);
    lastRequest.current = { text, hidden, what };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    streamResponse(apiMessages);
    return true;
  };

  /** Drops the failed exchange and sends the same request again. */
  const retry = () => {
    const request = lastRequest.current;
    if (!request || loadingRef.current) return;
    // The failed exchange is the last question and everything after it: the error, and an
    // empty or partial reply before it if the stream had started. Cut back to before it.
    const question = messagesRef.current.findLastIndex(m => m.role === 'user');
    const trimmed = messagesRef.current.slice(0, Math.max(question, 0));
    messagesRef.current = trimmed;
    setMessages(trimmed);
    sendMessage(request.text, request.hidden, request.what);
  };

  const handleTopicClick = (topic: Topic) => {
    if (loadingRef.current) return;
    setActiveTopic(topic);
    sendMessage(t(`prompts.${topic}`), true, topic === 'overview' ? { kind: 'overview' } : { kind: 'topic', topic });
  };

  const handleSend = () => {
    sendMessage(input, false, { kind: 'answer' });
  };

  const readingLine = (what: Reading): string => {
    switch (what.kind) {
      case 'overview': return t('reading.overview');
      case 'topic': return t('reading.topic', { topic: what.topic });
      // 命宫 already ends in 宫, the other eleven names don't; English adds "Palace" in the message
      case 'palace': return t('reading.palace', {
        palace: locale === 'en' ? term(what.palace) : what.palace.endsWith('宫') ? what.palace : `${what.palace}宫`,
      });
      case 'sihua': return t('reading.sihua', { star: term(what.star), sihua: term(`化${what.sihua}`) });
      case 'answer': return t('reading.answer');
    }
  };

  const last = messages[messages.length - 1];
  // Between sending and the first words of the reply, the panel says what it is reading (#63).
  const waiting = loading && !(last?.role === 'assistant' && last.content !== '');
  const anyShown = messages.some(m => (m.role === 'user' && !m.hidden) || (m.role === 'assistant' && m.content !== ''));
  const tooLong = input.length > MAX_USER_CHARS;
  // Full when one more question, the one being typed, would pass the server's limits.
  const tooMany = !tooLong && !fitsInterpretLimits([...toInterpretHistory(messages), { role: 'user', content: input }]);

  return (
    <div className="flex flex-col h-full overflow-hidden card-glass" style={{ minHeight: 480 }}>

      {/* ── Topic buttons ── */}
      <div className="flex-shrink-0 px-2" style={{ borderBottom: '1px solid var(--t-border)' }}>
        {/* English labels are longer: three per row instead of six (#59) */}
        <div className={locale === 'en' ? 'grid grid-cols-3' : 'grid grid-cols-6'}>
          {TOPICS.map(topic => {
            const isActive = activeTopic === topic;
            return (
              <button
                type="button"
                key={topic}
                onClick={() => handleTopicClick(topic)}
                disabled={loading}
                aria-pressed={isActive}
                style={{
                  minHeight: 44,
                  fontSize: 'var(--fs-small)',
                  background: 'none',
                  border: 'none',
                  color: isActive ? 'var(--t-text)' : 'var(--t-text2)',
                  boxShadow: isActive ? 'inset 0 -1px 0 var(--tx-0)' : 'none',
                }}
              >
                {t(`topics.${topic}`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} aria-live="polite" aria-busy={loading} className="flex-1 overflow-y-auto p-5 space-y-6 min-h-0">

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            if (msg.role === 'user' && msg.hidden) return null;
            if (msg.role === 'assistant' && msg.content === '') return null; // the reading line covers it

            if (msg.role === 'user') {
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end"
                >
                  <div
                    className="max-w-[85%] px-3 py-2"
                    style={{
                      fontSize: 'var(--fs-body)',
                      background: 'var(--bg-2)',
                      color: 'var(--t-text)',
                    }}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              );
            }

            // Assistant message
            const isLastMsg = i === messages.length - 1;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="mb-2" style={{ fontSize: 'var(--fs-caption)', color: 'var(--t-faint)' }}>{t('replyLabel')}</div>
                <AiContent text={msg.content} streaming={loading && isLastMsg} />
                {msg.error && RETRYABLE.has(msg.error) && isLastMsg && !loading && (
                  <button type="button" className="btn-ghost btn-sm mt-3" onClick={retry}>{t('retry')}</button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* What the panel is reading, centred before the first reply and inline after it */}
        {(waiting || messages.length === 0) && (
          <div className={anyShown ? 'flex items-center gap-3' : 'flex flex-col items-center justify-center h-full gap-3 text-center'}>
            <span aria-hidden="true" className="pole-mark animate-breathe" />
            <p style={{ fontSize: 'var(--fs-small)', color: 'var(--t-text2)' }}>{readingLine(reading)}</p>
          </div>
        )}
      </div>

      {/* ── Input ── */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2" style={{ borderTop: '1px solid var(--t-border)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={t('inputPlaceholder')}
            disabled={loading}
            aria-label={t('inputLabel')}
            aria-invalid={tooLong || undefined}
            aria-describedby={tooLong || tooMany || input.length >= COUNTER_FROM ? 'insight-input-note' : undefined}
            className="input-base flex-1"
            style={{ minHeight: 44 }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !input.trim() || tooLong || tooMany}
            className="btn-primary btn-sm"
          >
            {loading ? '…' : t('send')}
          </button>
        </div>
        {/* Why a question can't be sent, or how much room is left; never a silent 400 (#63) */}
        {tooLong || tooMany ? (
          <p id="insight-input-note" role="alert" className="mt-2" style={{ fontSize: 'var(--fs-caption)', color: 'var(--ji)' }}>
            {tooMany ? t('errors.tooMany') : t('errors.tooLong')}
          </p>
        ) : input.length >= COUNTER_FROM && (
          <p id="insight-input-note" className="mt-2" style={{ fontSize: 'var(--fs-caption)', color: 'var(--t-text2)' }}>
            {t('charsLeft', { n: MAX_USER_CHARS - input.length })}
          </p>
        )}
      </div>

    </div>
  );
}
