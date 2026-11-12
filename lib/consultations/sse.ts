// Server-Sent Events for consultation threads (#21). Vercel functions have a time limit, so a
// stream polls the database, then closes itself before the limit; EventSource reconnects on its
// own and sends Last-Event-ID, which the route passes back in as the cursor.

/** How often the stream checks for new messages. Also the heartbeat interval when nothing is new. */
export const SSE_POLL_INTERVAL_MS = 2_000;
/** Close before the platform kills the function (route maxDuration is 60 s). */
export const SSE_MAX_DURATION_MS = 55_000;
/** Tells EventSource how soon to reconnect after the stream closes. */
export const SSE_RETRY_MS = 1_000;

/** Response headers for an SSE stream. `no-transform` and X-Accel-Buffering stop proxies buffering it. */
export const SSE_HEADERS: Readonly<Record<string, string>> = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
};

export interface SseEvent {
  id?: string;
  event?: string;
  data: unknown;
}

// A line break in a field would end it early and let the rest be read as new fields.
function singleLine(value: string, field: string): string {
  if (/[\r\n]/.test(value)) throw new Error(`SSE ${field} must not contain line breaks`);
  return value;
}

/** One SSE event. `data` is JSON on a single line (JSON.stringify escapes newlines). */
export function formatSseEvent({ id, event = 'message', data }: SseEvent): string {
  const idLine = id === undefined ? '' : `id: ${singleLine(id, 'id')}\n`;
  return `${idLine}event: ${singleLine(event, 'event')}\ndata: ${JSON.stringify(data)}\n\n`;
}

/** An SSE comment: keeps idle connections open, and EventSource ignores it. */
export function formatHeartbeat(): string {
  return ': heartbeat\n\n';
}

export interface PollingStreamOptions<T extends { id: string }> {
  /** Returns items after the cursor, oldest first. */
  poll: (cursor: string | null) => Promise<T[]>;
  cursor?: string | null;
  pollIntervalMs?: number;
  maxDurationMs?: number;
  retryMs?: number;
  /** The request's signal: stops polling as soon as the client disconnects. */
  signal?: AbortSignal;
}

/**
 * Polls right away, then every `pollIntervalMs`. New items go out as events with their id;
 * a poll with nothing new sends a heartbeat. Closes with a `close` event after `maxDurationMs`,
 * or with a `stream-error` event (no details) if a poll fails.
 */
export function createPollingStream<T extends { id: string }>(options: PollingStreamOptions<T>): ReadableStream<Uint8Array> {
  const {
    poll,
    pollIntervalMs = SSE_POLL_INTERVAL_MS,
    maxDurationMs = SSE_MAX_DURATION_MS,
    retryMs = SSE_RETRY_MS,
    signal,
  } = options;
  const encoder = new TextEncoder();
  let cursor = options.cursor ?? null;
  // Ids already sent on this connection (at most ~55 s of messages).
  const sent = new Set<string>();
  let closed = false;
  let pollTimer: ReturnType<typeof setTimeout> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;

  const stop = () => {
    closed = true;
    clearTimeout(pollTimer);
    clearTimeout(deadline);
    if (onAbort) signal?.removeEventListener('abort', onAbort);
  };

  return new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (text: string) => controller.enqueue(encoder.encode(text));
      const finish = (finalEvent?: SseEvent) => {
        if (closed) return;
        stop();
        if (finalEvent) send(formatSseEvent(finalEvent));
        controller.close();
      };

      if (signal?.aborted) return finish();
      onAbort = () => finish();
      signal?.addEventListener('abort', onAbort);

      send(`retry: ${retryMs}\n\n`);
      deadline = setTimeout(() => finish({ event: 'close', data: { reason: 'max-duration' } }), maxDurationMs);

      const tick = async () => {
        if (closed) return;
        let items: T[];
        try {
          items = await poll(cursor);
        } catch {
          // Not "error": EventSource fires its own `error` for connection failures.
          return finish({ event: 'stream-error', data: { reason: 'poll-failed' } });
        }
        if (closed) return;
        // Polls overlap (the cursor query re-reads a short window), so send each id once per
        // connection. After a reconnect the client drops any repeats by id.
        const fresh = items.filter((item) => !sent.has(item.id));
        if (fresh.length === 0) {
          send(formatHeartbeat());
        } else {
          for (const item of fresh) {
            sent.add(item.id);
            send(formatSseEvent({ id: item.id, data: item }));
          }
        }
        if (items.length > 0) cursor = items[items.length - 1].id;
        pollTimer = setTimeout(tick, pollIntervalMs);
      };
      void tick();
    },
    cancel() {
      stop();
    },
  });
}
