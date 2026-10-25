import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { useLanguage } from '../../../context/LanguageContext';
import { useDebounce } from '../../../hooks/useDebounce';
import {
  useEntityAutocompleteInfiniteQuery,
  type AutocompleteEntity,
} from '../../../queries/autocomplete.queries';

export interface CustomAutocompleteProps<
  T = any,
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
> {
  entity: AutocompleteEntity;
  value: any;
  onChange: (value: any, option?: any) => void;
  /** Pre-known selected option(s) so closed dropdown displays label without any API request */
  initialOption?: T | T[] | null;
  /** Extra query parameters passed to the backend endpoint (e.g. clientId, excludeProjectId, permitType) */
  queryParams?: Record<string, any>;
  /** Items per page (default: 10) */
  pageSize?: number;
  /** Optional static prepend options (e.g. "All" option in filter dropdowns) */
  prependOptions?: T[];
  /** Client-side post-filter if needed */
  filterLoadedOptions?: (options: T[]) => T[];
  multiple?: Multiple;
  freeSolo?: FreeSolo;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  disablePortal?: boolean;
  disableClearable?: boolean;
  size?: 'small' | 'medium';
  label?: string;
  placeholder?: string;
  helperText?: React.ReactNode;
  error?: boolean;
  getOptionLabel?: (option: T | string) => string;
  isOptionEqualToValue?: (option: T, value: any) => boolean;
  groupBy?: (option: T) => string;
  renderOption?: (
    props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key },
    option: T,
    state: any
  ) => React.ReactNode;
  renderInput?: (params: any) => React.ReactNode;
  /** Mode for handling scalar values (e.g. value is an ID or Code string instead of full object) */
  valueMode?: 'object' | 'id' | 'code' | 'name';
}

