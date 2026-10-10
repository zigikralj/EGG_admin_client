import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProjectsPage from './ProjectsPage';
import { renderWithProviders } from '../../tests/test-utils';

describe('ProjectsPage Integration', () => {
  const mockOnSearchChange = vi.fn();
  const mockOnOpenNew = vi.fn();
  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = (props = {}) => {
    return renderWithProviders(
      <ProjectsPage
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        onOpenNew={mockOnOpenNew}
        onEdit={mockOnEdit}
        visibleColumns={['name', 'client', 'category', 'responsible', 'start', 'deadline', 'progress', 'status']}
        onVisibleColumnsChange={vi.fn()}
        rowsPerPageOptions={[25, 50, 100]}
        onRowsPerPageOptionsChange={vi.fn()}
        rowsPerPage={25}
        onRowsPerPageChange={vi.fn()}
        sortState={{ field: 'createdAt', direction: 'desc' }}
        onSortChange={vi.fn()}
        {...props}
      />
    );
  };

  it('renders the projects list and data from MSW', async () => {
    renderPage();

    // Verify title
    expect(screen.getByText('projectsListTitle')).toBeInTheDocument();

    // Wait for data to load from MSW
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    // Check row data
    expect(screen.getByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('handles search input', async () => {
    renderPage();

    // Click the search icon button to expand the input
    const searchBtn = screen.getByRole('button', { name: /searchPlaceholder/i });
    fireEvent.click(searchBtn);

    const searchInput = screen.getByPlaceholderText('searchPlaceholder');
    fireEvent.change(searchInput, { target: { value: 'New Search' } });

    expect(mockOnSearchChange).toHaveBeenCalledWith('New Search');
  });

  it('opens new project modal', async () => {
    renderPage();

    const newBtn = screen.getByText('btnNewProject');
    fireEvent.click(newBtn);

    expect(mockOnOpenNew).toHaveBeenCalled();
  });
});
