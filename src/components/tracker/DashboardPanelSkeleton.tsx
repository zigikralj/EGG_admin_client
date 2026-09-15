import React from 'react';
import { Card, CardContent, Box, Typography, Paper, TablePagination, IconButton, Tooltip, type TablePaginationProps } from '@mui/material';
import { TableSearchInput } from '../common/TableSearchInput';
import { TableQuickFilters, type QuickFilterItem } from '../common/TableQuickFilters';
import { RefreshIcon } from '../icons';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  title: string;
  icon?: React.ReactNode;
  actionButton?: React.ReactNode;
  isFullHeight?: boolean;
  hideNotch?: boolean;
  quickFiltersProps?: {
    options: QuickFilterItem[];
    selectedKeys: string[];
    onChange: (keys: string[]) => void;
  };
  searchProps?: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
  };
  refreshProps?: {
    onRefresh: () => void;
    isRefreshing?: boolean;
    disabled?: boolean;
    tooltip?: string;
  };
  refreshAction?: React.ReactNode;
  filterSelector?: React.ReactNode;
  tableOptions?: React.ReactNode;
  toolbarAction?: React.ReactNode;
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
  quickFiltersProps,
  searchProps,
  refreshProps,
  refreshAction,
  filterSelector,
  tableOptions,
  toolbarAction,
  toolbarContent,
  listContent,
  isEmpty = false,
  emptyMessage = 'No items found',
  paginationProps,
  cardContentSx = {},
}) => {
  const { t } = useLanguage();

  const renderedRefresh = refreshAction ?? (refreshProps && (
    <Tooltip title={refreshProps.tooltip || t('btnRefresh')}>
      <span>
        <IconButton
          size="small"
          onClick={refreshProps.onRefresh}
          disabled={refreshProps.disabled || refreshProps.isRefreshing}
          color="primary"
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            p: 0.7,
          }}
        >
          <RefreshIcon
            fontSize="small"
            sx={{
              animation: refreshProps.isRefreshing ? 'spin 1s linear infinite' : undefined,
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          />
        </IconButton>
      </span>
    </Tooltip>
  ));

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
        {toolbarContent ?? (
          (quickFiltersProps || searchProps || renderedRefresh || filterSelector || tableOptions || toolbarAction) && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                justifyContent: 'space-between',
                gap: 1.5,
                mb: 1.5,
                pb: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              {/* LEFT CONTROLS: QUICK FILTERS */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                {quickFiltersProps && (
                  <TableQuickFilters
                    options={quickFiltersProps.options}
                    selectedKeys={quickFiltersProps.selectedKeys}
                    onChange={quickFiltersProps.onChange}
                  />
                )}
              </Box>

              {/* RIGHT CONTROLS: SEARCH, REFRESH, FILTER SELECTOR, TABLE OPTIONS, ACTION BUTTON */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  justifyContent: { xs: 'space-between', sm: 'flex-end' },
                  flexWrap: 'wrap',
                }}
              >
                {searchProps && (
                  <TableSearchInput
                    value={searchProps.value}
                    onChange={searchProps.onChange}
                    placeholder={searchProps.placeholder}
                  />
                )}
                {renderedRefresh}
                {filterSelector}
                {tableOptions}
                {toolbarAction}
              </Box>
            </Box>
          )
        )}

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
