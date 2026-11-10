import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContractsPage } from './ContractsPage';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    hasPermission: () => true,
    currentUser: { id: 'admin-1', name: 'Admin', role: 'Administrator' },
  }),
}));

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (k: string) => k,
    getErrorMessage: (m: string) => m,
  }),
}));

vi.mock('../../queries', () => ({
  usePaginatedContractsQuery: () => ({
    data: {
      items: [
        {
          id: 'c1',
          contractNumber: 'UGOV-2026-001',
          title: 'Ugovor o zbrinjavanju otpada',
          clientName: 'Test Client DOO',
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          status: 'Active',
          reminders: [
            {
              id: 'rem-auto-1',
              title: 'Istek ugovora (45d)',
              dueDate: '2026-11-16',
              isAutoContractReminder: true,
            },
          ],
        },
      ],
      total: 1,
      page: 1,
      limit: 25,
      totalPages: 1,
    },
    isLoading: false,
  }),
  useContractsMutations: () => ({
    handleSave: vi.fn(),
    handleDelete: vi.fn(),
  }),
  usePaginatedContractTemplatesQuery: () => ({
    data: { items: [], total: 0 },
    isLoading: false,
  }),
  useContractTemplatesMutations: () => ({
    handleSave: vi.fn(),
    handleDelete: vi.fn(),
  }),
  useClientsSummaryQuery: () => ({
    data: [],
  }),
  useTablePreferences: () => ({
    rowsPerPage: 25,
  }),
  useRemindersMutations: () => ({
    handleSave: vi.fn(),
  }),
}));

describe('ContractsPage', () => {
  it('renders Contracts table with contract row and 45d reminder badge', () => {
    render(<ContractsPage />);

    expect(screen.getByText('contractsAndTemplates')).toBeInTheDocument();
    expect(screen.getByText('tabContracts')).toBeInTheDocument();
    expect(screen.getByText('tabTemplates')).toBeInTheDocument();
    expect(screen.getByText('colClient')).toBeInTheDocument();
    expect(screen.getByText('quickFilterExpiringContracts')).toBeInTheDocument();
    expect(screen.getByText('quickFilterDraftContracts')).toBeInTheDocument();
    expect(screen.getByText('UGOV-2026-001')).toBeInTheDocument();
    expect(screen.getByText('Ugovor o zbrinjavanju otpada')).toBeInTheDocument();
    expect(screen.getByText('Test Client DOO')).toBeInTheDocument();
    expect(screen.getByText('45d')).toBeInTheDocument();
  });
});
