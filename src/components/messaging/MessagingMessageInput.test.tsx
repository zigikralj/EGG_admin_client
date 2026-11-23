import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithProviders } from '../../tests/test-utils';
import {
  MessagingContext,
  type MessagingContextType,
  type MessagingDirectoryUser,
} from '../../context/MessagingContext';
import { MessagingMessageInput } from './MessagingMessageInput';
import { MessagingMessageBubble } from './MessagingMessageBubble';
import type { MessagingMessageItem } from './messagingApi';

const MOCK_USERS: MessagingDirectoryUser[] = [
  { id: 'u-tamara', name: 'Tamara Veljović', role: 'User', avatarUrl: null },
  { id: 'u-andrijana', name: 'Andrijana Vujović', role: 'User', avatarUrl: null },
  { id: 'u-jovana', name: 'Jovana Pantelić', role: 'Manager', avatarUrl: null },
];

const createMockMessagingValue = (allUsers: MessagingDirectoryUser[]): MessagingContextType => ({
  onlineUserIds: new Set(),
  activeWindows: [],
  openMessaging: vi.fn(),
  openDirectMessagingWithUser: vi.fn().mockResolvedValue(undefined),
  closeMessaging: vi.fn(),
  toggleMinimize: vi.fn(),
  markAsRead: vi.fn().mockResolvedValue(undefined),
  markAsUnread: vi.fn().mockResolvedValue(undefined),
  leaveConversation: vi.fn().mockResolvedValue(undefined),
  deleteConversation: vi.fn().mockResolvedValue(undefined),
  muteConversation: vi.fn().mockResolvedValue(undefined),
  unmuteConversation: vi.fn().mockResolvedValue(undefined),
  setDnd: vi.fn().mockResolvedValue(undefined),
  dndUntil: null,
  isDndActive: false,
  totalUnreadCount: 0,
  getProjectUnreadCount: vi.fn().mockReturnValue(0),
  getConversationUnreadCount: vi.fn().mockReturnValue(0),
  allUsers,
  isNewMessageOpen: false,
  isNewMessageMinimized: false,
  openNewMessage: vi.fn(),
  closeNewMessage: vi.fn(),
  toggleMinimizeNewMessage: vi.fn(),
  isMainOpen: false,
  setIsMainOpen: vi.fn(),
  openMainMessaging: vi.fn(),
  closeMainMessaging: vi.fn(),
  toggleMainMessaging: vi.fn(),
  notificationPermission: 'default',
  notificationPrefs: { enabled: true, showPreview: true, bannerDismissed: false },
  enableDesktopNotifications: vi.fn().mockResolvedValue('granted'),
  setDesktopNotificationsEnabled: vi.fn().mockResolvedValue(undefined),
  setDesktopNotificationsShowPreview: vi.fn(),
  dismissNotificationBanner: vi.fn(),
});

