'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import type { TimeView } from './TimeNav';
import AiContent from './AiContent';
import { useLocale, useTranslations } from 'next-intl';
import { termLabel } from '@/lib/i18n/glossary';
import { formatList } from '@/lib/i18n/format';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  hidden?: boolean; // don't show user bubble for auto/topic messages
  /** The request failed; the panel offers a retry. */
  error?: boolean;
}

interface SelectedSiHua {
  starName: string;
  siHua: string;
  view: TimeView;
}

interface InsightPanelProps {
  chart: ZiweiChart;
  selectedPalace?: Palace | null;
  selectedSiHua?: SelectedSiHua | null;
}

// Labels and prompts live in messages/{zh,en}/insight.json (#59); the Chinese is verbatim.
const TOPICS = ['overview', 'love', 'career', 'wealth', 'health', 'personality'] as const;
type Topic = (typeof TOPICS)[number];

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

export default function InsightPanel({ chart, selectedPalace, selectedSiHua }: InsightPanelProps) {
  const t = useTranslations('insight');
  const locale = useLocale();
  const term = (zh: string) => termLabel(zh, locale);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState<Topic>('overview');
  const messagesRef = useRef<Message[]>([]); // always-current copy for closures
  const loadingRef = useRef(false);
  const autoLoaded = useRef(false);
  const lastPalaceBranch = useRef<number | undefined>(undefined);
  const lastSiHuaKey = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-generate 命格总览 on mount
  useEffect(() => {
    if (autoLoaded.current) return;
    autoLoaded.current = true;
    sendMessage(t('prompts.overview'), true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

    if (sendMessage(prompt, true)) lastPalaceBranch.current = selectedPalace.branch;
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

    if (sendMessage(prompt, true)) lastSiHuaKey.current = key;
  }, [selectedSiHua]); // eslint-disable-line react-hooks/exhaustive-deps

  const streamResponse = async (apiMessages: { role: 'user' | 'assistant'; content: string }[]) => {
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chart, messages: apiMessages }),
      });
      if (res.status === 404) throw new Error('api-missing');
      if (!res.ok) throw new Error('request-failed');
      if (!res.body) throw new Error('no-stream');

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
    } catch (e) {
      const missing = e instanceof Error && e.message === 'api-missing';
      setMessages(prev => [...prev, { role: 'assistant', content: missing ? t('errors.apiMissing') : t('errors.failed'), error: true }]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const lastRequest = useRef<{ text: string; hidden: boolean } | null>(null);

  /** Sends a message; returns false when it was not sent (empty, or a reply is still streaming). */
  const sendMessage = (text: string, hidden = false): boolean => {
    if (!text.trim() || loadingRef.current) return false;
    loadingRef.current = true;
    setLoading(true);
    lastRequest.current = { text, hidden };

    const userMsg: Message = { role: 'user', content: text, hidden };
    // Capture current messages synchronously via ref (avoids stale closure)
    const apiMessages = [...messagesRef.current, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    streamResponse(apiMessages);
    return true;
  };

  /** Drops the failed exchange and sends the same request again. */
  const retry = () => {
    const request = lastRequest.current;
    if (!request || loadingRef.current) return;
    const trimmed = messagesRef.current.slice(0, -2);
    messagesRef.current = trimmed;
    setMessages(trimmed);
    sendMessage(request.text, request.hidden);
  };

  const handleTopicClick = (topic: Topic) => {
    if (loadingRef.current) return;
    setActiveTopic(topic);
    sendMessage(t(`prompts.${topic}`), true);
  };

  const handleSend = () => {
    sendMessage(input);
  };

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

        {/* Loading state before first message */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <span aria-hidden="true" className="pole-mark animate-breathe" />
            <p style={{ fontSize: 'var(--fs-small)', color: 'var(--t-text2)' }}>{t('loading')}</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            if (msg.role === 'user' && msg.hidden) return null;

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
                {msg.error && isLastMsg && !loading && (
                  <button type="button" className="btn-ghost btn-sm mt-3" onClick={retry}>{t('retry')}</button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
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
            className="input-base flex-1"
            style={{ minHeight: 44 }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="btn-primary btn-sm"
          >
            {loading ? '…' : t('send')}
          </button>
        </div>
      </div>

    </div>
  );
}
