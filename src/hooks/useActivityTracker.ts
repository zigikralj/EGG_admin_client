import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import { useActivityLogStatusQuery } from '../queries';

/**
 * Lightweight, batched page-activity tracker.
 *
 * - Events are queued in memory and sent as ONE request every FLUSH_INTERVAL_MS,
 *   or immediately (with `keepalive`) when the tab is hidden / closed or the user logs out.
 * - Time is only counted while the tab is visible; each visible segment is recorded exactly once
 *   (fixes double counting between `visibilitychange` and page unload).
 * - Non-urgent flushes run in `requestIdleCallback` so logging never competes with UI work.
 * - Identity (user id / name) is resolved server-side from the JWT.
 */

type TrackerEventType = 'PAGE_VIEW' | 'LOGIN' | 'LOGOUT';

interface TrackerEvent {
  type: TrackerEventType;
  path: string;
  durationSeconds: number;
  sessionId: string;
  timestamp: string;
}

const FLUSH_INTERVAL_MS = 30_000;
const MIN_PAGE_VIEW_SECONDS = 1;
const MAX_QUEUE_SIZE = 100;

function getSessionId(): string {
  let sid = sessionStorage.getItem('activity_session_id');
  if (!sid) {
    sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem('activity_session_id', sid);
  }
  return sid;
}

const runWhenIdle = (cb: () => void) => {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(cb, { timeout: 5_000 });
  } else {
    setTimeout(cb, 0);
  }
};

export function useActivityTracker() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const { data: statusData } = useActivityLogStatusQuery();
  const isEnabled = statusData?.enabled ?? true;

  const queueRef = useRef<TrackerEvent[]>([]);
  const segmentStartRef = useRef<number>(Date.now());
  const currentPathRef = useRef<string>(location.pathname);
  const pausedRef = useRef<boolean>(typeof document !== 'undefined' && document.visibilityState === 'hidden');
  /** Cached token so the final batch can still be sent right after logout clears localStorage. */
  const tokenRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const prevUserIdRef = useRef<string | null>(null);

  // Clear queue if logging is disabled
  useEffect(() => {
    if (!isEnabled) {
      queueRef.current = [];
    }
  }, [isEnabled]);

  const enqueue = (type: TrackerEventType, path: string, durationSeconds = 0) => {
    if (!isEnabled || !sessionIdRef.current) return;
    if (queueRef.current.length >= MAX_QUEUE_SIZE) queueRef.current.shift();
    queueRef.current.push({
      type,
      path,
      durationSeconds,
      sessionId: sessionIdRef.current,
      timestamp: new Date().toISOString()
    });
  };

  /** Close the current visible segment (if any) as a PAGE_VIEW and start a new one. */
  const closeSegment = () => {
    if (!isEnabled) return;
    const now = Date.now();
    if (!pausedRef.current) {
      const duration = Math.floor((now - segmentStartRef.current) / 1000);
      if (duration >= MIN_PAGE_VIEW_SECONDS) {
        enqueue('PAGE_VIEW', currentPathRef.current, duration);
      }
    }
    segmentStartRef.current = now;
  };

  const flush = (urgent = false) => {
    if (!isEnabled || queueRef.current.length === 0) return;
    const batch = queueRef.current;
    queueRef.current = [];

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    // apiFetch attaches the stored token; after logout fall back to the cached one.
    if (!localStorage.getItem('auth_token') && tokenRef.current) {
      headers['Authorization'] = `Bearer ${tokenRef.current}`;
    }

    const send = () => {
      apiFetch('/api/activity-logs', {
        method: 'POST',
        headers,
        body: JSON.stringify(batch),
        keepalive: urgent
      }).catch(() => {
        /* best-effort: drop on network failure */
      });
    };

    if (urgent) send();
    else runWhenIdle(send);
  };

  // Session lifecycle: login / logout.
  // Driven by user-id transitions (not effect cleanup) so StrictMode double-invocation is harmless.
  useEffect(() => {
    const prevId = prevUserIdRef.current;
    const nextId = currentUser?.id ?? null;
    if (prevId === nextId) return;
    prevUserIdRef.current = nextId;

    if (!nextId) {
      // Logged out: record the last segment and send everything immediately.
      closeSegment();
      enqueue('LOGOUT', currentPathRef.current, 0);
      flush(true);
      sessionStorage.removeItem('activity_login_logged');
      sessionStorage.removeItem('activity_session_id');
      sessionIdRef.current = null;
      tokenRef.current = null;
      return;
    }

    tokenRef.current = localStorage.getItem('auth_token');
    if (prevId) return; // user switch while logged in — keep the running session

    sessionIdRef.current = getSessionId();
    segmentStartRef.current = Date.now();
    currentPathRef.current = location.pathname;
    pausedRef.current = document.visibilityState === 'hidden';

    if (!sessionStorage.getItem('activity_login_logged')) {
      enqueue('LOGIN', location.pathname, 0);
      sessionStorage.setItem('activity_login_logged', 'true');
      flush(); // make the login visible quickly (idle-scheduled)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // Page navigation
  useEffect(() => {
    if (!currentUser) return;
    if (currentPathRef.current === location.pathname) return;
    closeSegment();
    currentPathRef.current = location.pathname;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, currentUser?.id]);

  // Visibility, unload and periodic flush
  useEffect(() => {
    if (!currentUser) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        closeSegment();
        pausedRef.current = true;
        flush(true);
      } else {
        pausedRef.current = false;
        segmentStartRef.current = Date.now();
      }
    };

    // `pagehide` covers tab close / reload / bfcache; time is only counted if not already paused.
    const handlePageHide = () => {
      closeSegment();
      pausedRef.current = true;
      flush(true);
    };

    // Only sends what is already queued — does not create extra rows.
    const interval = window.setInterval(() => flush(), FLUSH_INTERVAL_MS);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);
}
