import { NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api/authenticate';
import { parsePublicChartRequest } from '@/lib/validation/public-chart-request';
import { generateChart } from '@/lib/ziwei/algorithm';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Key first: an unauthenticated caller learns nothing about what a valid body looks like.
    const caller = await authenticateApiKey(request.headers.get('authorization'));
    if (!caller) {
      return NextResponse.json({ error: 'Missing or invalid API key' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
    }

    const parsed = parsePublicChartRequest(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    try {
      return NextResponse.json({ chart: generateChart(parsed.birthInfo) });
    } catch {
      return NextResponse.json({ error: 'Could not generate the chart' }, { status: 500 });
    }
  } catch {
    // A failed key lookup (database down, timeout). Never echo the cause: it can contain
    // hosts or other internals, and the key must never come back.
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