export function CustomAutocomplete<
  T extends { id?: string; code?: string; [key: string]: any } = any,
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
>({
  entity,
  value,
  onChange,
  initialOption,
  queryParams,
  pageSize = 10,
  prependOptions,
  filterLoadedOptions,
  multiple = false as Multiple,
  freeSolo = false as FreeSolo,
  disabled = false,
  readOnly = false,
  required = false,
  fullWidth = true,
  disablePortal = false,
  disableClearable = false,
  size = 'small',
  label,
  placeholder,
  helperText,
  error,
  getOptionLabel,
  isOptionEqualToValue,
  groupBy,
  renderOption,
  renderInput,
  valueMode = 'object',
}: CustomAutocompleteProps<T, Multiple, FreeSolo>) {
  const { t } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Lazy query: only fetch when dropdown is open and interactive
  const {
    items,
    total,
    hasMore,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
  } = useEntityAutocompleteInfiniteQuery<T>({
    entity,
    search: debouncedSearch,
    pageSize,
    queryParams,
    enabled: isOpen && !disabled && !readOnly,
  });

  // Track initialOption(s) locally so they persist even if query updates
  const [cachedSelectedOptions, setCachedSelectedOptions] = useState<T[]>(() => {
    if (!initialOption) return [];
    return Array.isArray(initialOption) ? (initialOption as T[]) : [initialOption as T];
  });

  useEffect(() => {
    if (initialOption) {
      const arr = Array.isArray(initialOption) ? (initialOption as T[]) : [initialOption as T];
      setCachedSelectedOptions((prev) => {
        const map = new Map<string, T>();
        prev.forEach((item) => {
          const k = item.id || item.code || JSON.stringify(item);
          map.set(k, item);
        });
        arr.forEach((item) => {
          const k = item.id || item.code || JSON.stringify(item);
          map.set(k, item);
        });
        return Array.from(map.values());
      });
    }
  }, [initialOption]);

  // Default equality comparator
  const defaultIsOptionEqualToValue = useCallback(
    (option: T, val: any) => {
      if (!option || !val) return option === val;
      if (typeof val === 'string') {
        if (valueMode === 'id') return option.id === val;
        if (valueMode === 'code') return option.code === val;
        if (valueMode === 'name') {
          return (
            (option as any).name === val ||
            (getOptionLabel ? getOptionLabel(option) === val : false)
          );
        }
        return (
          option.id === val ||
          option.code === val ||
          (option as any).name === val ||
          (getOptionLabel ? getOptionLabel(option) === val : false)
        );
      }
      if (option.id && val.id) return option.id === val.id;
      if (option.code && val.code) return option.code === val.code;
      return option === val;
    },
    [valueMode, getOptionLabel]
  );

  const activeIsOptionEqualToValue = isOptionEqualToValue || defaultIsOptionEqualToValue;

  // Resolve normalized value for MUI Autocomplete
  const normalizedValue = useMemo(() => {
    if (multiple) {
      if (!Array.isArray(value)) return [];
      if (valueMode === 'object') return value;
      return value.map((v) => {
        if (typeof v !== 'string') return v;
        const found =
          cachedSelectedOptions.find((opt) => activeIsOptionEqualToValue(opt, v as any)) ||
          items.find((opt) => activeIsOptionEqualToValue(opt, v as any));
        return (
          found ||
          ({
            id: valueMode === 'id' ? v : undefined,
            code: valueMode === 'code' ? v : undefined,
            name: v,
          } as unknown as T)
        );
      });
    }

    if (value === null || value === undefined || value === '') {
      return freeSolo ? '' : null;
    }

    if (valueMode === 'object') {
      return value;
    }

    // Scalar mode: find matching object from cache or loaded items
    if (typeof value === 'string') {
      const found =
        cachedSelectedOptions.find((opt) => activeIsOptionEqualToValue(opt, value as any)) ||
        items.find((opt) => activeIsOptionEqualToValue(opt, value as any));
      if (found) return found;
      if (freeSolo) return value;
      return {
        id: valueMode === 'id' ? value : undefined,
        code: valueMode === 'code' ? value : undefined,
        name: value,
      } as unknown as T;
    }

    return value;
  }, [value, multiple, valueMode, cachedSelectedOptions, items, activeIsOptionEqualToValue, freeSolo]);

  // Combine and deduplicate options
  const displayOptions = useMemo(() => {
    const list: T[] = [];
    const seen = new Set<string>();

    const add = (item: T) => {
      if (!item) return;
      const key = item.id || item.code || (typeof item === 'string' ? item : JSON.stringify(item));
      if (!seen.has(key)) {
        seen.add(key);
        list.push(item);
      }
    };

    // 1. Prepend options (e.g. "All" option)
    if (prependOptions) {
      prependOptions.forEach(add);
    }

    // 2. Currently selected items and cached initialOption (ensures label is visible when closed/not yet in first page)
    if (normalizedValue) {
      if (Array.isArray(normalizedValue)) {
        normalizedValue.forEach((item) => {
          if (typeof item === 'object') add(item);
        });
      } else if (typeof normalizedValue === 'object') {
        add(normalizedValue);
      }
    }
    cachedSelectedOptions.forEach(add);

    // 3. Loaded items from infinite query
    let filteredItems = items;
    if (filterLoadedOptions) {
      filteredItems = filterLoadedOptions(items);
    }
    filteredItems.forEach(add);

    // 4. Sentinel option for pagination footer if hasMore
    if (hasMore && isOpen) {
      list.push({
        id: '__LOAD_MORE__',
        __isLoadMoreSentinel: true,
      } as unknown as T);
    }

    return list;
  }, [
    prependOptions,
    normalizedValue,
    cachedSelectedOptions,
    items,
    filterLoadedOptions,
    hasMore,
    isOpen,
  ]);

  // Default label getter
  const defaultGetOptionLabel = useCallback(
    (option: T | string) => {
      if (typeof option === 'string') return option;
      if ((option as any)?.__isLoadMoreSentinel || option?.id === '__LOAD_MORE__') return '';
      return (
        (option as any)?.name ||
        option?.code ||
        option?.id ||
        ''
      );
    },
    []
  );

  const activeGetOptionLabel = getOptionLabel || defaultGetOptionLabel;

  // Handle option change
  const handleChange = useCallback(
    (_: any, newValue: any, reason: string) => {
      if (reason === 'selectOption' && newValue) {
        const isSentinel = Array.isArray(newValue)
          ? newValue.some((v) => (v as any)?.__isLoadMoreSentinel || v?.id === '__LOAD_MORE__')
          : (newValue as any)?.__isLoadMoreSentinel || newValue?.id === '__LOAD_MORE__';
        if (isSentinel) {
          return;
        }
      }

      // Cache selected options
      if (newValue) {
        const arr = Array.isArray(newValue) ? newValue : [newValue];
        setCachedSelectedOptions((prev) => {
          const map = new Map<string, T>();
          prev.forEach((item) => {
            const k = item.id || item.code || JSON.stringify(item);
            map.set(k, item);
          });
          arr.forEach((item) => {
            if (item && typeof item === 'object') {
              const k = item.id || item.code || JSON.stringify(item);
              map.set(k, item);
            }
          });
          return Array.from(map.values());
        });
      }

      if (valueMode === 'id') {
        if (multiple) {
          const ids = Array.isArray(newValue)
            ? newValue.map((v) => (typeof v === 'string' ? v : v?.id)).filter(Boolean)
            : [];
          onChange(ids, newValue);
        } else {
          const singleVal = typeof newValue === 'string' ? newValue : newValue?.id || null;
          onChange(singleVal, newValue);
        }
        return;
      }

      if (valueMode === 'code') {
        if (multiple) {
          const codes = Array.isArray(newValue)
            ? newValue.map((v) => (typeof v === 'string' ? v : v?.code)).filter(Boolean)
            : [];
          onChange(codes, newValue);
        } else {
          const singleVal = typeof newValue === 'string' ? newValue : newValue?.code || null;
          onChange(singleVal, newValue);
        }
        return;
      }

      if (valueMode === 'name') {
        if (multiple) {
          const names = Array.isArray(newValue)
            ? newValue.map((v) => (typeof v === 'string' ? v : (v as any)?.name)).filter(Boolean)
            : [];
          onChange(names, newValue);
        } else {
          const singleVal = typeof newValue === 'string' ? newValue : (newValue as any)?.name || null;
          onChange(singleVal, newValue);
        }
        return;
      }

      // Default 'object' mode
      onChange(newValue, newValue);
    },
    [valueMode, multiple, onChange]
  );

  const emptyText = useMemo(() => {
    switch (entity) {
      case 'clients':
        return t('emptyClients');
      case 'users':
        return t('emptyUsers');
      case 'services':
        return t('emptyServices');
      case 'reminders':
        return t('emptyReminders');
      case 'invoices':
        return t('emptyInvoices');
      case 'projects':
        return t('emptyProjects');
      case 'permits':
        return t('emptyPermits');
      case 'categories':
        return t('emptyCategories');
      default:
        return 'Nema rezultata';
    }
  }, [entity, t]);

  return (
    <Autocomplete
      open={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => {
        setIsOpen(false);
        setSearchTerm('');
      }}
      options={displayOptions}
      value={normalizedValue}
      onChange={handleChange}
      onInputChange={(_, newInputValue, reason) => {
        if (reason === 'input') {
          setSearchTerm(newInputValue);
        } else if (reason === 'clear') {
          setSearchTerm('');
        }
        // Deliberately ignore reason === 'reset' because MUI resets on async option load
      }}
      filterOptions={(options) => options} // Handled by server query
      getOptionLabel={activeGetOptionLabel}
      isOptionEqualToValue={activeIsOptionEqualToValue as any}
      groupBy={
        groupBy
          ? (option) => {
              if ((option as any)?.__isLoadMoreSentinel || option?.id === '__LOAD_MORE__') {
                return '';
              }
              return groupBy(option);
            }
          : undefined
      }
      multiple={multiple as any}
      freeSolo={freeSolo as any}
      disabled={disabled}
      readOnly={readOnly}
      fullWidth={fullWidth}
      disablePortal={disablePortal}
      disableClearable={disableClearable}
      size={size}
      slotProps={{
        listbox: {
          onScroll: (event: React.SyntheticEvent) => {
            const listboxNode = event.currentTarget as HTMLElement;
            if (
              listboxNode.scrollTop + listboxNode.clientHeight >=
              listboxNode.scrollHeight - 40
            ) {
              if (hasMore && !isFetchingNextPage && !isLoading) {
                fetchNextPage();
              }
            }
          },
          sx: { maxHeight: 320 },
        } as any,
      }}
      noOptionsText={
        isLoading ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              py: 1.5,
            }}
          >
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              {t('loadingData') || 'Učitavanje...'}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {emptyText}
          </Typography>
        )
      }
      loadingText={t('loadingData') || 'Učitavanje...'}
      loading={isLoading}
      renderOption={(props, option, state) => {
        const { key, ...otherProps } = props as any;

        if ((option as any)?.__isLoadMoreSentinel || option?.id === '__LOAD_MORE__') {
          return (
            <Box
              key={key || '__LOAD_MORE__'}
              component="li"
              {...otherProps}
              onMouseDown={(e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                if (hasMore && !isFetchingNextPage && !isLoading) {
                  fetchNextPage();
                }
              }}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                py: 1.25,
                px: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: 'action.hover',
                cursor: isFetchingNextPage ? 'default' : 'pointer',
                '&:hover': {
                  bgcolor: isFetchingNextPage ? 'action.hover' : 'action.selected',
                },
              }}
            >
              {isFetchingNextPage ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={14} />
                  <Typography variant="caption" color="text.secondary">
                    {t('loadingData') || 'Učitavanje...'}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                  + {t('btnLoadMore') || 'Učitaj još...'} ({items.length} / {total})
                </Typography>
              )}
            </Box>
          );
        }

        if (renderOption) {
          return renderOption(props, option, state);
        }

        return (
          <Box key={key || option.id || option.code} component="li" {...otherProps}>
            <Typography variant="body2">{activeGetOptionLabel(option)}</Typography>
          </Box>
        );
      }}
      renderInput={(params) => {
        if (renderInput) {
          return renderInput(params);
        }
        const { slotProps: pSlotProps, ...restParams } = params as any;
        return (
          <TextField
            {...restParams}
            label={label}
            placeholder={placeholder}
            required={required}
            error={error}
            helperText={helperText}
            size={size}
            slotProps={{
              ...pSlotProps,
              input: {
                ...pSlotProps?.input,
                endAdornment: (
                  <>
                    {isLoading && isOpen ? (
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
}
