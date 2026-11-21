import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RolesPage from './RolesPage';
import { renderWithProviders } from '../../tests/test-utils';
import * as queries from '../../queries';

vi.mock('../../queries', async (importOriginal) => {
  const actual = await importOriginal<typeof queries>();
  return {
    ...actual,
    useRolesQuery: vi.fn(),
    useRoleMutations: vi.fn(),
  };
});

describe('RolesPage Integration', () => {
  const mockRoles = [
    { name: 'Viewer', level: 10, isSystemAdmin: false, description: 'Basic user' },
    { name: 'SuperAdmin', level: 100, isSystemAdmin: true, description: 'Root admin' },
    { name: 'Editor', level: 50, isSystemAdmin: false, description: 'Editor user' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(queries.useRolesQuery).mockReturnValue({
      data: mockRoles,
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(queries.useRoleMutations).mockReturnValue({
      createMutation: { mutate: vi.fn() },
      updateMutation: { mutate: vi.fn() },
      deleteMutation: { mutate: vi.fn() },
    } as any);
  });

  const renderPage = (props = {}) => {
    return renderWithProviders(<RolesPage {...props} />);
  };

  it('renders roles sorted by level in descending order by default', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    const rows = screen.getAllByRole('row');
    // First row is the TableHead, followed by 3 role rows
    expect(rows).toHaveLength(4);
    expect(rows[1]).toHaveTextContent('SuperAdmin');
    expect(rows[1]).toHaveTextContent('100');
    expect(rows[2]).toHaveTextContent('Editor');
    expect(rows[2]).toHaveTextContent('50');
    expect(rows[3]).toHaveTextContent('Viewer');
    expect(rows[3]).toHaveTextContent('10');
  });

  it('toggles sort order to ascending when level sort header is clicked', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    const levelHeader = screen.getByText('Level');
    fireEvent.click(levelHeader);

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Viewer');
    expect(rows[1]).toHaveTextContent('10');
    expect(rows[2]).toHaveTextContent('Editor');
    expect(rows[2]).toHaveTextContent('50');
    expect(rows[3]).toHaveTextContent('SuperAdmin');
    expect(rows[3]).toHaveTextContent('100');
  });
});
