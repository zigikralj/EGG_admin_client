import React, { useState } from 'react';
import {
  Button,
  Popover,
  Typography,
  Divider,
  Box,
  Badge,
  IconButton,
  Tooltip,
} from '@mui/material';

import { useLanguage } from '../context/LanguageContext';
import { FilterListIcon, FilterListOffIcon } from './icons';

interface Props {
  activeCount: number;
  onClear: () => void;
  sortingContent?: React.ReactNode;
  dateRangeContent?: React.ReactNode;
  filteringContent?: React.ReactNode;
  children?: React.ReactNode;
}

export const TableFilterSelector: React.FC<Props> = ({
  activeCount,
  onClear,
  sortingContent,
  dateRangeContent,
  filteringContent,
  children,
}) => {
  const { t } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'table-filter-popover' : undefined;

  const hasSections = Boolean(sortingContent || dateRangeContent || filteringContent);

  return (
    <>
      <Tooltip title={t('btnFilters')}>
        <Badge
          badgeContent={activeCount}
          color="primary"
          sx={{ '& .MuiBadge-badge': { top: 4, right: 4 } }}
        >
          <IconButton
            aria-describedby={id}
            size="small"
            onClick={handleClick}
            color={activeCount > 0 ? 'primary' : 'inherit'}
            sx={{
              border: 1,
              borderColor: activeCount > 0 ? 'primary.main' : 'divider',
              borderRadius: 2,
              p: 0.7,
              bgcolor: activeCount > 0 ? 'action.selected' : 'transparent',
              '&:hover': {
                borderColor: 'primary.main',
              },
            }}
          >
            <FilterListIcon fontSize="small" />
          </IconButton>
        </Badge>
      </Tooltip>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        disableEnforceFocus
        disableAutoFocus
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: { sx: { width: { xs: 300, sm: 320 }, maxHeight: '85vh', overflowY: 'auto', p: 2 } },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {hasSections ? (
            <>
              {sortingContent && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700, letterSpacing: 0.5, lineHeight: 1 }}>
                    {t('lblSortingOptions')}
                  </Typography>
                  {sortingContent}
                </Box>
              )}
              {sortingContent && (dateRangeContent || filteringContent) && <Divider sx={{ my: 0.5 }} />}
              {dateRangeContent && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700, letterSpacing: 0.5, lineHeight: 1 }}>
                    {t('lblDateRange')}
                  </Typography>
                  {dateRangeContent}
                </Box>
              )}
              {dateRangeContent && filteringContent && <Divider sx={{ my: 0.5 }} />}
              {filteringContent && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 24 }}>
                    <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700, letterSpacing: 0.5, lineHeight: 1 }}>
                      {t('lblFilteringOptions')}
                    </Typography>
                    {activeCount > 0 && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={onClear}
                        startIcon={<FilterListOffIcon fontSize="small" />}
                        sx={{ fontSize: '0.7rem', py: 0.2, px: 1, textTransform: 'none', borderRadius: 1 }}
                      >
                        {t('btnClearFilters')}
                      </Button>
                    )}
                  </Box>
                  {filteringContent}
                </Box>
              )}
            </>
          ) : (
            <>
              {activeCount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={onClear}
                    startIcon={<FilterListOffIcon fontSize="small" />}
                    sx={{ fontSize: '0.7rem', py: 0.2, px: 1, textTransform: 'none', borderRadius: 1 }}
                  >
                    {t('btnClearFilters')}
                  </Button>
                </Box>
              )}
              {children}
            </>
          )}
        </Box>
      </Popover>
    </>
  );
};
