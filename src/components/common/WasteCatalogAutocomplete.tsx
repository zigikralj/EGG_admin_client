import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material';
import { StarIcon, StarBorderIcon } from '../icons';
import { apiFetch } from '../../api';
import type { WasteCatalog, WasteCatalogResponse } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

export interface WasteCatalogAutocompleteProps {
  value: WasteCatalog[] | WasteCatalog | string[] | string | null;
  onChange: (value: any, codeOrCodes?: any) => void;
  multiple?: boolean;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  label?: string;
  placeholder?: string;
  error?: boolean;
  helperText?: React.ReactNode;
  size?: 'small' | 'medium';
}

const EMPTY_ARRAY: WasteCatalog[] = [];

export const WasteCatalogAutocomplete: React.FC<WasteCatalogAutocompleteProps> = ({
  value,
  onChange,
  multiple = true,
  required = false,
  disabled = false,
  fullWidth = true,
  label,
  placeholder,
  error,
  helperText,
  size = 'small',
}) => {
  const { t } = useLanguage();

  const [catalogOptions, setCatalogOptions] = useState<WasteCatalog[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogLoadingMore, setCatalogLoadingMore] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogHasMore, setCatalogHasMore] = useState(true);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [catalogInputValue, setCatalogInputValue] = useState('');

  const fetchCatalogPage = useCallback(
    async (pageToFetch: number, search: string, isAppend = false) => {
      try {
        if (isAppend) {
          setCatalogLoadingMore(true);
        } else {
          setCatalogLoading(true);
        }
        const params = new URLSearchParams({
          page: String(pageToFetch),
          limit: '20',
        });
        if (search.trim()) {
          params.set('search', search.trim());
        }
        const res = await apiFetch(`/api/waste-catalog?${params.toString()}`);
        if (res.ok) {
          const data: WasteCatalogResponse = await res.json();
          const items = data.items || [];
          setCatalogOptions((prev) => {
            if (!isAppend) return items;
            const existingIds = new Set(prev.map((it) => it.id));
            const newItems = items.filter((it) => !existingIds.has(it.id));
            return [...prev, ...newItems];
          });
          setCatalogPage(data.page || pageToFetch);
          setCatalogHasMore(Boolean(data.hasMore));
        }
      } catch (err) {
        console.error('Error fetching waste catalog page:', err);
      } finally {
        setCatalogLoading(false);
        setCatalogLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCatalogPage(1, catalogSearchTerm, false);
    }, 250);
    return () => clearTimeout(timer);
  }, [catalogSearchTerm, fetchCatalogPage]);

  // Normalize value to WasteCatalog[] for multiple or WasteCatalog | null for single
  const normalizedValue = useMemo(() => {
    if (multiple) {
      let rawArray: any[] = [];
      if (Array.isArray(value)) {
        rawArray = value;
      } else if (typeof value === 'string' && value.trim()) {
        rawArray = value.split(',').map((s) => s.trim()).filter(Boolean);
      } else if (value && typeof value === 'object') {
        rawArray = [value];
      }
      if (rawArray.length === 0) return EMPTY_ARRAY;

      // If all items are already WasteCatalog objects with code, preserve them
      if (rawArray.every((it) => it && typeof it === 'object' && it.code)) {
        return rawArray as WasteCatalog[];
      }

      return rawArray.map((item) => {
        if (typeof item === 'string') {
          const found = catalogOptions.find((o) => o.code === item || o.id === item);
          return (
            found ||
            ({
              id: item,
              code: item,
              description: '',
              isHazardous: item.includes('*'),
            } as WasteCatalog)
          );
        }
        return item;
      });
    } else {
      if (!value) return null;
      if (typeof value === 'string') {
        const found = catalogOptions.find((o) => o.code === value || o.id === value);
        return (
          found ||
          ({
            id: value,
            code: value,
            description: '',
            isHazardous: value.includes('*'),
          } as WasteCatalog)
        );
      }
      return value as WasteCatalog;
    }
  }, [value, multiple, catalogOptions]);

  const combinedCatalogOptions = useMemo(() => {
    const newOptions = [...catalogOptions];
    if (multiple && Array.isArray(normalizedValue)) {
      normalizedValue.forEach((item) => {
        if (!newOptions.some((o) => o.id === item.id || o.code === item.code)) {
          newOptions.unshift(item);
        }
      });
    } else if (!multiple && normalizedValue) {
      const singleItem = normalizedValue as WasteCatalog;
      if (!newOptions.some((o) => o.id === singleItem.id || o.code === singleItem.code)) {
        newOptions.unshift(singleItem);
      }
    }
    return newOptions;
  }, [normalizedValue, catalogOptions, multiple]);

  // Sync initial input value in single selection mode
  useEffect(() => {
    if (!multiple) {
      if (normalizedValue && typeof normalizedValue === 'object' && (normalizedValue as WasteCatalog).code) {
        setCatalogInputValue((normalizedValue as WasteCatalog).code);
      } else if (!normalizedValue) {
        setCatalogInputValue('');
      }
    }
  }, [normalizedValue, multiple]);

  const handleToggleFrequent = async (e: React.MouseEvent, item: WasteCatalog) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const res = await apiFetch(`/api/waste-catalog/${item.id}/frequent`, {
        method: 'PATCH',
      });
      if (res.ok) {
        const updated: WasteCatalog = await res.json();
        setCatalogOptions((prev) =>
          prev.map((it) => (it.id === updated.id ? updated : it))
        );
        if (multiple && Array.isArray(normalizedValue)) {
          if (normalizedValue.some((v) => v.id === updated.id)) {
            onChange(
              normalizedValue.map((v) => (v.id === updated.id ? updated : v)),
              normalizedValue.map((v) => (v.id === updated.id ? updated.code : v.code))
            );
          }
        } else if (!multiple && normalizedValue) {
          if ((normalizedValue as WasteCatalog).id === updated.id) {
            onChange(updated, updated.code);
          }
        }
      }
    } catch (err) {
      console.error('Error toggling frequent status:', err);
    }
  };

  return (
    <Autocomplete
      multiple={multiple as any}
      disabled={disabled}
      fullWidth={fullWidth}
      size={size}
      options={combinedCatalogOptions}
      loading={catalogLoading}
      filterOptions={(options) => options}
      filterSelectedOptions={Boolean(multiple)}
      value={normalizedValue}
      onChange={(_, newValue) => {
        if (multiple) {
          setCatalogInputValue('');
          setCatalogSearchTerm('');
          const validValues = ((newValue as WasteCatalog[]) || []).filter(Boolean);
          onChange(validValues, validValues.map((v) => v.code));
        } else {
          const singleVal = (newValue as WasteCatalog) || null;
          setCatalogInputValue(singleVal ? singleVal.code : '');
          setCatalogSearchTerm('');
          onChange(singleVal, singleVal?.code || '');
        }
      }}
      inputValue={catalogInputValue}
      onInputChange={(_, newInputValue, reason) => {
        if (reason === 'input') {
          setCatalogInputValue(newInputValue);
          setCatalogSearchTerm(newInputValue);
        } else if (reason === 'clear') {
          setCatalogInputValue('');
          setCatalogSearchTerm('');
        }
        // Deliberately do not clear on reason === 'reset', because MUI Autocomplete
        // internally dispatches 'reset' with empty string whenever async options arrive or options change.
      }}
      onClose={() => {
        if (multiple) {
          setCatalogInputValue('');
          setCatalogSearchTerm('');
        } else if (normalizedValue && typeof normalizedValue === 'object') {
          setCatalogInputValue((normalizedValue as WasteCatalog).code || '');
          setCatalogSearchTerm('');
        } else {
          setCatalogInputValue('');
          setCatalogSearchTerm('');
        }
      }}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.code)}
      isOptionEqualToValue={(option, val) => option.id === val?.id || option.code === val?.code}
      slotProps={{
        listbox: {
          onScroll: (event: React.SyntheticEvent) => {
            const listboxNode = event.currentTarget;
            if (
              listboxNode.scrollTop + listboxNode.clientHeight >=
              listboxNode.scrollHeight - 25
            ) {
              if (!catalogLoading && !catalogLoadingMore && catalogHasMore) {
                fetchCatalogPage(catalogPage + 1, catalogSearchTerm, true);
              }
            }
          },
          sx: { maxHeight: 320 },
        } as any,
      }}
      noOptionsText={catalogLoading ? 'Učitavanje...' : 'Nema rezultata'}
      loadingText="Učitavanje..."
      renderOption={(props, option) => {
        const { key, ...otherProps } = props as any;
        const isStarred = option.frequent !== null && option.frequent !== undefined;
        return (
          <Box
            key={key || option.id}
            component="li"
            {...otherProps}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 0.8,
              px: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:last-child': { borderBottom: 'none' },
              bgcolor: isStarred ? 'action.hover' : 'inherit',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, pr: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                  {option.code}
                </Typography>
                {option.isHazardous && (
                  <Chip
                    label="Opasan"
                    size="small"
                    color="error"
                    variant="outlined"
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                )}
                {option.hazardListMark && (
                  <Typography variant="caption" color="text.secondary">
                    ({option.hazardListMark})
                  </Typography>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.3 }}>
                {option.description}
              </Typography>
            </Box>

            <Tooltip
              title={
                isStarred
                  ? 'Ukloni iz preporučenih (čestih)'
                  : 'Označi kao preporučeno (često)'
              }
            >
              <IconButton
                size="small"
                onClick={(e) => handleToggleFrequent(e, option)}
                sx={{
                  p: 0.5,
                  color: isStarred ? '#f59e0b' : 'action.disabled',
                  '&:hover': {
                    color: '#f59e0b',
                    bgcolor: 'rgba(245, 158, 11, 0.12)',
                  },
                }}
              >
                {isStarred ? (
                  <StarIcon fontSize="small" />
                ) : (
                  <StarBorderIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        );
      }}
      renderInput={(params) => {
        const { slotProps: pSlotProps, ...restParams } = params as any;
        const isEmpty = multiple
          ? !normalizedValue || (normalizedValue as WasteCatalog[]).length === 0
          : !normalizedValue;
        return (
          <TextField
            {...restParams}
            label={label || t('lblIndexNumber')}
            placeholder={placeholder || t('phIndexNumber')}
            required={required && isEmpty}
            error={error}
            helperText={helperText}
            slotProps={{
              ...pSlotProps,
              input: {
                ...pSlotProps?.input,
                endAdornment: (
                  <>
                    {catalogLoading || catalogLoadingMore ? (
                      <CircularProgress color="inherit" size={18} sx={{ mr: 1 }} />
                    ) : null}
                    {pSlotProps?.input?.endAdornment}
                  </>
                ),
              },
            }}
          />
        );
      }}
    />
  );
};
