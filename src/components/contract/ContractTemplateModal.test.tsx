import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { ContractTemplateModal } from './ContractTemplateModal';
import { renderWithProviders } from '../../tests/test-utils';
import type { ContractTemplate } from '../../types';

vi.mock('../common/tiptap/TipTapEditor', () => ({
  TipTapEditor: ({ value, onChange, extraToolbarActions }: any) => (
    <div data-testid="mock-tiptap-editor">
      <div data-testid="mock-toolbar-actions">{extraToolbarActions}</div>
      <textarea
        data-testid="mock-editor-textarea"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  ),
}));

const mockTemplate: ContractTemplate = {
  id: 'tpl-99',
  name: 'Standard Indemnity Clause',
  category: 'Liability',
  description: 'Standard clause defining client liability',
  content: '<p>The party shall indemnify and hold harmless...</p>',
};

describe('ContractTemplateModal', () => {
  it('renders Details workspace with metadata and summary card by default', () => {
    renderWithProviders(
      <ContractTemplateModal
        open={true}
        onClose={vi.fn()}
        editingTemplate={mockTemplate}
        canEdit={true}
        onSave={vi.fn()}
      />
    );

    // Switcher
    expect(screen.getByText('templateTabDetails')).toBeInTheDocument();
    expect(screen.getByText('templateTabEditor')).toBeInTheDocument();

    // Details view content (appears in modal title and fields)
    expect(screen.getAllByText('Standard Indemnity Clause').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Liability')).toBeInTheDocument();
    expect(screen.getByText('Standard clause defining client liability')).toBeInTheDocument();
    expect(screen.getByText('templateDocSummaryTitle')).toBeInTheDocument();
    expect(screen.getByText('btnPreviewTemplate')).toBeInTheDocument();
  });

  it('switches between Details workspace and Editor Studio', () => {
    renderWithProviders(
      <ContractTemplateModal
        open={true}
        onClose={vi.fn()}
        editingTemplate={mockTemplate}
        canEdit={true}
        onSave={vi.fn()}
      />
    );

    // Click "Preview Template" button in summary card
    fireEvent.click(screen.getByText('btnPreviewTemplate'));

    // In Editor Studio
    expect(screen.getByTestId('mock-tiptap-editor')).toBeInTheDocument();

    // Click "templateTabDetails" header pill to switch back
    fireEvent.click(screen.getByText('templateTabDetails'));

    // Returned to details
    expect(screen.getByText('templateDocSummaryTitle')).toBeInTheDocument();
  });
});
