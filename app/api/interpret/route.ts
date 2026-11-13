import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import {
  createAnthropicStream,
  encodeInterpretationStream,
  parseAnthropicEffort,
  validateInterpretRequest,
} from '@/lib/ai/interpret';
import { localeFromRequest } from '@/lib/i18n/locale';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const input = validateInterpretRequest(body);
  if (!input) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL;
  const effort = parseAnthropicEffort(process.env.ANTHROPIC_EFFORT);
  if (!apiKey || !model || !effort.ok) {
    return NextResponse.json({ error: 'AI service is not configured' }, { status: 500 });
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    // The reading's language comes from the visitor's saved choice or browser (#59),
    // never from the body, so the 2.3 request contract stays { chart, messages }.
    const stream = await createAnthropicStream(anthropic, input, model, localeFromRequest(request), {
      effort: effort.effort,
    });
    return new Response(encodeInterpretationStream(stream), {
      headers: {
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream; charset=utf-8',
      },
    });
  } catch {
    return NextResponse.json({ error: 'AI service request failed' }, { status: 500 });
  }
}
