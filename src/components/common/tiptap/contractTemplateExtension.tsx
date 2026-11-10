import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { CloseIcon, DescriptionIcon } from '../../icons';

export interface ContractTemplateBlockAttributes {
  templateId?: string;
  templateName?: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    contractTemplateBlock: {
      setContractTemplateBlock: (attributes?: ContractTemplateBlockAttributes) => ReturnType;
    };
  }
}

const ContractTemplateBlockComponent: React.FC<any> = ({ node, deleteNode, editor }) => {
  const isEditable = editor.isEditable;
  const templateName = node.attrs.templateName || 'Šablon / Boilerplate';

  return (
    <NodeViewWrapper className="contract-template-block-wrapper">
      <Box
        sx={{
          position: 'relative',
          my: 1.5,
          p: 2,
          borderRadius: 1.5,
          border: '1px dashed',
          borderColor: 'primary.main',
          bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.08)' : 'rgba(25, 118, 210, 0.04)'),
          transition: 'all 0.15s ease-in-out',
          '&:hover': {
            borderColor: 'primary.dark',
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.12)' : 'rgba(25, 118, 210, 0.07)'),
            '& .template-block-remove-btn': {
              opacity: 1,
              pointerEvents: 'auto',
            },
          },
          '@media print': {
            border: 'none !important',
            bgcolor: 'transparent !important',
            p: '0 !important',
            m: '0 !important',
            '& .template-block-header, & .template-block-remove-btn': {
              display: 'none !important',
            },
          },
        }}
      >
        {/* Template Header Badge */}
        <Box
          className="template-block-header"
          contentEditable={false}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1,
            userSelect: 'none',
          }}
        >
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, bgcolor: 'primary.main', color: '#fff', px: 1, py: 0.25, borderRadius: 1 }}>
            <DescriptionIcon sx={{ fontSize: 13 }} />
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.72rem', letterSpacing: 0.3 }}>
              {templateName}
            </Typography>
          </Box>

          {isEditable && (
            <Tooltip title="Ukloni ovaj šablon">
              <IconButton
                className="template-block-remove-btn"
                size="small"
                onClick={deleteNode}
                sx={{
                  width: 22,
                  height: 22,
                  bgcolor: 'error.main',
                  color: '#fff',
                  opacity: { xs: 1, sm: 0 },
                  pointerEvents: { xs: 'auto', sm: 'none' },
                  transition: 'opacity 0.15s ease-in-out',
                  '&:hover': {
                    bgcolor: 'error.dark',
                  },
                }}
              >
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Inner editable template content */}
        <NodeViewContent className="contract-template-content" />
      </Box>
    </NodeViewWrapper>
  );
};

export const ContractTemplateBlock = Node.create({
  name: 'contractTemplateBlock',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      templateId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-template-id'),
        renderHTML: (attributes) => {
          if (!attributes.templateId) return {};
          return { 'data-template-id': attributes.templateId };
        },
      },
      templateName: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-template-name'),
        renderHTML: (attributes) => {
          if (!attributes.templateName) return {};
          return { 'data-template-name': attributes.templateName };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-contract-template-block="true"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-contract-template-block': 'true' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ContractTemplateBlockComponent);
  },

  addCommands() {
    return {
      setContractTemplateBlock:
        (attributes) =>
        ({ commands }) => {
          return commands.setNode(this.name, attributes);
        },
    };
  },
});
