import React, { useState } from 'react';
import {
  Popover,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Divider,
  Box,
  Chip,
  IconButton,
  TextField,
  Tooltip,
} from '@mui/material';

import { useLanguage } from '../context/LanguageContext';
import { SettingsIcon, EditIcon, CheckIcon, CloseIcon, UndoIcon } from './icons';

export interface ColumnDef {
  id: string;
  label: string;
}

export const DEFAULT_ROWS_PER_PAGE_OPTIONS = [15, 25, 50];

export interface TableOptionsProps {
  columns?: ColumnDef[];
  visibleColumns?: string[];
  onChange?: (visible: string[]) => void;
  onVisibleColumnsChange?: (visible: string[]) => void;
  rowsPerPageOptions?: number[];
  onRowsPerPageOptionsChange?: (options: number[]) => void;
  rowsPerPage?: number;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  defaultRowsPerPageOptions?: number[];
}

export const TableOptionsSelector: React.FC<TableOptionsProps> = ({
  columns = [],
  visibleColumns = [],
  onChange,
  onVisibleColumnsChange,
  rowsPerPageOptions = DEFAULT_ROWS_PER_PAGE_OPTIONS,
  onRowsPerPageOptionsChange,
  rowsPerPage = 15,
  onRowsPerPageChange,
  defaultRowsPerPageOptions = DEFAULT_ROWS_PER_PAGE_OPTIONS,
}) => {
  const { t } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  // Edit mode for custom rowsPerPageOptions
  const [isEditingRpp, setIsEditingRpp] = useState(false);
  const [rppInputText, setRppInputText] = useState('');
  const [rppInputError, setRppInputError] = useState<string | null>(null);

  const activeRppOptions =
    Array.isArray(rowsPerPageOptions) && rowsPerPageOptions.length > 0
      ? rowsPerPageOptions
      : defaultRowsPerPageOptions;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setIsEditingRpp(false);
    setRppInputError(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setIsEditingRpp(false);
    setRppInputError(null);
  };

  const handleStartEditRpp = () => {
    setRppInputText(activeRppOptions.join(', '));
    setRppInputError(null);
    setIsEditingRpp(true);
  };

  const handleCancelEditRpp = () => {
    setIsEditingRpp(false);
    setRppInputError(null);
  };

  const handleSaveRpp = () => {
    const rawParts = rppInputText.split(/[\s,;]+/);
    const parsed = rawParts
      .map((p) => parseInt(p.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);

    const uniqueSorted = Array.from(new Set(parsed)).sort((a, b) => a - b);

    if (uniqueSorted.length === 0) {
      setRppInputError('Unesite barem jedan validan broj veći od 0.');
      return;
    }

    if (onRowsPerPageOptionsChange) {
      onRowsPerPageOptionsChange(uniqueSorted);
    }

    // If current rowsPerPage is not in the new options, adjust to first option
    if (!uniqueSorted.includes(rowsPerPage) && onRowsPerPageChange) {
      onRowsPerPageChange(uniqueSorted[0]);
    }

    setIsEditingRpp(false);
    setRppInputError(null);
  };

  const handleResetRpp = () => {
    if (onRowsPerPageOptionsChange) {
      onRowsPerPageOptionsChange(defaultRowsPerPageOptions);
    }
    if (!defaultRowsPerPageOptions.includes(rowsPerPage) && onRowsPerPageChange) {
      onRowsPerPageChange(defaultRowsPerPageOptions[0]);
    }
    setIsEditingRpp(false);
    setRppInputError(null);
  };

  const handleSelectRowsPerPage = (opt: number) => {
    if (onRowsPerPageChange) {
      onRowsPerPageChange(opt);
    }
  };

  const toggleColumn = (id: string) => {
    let nextVisible: string[];
    if (visibleColumns.includes(id)) {
      if (visibleColumns.length <= 1) return; // Keep at least one column
      nextVisible = visibleColumns.filter((c) => c !== id);
    } else {
      nextVisible = [...visibleColumns, id];
    }
    const orderMap = new Map(columns.map((c, idx) => [c.id, idx]));
    nextVisible.sort((a, b) => (orderMap.get(a) ?? 0) - (orderMap.get(b) ?? 0));
    
    if (onChange) onChange(nextVisible);
    if (onVisibleColumnsChange) onVisibleColumnsChange(nextVisible);
  };

  const open = Boolean(anchorEl);
  const popoverId = open ? 'table-options-popover' : undefined;

  return (
    <>
      <Tooltip title={t('btnTableOptions')}>
        <IconButton
          aria-describedby={popoverId}
          size="small"
          onClick={handleClick}
          color="primary"
          sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 0.7 }}
        >
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Popover
        id={popoverId}
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
          paper: {
            sx: {
              width: 300,
              maxHeight: 520,
              p: 2,
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            },
          },
        }}
      >
        {/* HEADER */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          <SettingsIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {t('lblTableOptions')}
          </Typography>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* SECTION 1: ROWS PER PAGE */}
        <Box sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('lblRowsPerPage')}
            </Typography>
            {!isEditingRpp ? (
              <Tooltip title={t('lblEditOptions')}>
                <IconButton size="small" onClick={handleStartEditRpp} sx={{ p: 0.5 }}>
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            ) : (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title={t('btnResetDefault')}>
                  <IconButton size="small" onClick={handleResetRpp} sx={{ p: 0.5 }}>
                    <UndoIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('btnCancel')}>
                  <IconButton size="small" onClick={handleCancelEditRpp} sx={{ p: 0.5 }}>
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('btnSave')}>
                  <IconButton size="small" color="primary" onClick={handleSaveRpp} sx={{ p: 0.5 }}>
                    <CheckIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          {!isEditingRpp ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, alignItems: 'center' }}>
              {activeRppOptions.map((opt) => {
                const isSelected = rowsPerPage === opt;
                return (
                  <Chip
                    key={opt}
                    label={opt}
                    size="small"
                    color={isSelected ? 'primary' : 'default'}
                    variant={isSelected ? 'filled' : 'outlined'}
                    onClick={() => handleSelectRowsPerPage(opt)}
                    sx={{
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      borderRadius: 1.5,
                      '&:hover': {
                        borderColor: 'primary.main',
                      },
                    }}
                  />
                );
              })}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                size="small"
                value={rppInputText}
                onChange={(e) => {
                  setRppInputText(e.target.value);
                  if (rppInputError) setRppInputError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveRpp();
                  } else if (e.key === 'Escape') {
                    handleCancelEditRpp();
                  }
                }}
                placeholder="15, 25, 50"
                helperText={rppInputError || t('lblCustomizeRowsPerPageHelp')}
                error={Boolean(rppInputError)}
                autoFocus
                fullWidth
                slotProps={{
                  input: {
                    sx: { fontSize: '0.85rem', borderRadius: 1.5 },
                  },
                }}
              />
            </Box>
          )}
        </Box>

        {/* SECTION 2: COLUMNS */}
        {columns && columns.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
              {t('lblSelectColumns')}
            </Typography>
            <FormGroup sx={{ px: 0.5, maxHeight: 220, overflowY: 'auto' }}>
              {columns.map((col) => {
                const isChecked = visibleColumns.includes(col.id);
                return (
                  <FormControlLabel
                    key={col.id}
                    control={
                      <Checkbox
                        size="small"
                        checked={isChecked}
                        onChange={() => toggleColumn(col.id)}
                        color="primary"
                        sx={{ py: 0.4 }}
                      />
                    }
                    label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{col.label}</Typography>}
                    sx={{ my: -0.2 }}
                  />
                );
              })}
            </FormGroup>
          </>
        )}
      </Popover>
    </>
  );
};

// Backward-compatible alias for existing imports
export const ColumnSelector = TableOptionsSelector;
export default TableOptionsSelector;
