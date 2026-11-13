import Anthropic from '@anthropic-ai/sdk';
import type { MessageCreateParamsStreaming, RawMessageStreamEvent } from '@anthropic-ai/sdk/resources/messages';
import { z } from 'zod';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { serializeChartForInterpretation } from './chart-context';
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

/** Puts the chart text at the start of the first user turn, keeping user/assistant alternation. */
export function withChartContext(chart: ZiweiChart, messages: InterpretMessage[]): InterpretMessage[] {
  const chartText = `${CHART_PREFIX}${serializeChartForInterpretation(chart)}`;
  const [first, ...rest] = messages;
  if (first?.role === 'user') return [{ role: 'user', content: `${chartText}\n\n${first.content}` }, ...rest];
  return [{ role: 'user', content: chartText }, ...messages];
}

// Current models think before they answer, and thinking counts toward max_tokens. At 2,048 a
// reading could stop before its first word; at default effort one overview took 3,512 thinking
// tokens and 1,921 text tokens.
const MAX_OUTPUT_TOKENS = 16000;

const EffortSchema = z.enum(['low', 'medium', 'high', 'xhigh', 'max']);
export type AnthropicEffort = z.infer<typeof EffortSchema>;

/**
 * Reads ANTHROPIC_EFFORT. Unset or empty means no effort is sent, because the model comes from
 * ANTHROPIC_MODEL and some older models (Claude Sonnet 4.5, Claude Haiku 4.5) reject the
 * parameter. Any other value is a configuration error.
 */
export function parseAnthropicEffort(
  value: string | undefined,
): { ok: true; effort?: AnthropicEffort } | { ok: false } {
  if (value === undefined || value === '') return { ok: true, effort: undefined };
  const parsed = EffortSchema.safeParse(value);
  return parsed.success ? { ok: true, effort: parsed.data } : { ok: false };
}

// See #103: the installed SDK (0.27) predates output_config, so its params type lacks it. The
// SDK sends the body as given, and the API accepts the field on every model that takes effort.
type StreamParams = MessageCreateParamsStreaming & { output_config?: { effort: AnthropicEffort } };

export function createAnthropicStream(
  client: Pick<Anthropic, 'messages'>,
  request: InterpretRequest,
  model: string,
  options: { effort?: AnthropicEffort } = {},
) {
  const params: StreamParams = {
    model,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: SYSTEM_PROMPT,
    messages: withChartContext(request.chart, request.messages),
    stream: true,
    ...(options.effort ? { output_config: { effort: options.effort } } : {}),
  };
  return client.messages.create(params);
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
