import React, { useState } from 'react';
import {
  Button,
  Popover,
  Typography,
  Divider,
  Box,
  Badge,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  activeCount: number;
  onClear: () => void;
  children: React.ReactNode;
}

export const TableFilterSelector: React.FC<Props> = ({
  activeCount,
  onClear,
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

  return (
    <>
      <Badge badgeContent={activeCount} color="primary" sx={{ '& .MuiBadge-badge': { top: 4, right: 4 } }}>
        <Button
          aria-describedby={id}
          variant={activeCount > 0 ? 'contained' : 'outlined'}
          size="small"
          startIcon={<FilterListIcon />}
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
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: { sx: { width: 280, p: 2 } },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
            {t('lblFilterOptions')}
          </Typography>
          {activeCount > 0 && (
            <Button
              size="small"
              color="error"
              onClick={onClear}
              startIcon={<FilterListOffIcon fontSize="small" />}
              sx={{ fontSize: '0.75rem', py: 0 }}
            >
              {t('btnClearFilters')}
            </Button>
          )}
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {children}
        </Box>
      </Popover>
    </>
  );
};
