import Anthropic from '@anthropic-ai/sdk';
import type { RawMessageStreamEvent } from '@anthropic-ai/sdk/resources/messages';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { isKnownChart } from './known-chart-values';

export interface InterpretMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface InterpretRequest {
  chart: ZiweiChart;
  messages: InterpretMessage[];
}

// Fixed instructions only. The chart comes from the client, so it goes in the first user
// message (see withChartContext), never in the system prompt (CodeQL js/system-prompt-injection).
const SYSTEM_PROMPT = `你是专业的紫微斗数命盘解读助手。命盘数据在用户的第一条消息里。请根据命盘结构，用清晰、谨慎、具体的中文回答用户。不要声称预测必然发生，也不要编造命盘中没有的信息。`;

const CHART_PREFIX = '命盘数据（仅供解读）：\n';

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
export function withChartContext(chart: ZiweiChart, messages: InterpretMessage[]): InterpretMessage[] {
  const chartText = `${CHART_PREFIX}${serializeChartForInterpretation(chart)}`;
  const [first, ...rest] = messages;
  if (first?.role === 'user') return [{ role: 'user', content: `${chartText}\n\n${first.content}` }, ...rest];
  return [{ role: 'user', content: chartText }, ...messages];
}

export function createAnthropicStream(
  client: Pick<Anthropic, 'messages'>,
  request: InterpretRequest,
  model: string,
) {
  return client.messages.create({
    model,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: withChartContext(request.chart, request.messages),
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
