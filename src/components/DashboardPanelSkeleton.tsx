import React from 'react';
import { Card, CardContent, Box, Typography, Paper, TablePagination, type TablePaginationProps } from '@mui/material';

interface Props {
  title: string;
  icon?: React.ReactNode;
  actionButton?: React.ReactNode;
  isFullHeight?: boolean;
  hideNotch?: boolean;
  toolbarContent?: React.ReactNode;
  listContent?: React.ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
  paginationProps?: TablePaginationProps | null;
  cardContentSx?: object;
}

export const DashboardPanelSkeleton: React.FC<Props> = ({
  title,
  icon,
  actionButton,
  isFullHeight = false,
  hideNotch = false,
  toolbarContent,
  listContent,
  isEmpty = false,
  emptyMessage = 'No items found',
  paginationProps,
  cardContentSx = {},
}) => {
  return (
    <Card
      elevation={3}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: isFullHeight ? '100%' : 'auto',
        borderRadius: 2,
        position: 'relative',
        overflow: 'visible',
        bgcolor: 'background.paper',
        mt: hideNotch ? 0 : 2.5,
        ...(isFullHeight && { minHeight: 0 }), // Important for flex scrolling
      }}
    >
      {/* NOTCHED TITLE */}
      {!hideNotch && (
        <Box
          sx={{
            position: 'absolute',
            top: -12,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {/* TITLE CHIP */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              py: 0.5,
              px: 2,
              borderRadius: 8,
              boxShadow: 2,
              pointerEvents: 'auto',
            }}
          >
            {icon}
            <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              {title}
            </Typography>
          </Box>
          
          {/* OPTIONAL ACTION BUTTON */}
          {actionButton && (
            <Box sx={{ pointerEvents: 'auto' }}>
              {actionButton}
            </Box>
          )}
        </Box>
      )}

      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          pt: hideNotch ? 2 : 3,
          flex: 1,
          minHeight: 0,
          '&:last-child': { pb: 2 },
          ...cardContentSx,
        }}
      >
        {toolbarContent}

        <Box
          sx={{
            maxHeight: isFullHeight ? 'none' : 320,
            overflowY: isFullHeight ? 'visible' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            width: '100%',
            flex: 1,
            pb: 1,
          }}
        >
          {isEmpty ? (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {emptyMessage}
              </Typography>
            </Paper>
          ) : (
            listContent
          )}
        </Box>

        {paginationProps && !isEmpty && (
          <TablePagination
            component="div"
            {...paginationProps}
            sx={{ borderTop: 1, borderColor: 'divider', mt: 0.5, flexShrink: 0, ...paginationProps.sx }}
          />
        )}
      </CardContent>
    </Card>
  );
};
