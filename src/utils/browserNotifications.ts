import { STORAGE_KEYS } from '../constants';

export interface MessagingNotificationPrefs {
  enabled: boolean;
  showPreview: boolean;
  bannerDismissed: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: MessagingNotificationPrefs = {
  enabled: true,
  showPreview: true,
  bannerDismissed: false,
};

export const isBrowserNotificationSupported = (): boolean =>
  typeof window !== 'undefined' && 'Notification' in window;

export const getBrowserNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

export const requestBrowserNotificationPermission = async (): Promise<
  NotificationPermission | 'unsupported'
> => {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
};

export const loadNotificationPrefs = (userId: string): MessagingNotificationPrefs => {
  if (!userId) return { ...DEFAULT_NOTIFICATION_PREFS };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MESSAGING_NOTIFICATION_PREFS(userId));
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFS };
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed?.enabled === 'boolean' ? parsed.enabled : DEFAULT_NOTIFICATION_PREFS.enabled,
      showPreview:
        typeof parsed?.showPreview === 'boolean'
          ? parsed.showPreview
          : DEFAULT_NOTIFICATION_PREFS.showPreview,
      bannerDismissed:
        typeof parsed?.bannerDismissed === 'boolean'
          ? parsed.bannerDismissed
          : DEFAULT_NOTIFICATION_PREFS.bannerDismissed,
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
};

export const saveNotificationPrefs = (
  userId: string,
  prefs: MessagingNotificationPrefs
): void => {
  if (!userId) return;
  try {
    localStorage.setItem(
      STORAGE_KEYS.MESSAGING_NOTIFICATION_PREFS(userId),
      JSON.stringify(prefs)
    );
  } catch {
    // Ignore storage quota or private mode errors
  }
};

const truncateSnippet = (content: string, maxLength = 100): string => {
  const normalized = content.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3)}...`;
};

const getCurrentFaviconHref = (): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  return document.querySelector<HTMLLinkElement>('link[rel~="icon"]')?.href || undefined;
};

export interface ShowMessagingNotificationParams {
  conversationId: string;
  senderName: string;
  conversationTitle?: string | null;
  isGroup?: boolean;
  isProject?: boolean;
  messageContent?: string | null;
  showPreview: boolean;
  privacyTitle: string;
  privacyBody: string;
  onClick?: () => void;
}

/**
 * Displays a native browser notification for an incoming message if permission is granted.
 */
export const showMessagingBrowserNotification = ({
  conversationId,
  senderName,
  conversationTitle,
  isGroup = false,
  isProject = false,
  messageContent,
  showPreview,
  privacyTitle,
  privacyBody,
  onClick,
}: ShowMessagingNotificationParams): Notification | null => {
  if (!isBrowserNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  let title: string;
  let body: string;

  if (showPreview) {
    title =
      (isGroup || isProject) && conversationTitle
        ? `${senderName} (${conversationTitle})`
        : senderName;
    const snippet = messageContent ? truncateSnippet(messageContent, 100) : '';
    body = snippet || privacyBody;
  } else {
    title = privacyTitle;
    body = privacyBody;
  }

  try {
    const icon = getCurrentFaviconHref();
    const notification = new Notification(title, {
      body,
      ...(icon ? { icon } : {}),
      tag: `messaging-${conversationId}`,
    });

    notification.onclick = () => {
      if (typeof window !== 'undefined' && typeof window.focus === 'function') {
        window.focus();
      }
      onClick?.();
      notification.close();
    };

    return notification;
  } catch {
    return null;
  }
};