describe('MessagingMessageInput @mention scoping', () => {
  it('disables @mention popup and clears mentionedUserIds when allowMentions is false (DIRECT chat)', async () => {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    const messagingValue = createMockMessagingValue(MOCK_USERS);

    renderWithProviders(
      <MessagingContext.Provider value={messagingValue}>
        <MessagingMessageInput
          onSendMessage={onSendMessage}
          replyingTo={null}
          onCancelReply={vi.fn()}
          allowMentions={false}
          placeholder="Write message"
        />
      </MessagingContext.Provider>
    );

    const textbox = screen.getByPlaceholderText('Write message');
    fireEvent.change(textbox, {
      target: { value: 'Hello @Tam', selectionStart: 10 },
    });

    expect(screen.queryByText('Tamara Veljović')).not.toBeInTheDocument();

    const sendButton = screen.getByTestId('SendIcon').closest('button')!;
    await act(async () => {
      fireEvent.click(sendButton);
    });

    expect(onSendMessage).toHaveBeenCalledWith('Hello @Tam', undefined, []);
  });

  it('suggests only mentionCandidates when provided (GROUP chat)', async () => {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    const messagingValue = createMockMessagingValue(MOCK_USERS);
    const groupMembers = [MOCK_USERS[1]]; // Only Andrijana Vujović is in the group

    renderWithProviders(
      <MessagingContext.Provider value={messagingValue}>
        <MessagingMessageInput
          onSendMessage={onSendMessage}
          replyingTo={null}
          onCancelReply={vi.fn()}
          allowMentions
          mentionCandidates={groupMembers}
          placeholder="Write message"
        />
      </MessagingContext.Provider>
    );

    const textbox = screen.getByPlaceholderText('Write message');
    fireEvent.change(textbox, {
      target: { value: 'Hello @', selectionStart: 7 },
    });

    expect(screen.getByText('Andrijana Vujović')).toBeInTheDocument();
    expect(screen.queryByText('Tamara Veljović')).not.toBeInTheDocument();
    expect(screen.queryByText('Jovana Pantelić')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Andrijana Vujović'));
    const sendButton = screen.getByTestId('SendIcon').closest('button')!;
    await act(async () => {
      fireEvent.click(sendButton);
    });

    expect(onSendMessage).toHaveBeenCalledWith('Hello @Andrijana Vujović', undefined, ['u-andrijana']);
  });

  it('suggests from allUsers when allowMentions is enabled without mentionCandidates (PROJECT chat)', async () => {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    const messagingValue = createMockMessagingValue(MOCK_USERS);

    renderWithProviders(
      <MessagingContext.Provider value={messagingValue}>
        <MessagingMessageInput
          onSendMessage={onSendMessage}
          replyingTo={null}
          onCancelReply={vi.fn()}
          allowMentions
          placeholder="Write message"
        />
      </MessagingContext.Provider>
    );

    const textbox = screen.getByPlaceholderText('Write message');
    fireEvent.change(textbox, {
      target: { value: 'Check @', selectionStart: 7 },
    });

    expect(screen.getByText('Tamara Veljović')).toBeInTheDocument();
    expect(screen.getByText('Andrijana Vujović')).toBeInTheDocument();
    expect(screen.getByText('Jovana Pantelić')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Tamara Veljović'));
    const sendButton = screen.getByTestId('SendIcon').closest('button')!;
    await act(async () => {
      fireEvent.click(sendButton);
    });

    expect(onSendMessage).toHaveBeenCalledWith('Check @Tamara Veljović', undefined, ['u-tamara']);
  });
});

describe('MessagingMessageBubble mention highlighting', () => {
  const sampleMessage: MessagingMessageItem = {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'u-andrijana',
    content: 'Please ask @Tamara Veljović',
    isEdited: false,
    isDeleted: false,
    createdAt: '2026-11-20T08:00:00.000Z',
    sender: { id: 'u-andrijana', name: 'Andrijana Vujović', role: 'User' },
  };

  it('does not highlight @mentions when highlightMentions is false', () => {
    const messagingValue = createMockMessagingValue(MOCK_USERS);

    renderWithProviders(
      <MessagingContext.Provider value={messagingValue}>
        <MessagingMessageBubble
          message={sampleMessage}
          isCurrentUser={false}
          canModerate={false}
          highlightMentions={false}
          onReply={vi.fn()}
          onEdit={vi.fn().mockResolvedValue(undefined)}
          onDelete={vi.fn().mockResolvedValue(undefined)}
        />
      </MessagingContext.Provider>
    );

    const textEl = screen.getByText('Please ask @Tamara Veljović');
    expect(textEl.tagName.toLowerCase()).toBe('p');
    expect(screen.queryByText('@Tamara Veljović')).not.toBeInTheDocument();
  });

  it('highlights @mentions when highlightMentions is true', () => {
    const messagingValue = createMockMessagingValue(MOCK_USERS);

    renderWithProviders(
      <MessagingContext.Provider value={messagingValue}>
        <MessagingMessageBubble
          message={sampleMessage}
          isCurrentUser={false}
          canModerate={false}
          highlightMentions
          onReply={vi.fn()}
          onEdit={vi.fn().mockResolvedValue(undefined)}
          onDelete={vi.fn().mockResolvedValue(undefined)}
        />
      </MessagingContext.Provider>
    );

    const mentionSpan = screen.getByText('@Tamara Veljović');
    expect(mentionSpan).toBeInTheDocument();
    expect(mentionSpan.tagName.toLowerCase()).toBe('span');
  });

  it('focuses the message input when autoFocus is enabled', async () => {
    vi.useFakeTimers();
    const messagingValue = createMockMessagingValue(MOCK_USERS);

    renderWithProviders(
      <MessagingContext.Provider value={messagingValue}>
        <MessagingMessageInput
          onSendMessage={vi.fn().mockResolvedValue(undefined)}
          replyingTo={null}
          onCancelReply={vi.fn()}
          placeholder="Write message"
          autoFocus
        />
      </MessagingContext.Provider>
    );

    const textbox = screen.getByPlaceholderText('Write message');
    expect(document.activeElement).not.toBe(textbox);

    await act(async () => {
      vi.advanceTimersByTime(60);
    });

    expect(document.activeElement).toBe(textbox);
    vi.useRealTimers();
  });
});
