import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProjectModalProvider, useProjectModal } from './ProjectModalContext';

vi.mock('../components/project/ProjectModal', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? <div data-testid="project-modal"><button onClick={onClose}>Close Edit</button></div> : null,
}));

vi.mock('../components/project/ProjectViewModal', () => ({
  default: ({ isOpen, onClose, onEdit }: { isOpen: boolean; onClose: () => void; onEdit: (p: any) => void }) =>
    isOpen ? (
      <div data-testid="project-view-modal">
        <button onClick={onClose}>Close View</button>
        <button onClick={() => onEdit({ id: '1', name: 'Test' })}>Edit View</button>
      </div>
    ) : null,
}));

const TestConsumer = () => {
  const { openNewProject, openViewProject, openEditProject } = useProjectModal();
  return (
    <div>
      <button onClick={openNewProject}>New Project</button>
      <button onClick={() => openViewProject({ id: '1', name: 'Test' } as any)}>View Project</button>
      <button onClick={() => openEditProject({ id: '1', name: 'Test' } as any)}>Edit Project</button>
    </div>
  );
};

describe('ProjectModalContext', () => {
  it('opens and closes ProjectModal on openNewProject', async () => {
    render(
      <ProjectModalProvider>
        <TestConsumer />
      </ProjectModalProvider>
    );

    expect(screen.queryByTestId('project-modal')).not.toBeInTheDocument();

    act(() => {
      screen.getByText('New Project').click();
    });

    expect(await screen.findByTestId('project-modal')).toBeInTheDocument();

    act(() => {
      screen.getByText('Close Edit').click();
    });

    expect(screen.queryByTestId('project-modal')).not.toBeInTheDocument();
  });

  it('opens ProjectViewModal and can transition to edit', async () => {
    render(
      <ProjectModalProvider>
        <TestConsumer />
      </ProjectModalProvider>
    );

    act(() => {
      screen.getByText('View Project').click();
    });

    expect(await screen.findByTestId('project-view-modal')).toBeInTheDocument();

    act(() => {
      screen.getByText('Edit View').click();
    });

    expect(await screen.findByTestId('project-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('project-view-modal')).not.toBeInTheDocument();
  });
});
