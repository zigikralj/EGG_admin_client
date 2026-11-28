import { apiFetch } from '../api';

export interface SSEEventMessage {
  event: string;
  data: string;
  id?: string;
}

export interface FetchSSEOptions {
  url: string;
  onEvent: (message: SSEEventMessage) => void;
  onReconnect?: () => void;
  fetchImpl?: (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
  initialRetryDelayMs?: number;
  maxRetryDelayMs?: number;
}

export interface FetchSSEConnection {
  close: () => void;
}

/**
 * Incremental WHATWG Server-Sent Events parser for streaming text chunks.
 */
export function createSSEParser(
  onEvent: (message: SSEEventMessage) => void,
  onRetry?: (retryMs: number) => void
): { feed: (chunk: string) => void; flush: () => void } {
  let buffer = '';
  let eventName = '';
  let dataLines: string[] = [];
  let lastEventId: string | undefined;
  let ignoreNextLF = false;

  const dispatchEvent = () => {
    if (dataLines.length > 0) {
      onEvent({
        event: eventName || 'message',
        data: dataLines.join('\n'),
        id: lastEventId,
      });
    }
    eventName = '';
    dataLines = [];
  };

  const processLine = (line: string) => {
    if (line === '') {
      dispatchEvent();
      return;
    }

    // Lines starting with ':' are SSE comments (e.g. ': keepalive')
    if (line.startsWith(':')) {
      return;
    }

    const colonIndex = line.indexOf(':');
    let field: string;
    let value: string;
    if (colonIndex === -1) {
      field = line;
      value = '';
    } else {
      field = line.slice(0, colonIndex);
      value = line.slice(colonIndex + 1);
      if (value.startsWith(' ')) {
        value = value.slice(1);
      }
    }

    switch (field) {
      case 'event':
        eventName = value;
        break;
      case 'data':
        dataLines.push(value);
        break;
      case 'id':
        if (!value.includes('\0')) {
          lastEventId = value;
        }
        break;
      case 'retry':
        if (/^\d+$/.test(value)) {
          onRetry?.(Number(value));
        }
        break;
      default:
        break;
    }
  };

  const feed = (chunk: string) => {
    if (!chunk) return;
    let text = chunk;

    if (ignoreNextLF) {
      ignoreNextLF = false;
      if (text.startsWith('\n')) {
        text = text.slice(1);
      }
    }

    buffer += text;

    let lineStart = 0;
    for (let i = 0; i < buffer.length; i++) {
      const ch = buffer[i];
      if (ch === '\r' || ch === '\n') {
        const line = buffer.slice(lineStart, i);
        processLine(line);
        if (ch === '\r') {
          if (i + 1 < buffer.length) {
            if (buffer[i + 1] === '\n') {
              i += 1;
            }
          } else {
            ignoreNextLF = true;
          }
        }
        lineStart = i + 1;
      }
    }

    buffer = buffer.slice(lineStart);
  };

  const flush = () => {
    if (buffer.length > 0) {
      processLine(buffer);
      buffer = '';
    }
    dispatchEvent();
  };

  return { feed, flush };
}

/**
 * Opens an authenticated SSE stream via fetch() + ReadableStream so the Bearer
 * JWT is sent in the Authorization header instead of the query string.
 */
export function createFetchSSEConnection(options: FetchSSEOptions): FetchSSEConnection {
  const {
    url,
    onEvent,
    onReconnect,
    fetchImpl = apiFetch,
    initialRetryDelayMs = 1000,
    maxRetryDelayMs = 30_000,
  } = options;

  let closed = false;
  let attempt = 0;
  let hasConnectedBefore = false;
  let serverRetryMs: number | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let activeController: AbortController | null = null;
  let activeReader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  const clearReconnectTimer = () => {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const scheduleReconnect = () => {
    if (closed) return;
    clearReconnectTimer();

    const baseBackoff = Math.min(maxRetryDelayMs, initialRetryDelayMs * 2 ** attempt);
    const jitter = Math.floor(Math.random() * 250);
    const backoffDelay = baseBackoff + jitter;
    const delay = serverRetryMs !== null ? Math.max(serverRetryMs, backoffDelay) : backoffDelay;
    attempt = Math.min(attempt + 1, 10);

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (!closed) {
        void connect();
      }
    }, delay);
  };

  const connect = async () => {
    if (closed) return;

    const controller = new AbortController();
    activeController = controller;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    try {
      const response = await fetchImpl(url, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
        },
        cache: 'no-store',
        signal: controller.signal,
      });

      if (closed || controller.signal.aborted) {
        return;
      }

      // Stop permanently on authentication/authorization failures
      if (response.status === 401 || response.status === 403) {
        closed = true;
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error(`SSE connection failed with status ${response.status}`);
      }

      if (hasConnectedBefore) {
        onReconnect?.();
      }
      hasConnectedBefore = true;

      reader = response.body.getReader();
      activeReader = reader;

      const decoder = new TextDecoder('utf-8');
      const parser = createSSEParser(
        (msg) => {
          attempt = 0;
          onEvent(msg);
        },
        (retryMs) => {
          serverRetryMs = retryMs;
        }
      );

      while (!closed) {
        const { value, done } = await reader.read();
        if (closed) break;
        if (done) {
          const tail = decoder.decode();
          if (tail) parser.feed(tail);
          parser.flush();
          break;
        }
        if (value) {
          parser.feed(decoder.decode(value, { stream: true }));
        }
      }
    } catch (error) {
      if (closed || controller.signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
        return;
      }
    } finally {
      if (reader) {
        reader.cancel().catch(() => {});
      }
      if (activeReader === reader) {
        activeReader = null;
      }
      if (activeController === controller) {
        activeController = null;
      }
    }

    if (!closed) {
      scheduleReconnect();
    }
  };

  void connect();

  return {
    close: () => {
      if (closed) return;
      closed = true;
      clearReconnectTimer();
      activeController?.abort();
      activeController = null;
      activeReader?.cancel().catch(() => {});
      activeReader = null;
    },
  };
}
