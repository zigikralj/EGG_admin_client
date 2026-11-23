import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_NOTIFICATION_PREFS,
  getBrowserNotificationPermission,
  isBrowserNotificationSupported,
  loadNotificationPrefs,
  requestBrowserNotificationPermission,
  saveNotificationPrefs,
  showMessagingBrowserNotification,
} from './browserNotifications';

describe('browserNotifications', () => {
  const originalNotification = globalThis.Notification;
  let mockInstances: Array<{
    title: string;
    options?: NotificationOptions;
    onclick: ((this: Notification, ev: Event) => unknown) | null;
    close: ReturnType<typeof vi.fn>;
  }>;

  const setupNotificationMock = (permission: NotificationPermission = 'granted') => {
    mockInstances = [];
    const MockNotification = vi.fn().mockImplementation(function (
      this: any,
      title: string,
      options?: NotificationOptions
    ) {
      this.title = title;
      this.options = options;
      this.onclick = null;
      this.close = vi.fn();
      mockInstances.push(this);
    }) as any;

    MockNotification.permission = permission;
    MockNotification.requestPermission = vi.fn().mockResolvedValue(permission);

    Object.defineProperty(globalThis, 'Notification', {
      configurable: true,
      writable: true,
      value: MockNotification,
    });

    return MockNotification;
  };

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalNotification) {
      Object.defineProperty(globalThis, 'Notification', {
        configurable: true,
        writable: true,
        value: originalNotification,
      });
    } else {
      delete (globalThis as any).Notification;
    }
  });

  it('persists and loads notification preferences per user', () => {
    expect(loadNotificationPrefs('user-1')).toEqual(DEFAULT_NOTIFICATION_PREFS);

    const custom = { enabled: false, showPreview: false, bannerDismissed: true };
    saveNotificationPrefs('user-1', custom);

    expect(loadNotificationPrefs('user-1')).toEqual(custom);
    expect(loadNotificationPrefs('user-2')).toEqual(DEFAULT_NOTIFICATION_PREFS);
  });

  it('checks permission and requests permission safely', async () => {
    const MockNotification = setupNotificationMock('default');
    expect(isBrowserNotificationSupported()).toBe(true);
    expect(getBrowserNotificationPermission()).toBe('default');

    MockNotification.requestPermission.mockResolvedValueOnce('granted');
    const res = await requestBrowserNotificationPermission();
    expect(res).toBe('granted');
    expect(MockNotification.requestPermission).toHaveBeenCalledTimes(1);
  });

  it('does not show notification if permission is not granted', () => {
    const MockNotification = setupNotificationMock('default');
    const result = showMessagingBrowserNotification({
      conversationId: 'conv-1',
      senderName: 'Marko',
      messageContent: 'Hello there',
      showPreview: true,
      privacyTitle: 'Ekos Green Group',
      privacyBody: 'New message received',
    });

    expect(result).toBeNull();
    expect(MockNotification).not.toHaveBeenCalled();
  });

  it('formats preview mode for direct and project/group conversations with truncation', () => {
    const MockNotification = setupNotificationMock('granted');
    const longText = 'A'.repeat(120);

    showMessagingBrowserNotification({
      conversationId: 'conv-project',
      senderName: 'Ana',
      conversationTitle: 'Project Alpha',
      isProject: true,
      messageContent: `  ${longText}  `,
      showPreview: true,
      privacyTitle: 'Ekos Green Group',
      privacyBody: 'New message received',
    });

    expect(MockNotification).toHaveBeenCalledWith(
      'Ana (Project Alpha)',
      expect.objectContaining({
        body: `${'A'.repeat(97)}...`,
        tag: 'messaging-conv-project',
      })
    );
  });

  it('formats privacy mode hiding sender and message body', () => {
    const MockNotification = setupNotificationMock('granted');

    showMessagingBrowserNotification({
      conversationId: 'conv-2',
      senderName: 'Ana',
      conversationTitle: 'Secret Project',
      isProject: true,
      messageContent: 'Confidential info',
      showPreview: false,
      privacyTitle: 'Ekos Green Group',
      privacyBody: 'New message received',
    });

    expect(MockNotification).toHaveBeenCalledWith(
      'Ekos Green Group',
      expect.objectContaining({
        body: 'New message received',
        tag: 'messaging-conv-2',
      })
    );
  });

  it('focuses window, opens docked messaging callback, and closes notification on click', () => {
    setupNotificationMock('granted');
    const focusSpy = vi.spyOn(window, 'focus').mockImplementation(() => {});
    const onClick = vi.fn();

    const notif = showMessagingBrowserNotification({
      conversationId: 'conv-click',
      senderName: 'Marko',
      messageContent: 'Check this',
      showPreview: true,
      privacyTitle: 'Ekos Green Group',
      privacyBody: 'New message received',
      onClick,
    });

    expect(notif).not.toBeNull();
    notif!.onclick?.(new Event('click'));

    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(mockInstances[0].close).toHaveBeenCalledTimes(1);
  });
});
