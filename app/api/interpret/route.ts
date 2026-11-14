import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDailyAiLimit } from '@/lib/admin/settings';
import { prisma } from '@/lib/db';
import {
  createAnthropicStream,
  encodeInterpretationStream,
  parseAnthropicEffort,
  validateInterpretRequest,
} from '@/lib/ai/interpret';
import { AuthError, requireUser } from '@/lib/auth/guards';
import { toSessionUser } from '@/lib/auth/session';
import type { SessionUser } from '@/lib/auth/types';
import { limitAiRequest, tooManyRequests } from '@/lib/rate-limit/ai-limit';
import { clientIp } from '@/lib/rate-limit/client-ip';
import { getRateLimitStore } from '@/lib/rate-limit/store';
import { localeFromRequest } from '@/lib/i18n/locale';

export const runtime = 'nodejs';

/**
 * Streams an AI reading of the posted chart as server-sent events. Members only:
 * without a valid session it returns 401, and over the hourly or the admin-set
 * daily limit 429, both before reading the body.
 */
export const POST = auth(async function POST(request) {
  let user: SessionUser;
  try {
    user = requireUser(toSessionUser({ sub: request.auth?.user?.id, role: request.auth?.user?.role }));
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }

  const dailyLimit = await getDailyAiLimit(prisma);
  const limit = await limitAiRequest(getRateLimitStore(), { userId: user.id, ip: clientIp(request.headers), dailyLimit }, Date.now());
  if (!limit.allowed) return tooManyRequests(limit);

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

  // The reading's language comes from the visitor's saved choice or browser (#59), never
  // from the body, so the 2.3 request contract stays { chart, messages }. Resolved outside
  // the try below, so a locale problem can't pass for an AI outage.
  const locale = localeFromRequest(request);

  try {
    const anthropic = new Anthropic({ apiKey });
    const stream = await createAnthropicStream(anthropic, input, model, locale, { effort: effort.effort });
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
});
