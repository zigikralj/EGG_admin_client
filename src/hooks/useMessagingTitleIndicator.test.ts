import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMessagingTitleIndicator } from './useMessagingTitleIndicator';
import * as faviconBadge from '../utils/faviconBadge';

describe('useMessagingTitleIndicator', () => {
  let hiddenValue = false;
  let setFaviconSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    document.title = 'Ekos Green Group - Project Tracker';
    hiddenValue = false;
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => hiddenValue,
    });
    setFaviconSpy = vi.spyOn(faviconBadge, 'setFaviconBadge').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    faviconBadge.resetFaviconBadgeCacheForTests();
  });

  const setTabHidden = (hidden: boolean) => {
    hiddenValue = hidden;
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
  };

  it('does not change title or show favicon badge when tab is visible', () => {
    renderHook(({ unreadCount }) => useMessagingTitleIndicator({ unreadCount }), {
      initialProps: { unreadCount: 3 },
    });

    expect(document.title).toBe('Ekos Green Group - Project Tracker');
    expect(setFaviconSpy).toHaveBeenCalledWith(false);
    expect(setFaviconSpy).not.toHaveBeenCalledWith(true);
  });

  it('alternates between count and dot and sets favicon badge when tab is hidden with unread messages', () => {
    renderHook(({ unreadCount }) => useMessagingTitleIndicator({ unreadCount }), {
      initialProps: { unreadCount: 4 },
    });

    setTabHidden(true);

    expect(document.title).toBe('(4) Ekos Green Group - Project Tracker');
    expect(setFaviconSpy).toHaveBeenLastCalledWith(true);

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(document.title).toBe('● Ekos Green Group - Project Tracker');

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(document.title).toBe('(4) Ekos Green Group - Project Tracker');
  });

  it('immediately restores base title and clears favicon badge when tab becomes visible', () => {
    renderHook(({ unreadCount }) => useMessagingTitleIndicator({ unreadCount }), {
      initialProps: { unreadCount: 2 },
    });

    setTabHidden(true);
    expect(document.title).toBe('(2) Ekos Green Group - Project Tracker');
    expect(setFaviconSpy).toHaveBeenLastCalledWith(true);

    setTabHidden(false);
    expect(document.title).toBe('Ekos Green Group - Project Tracker');
    expect(setFaviconSpy).toHaveBeenLastCalledWith(false);
  });

  it('restores base title and clears favicon badge when unreadCount drops to 0', () => {
    const { rerender } = renderHook(
      ({ unreadCount }) => useMessagingTitleIndicator({ unreadCount }),
      { initialProps: { unreadCount: 5 } }
    );

    setTabHidden(true);
    expect(document.title).toBe('(5) Ekos Green Group - Project Tracker');
    expect(setFaviconSpy).toHaveBeenLastCalledWith(true);

    rerender({ unreadCount: 0 });
    expect(document.title).toBe('Ekos Green Group - Project Tracker');
    expect(setFaviconSpy).toHaveBeenLastCalledWith(false);
  });

  it('strips any existing indicator prefixes from document.title so counts never stack', () => {
    document.title = '(1) (1) ● Ekos Green Group - Project Tracker';
    renderHook(({ unreadCount }) => useMessagingTitleIndicator({ unreadCount }), {
      initialProps: { unreadCount: 3 },
    });

    setTabHidden(true);
    expect(document.title).toBe('(3) Ekos Green Group - Project Tracker');

    setTabHidden(false);
    expect(document.title).toBe('Ekos Green Group - Project Tracker');
  });
});
