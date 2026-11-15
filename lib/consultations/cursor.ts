// Where a consultation stream resumes (#21). Kept apart from stream.ts so it has no database
// import and can be unit tested on its own.

/** Message ids are cuids; anything else is ignored instead of queried. */
const EVENT_ID = /^[a-z0-9]{1,64}$/i;

/**
 * The cursor to resume from. EventSource sends Last-Event-ID when it reconnects by itself; a
 * new EventSource (the page reopening the stream after the tab was hidden) can't set headers,
 * so it passes the newest id it has as `?cursor=`. The header wins when both are sent.
 */
export function resumeCursor(request: Request): string | null {
  const fromHeader = request.headers.get('last-event-id')?.trim();
  if (fromHeader) return EVENT_ID.test(fromHeader) ? fromHeader : null;
  const fromQuery = new URL(request.url).searchParams.get('cursor');
  return fromQuery && EVENT_ID.test(fromQuery) ? fromQuery : null;
}
