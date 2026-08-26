import React, { useState } from 'react';
import {
  Button,
  Popover,
  Typography,
  Divider,
  Box,
  Badge,
} from '@mui/material';



import { useLanguage } from '../context/LanguageContext';
import { FilterListIcon, SortIcon, FilterListOffIcon } from './icons';

interface Props {
  activeCount: number;
  onClear: () => void;
  sortingContent?: React.ReactNode;
  filteringContent?: React.ReactNode;
  children?: React.ReactNode;
}

export const TableFilterSelector: React.FC<Props> = ({
  activeCount,
  onClear,
  sortingContent,
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

  const hasSections = Boolean(sortingContent || filteringContent);

  return (
    <>
      <Badge badgeContent={activeCount} color="primary" sx={{ '& .MuiBadge-badge': { top: 4, right: 4 } }}>
        <Button
          aria-describedby={id}
          variant={activeCount > 0 ? 'contained' : 'outlined'}
          size="small"
          startIcon={<FilterListIcon />}
          endIcon={<SortIcon />}
          onClick={handleClick}
          color={activeCount > 0 ? 'primary' : 'inherit'}
          sx={{ borderRadius: 2 }}
        >
          {t('btnFilters')}
        </Button>
      </Badge>
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
          paper: { sx: { width: 300, p: 2, overflow: 'visible' } },
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
              {sortingContent && filteringContent && <Divider sx={{ my: 0.5 }} />}
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
