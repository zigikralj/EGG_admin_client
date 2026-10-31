import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ViewEditField } from './ViewEditField';

describe('ViewEditField', () => {
  it('renders label and value in view mode', () => {
    render(
      <ViewEditField
        mode="view"
        label="Project Name"
        value="Eco Project 1"
        editRender={() => <input data-testid="edit-input" />}
      />
    );

    expect(screen.getByText('Project Name:')).toBeInTheDocument();
    expect(screen.getByText('Eco Project 1')).toBeInTheDocument();
    expect(screen.queryByTestId('edit-input')).not.toBeInTheDocument();
  });

  it('renders custom viewRender output and diff badge in view mode', () => {
    render(
      <ViewEditField
        mode="view"
        label="Client"
        value={{ name: 'Acme Corp' }}
        viewRender={(val) => <strong>{val.name}</strong>}
        diffBadge={<span data-testid="diff-badge">MODIFIED</span>}
        editRender={() => <input data-testid="edit-input" />}
      />
    );

    expect(screen.getByText('Client:')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByTestId('diff-badge')).toBeInTheDocument();
  });

  it('renders fallback dash when value is empty in view mode', () => {
    render(
      <ViewEditField
        mode="view"
        label="Deadline"
        value=""
        editRender={() => <input data-testid="edit-input" />}
      />
    );

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders editRender in edit mode', () => {
    render(
      <ViewEditField
        mode="edit"
        label="Project Name"
        value="Eco Project 1"
        editRender={() => <input data-testid="edit-input" defaultValue="Eco Project 1" />}
      />
    );

    expect(screen.getByTestId('edit-input')).toBeInTheDocument();
    expect(screen.queryByText('Project Name:')).not.toBeInTheDocument();
  });

  it('renders editRender in create mode', () => {
    render(
      <ViewEditField
        mode="create"
        label="Project Name"
        value=""
        editRender={() => <input data-testid="create-input" />}
      />
    );

    expect(screen.getByTestId('create-input')).toBeInTheDocument();
    expect(screen.queryByText('Project Name:')).not.toBeInTheDocument();
  });
});
