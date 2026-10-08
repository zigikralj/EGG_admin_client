import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VersionUpdatePrompt } from './VersionUpdatePrompt';
import * as LanguageContext from '../../context/LanguageContext';
import * as VersionCheckHook from '../../hooks/useVersionCheck';

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

vi.mock('../../hooks/useVersionCheck', () => ({
  useVersionCheck: vi.fn(),
}));

describe('VersionUpdatePrompt', () => {
  const mockReloadApp = vi.fn();
  const mockDismissUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => key,
    });

    (VersionCheckHook.useVersionCheck as any).mockReturnValue({
      hasUpdate: true,
      latestVersion: '2.0.0',
      currentVersion: '1.0.0',
      reloadApp: mockReloadApp,
      dismissUpdate: mockDismissUpdate,
    });
  });

  const renderComponent = () => {
    return render(<VersionUpdatePrompt />);
  };

  it('renders correctly when update is available', () => {
    renderComponent();
    
    expect(screen.getByText('appUpdateAvailable')).toBeInTheDocument();
    expect(screen.getByText('appUpdateDescription')).toBeInTheDocument();
    expect(screen.getByText('v2.0.0')).toBeInTheDocument();
    expect(screen.getByText('btnRefreshNow')).toBeInTheDocument();
  });

  it('does not render when no update is available', () => {
    (VersionCheckHook.useVersionCheck as any).mockReturnValue({
      hasUpdate: false,
    });
    
    const { container } = renderComponent();
    expect(container).toBeEmptyDOMElement();
  });

  it('calls reloadApp when refresh button is clicked', () => {
    renderComponent();
    
    const refreshButton = screen.getByText('btnRefreshNow');
    fireEvent.click(refreshButton);
    
    expect(mockReloadApp).toHaveBeenCalled();
  });

  it('calls dismissUpdate when dismiss button is clicked', () => {
    renderComponent();
    
    const dismissButtons = screen.getAllByText('btnDismiss');
    fireEvent.click(dismissButtons[0]);
    
    expect(mockDismissUpdate).toHaveBeenCalled();
  });
});
