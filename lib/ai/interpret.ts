import Anthropic from '@anthropic-ai/sdk';
import type { RawMessageStreamEvent } from '@anthropic-ai/sdk/resources/messages';
import type { ZiweiChart } from '@/lib/ziwei/types';
import type { Locale } from '@/lib/i18n/locale';
import { glossaryForPrompt } from '@/lib/i18n/glossary';
import { isKnownChart } from './known-chart-values';

export interface InterpretMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface InterpretRequest {
  chart: ZiweiChart;
  messages: InterpretMessage[];
}

// Fixed instructions only, one per locale. The chart comes from the client, so it goes in
// the first user message (see withChartContext), never in the system prompt (CodeQL
// js/system-prompt-injection). The English prompt carries the product owner's translation
// rules (#59) and the whole static glossary, never terms picked from the chart.
// The guardrails after the original sentence come from the pre-launch copy review (#63):
// readings explain, they don't hand down verdicts, and they skip hype words.
const SYSTEM_PROMPT_ZH = `你是专业的紫微斗数命盘解读助手。命盘数据在用户的第一条消息里。请根据命盘结构，用清晰、谨慎、具体的中文回答用户。不要声称预测必然发生，也不要编造命盘中没有的信息。不要给是或否的判决：说明你在盘中看到了什么、依据是哪几颗星。不要用"正宗""深度""注定""一定""能量""之旅"这类词，也不要用"最好""最差"这类最高级。不要给医疗、法律或财务方面的具体建议；遇到这类问题，请对方去问医生、律师或持证的理财顾问。谈到父母、兄弟、子女等六亲时，说明斗数看六亲较弱，这部分仅供参考。`;

const SYSTEM_PROMPT_EN = [
  'You are a careful reader of Ziwei Doushu (Purple Star Astrology) natal charts. The chart data is in the user’s first message, and its terms are in Chinese.',
  'Answer in clear, direct English at about a high-school reading level. Base every statement on the structure of the chart. Never claim that a prediction will certainly happen, and never invent anything that is not in the chart.',
  'Don’t give yes/no verdicts: say what you see in the chart and which stars it rests on. Avoid hype and verdict words such as authentic, deep, destined, certainly, energy and journey, and avoid superlatives such as best and worst.',
  'Don’t give specific medical, legal or financial advice; for those questions, suggest a doctor, a lawyer or a licensed financial adviser. When the reading touches on parents, siblings or children, say that Ziwei Doushu is weaker at reading family ties, so that part is for reference only.',
  '',
  'Terms: use exactly the renderings in this glossary (Chinese = English). Palaces and concepts are in English. Stars, brightness grades and the Four Transformations are in pinyin, with the English in parentheses on first mention where the glossary gives one. Do not use Western astrology vocabulary (benefic, malefic, dignity, exaltation, synastry), and never call Huoxing "Mars". Name classical books by their pinyin title with an English gloss, for example Ziwei doushu quanshu (Complete Book of Ziwei Doushu).',
  glossaryForPrompt(),
  '',
  'Quoting a classical book (such as the Ziwei doushu quanshu or the Gusui fu): write the original Chinese, then which means: "…". Inside those quotes, write technical terms in pinyin (minggong, sanfang, Tanlang) and everything else in English. Quotes from Ni Haixia’s lectures are not classical books; translate them directly.',
  '',
  'Parallel couplets: when the source is a parallel couplet, render its meaning as a rhyming couplet in the manner of 18th- and 19th-century English verse: two lines of iambic pentameter, each on its own line. For example:',
  '命宫为本，三方为用 which means: "The minggong is the root from whence we start;',
  'The sanfang is the use that plays its part."',
  '',
  'Format: start each section with a line of the form **【Section title】**, for example **【Overview】**, followed by plain paragraphs. Use **bold** sparingly for key points.',
].join('\n');

/** The fixed system prompt for a locale. */
export function systemPrompt(locale: Locale): string {
  return locale === 'en' ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_ZH;
}

const CHART_PREFIX: Record<Locale, string> = {
  zh: '命盘数据（仅供解读）：\n',
  en: 'Chart data (for the reading only):\n',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export function validateInterpretRequest(value: unknown): InterpretRequest | null {
  if (!isRecord(value) || !Array.isArray(value.messages)) return null;
  const chart = value.chart;
  // 12 palaces, and every name/value the serializer reads must be one the engine produces.
  if (!isKnownChart(chart)) return null;
  if (value.messages.length > 30) return null;

  const messages: InterpretMessage[] = [];
  for (const message of value.messages) {
    if (
      !isRecord(message) ||
      (message.role !== 'user' && message.role !== 'assistant') ||
      typeof message.content !== 'string' ||
      message.content.length > 2000
    ) {
      return null;
    }
    messages.push({ role: message.role, content: message.content });
  }

  return { chart, messages };
}

export function serializeChartForInterpretation(chart: ZiweiChart): string {
  const palaces = chart.palaces.map((palace) => ({
    name: palace.name,
    branch: palace.branch,
    stars: palace.stars.map((star) => ({
      name: star.name,
      type: star.type,
      brightness: star.brightnessRaw ?? star.brightness,
      siHua: star.siHua,
    })),
    selfSihua: palace.selfSihua,
    daXianAge: palace.daXianAge,
    isMingGong: palace.isMingGong,
    isShenGong: palace.isShenGong,
  }));

  return JSON.stringify({
    wuxingJuName: chart.wuxingJuName,
    mingZhu: chart.mingZhu,
    shenZhu: chart.shenZhu,
    currentAge: chart.currentAge,
    palaces,
    daXians: chart.daXians.map((daXian) => ({
      startAge: daXian.startAge,
      endAge: daXian.endAge,
      palaceName: daXian.palaceName,
      siHua: daXian.siHua,
    })),
  });
}

/** Puts the chart text at the start of the first user turn, keeping user/assistant alternation. */
export function withChartContext(chart: ZiweiChart, messages: InterpretMessage[], locale: Locale = 'zh'): InterpretMessage[] {
  const chartText = `${CHART_PREFIX[locale]}${serializeChartForInterpretation(chart)}`;
  const [first, ...rest] = messages;
  if (first?.role === 'user') return [{ role: 'user', content: `${chartText}\n\n${first.content}` }, ...rest];
  return [{ role: 'user', content: chartText }, ...messages];
}

export function createAnthropicStream(
  client: Pick<Anthropic, 'messages'>,
  request: InterpretRequest,
  model: string,
  locale: Locale = 'zh',
) {
  return client.messages.create({
    model,
    max_tokens: 2048,
    system: systemPrompt(locale),
    messages: withChartContext(request.chart, request.messages, locale),
    stream: true,
  });
}

export function encodeInterpretationStream(
  source: AsyncIterable<RawMessageStreamEvent>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of source) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: { text: event.delta.text } })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
