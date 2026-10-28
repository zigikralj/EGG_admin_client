import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';

// Mock sub-pages so AppRoutes tests test route matching without heavy page mounts
vi.mock('../pages/project-tracker/TrackerProjectsPage', () => ({
  default: () => <div data-testid="tracker-projects-page">Tracker Projects</div>,
}));
vi.mock('../pages/project-tracker/TrackerUpdatesPage', () => ({
  default: () => <div data-testid="tracker-updates-page">Tracker Updates</div>,
}));
vi.mock('../pages/project-tracker/TrackerInvoicesPage', () => ({
  default: () => <div data-testid="tracker-invoices-page">Tracker Invoices</div>,
}));
vi.mock('../pages/data-management/ProjectsPage', () => ({
  default: () => <div data-testid="dm-projects-page">Data Management Projects</div>,
}));
vi.mock('../pages/data-management/ClientsPage', () => ({
  default: () => <div data-testid="dm-clients-page">Data Management Clients</div>,
}));

describe('AppRoutes', () => {
  it('redirects root / to /project-tracker/projects', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(await screen.findByTestId('tracker-projects-page')).toBeInTheDocument();
  });

  it('renders TrackerUpdatesPage on /project-tracker/updates', async () => {
    render(
      <MemoryRouter initialEntries={['/project-tracker/updates']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(await screen.findByTestId('tracker-updates-page')).toBeInTheDocument();
  });

  it('renders TrackerInvoicesPage on /project-tracker/invoices', async () => {
    render(
      <MemoryRouter initialEntries={['/project-tracker/invoices']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(await screen.findByTestId('tracker-invoices-page')).toBeInTheDocument();
  });

  it('renders Data Management ProjectsPage on /data-management/projects', async () => {
    render(
      <MemoryRouter initialEntries={['/data-management/projects']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(await screen.findByTestId('dm-projects-page')).toBeInTheDocument();
  });

  it('renders Data Management ClientsPage on /data-management/clients', async () => {
    render(
      <MemoryRouter initialEntries={['/data-management/clients']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(await screen.findByTestId('dm-clients-page')).toBeInTheDocument();
  });
});
