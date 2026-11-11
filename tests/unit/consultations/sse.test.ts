import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SSE_MAX_DURATION_MS,
  SSE_POLL_INTERVAL_MS,
  createPollingStream,
  formatHeartbeat,
  formatSseEvent,
} from '@/lib/consultations/sse';

interface Item {
  id: string;
  body: string;
}

// Reads a stream in the background so fake timers can drive it.
function collect(stream: ReadableStream<Uint8Array>) {
  const decoder = new TextDecoder();
  const state = { text: '', done: false };
  const reader = stream.getReader();
  const finished = (async () => {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      state.text += decoder.decode(value);
    }
    state.done = true;
  })();
  return { state, finished, cancel: () => reader.cancel() };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('formatSseEvent', () => {
  it('formats a message as an SSE event with an id, so clients can resume with Last-Event-ID', () => {
    expect(formatSseEvent({ id: 'm1', data: { body: 'hi' } })).toBe('id: m1\nevent: message\ndata: {"body":"hi"}\n\n');
  });

  it('keeps multi-line text on one data line (newlines are JSON-escaped)', () => {
    const event = formatSseEvent({ id: 'm2', data: { body: 'line 1\nline 2' } });
    expect(event).toBe('id: m2\nevent: message\ndata: {"body":"line 1\\nline 2"}\n\n');
    expect(event.trim().split('\n')).toHaveLength(3);
  });

  it('supports a custom event name', () => {
    expect(formatSseEvent({ event: 'close', data: { reason: 'max-duration' } })).toBe(
      'event: close\ndata: {"reason":"max-duration"}\n\n',
    );
  });

  it('refuses an id or event name containing a line break, which would inject fields', () => {
    expect(() => formatSseEvent({ id: 'm1\ndata: evil', data: {} })).toThrow();
    expect(() => formatSseEvent({ id: 'm1', event: 'message\r\nid: x', data: {} })).toThrow();
  });
});

describe('formatHeartbeat', () => {
  it('is an SSE comment line, which keeps the connection alive and is ignored by EventSource', () => {
    expect(formatHeartbeat()).toBe(': heartbeat\n\n');
  });
});

describe('createPollingStream', () => {
  it('defaults to polling every 2 s and closing after 55 s', () => {
    expect(SSE_POLL_INTERVAL_MS).toBe(2_000);
    expect(SSE_MAX_DURATION_MS).toBe(55_000);
  });

  it('starts with a retry hint, then emits new items as events and advances the cursor', async () => {
    const batches: Item[][] = [[{ id: 'm1', body: 'one' }, { id: 'm2', body: 'two' }], [], [{ id: 'm3', body: 'three' }]];
    const poll = vi.fn(async (_cursor: string | null) => batches.shift() ?? []);
    const out = collect(createPollingStream<Item>({ poll, cursor: null }));

    await vi.advanceTimersByTimeAsync(0);
    expect(out.state.text.startsWith('retry: ')).toBe(true);
    expect(out.state.text).toContain(formatSseEvent({ id: 'm1', data: { id: 'm1', body: 'one' } }));
    expect(out.state.text).toContain(formatSseEvent({ id: 'm2', data: { id: 'm2', body: 'two' } }));

    await vi.advanceTimersByTimeAsync(SSE_POLL_INTERVAL_MS); // nothing new → heartbeat
    expect(out.state.text.endsWith(formatHeartbeat())).toBe(true);

    await vi.advanceTimersByTimeAsync(SSE_POLL_INTERVAL_MS);
    expect(out.state.text).toContain('id: m3\n');
    expect(poll.mock.calls.map(([cursor]) => cursor)).toEqual([null, 'm2', 'm2']);
    await out.cancel();
  });

  it('resumes from the given cursor', async () => {
    const poll = vi.fn(async (_cursor: string | null) => [] as Item[]);
    const out = collect(createPollingStream<Item>({ poll, cursor: 'm7' }));
    await vi.advanceTimersByTimeAsync(0);
    expect(poll).toHaveBeenCalledWith('m7');
    await out.cancel();
  });

  it('sends a heartbeat on every poll with nothing new', async () => {
    const out = collect(createPollingStream<Item>({ poll: async () => [] }));
    await vi.advanceTimersByTimeAsync(10_000);
    // One poll at 0 s, then one every 2 s up to 10 s.
    expect(out.state.text.split(formatHeartbeat()).length - 1).toBe(6);
    await out.cancel();
  });

  it('closes itself after 55 s by default, with a close event so the client knows to reconnect', async () => {
    const out = collect(createPollingStream<Item>({ poll: async () => [] }));

    await vi.advanceTimersByTimeAsync(SSE_MAX_DURATION_MS - 1);
    expect(out.state.done).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await out.finished;
    expect(out.state.done).toBe(true);
    expect(out.state.text.endsWith(formatSseEvent({ event: 'close', data: { reason: 'max-duration' } }))).toBe(true);
  });

  it('takes a configurable max duration', async () => {
    const poll = vi.fn(async () => [] as Item[]);
    const out = collect(createPollingStream<Item>({ poll, maxDurationMs: 5_000 }));

    await vi.advanceTimersByTimeAsync(5_000);
    await out.finished;
    expect(out.state.done).toBe(true);

    const calls = poll.mock.calls.length;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(poll.mock.calls.length).toBe(calls); // no polling after close
  });

  it('takes a configurable poll interval', async () => {
    const poll = vi.fn(async () => [] as Item[]);
    const out = collect(createPollingStream<Item>({ poll, pollIntervalMs: 500 }));
    await vi.advanceTimersByTimeAsync(2_000);
    expect(poll).toHaveBeenCalledTimes(5);
    await out.cancel();
  });

  it('stops polling when the client disconnects (abort signal)', async () => {
    const controller = new AbortController();
    const poll = vi.fn(async () => [] as Item[]);
    const out = collect(createPollingStream<Item>({ poll, signal: controller.signal }));
    await vi.advanceTimersByTimeAsync(4_000);

    controller.abort();
    await out.finished;
    const calls = poll.mock.calls.length;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(poll.mock.calls.length).toBe(calls);
  });

  it('stops polling when the reader cancels the stream', async () => {
    const poll = vi.fn(async () => [] as Item[]);
    const out = collect(createPollingStream<Item>({ poll }));
    await vi.advanceTimersByTimeAsync(2_000);

    await out.cancel();
    const calls = poll.mock.calls.length;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(poll.mock.calls.length).toBe(calls);
  });

  it('closes with an error event, without details, when a poll fails', async () => {
    const out = collect(createPollingStream<Item>({
      poll: async () => {
        throw new Error('database said something private');
      },
    }));
    await vi.advanceTimersByTimeAsync(0);
    await out.finished;
    expect(out.state.text.endsWith(formatSseEvent({ event: 'error', data: { reason: 'poll-failed' } }))).toBe(true);
    expect(out.state.text).not.toContain('private');
  });
});
