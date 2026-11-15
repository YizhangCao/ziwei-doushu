'use client';
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import BirthForm, { type BirthFormState } from '@/components/BirthForm';
import AiContent from '@/components/AiContent';
import { formToBirthInfo } from '@/lib/ziwei/share';
import { generateChart as buildChart } from '@/lib/ziwei/algorithm';
import type { BirthInfo, ZiweiChart } from '@/lib/ziwei/types';

// ─── AiContent 渲染器（与 InsightPanel 一致）────────────────

// Keys, not a JSON array, so next-intl keeps checking every heming.* key (#59).
const QUICK_QUESTIONS = ['q1', 'q2', 'q3', 'q4', 'q5'] as const;

/** Each cause has its own message, so a used-up limit never reads like a bug (#63). */
type HemingError = 'network' | 'apiMissing' | 'rateLimited' | 'failed';
// The per-message limit the reading routes enforce (#5); checked here so the page can say why.
const MAX_CHARS = 2000;
/** The character counter appears once a question gets this long. */
const COUNTER_FROM = 1800;

export default function HemingPage() {
  const router = useRouter();
  const t = useTranslations('heming');

  // ─── 双方命盘状态 ─────────────────────────────────────────
  const [chartA, setChartA] = useState<ZiweiChart | null>(null);
  const [chartB, setChartB] = useState<ZiweiChart | null>(null);
  // 双方表单状态由 BirthForm onFormSave 同步到此处，统一按钮触发起盘
  const [formA, setFormA] = useState<BirthFormState | null>(null);
  const [formB, setFormB] = useState<BirthFormState | null>(null);

  // ─── AI 合盘分析状态 ─────────────────────────────────────
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [question, setQuestion] = useState('');
  // 失败按原因分开说明（#63）：开源版不含 /api/heming，404 时单独说明，而不是让用户反复重试
  const [errorKind, setErrorKind] = useState<HemingError | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  // ─── 起盘（单次调用，返回 chart 给统一流程使用）──────────
  // 开源版不含后端 /api/generate：直接用本仓库的排盘引擎在浏览器里起盘
  const generateChart = useCallback(async (info: BirthInfo): Promise<ZiweiChart | null> => {
    try {
      return buildChart(info);
    } catch {
      return null;
    }
  }, []);

  // 表单是否填齐
  const isFormReady = (f: BirthFormState | null): boolean =>
    !!(f && f.year && f.month && f.day && f.gender && (f.unknownTime || (f.clockHour !== '' && f.clockMinute !== '')));

  // ─── 统一入口：起盘 + 合盘分析 ─────────────────────────────
  const runAnalysis = useCallback(async (q?: string) => {
    setFormError(null);
    if (!isFormReady(formA) || !isFormReady(formB)) {
      setFormError(t('errors.formIncomplete'));
      return;
    }
    if (q && q.length > MAX_CHARS) return; // the input area already says why
    setAnalyzing(true);
    setAnalysis('');
    setErrorKind(null);

    try {
      // 并行起两张盘（如果还没起）
      let cA = chartA;
      let cB = chartB;
      const [newA, newB] = await Promise.all([
        cA ? Promise.resolve(cA) : generateChart(formToBirthInfo(formA!)),
        cB ? Promise.resolve(cB) : generateChart(formToBirthInfo(formB!)),
      ]);
      cA = newA;
      cB = newB;
      if (!cA || !cB) {
        setErrorKind('failed');
        setAnalyzing(false);
        return;
      }
      if (!chartA) setChartA(cA);
      if (!chartB) setChartB(cB);

      let res: Response;
      try {
        res = await fetch('/api/heming', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chartA: cA, chartB: cB, question: q ?? undefined }),
        });
      } catch {
        setErrorKind('network'); // fetch rejects only when no answer came back
        return;
      }
      if (res.status === 404) { setErrorKind('apiMissing'); return; }
      if (res.status === 429) { setErrorKind('rateLimited'); return; }
      if (!res.ok || !res.body) { setErrorKind('failed'); return; }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';

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
            text += delta;
            setAnalysis(text);
          } catch { /* skip */ }
        }
      }
      // scroll to analysis
      setTimeout(() => analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch {
      setErrorKind('network'); // reading the stream rejects when the connection drops mid-reply
    } finally {
      setAnalyzing(false);
    }
  }, [chartA, chartB, formA, formB, generateChart, t]);

  const tooLong = question.length > MAX_CHARS;

  // 设计系统（#57）：颜色和形状都来自 app/globals.css 的 token
  const cardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--bdr)',
    borderRadius: 'var(--r-md)',
    padding: '24px',
  };

  const labelStyle = {
    fontSize: 'var(--fs-small)', color: 'var(--tx-2)',
    marginBottom: '16px', display: 'block',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)' }}>

      {/* 主体 */}
      <div className="page" style={{ paddingTop: 48, paddingBottom: 96 }}>

        {/* 标题 */}
        <div style={{ maxWidth: 720, marginBottom: 32 }}>
          <h1 style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.25, color: 'var(--tx-0)' }}>{t('title')}</h1>
          <p style={{ marginTop: 8, color: 'var(--tx-2)' }}>
            {t('lead')}
          </p>
        </div>

        {/* 双栏表单 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 甲方 */}
          <div style={cardStyle}>
            <span style={labelStyle}>{t('personA')}</span>
            <BirthForm
              bare
              hideSubmit
              onSubmit={() => {}}
              onFormSave={setFormA}
            />
          </div>

          {/* 乙方 */}
          <div style={cardStyle}>
            <span style={labelStyle}>{t('personB')}</span>
            <BirthForm
              bare
              hideSubmit
              onSubmit={() => {}}
              onFormSave={setFormB}
            />
          </div>
        </div>

        {/* ═══ 大合盘分析框（视觉中心，始终显示）════════════════ */}
        <div ref={analysisRef} aria-live="polite" aria-busy={analyzing} style={{
          ...cardStyle,
          minHeight: '320px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: (!analysis && !analyzing) ? 'center' : 'flex-start',
        }}>
          {/* 区块标题 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: (analysis || analyzing) ? '20px' : '24px' }}>
            <h2 style={{ fontSize: 'var(--fs-small)', color: 'var(--tx-2)' }}>{t('analysisTitle')}</h2>
          </div>

          {/* 状态分支 */}
          {/* /api/heming isn't built yet (#124), so say so up front instead of offering a button that answers nothing. */}
          {!analysis && !analyzing && (
            <div role="status" style={{ textAlign: 'center', padding: '32px 0' }}>
              <p style={{ color: 'var(--tx-1)', marginBottom: '8px' }}>{t('comingSoon')}</p>
              <p style={{ color: 'var(--tx-2)', fontSize: 'var(--fs-small)' }}>{t('comingSoonHint')}</p>
            </div>
          )}

          {analyzing && !analysis && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '40px 0', color: 'var(--tx-2)', fontSize: 'var(--fs-small)' }}>
              <span aria-hidden="true" className="pole-mark animate-breathe" />
              {t('loading')}
            </div>
          )}

          {analysis && <AiContent text={analysis} streaming={analyzing} />}

          {errorKind && (
            <div style={{ padding: '12px 16px', border: '1px solid var(--bdr)', fontSize: 'var(--fs-small)', color: 'var(--tx-2)', marginTop: '12px' }}>
              {t(`errors.${errorKind}`)}
              {/* The developer note only shows in `next dev`; visitors see the plain message. */}
              {errorKind === 'apiMissing' && process.env.NODE_ENV === 'development' && (
                <p style={{ marginTop: 8 }}>{t('errors.apiMissingDev')}</p>
              )}
            </div>
          )}
        </div>

        {/* ═══ 针对合盘的追问聊天框（仅分析完成后显示）═══════════ */}
        {analysis && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
            <div style={{ fontSize: 'var(--fs-small)', color: 'var(--tx-2)', marginBottom: '4px' }}>
              {t('followUpTitle')}
            </div>

            {/* 快捷问题 */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {QUICK_QUESTIONS.map(key => t(`quickQuestions.${key}`)).map(q => (
                <button
                  type="button"
                  key={q}
                  className="btn-ghost btn-sm"
                  onClick={() => { setQuestion(q); runAnalysis(q); }}
                  disabled={analyzing}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* 输入框 + 追问按钮 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !analyzing && !tooLong) runAnalysis(question || undefined); }}
                placeholder={t('inputPlaceholder')}
                disabled={analyzing}
                aria-label={t('inputLabel')}
                aria-invalid={tooLong || undefined}
                aria-describedby={question.length >= COUNTER_FROM ? 'heming-input-note' : undefined}
                className="input-base"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={() => runAnalysis(question || undefined)}
                disabled={analyzing || tooLong}
              >
                {analyzing ? t('sending') : t('send')}
              </button>
            </div>
            {/* Why a question can't be sent, or how much room is left (#63) */}
            {tooLong ? (
              <p id="heming-input-note" role="alert" style={{ fontSize: 'var(--fs-caption)', color: 'var(--ji)' }}>
                {t('errors.tooLong')}
              </p>
            ) : question.length >= COUNTER_FROM && (
              <p id="heming-input-note" style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>
                {t('charsLeft', { n: MAX_CHARS - question.length })}
              </p>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
