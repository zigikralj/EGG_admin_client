import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSSEParser, createFetchSSEConnection, type SSEEventMessage } from './sseClient';

function makeStream(chunks: string[], keepOpen = false): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      if (!keepOpen) {
        controller.close();
      }
    },
  });
}

describe('createSSEParser', () => {
  it('parses split chunks, CRLF/LF line endings, multi-line data, and ignores comments', () => {
    const events: SSEEventMessage[] = [];
    const retries: number[] = [];
    const parser = createSSEParser(
      (msg) => events.push(msg),
      (ms) => retries.push(ms)
    );

    parser.feed(': keepalive\r\n\r\n');
    parser.feed('retry: 60000\n');
    parser.feed('id: 42\r');
    parser.feed('\nevent: MESSAGE_CREATED\r\ndata: {"a":1,\n');
    parser.feed('data: "b":2}\r\n\r\n');
    parser.feed('data: default event line\n\n');

    expect(retries).toEqual([60000]);
    expect(events).toEqual([
      { event: 'MESSAGE_CREATED', data: '{"a":1,\n"b":2}', id: '42' },
      { event: 'message', data: 'default event line', id: '42' },
    ]);
  });
});

describe('createFetchSSEConnection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('connects with Accept: text/event-stream and no token query param, and dispatches events', async () => {
    const events: SSEEventMessage[] = [];
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(makeStream(['event: CONNECTED\ndata: {"onlineUserIds":["u1"]}\n\n'], true), {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      })
    );

    const conn = createFetchSSEConnection({
      url: '/api/messaging/stream',
      fetchImpl: fetchMock,
      onEvent: (msg) => events.push(msg),
    });

    await vi.waitFor(() => {
      expect(events).toHaveLength(1);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, calledInit] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe('/api/messaging/stream');
    expect(calledUrl).not.toContain('token=');
    expect(calledInit.headers).toEqual({ Accept: 'text/event-stream' });
    expect(events[0]).toEqual({
      event: 'CONNECTED',
      data: '{"onlineUserIds":["u1"]}',
      id: undefined,
    });

    conn.close();
  });

  it.each([401, 403])('stops permanently without retrying on HTTP %i', async (status) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status }));

    const conn = createFetchSSEConnection({
      url: '/api/messaging/stream',
      fetchImpl: fetchMock,
      onEvent: vi.fn(),
      initialRetryDelayMs: 50,
    });

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    await vi.advanceTimersByTimeAsync(10_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    conn.close();
  });

  it('reconnects after stream ends, respects server retry hint, and invokes onReconnect', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const events: SSEEventMessage[] = [];
    const onReconnect = vi.fn();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          makeStream(['retry: 5000\nevent: CONNECTED\ndata: {"onlineUserIds":[]}\n\n']),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          makeStream(['event: CONNECTED\ndata: {"onlineUserIds":["u2"]}\n\n'], true),
          { status: 200 }
        )
      );

    const conn = createFetchSSEConnection({
      url: '/api/messaging/stream',
      fetchImpl: fetchMock,
      onEvent: (msg) => events.push(msg),
      onReconnect,
      initialRetryDelayMs: 1000,
    });

    await vi.advanceTimersByTimeAsync(0);
    expect(events).toHaveLength(1);
    expect(onReconnect).not.toHaveBeenCalled();

    // Should wait for retry: 5000 before reconnecting
    await vi.advanceTimersByTimeAsync(4999);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(events).toHaveLength(2);

    expect(onReconnect).toHaveBeenCalledTimes(1);
    conn.close();
  });

  it('aborts pending fetch cleanly on close() and does not reconnect', async () => {
    let capturedSignal: AbortSignal | undefined;
    const fetchMock = vi.fn().mockImplementation((_url, init) => {
      capturedSignal = init?.signal as AbortSignal | undefined;
      return new Promise((_resolve, reject) => {
        capturedSignal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    });

    const conn = createFetchSSEConnection({
      url: '/api/messaging/stream',
      fetchImpl: fetchMock,
      onEvent: vi.fn(),
      initialRetryDelayMs: 50,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(capturedSignal?.aborted).toBe(false);

    conn.close();
    expect(capturedSignal?.aborted).toBe(true);

    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
