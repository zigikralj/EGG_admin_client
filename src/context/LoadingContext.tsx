import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useLanguage } from './LanguageContext';

export interface LoadingContextType {
  isLoading: boolean;
  loadingMessage: string;
  isServerWakingUp: boolean;
  elapsedSeconds: number;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  withLoading: <T>(action: Promise<T> | (() => Promise<T>), message?: string) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

const WAKE_UP_THRESHOLD_SECONDS = 4;
// Minimum duration the loading overlay stays visible to prevent sudden jarring flashes on fast responses
const MIN_DISPLAY_TIME_MS = 500;

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useLanguage();

  const [manualCount, setManualCount] = useState<number>(0);
  const [manualMessage, setManualMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [displayLoading, setDisplayLoading] = useState<boolean>(false);

  const startTimeRef = useRef<number>(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Monitor React Query fetching when data is not shown yet
  const fetchingCount = useIsFetching({
    predicate: (query) => {
      if (query.meta?.silent === true) return false;
      // Only count queries that are actively fetching and do not yet have cached data
      return query.state.fetchStatus === 'fetching' && query.state.data === undefined;
    },
  });

  // Monitor React Query non-silent mutations (saving, deleting, etc.)
  const mutatingCount = useIsMutating({
    predicate: (mutation) => {
      if (mutation.options.meta?.silent === true) return false;
      if (mutation.options.mutationKey?.[0] === 'preferences') return false;
      return true;
    },
  });

  const rawIsLoading = manualCount > 0 || fetchingCount > 0 || mutatingCount > 0;

  // Manage smooth display time and avoid quick flicker
  useEffect(() => {
    if (rawIsLoading) {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      if (!displayLoading) {
        startTimeRef.current = Date.now();
        setDisplayLoading(true);
      }
    } else {
      if (displayLoading) {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, MIN_DISPLAY_TIME_MS - elapsed);
        if (remaining > 0) {
          hideTimerRef.current = setTimeout(() => {
            setDisplayLoading(false);
            setManualMessage(null);
            hideTimerRef.current = null;
          }, remaining);
        } else {
          setDisplayLoading(false);
          setManualMessage(null);
        }
      }
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [rawIsLoading, displayLoading]);

  // Track elapsed time when loading is actively displayed
  useEffect(() => {
    if (!displayLoading) {
      setElapsedSeconds(0);
      return;
    }

    const startTime = startTimeRef.current || Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 500);

    return () => clearInterval(interval);
  }, [displayLoading]);

  const isServerWakingUp = elapsedSeconds >= WAKE_UP_THRESHOLD_SECONDS;

  const showLoading = useCallback((message?: string) => {
    setManualCount((prev) => prev + 1);
    if (message) {
      setManualMessage(message);
    }
  }, []);

  const hideLoading = useCallback(() => {
    setManualCount((prev) => Math.max(0, prev - 1));
  }, []);

  const withLoading = useCallback(
    async <T,>(action: Promise<T> | (() => Promise<T>), message?: string): Promise<T> => {
      showLoading(message);
      try {
        const promise = typeof action === 'function' ? action() : action;
        return await promise;
      } finally {
        hideLoading();
      }
    },
    [showLoading, hideLoading]
  );

  const loadingMessage = useMemo(() => {
    if (manualMessage) return manualMessage;
    if (mutatingCount > 0) return t('loadingSaving') || 'Saving...';
    return t('loadingData') || 'Loading data...';
  }, [manualMessage, mutatingCount, t]);

  const value = useMemo(
    () => ({
      isLoading: displayLoading,
      loadingMessage,
      isServerWakingUp,
      elapsedSeconds,
      showLoading,
      hideLoading,
      withLoading,
    }),
    [displayLoading, loadingMessage, isServerWakingUp, elapsedSeconds, showLoading, hideLoading, withLoading]
  );

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
