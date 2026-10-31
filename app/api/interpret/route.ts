import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import {
  buildInterpretSystemPrompt,
  createInterpretationStream,
  validateInterpretRequest,
} from '@/lib/ai/interpret';

export const runtime = 'nodejs';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const input = validateInterpretRequest(body);
  if (!input) {
    return Response.json({ error: 'Request must include a valid chart and messages' }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'AI service is not configured' }, { status: 500 });
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const messages: MessageParam[] = input.messages.map(message => ({
      role: message.role,
      content: message.content,
    }));
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 2_048,
      system: buildInterpretSystemPrompt(input.chart),
      messages,
    });

    return new Response(createInterpretationStream(stream), {
      headers: {
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Failed to start interpretation stream', error);
    return Response.json({ error: 'Unable to start AI interpretation' }, { status: 500 });
  }
}
