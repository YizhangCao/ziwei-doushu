// TEMPORARY spike for #21: measures SSE behaviour on Vercel. Removed before review.
// The folder is %5Fspike because a plain _spike folder is private (not routed) in the App Router.
import { createPollingStream, SSE_HEADERS } from '@/lib/consultations/sse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export function GET(request: Request) {
  // Nothing to poll: every tick sends a heartbeat, every 2 s, and the stream closes at 55 s.
  const stream = createPollingStream<{ id: string }>({ poll: async () => [], signal: request.signal });
  return new Response(stream, { headers: SSE_HEADERS });
}
