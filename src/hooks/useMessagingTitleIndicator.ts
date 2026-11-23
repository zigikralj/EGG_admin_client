import { useEffect, useRef, useState } from 'react';
import { setFaviconBadge } from '../utils/faviconBadge';

const DEFAULT_BASE_TITLE = 'Ekos Green Group - Project Tracker';
const FLASH_INTERVAL_MS = 1500;

const stripTitleIndicators = (title: string): string => {
  const cleaned = title.replace(/^(?:\(\d+\)\s+|●\s+)+/, '').trim();
  return cleaned || DEFAULT_BASE_TITLE;
};

interface UseMessagingTitleIndicatorOptions {
  unreadCount: number;
  enabled?: boolean;
}

/**
 * Updates `document.title` with an alternating unread indicator (`(N) Title` <-> `● Title`)
 * and applies a favicon badge when the browser tab is hidden and unread messages exist.
 * Restores the original title and favicon immediately when the tab becomes visible or unreadCount reaches 0.
 */
export const useMessagingTitleIndicator = ({
  unreadCount,
  enabled = true,
}: UseMessagingTitleIndicatorOptions): void => {
  const baseTitleRef = useRef<string>(
    typeof document !== 'undefined' && document.title
      ? stripTitleIndicators(document.title)
      : DEFAULT_BASE_TITLE
  );
  const [isTabHidden, setIsTabHidden] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.hidden : false
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      setIsTabHidden(document.hidden);
    };

    setIsTabHidden(document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const baseTitle = baseTitleRef.current || DEFAULT_BASE_TITLE;
    const shouldIndicate = enabled && isTabHidden && unreadCount > 0;

    if (!shouldIndicate) {
      document.title = baseTitle;
      setFaviconBadge(false);
      return;
    }

    let showCount = true;
    const countTitle = `(${unreadCount}) ${baseTitle}`;
    const dotTitle = `● ${baseTitle}`;

    document.title = countTitle;
    setFaviconBadge(true);

    const intervalId = window.setInterval(() => {
      showCount = !showCount;
      document.title = showCount ? countTitle : dotTitle;
    }, FLASH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      document.title = baseTitle;
      setFaviconBadge(false);
    };
  }, [unreadCount, enabled, isTabHidden]);
};
