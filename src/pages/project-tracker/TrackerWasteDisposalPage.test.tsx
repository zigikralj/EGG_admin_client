import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TrackerWasteDisposalPage from './TrackerWasteDisposalPage';
import { renderWithProviders } from '../../tests/test-utils';
import * as api from '../../api';

describe('TrackerWasteDisposalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title, count chip, and new button', async () => {
    renderWithProviders(<TrackerWasteDisposalPage />);
    await waitFor(() => {
      expect(screen.getByText('subTabWasteDisposal')).toBeInTheDocument();
      expect(screen.getByText('btnNewWasteDisposal')).toBeInTheDocument();
    });
  });

  it('renders service selector next to title for administrators', async () => {
    vi.spyOn(api, 'apiFetch').mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/system-settings')) {
        return {
          ok: true,
          json: async () => ({ waste_disposal_service_id: 'srv-1' }),
        } as any;
      }
      return {
        ok: true,
        json: async () => ([]),
      } as any;
    });

    renderWithProviders(<TrackerWasteDisposalPage />, {
      authValue: {
        currentUser: { id: 'admin1', name: 'Admin', role: 'Administrator' } as any,
        isRealAdmin: true,
        hasPermission: vi.fn().mockReturnValue(true),
      } as any,
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/lblSelectedWasteService|service/i)).toBeInTheDocument();
    });
  });

  it('does not render service selector for non-administrators', async () => {
    renderWithProviders(<TrackerWasteDisposalPage />, {
      authValue: {
        currentUser: { id: 'user1', name: 'User', role: 'User' } as any,
        isRealAdmin: false,
        hasPermission: vi.fn().mockReturnValue(true),
      } as any,
    });

    await waitFor(() => {
      expect(screen.getByText('subTabWasteDisposal')).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/lblSelectedWasteService/i)).not.toBeInTheDocument();
  });
});
