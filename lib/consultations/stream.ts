import type { SessionUser } from '@/lib/auth/types';
import { getThread, listMessagesSince } from './service';
import { SSE_HEADERS, createPollingStream } from './sse';
import type { ConsultationMessage } from './types';

// The SSE response for one consultation thread (#21), kept out of the route file so the route
// stays thin (AGENTS.md).

/** Message ids are cuids; anything else in Last-Event-ID is ignored instead of queried. */
const EVENT_ID = /^[a-z0-9]{1,64}$/i;

/** The cursor to resume from: the Last-Event-ID EventSource sends on reconnect, if it is valid. */
export function resumeCursor(request: Request): string | null {
  const id = request.headers.get('last-event-id')?.trim();
  return id && EVENT_ID.test(id) ? id : null;
}

/**
 * Checks access first, so the owner and this share's practitioner get a stream and anyone else
 * gets the AuthError (404 JSON) before a stream exists. If access is lost mid-stream (the share
 * is revoked), the next poll fails and the stream ends with a `stream-error` event.
 */
export async function openThreadStream(user: SessionUser, shareId: string, request: Request): Promise<Response> {
  await getThread(user, shareId);
  const stream = createPollingStream<ConsultationMessage>({
    cursor: resumeCursor(request),
    signal: request.signal,
    poll: async (cursor) => {
      const page = await listMessagesSince(user, shareId, cursor);
      return { items: page.messages, cursor: page.cursor };
    },
  });
  return new Response(stream, { headers: SSE_HEADERS });
}
