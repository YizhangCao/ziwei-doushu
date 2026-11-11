// TEMPORARY spike for #21: measures SSE behaviour on Vercel. Removed before review.
// The folder is %5Fspike because a plain _spike folder is private (not routed) in the App Router.
import { createPollingStream, SSE_HEADERS } from '@/lib/consultations/sse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export function GET(request: Request) {
  // ?maxMs= lets the spike try to outlive maxDuration, to see what the platform does at the limit.
  const requested = Number(new URL(request.url).searchParams.get('maxMs'));
  const maxDurationMs = Number.isFinite(requested) && requested > 0 ? Math.min(requested, 120_000) : undefined;
  // Nothing to poll: every tick sends a heartbeat, every 2 s, and the stream closes at 55 s by default.
  const stream = createPollingStream<{ id: string }>({ poll: async () => [], signal: request.signal, maxDurationMs });
  return new Response(stream, { headers: SSE_HEADERS });
}
