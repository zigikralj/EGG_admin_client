import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from './Sidebar';
import { MemoryRouter, useLocation } from 'react-router-dom';
import * as AuthContext from '../../context/AuthContext';
import * as LanguageContext from '../../context/LanguageContext';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn(),
    useNavigate: vi.fn().mockReturnValue(vi.fn()),
  };
});

describe('Sidebar', () => {
  const mockOnMobileClose = vi.fn();
  const mockHasPermission = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (LanguageContext.useLanguage as any).mockReturnValue({
      t: (key: string) => key,
    });

    (AuthContext.useAuth as any).mockReturnValue({
      hasPermission: mockHasPermission,
    });

    mockHasPermission.mockReturnValue(true);
    
    // Default location to data management
    (useLocation as any).mockReturnValue({ pathname: '/data-management/projects' });
  });

  const renderComponent = (navItems: any[] = []) => {
    return render(
      <MemoryRouter>
        <Sidebar
          mobileOpen={false}
          onMobileClose={mockOnMobileClose}
          navItems={navItems}
        />
      </MemoryRouter>
    );
  };

  it('renders standard nav items in data management app', () => {
    const navItems = [
      { path: '/data-management/projects', label: 'Projects', icon: <span />, count: 0, show: true },
      { path: '/data-management/clients', label: 'Clients', icon: <span />, count: 0, show: true },
    ];
    
    renderComponent(navItems);
    
    expect(screen.getAllByText('Projects').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Clients').length).toBeGreaterThan(0);
  });

  it('renders project tracker sub tabs in project tracker app', () => {
    (useLocation as any).mockReturnValue({ pathname: '/project-tracker' });
    
    renderComponent([]);
    
    expect(screen.getAllByText('subTabProjects').length).toBeGreaterThan(0);
    expect(screen.getAllByText('subTabReminders').length).toBeGreaterThan(0);
    expect(screen.getAllByText('tabInvoices').length).toBeGreaterThan(0);
    expect(screen.getAllByText('subTabWasteDisposal').length).toBeGreaterThan(0);
    expect(screen.getAllByText('subTabStatistic').length).toBeGreaterThan(0);
  });

  it('hides sub tabs when permission is lacking', () => {
    (useLocation as any).mockReturnValue({ pathname: '/project-tracker' });
    mockHasPermission.mockImplementation((resource) => {
      if (resource === 'tracker_invoices') return false;
      return true;
    });

    renderComponent([]);

    expect(screen.queryAllByText('tabInvoices').length).toBe(0);
  });
});
