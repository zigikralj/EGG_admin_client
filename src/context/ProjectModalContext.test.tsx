import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProjectModalProvider, useProjectModal } from './ProjectModalContext';

vi.mock('../components/project/ProjectModal', () => ({
  default: ({
    isOpen,
    onClose,
    initialMode,
    onEdit,
    project,
  }: {
    isOpen: boolean;
    onClose: () => void;
    initialMode: string;
    onEdit?: (p: any) => void;
    project?: any;
  }) =>
    isOpen ? (
      <div data-testid="project-modal" data-mode={initialMode}>
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
  const { openNewProject, openViewProject, openEditProject } = useProjectModal();
  return (
    <div>
      <button onClick={openNewProject}>New Project</button>
      <button onClick={() => openViewProject({ id: '1', name: 'Test Project' } as any)}>View Project</button>
      <button onClick={() => openEditProject({ id: '1', name: 'Test Project' } as any)}>Edit Project</button>
    </div>
  );
};

describe('ProjectModalContext', () => {
  it('opens and closes ProjectModal on openNewProject with create mode', async () => {
    render(
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
    render(
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
});
