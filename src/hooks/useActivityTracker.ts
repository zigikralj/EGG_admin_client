import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import { API_ROUTES, PAGE_ROUTES } from '../constants';
import { useActivityLogStatusQuery } from '../queries';

/**
 * Lightweight, batched page-activity tracker.
 *
 * - Events are queued in memory and sent as ONE request every FLUSH_INTERVAL_MS,
 *   or immediately on page navigation, unload, visibility change, or logout.
 * - Sessions are shared across tabs via localStorage and expire after 30 minutes of inactivity.
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
export const MAX_IDLE_SECONDS = 120; // 2 minutes without user interaction considered idle
const HEARTBEAT_INTERVAL_MS = 5_000; // 5-second tick for idle & sleep detection

export const SESSION_STORAGE_KEY = 'activity_session_id';
export const SESSION_ACTIVITY_KEY = 'activity_session_last_active';
export const SESSION_LOGIN_KEY = 'activity_login_logged';
export const SESSION_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function getSessionId(): string {
  const now = Date.now();
  const lastActiveStr =
    (typeof localStorage !== 'undefined' ? localStorage.getItem(SESSION_ACTIVITY_KEY) : null) ||
    (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_ACTIVITY_KEY) : null);
  const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : 0;
  let sid =
    (typeof localStorage !== 'undefined' ? localStorage.getItem(SESSION_STORAGE_KEY) : null) ||
    (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_STORAGE_KEY) : null);

  // If no session exists or session expired due to inactivity (> 30 mins)
  if (!sid || !lastActive || now - lastActive > SESSION_INACTIVITY_TIMEOUT_MS) {
    const randomBytes = window.crypto.getRandomValues(new Uint8Array(8));
    const randomPart = Array.from(randomBytes, (b) => b.toString(16).padStart(2, '0')).join('');
    sid = 'sess_' + now + '_' + randomPart;
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, sid);
      sessionStorage.setItem(SESSION_STORAGE_KEY, sid);
      localStorage.removeItem(SESSION_LOGIN_KEY);
      sessionStorage.removeItem(SESSION_LOGIN_KEY);
    } catch (e) {}
  } else {
    // Keep storages synced across tabs
    try {
      if (!sessionStorage.getItem(SESSION_STORAGE_KEY)) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, sid);
      }
      if (!localStorage.getItem(SESSION_STORAGE_KEY)) {
        localStorage.setItem(SESSION_STORAGE_KEY, sid);
      }
    } catch (e) {}
  }

  try {
    localStorage.setItem(SESSION_ACTIVITY_KEY, String(now));
    sessionStorage.setItem(SESSION_ACTIVITY_KEY, String(now));
  } catch (e) {}
  return sid;
}

export function updateSessionActivity(): void {
  const now = Date.now();
  try {
    localStorage.setItem(SESSION_ACTIVITY_KEY, String(now));
    sessionStorage.setItem(SESSION_ACTIVITY_KEY, String(now));
  } catch (e) {}
}

export function clearSessionData(): void {
  try {
    sessionStorage.removeItem(SESSION_LOGIN_KEY);
    localStorage.removeItem(SESSION_LOGIN_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_ACTIVITY_KEY);
    localStorage.removeItem(SESSION_ACTIVITY_KEY);
  } catch (e) {}
}

let activeFlushFn: ((urgent?: boolean) => Promise<void>) | null = null;
let activeCloseSegmentFn: (() => void) | null = null;

/** Trigger an immediate flush of the activity tracker from outside the hook (e.g. on manual refresh). */
export async function flushActivityTracker(urgent = true): Promise<void> {
  if (activeCloseSegmentFn) activeCloseSegmentFn();
  if (activeFlushFn) return activeFlushFn(urgent);
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
  const queryClient = useQueryClient();
  const { data: statusData } = useActivityLogStatusQuery();
  const isEnabled = statusData?.enabled ?? true;

  const queueRef = useRef<TrackerEvent[]>([]);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const segmentStartRef = useRef<number>(Date.now());
  const normalizeTrackedPath = (p: string): string => {
    return p === '/' || p === PAGE_ROUTES.HOME ? PAGE_ROUTES.PROJECT_TRACKER_PROJECTS : p;
  };
  const currentPathRef = useRef<string>(normalizeTrackedPath(location.pathname));
  const pausedRef = useRef<boolean>(typeof document !== 'undefined' && document.visibilityState === 'hidden');
  const lastInteractionRef = useRef<number>(Date.now());
  const lastHeartbeatRef = useRef<number>(Date.now());
  const isIdleRef = useRef<boolean>(false);
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

  const rotateSessionIfExpired = () => {
    const lastActiveStr =
      (typeof localStorage !== 'undefined' ? localStorage.getItem(SESSION_ACTIVITY_KEY) : null) ||
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_ACTIVITY_KEY) : null);
    const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : 0;
    const now = Date.now();

    if (!sessionIdRef.current || !lastActive || now - lastActive > SESSION_INACTIVITY_TIMEOUT_MS) {
      if (queueRef.current.length > 0) {
        void flush(true);
      }
      sessionIdRef.current = getSessionId();
      sessionStartTimeRef.current = now;
      segmentStartRef.current = now;
      lastInteractionRef.current = now;
      isIdleRef.current = false;
    }
  };

  const enqueue = (type: TrackerEventType, path: string, durationSeconds = 0) => {
    if (!isEnabled) return;
    if (type !== 'LOGOUT') {
      rotateSessionIfExpired();
    }
    if (!sessionIdRef.current) return;
    updateSessionActivity();
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
  const closeSegment = (isSleepOrIdleCutoff = false) => {
    if (!isEnabled) return;
    const now = Date.now();
    if (!pausedRef.current && !isIdleRef.current) {
      // Effective end time cannot exceed last interaction + MAX_IDLE_SECONDS
      const maxAllowedEnd = lastInteractionRef.current + MAX_IDLE_SECONDS * 1000;
      const effectiveEnd = Math.min(now, maxAllowedEnd);
      const duration = Math.floor((effectiveEnd - segmentStartRef.current) / 1000);
      if (duration >= MIN_PAGE_VIEW_SECONDS) {
        enqueue('PAGE_VIEW', currentPathRef.current, duration);
      }
    }
    segmentStartRef.current = now;
    if (isSleepOrIdleCutoff) {
      isIdleRef.current = true;
    }
  };

  const flush = (urgent = false): Promise<void> => {
    if (!isEnabled || queueRef.current.length === 0) return Promise.resolve();

    const isOnlyLifecycle = queueRef.current.every(
      (e) => e.type === 'LOGIN' || e.type === 'LOGOUT'
    );
    const sessionAgeSeconds = (Date.now() - sessionStartTimeRef.current) / 1000;

    // Do not register/persist sessions that only contain login/logout and last less than 5 seconds
    if (isOnlyLifecycle && sessionAgeSeconds < 5) {
      if (urgent) {
        // Session ending or window closing under 5s with only lifecycle events: drop it
        queueRef.current = [];
        return Promise.resolve();
      }
      // Hold in memory queue until real activity occurs or >= 5 seconds elapse
      return Promise.resolve();
    }

    const batch = queueRef.current;
    queueRef.current = [];

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    // apiFetch attaches the stored token; after logout fall back to the cached one.
    if (!localStorage.getItem('auth_token') && tokenRef.current) {
      headers['Authorization'] = `Bearer ${tokenRef.current}`;
    }

    const send = () =>
      apiFetch(API_ROUTES.ACTIVITY_LOGS.BASE, {
        method: 'POST',
        headers,
        body: JSON.stringify(batch),
        keepalive: urgent
      })
        .then(() => {
          // If viewing activity logs, trigger query invalidation so newly flushed records appear immediately
          if (typeof window !== 'undefined' && window.location.pathname.includes(PAGE_ROUTES.ACTIVITY_LOGS)) {
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
          }
        })
        .catch(() => {
          /* best-effort: drop on network failure */
        });

    if (urgent) {
      return send();
    } else {
      return new Promise<void>((resolve) => {
        runWhenIdle(() => {
          send().finally(resolve);
        });
      });
    }
  };

  useEffect(() => {
    activeFlushFn = flush;
    activeCloseSegmentFn = closeSegment;
    return () => {
      activeFlushFn = null;
      activeCloseSegmentFn = null;
    };
  });

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
      const sessionAgeSeconds = (Date.now() - sessionStartTimeRef.current) / 1000;
      const isOnlyLifecycle = queueRef.current.every(
        (e) => e.type === 'LOGIN' || e.type === 'LOGOUT'
      );
      if (isOnlyLifecycle && sessionAgeSeconds < 5) {
        queueRef.current = [];
      } else {
        enqueue('LOGOUT', '', 0);
        void flush(true);
      }
      clearSessionData();
      sessionIdRef.current = null;
      tokenRef.current = null;
      return;
    }

    tokenRef.current = localStorage.getItem('auth_token');
    if (prevId) return; // user switch while logged in — keep the running session

    sessionIdRef.current = getSessionId();
    sessionStartTimeRef.current = Date.now();
    segmentStartRef.current = Date.now();
    lastInteractionRef.current = Date.now();
    lastHeartbeatRef.current = Date.now();
    isIdleRef.current = false;
    currentPathRef.current = normalizeTrackedPath(location.pathname);
    pausedRef.current = document.visibilityState === 'hidden';

    const hasLoggedLogin =
      (typeof localStorage !== 'undefined' ? localStorage.getItem(SESSION_LOGIN_KEY) : null) ||
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_LOGIN_KEY) : null);

    if (!hasLoggedLogin) {
      enqueue('LOGIN', '', 0);
      try {
        localStorage.setItem(SESSION_LOGIN_KEY, 'true');
        sessionStorage.setItem(SESSION_LOGIN_KEY, 'true');
      } catch (e) {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // Page navigation
  useEffect(() => {
    if (!currentUser) return;
    const targetPath = normalizeTrackedPath(location.pathname);
    if (currentPathRef.current === targetPath) return;
    closeSegment();
    currentPathRef.current = targetPath;
    const now = Date.now();
    segmentStartRef.current = now;
    lastInteractionRef.current = now;
    isIdleRef.current = false;
    void flush(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, currentUser?.id]);

  // User activity listeners, sleep/freeze heartbeat, visibility, unload and periodic flush
  useEffect(() => {
    if (!currentUser) return;

    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle activity updates to at most once per second
      if (now - lastInteractionRef.current < 1000) return;
      lastInteractionRef.current = now;
      updateSessionActivity();

      // If waking from idle or suspended sleep, start fresh segment
      if (isIdleRef.current) {
        isIdleRef.current = false;
        rotateSessionIfExpired();
        segmentStartRef.current = now;
      }
    };

    const checkSleepOrIdle = () => {
      const now = Date.now();
      const elapsedSinceLastTick = now - lastHeartbeatRef.current;
      lastHeartbeatRef.current = now;

      // 1. Sleep / Freeze detection:
      // Heartbeat is scheduled every 5s. If elapsed > 15s, system was suspended/asleep!
      if (elapsedSinceLastTick > 15_000) {
        if (!isIdleRef.current) {
          closeSegment(true);
        }
        rotateSessionIfExpired();
        return;
      }

      // 2. Inactivity idle detection: user has not interacted for > MAX_IDLE_SECONDS
      if (!isIdleRef.current && now - lastInteractionRef.current > MAX_IDLE_SECONDS * 1000) {
        closeSegment(true);
        void flush();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        closeSegment();
        pausedRef.current = true;
        flush(true);
      } else {
        pausedRef.current = false;
        checkSleepOrIdle();
        const now = Date.now();
        segmentStartRef.current = now;
        lastInteractionRef.current = now;
        lastHeartbeatRef.current = now;
      }
    };

    const handlePageHide = () => {
      closeSegment();
      pausedRef.current = true;
      flush(true);
    };

    const handleFocus = () => {
      checkSleepOrIdle();
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((ev) => {
      window.addEventListener(ev, handleUserActivity, { passive: true });
    });

    const heartbeatInterval = window.setInterval(checkSleepOrIdle, HEARTBEAT_INTERVAL_MS);
    const flushInterval = window.setInterval(() => flush(), FLUSH_INTERVAL_MS);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('focus', handleFocus);

    return () => {
      activityEvents.forEach((ev) => {
        window.removeEventListener(ev, handleUserActivity);
      });
      window.clearInterval(heartbeatInterval);
      window.clearInterval(flushInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('focus', handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);
}
