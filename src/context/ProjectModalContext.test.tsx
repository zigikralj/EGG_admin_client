import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectModalProvider, useProjectModal } from './ProjectModalContext';
import * as apiModule from '../api';

vi.mock('../components/project/ProjectModal', () => ({
  default: ({
    isOpen,
    onClose,
    initialMode,
    initialTab,
    onEdit,
    project,
  }: {
    isOpen: boolean;
    onClose: () => void;
    initialMode: string;
    initialTab?: string;
    onEdit?: (p: any) => void;
    project?: any;
  }) =>
    isOpen ? (
      <div
        data-testid="project-modal"
        data-mode={initialMode}
        data-initial-tab={initialTab || ''}
      >
        <span data-testid="project-title">{project?.name || 'No Project'}</span>
        <button onClick={onClose}>Close Modal</button>
        {onEdit && (
          <button onClick={() => onEdit({ id: '1', name: 'Test Updated' })}>
            Trigger Edit Transition
          </button>
        )}
      </div>
    ) : null,
}));

const TestConsumer = () => {
  const { openNewProject, openViewProject, openEditProject, openProjectById } = useProjectModal();
  return (
    <div>
      <button onClick={openNewProject}>New Project</button>
      <button onClick={() => openViewProject({ id: '1', name: 'Test Project' } as any)}>View Project</button>
      <button onClick={() => openEditProject({ id: '1', name: 'Test Project' } as any)}>Edit Project</button>
      <button onClick={() => void openProjectById('proj-42', 'messages')}>Open Project Messaging</button>
    </div>
  );
};

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('ProjectModalContext', () => {
  it('opens and closes ProjectModal on openNewProject with create mode', async () => {
    renderWithQueryClient(
      <ProjectModalProvider>
        <TestConsumer />
      </ProjectModalProvider>
    );

    expect(screen.queryByTestId('project-modal')).not.toBeInTheDocument();

    act(() => {
      screen.getByText('New Project').click();
    });

    const modal = await screen.findByTestId('project-modal');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveAttribute('data-mode', 'create');

    act(() => {
      screen.getByText('Close Modal').click();
    });

    expect(screen.queryByTestId('project-modal')).not.toBeInTheDocument();
  });

  it('opens ProjectModal in view mode and can transition to edit in-place', async () => {
    renderWithQueryClient(
      <ProjectModalProvider>
        <TestConsumer />
      </ProjectModalProvider>
    );

    act(() => {
      screen.getByText('View Project').click();
    });

    const modal = await screen.findByTestId('project-modal');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveAttribute('data-mode', 'view');
    expect(screen.getByTestId('project-title')).toHaveTextContent('Test Project');

    act(() => {
      screen.getByText('Trigger Edit Transition').click();
    });

    expect(screen.getByTestId('project-modal')).toHaveAttribute('data-mode', 'edit');
    expect(screen.getByTestId('project-title')).toHaveTextContent('Test Updated');
  });

  it('passes initialTab="messages" when openProjectById is invoked for project messaging', async () => {
    const apiFetchSpy = vi.spyOn(apiModule, 'apiFetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'proj-42', name: 'Project 42' }),
    } as Response);

    renderWithQueryClient(
      <ProjectModalProvider>
        <TestConsumer />
      </ProjectModalProvider>
    );

    await act(async () => {
      screen.getByText('Open Project Messaging').click();
    });

    const modal = await screen.findByTestId('project-modal');
    expect(modal).toHaveAttribute('data-mode', 'view');
    expect(modal).toHaveAttribute('data-initial-tab', 'messages');
    expect(screen.getByTestId('project-title')).toHaveTextContent('Project 42');
    apiFetchSpy.mockRestore();
  });
});
