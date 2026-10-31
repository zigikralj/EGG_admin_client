import React from 'react';
import { Box, Typography, type SxProps, type Theme } from '@mui/material';
import type { ModalMode } from './ViewEditModalBase';

export interface ViewEditFieldProps {
  mode?: ModalMode;
  isViewMode?: boolean;
  label?: React.ReactNode;
  value?: any;
  viewValue?: React.ReactNode;
  viewRender?: (value: any) => React.ReactNode;
  editRender?: () => React.ReactNode;
  children?: React.ReactNode;
  diffBadge?: React.ReactNode;
  viewSx?: SxProps<Theme>;
  minHeight?: number | string;
  hideLabelInView?: boolean;
  emptyText?: string;
}

export const ViewEditField: React.FC<ViewEditFieldProps> = ({
  mode,
  isViewMode,
  label,
  value,
  viewValue,
  viewRender,
  editRender,
  children,
  diffBadge,
  viewSx,
  minHeight = 38,
  hideLabelInView = false,
  emptyText = '—',
}) => {
  const isView = isViewMode !== undefined ? isViewMode : mode === 'view';

  if (!isView) {
    return <>{children ?? editRender?.()}</>;
  }

  let renderedValue: React.ReactNode;
  if (viewRender) {
    renderedValue = viewRender(value);
  } else if (viewValue !== undefined) {
    renderedValue = viewValue || emptyText;
  } else {
    renderedValue = value || emptyText;
  }

  return (
    <Box
      sx={{
        py: 0.75,
        px: 1.25,
        bgcolor: 'background.default',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flexWrap: 'wrap',
        minHeight,
        width: '100%',
        ...viewSx,
      }}
    >
      {!hideLabelInView && label && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}
        >
          {label}:
        </Typography>
      )}
      <Typography
        variant="body2"
        component="span"
        sx={{
          fontWeight: 600,
          color: 'text.primary',
          display: 'inline-flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 0.5,
          wordBreak: 'break-word',
        }}
      >
        {renderedValue}
        {diffBadge}
      </Typography>
    </Box>
  );
};

export default ViewEditField;
