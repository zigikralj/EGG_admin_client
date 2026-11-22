import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../tests/test-utils';
import {
  MessagingContext,
  type MessagingContextType,
  type MessagingDirectoryUser,
} from '../../context/MessagingContext';
import { MessagingMessageBubble } from './MessagingMessageBubble';
import { MessagingMemberSelector } from './MessagingMemberSelector';
import { MessagingWindow } from './MessagingWindow';
import type { MessagingMessageItem } from './messagingApi';

const MOCK_USERS: MessagingDirectoryUser[] = [
  { id: 'u-tamara', name: 'Tamara Veljović', role: 'User', avatarUrl: null },
  { id: 'u-andrijana', name: 'Andrijana Vujović', role: 'User', avatarUrl: null },
];

const createMockMessagingValue = (overrides?: Partial<MessagingContextType>): MessagingContextType => ({
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
  allUsers: MOCK_USERS,
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
  ...overrides,
});

const createMessage = (overrides?: Partial<MessagingMessageItem>): MessagingMessageItem => ({
  id: 'msg-1',
  conversationId: 'conv-1',
  seq: 1,
  senderId: 'u-tamara',
  content: 'Hello everyone',
  isEdited: false,
  isDeleted: false,
  createdAt: new Date().toISOString(),
  sender: {
    id: 'u-tamara',
    name: 'Tamara Veljović',
    avatarUrl: null,
  },
  ...overrides,
});

describe('MessagingMessageBubble person click', () => {
  it('opens direct messaging when clicking the sender name on another user message', () => {
    const openDirectMessagingWithUser = vi.fn().mockResolvedValue(undefined);
    const messagingValue = createMockMessagingValue({ openDirectMessagingWithUser });

    renderWithProviders(
      <MessagingContext.Provider value={messagingValue}>
        <MessagingMessageBubble
          message={createMessage()}
          isCurrentUser={false}
          canModerate={false}
          onReply={vi.fn()}
          onEdit={vi.fn().mockResolvedValue(undefined)}
          onDelete={vi.fn().mockResolvedValue(undefined)}
        />
      </MessagingContext.Provider>
    );

    fireEvent.click(screen.getByText('Tamara Veljović'));
    expect(openDirectMessagingWithUser).toHaveBeenCalledWith('u-tamara', 'Tamara Veljović');
  });

  it('opens direct messaging when clicking the sender avatar on another user message', () => {
    const openDirectMessagingWithUser = vi.fn().mockResolvedValue(undefined);
    const messagingValue = createMockMessagingValue({ openDirectMessagingWithUser });

    renderWithProviders(
      <MessagingContext.Provider value={messagingValue}>
        <MessagingMessageBubble
          message={createMessage()}
          isCurrentUser={false}
          canModerate={false}
          onReply={vi.fn()}
          onEdit={vi.fn().mockResolvedValue(undefined)}
          onDelete={vi.fn().mockResolvedValue(undefined)}
        />
      </MessagingContext.Provider>
    );

    const buttons = screen.getAllByRole('button');
    // First button is the Avatar, second is the sender name
    fireEvent.click(buttons[0]);
    expect(openDirectMessagingWithUser).toHaveBeenCalledWith('u-tamara', 'Tamara Veljović');
  });
});

describe('MessagingMemberSelector existing member click', () => {
  it('calls onClickExistingMember when clicking an existing group member chip', () => {
    const onClickExistingMember = vi.fn();
    const messagingValue = createMockMessagingValue();

    renderWithProviders(
      <MessagingContext.Provider value={messagingValue}>
        <MessagingMemberSelector
          selectedUsers={[]}
          onSelectedUsersChange={vi.fn()}
          existingMembers={[{ id: 'u-andrijana', name: 'Andrijana Vujović', role: 'User', avatarUrl: null }]}
          onClickExistingMember={onClickExistingMember}
        />
      </MessagingContext.Provider>
    );

    fireEvent.click(screen.getByText('Andrijana Vujović'));
    expect(onClickExistingMember).toHaveBeenCalledWith({
      id: 'u-andrijana',
      name: 'Andrijana Vujović',
      role: 'User',
      avatarUrl: null,
    });
  });
});

describe('MessagingWindow minimized unread badge', () => {
  it('displays unread badge on a minimized window even when muted', () => {
    const messagingValue = createMockMessagingValue({
      getConversationUnreadCount: vi.fn().mockReturnValue(3),
    });

    renderWithProviders(
      <MessagingContext.Provider value={messagingValue}>
        <MessagingWindow
          conversationId="conv-aleksandar"
          minimized
          title="Aleksandar Stanković"
          onClose={vi.fn()}
          onToggleMinimize={vi.fn()}
        />
      </MessagingContext.Provider>
    );

    expect(screen.getByText('Aleksandar Stanković')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
