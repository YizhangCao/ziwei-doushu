import Anthropic from '@anthropic-ai/sdk';
import type { ZiweiChart } from '@/lib/ziwei/types';

export const runtime = 'nodejs';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type InterpretRequest = {
  chart: ZiweiChart;
  messages: ChatMessage[];
};

type AnthropicClient = {
  messages: {
    stream: (params: {
      model: string;
      max_tokens: number;
      system: string;
      messages: ChatMessage[];
    }) => AsyncIterable<{ type: string; delta?: { type?: string; text?: string } }>;
  };
};

const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';
const MAX_TOKENS = 4096;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isInterpretRequest(value: unknown): value is InterpretRequest {
  if (!isRecord(value) || !isRecord(value.chart) || !Array.isArray(value.messages)) {
    return false;
  }

  return value.messages.every(message =>
    isRecord(message) &&
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string' &&
    message.content.trim().length > 0
  );
}

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function sseEvent(data: string) {
  return `data: ${data}\n\n`;
}

const SYSTEM_PROMPT = `你是一位严谨、温和的紫微斗数命理师。请根据用户提供的命盘数据回答问题。
以倪海厦体系和传统紫微斗数为主要参考，明确区分命盘信息与推断，不要捏造命盘中不存在的星曜或宫位。
健康、财务和人生重大决定只能给出一般性建议，并提醒用户咨询专业人士。使用中文回答，结构清晰、具体而克制。

命盘数据：
`;

export function createInterpretHandler(
  createClient: () => AnthropicClient = () => new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  }) as AnthropicClient
) {
  return async function POST(request: Request): Promise<Response> {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse('请求体必须是有效的 JSON', 400);
    }

    if (!isInterpretRequest(body)) {
      return errorResponse('请求体必须包含有效的 chart 和 messages', 400);
    }

    let stream: AsyncIterable<{ type: string; delta?: { type?: string; text?: string } }>;
    try {
      const client = createClient();
      stream = client.messages.stream({
        model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens: MAX_TOKENS,
        system: `${SYSTEM_PROMPT}${JSON.stringify(body.chart)}`,
        messages: body.messages,
      });
    } catch (error) {
      console.error('Failed to create Anthropic stream', error);
      return errorResponse('AI 解读服务暂时不可用', 500);
    }

    const encoder = new TextEncoder();
    const responseStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type !== 'content_block_delta' || event.delta?.type !== 'text_delta') {
              continue;
            }
            const text = event.delta.text;
            if (text) {
              controller.enqueue(encoder.encode(sseEvent(JSON.stringify({ delta: { text } }))));
            }
          }
          controller.enqueue(encoder.encode(sseEvent('[DONE]')));
          controller.close();
        } catch (error) {
          console.error('Anthropic stream failed', error);
          controller.error(error);
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream; charset=utf-8',
      },
    });
  };
}

export const POST = createInterpretHandler();
