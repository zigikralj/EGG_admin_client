import React, { useState, useRef, useEffect } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Box,
  type SxProps,
  type Theme,
} from '@mui/material';
import { SearchIcon, CloseIcon } from './icons';
import { useLanguage } from '../context/LanguageContext';

export interface TableSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  expandedWidth?: number | string | Record<string, any>;
  collapsedWidth?: number | string;
  sx?: SxProps<Theme>;
  autoFocus?: boolean;
  size?: 'small' | 'medium';
}

export const TableSearchInput: React.FC<TableSearchInputProps> = ({
  value,
  onChange,
  placeholder,
  expandedWidth = { xs: '100%', sm: 220 },
  collapsedWidth = 36,
  sx,
  autoFocus,
  size = 'small',
}) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(Boolean(value && value.trim().length > 0));
  const inputRef = useRef<HTMLInputElement>(null);

  const resolvedPlaceholder = placeholder ?? t('searchPlaceholder');
  const hasValue = Boolean(value && value.trim().length > 0);

  // Keep expanded if value gets set externally or has text
  useEffect(() => {
    if (hasValue) {
      setIsExpanded(true);
    }
  }, [hasValue]);

  const handleExpand = () => {
    setIsExpanded(true);
    // Focus the input immediately upon expansion
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // If focus moves outside the component and there is no text, collapse it
    if (!e.currentTarget.contains(e.relatedTarget as Node) && !hasValue) {
      setIsExpanded(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsExpanded(false);
  };

  return (
    <Box
      onBlur={handleBlur}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        position: 'relative',
        height: 36,
        verticalAlign: 'middle',
        overflow: 'hidden',
        transition:
          'width 300ms cubic-bezier(0.4, 0, 0.2, 1), max-width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        width: isExpanded ? expandedWidth : collapsedWidth,
        maxWidth: isExpanded ? expandedWidth : collapsedWidth,
        ...sx,
      }}
    >
      {!isExpanded ? (
        <Tooltip title={resolvedPlaceholder} enterDelay={300} arrow>
          <IconButton
            size="small"
            onClick={handleExpand}
            aria-label={resolvedPlaceholder}
            sx={{
              width: collapsedWidth,
              height: 36,
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'primary.main',
                color: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
          >
            <SearchIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : (
        <TextField
          variant="standard"
          size={size}
          inputRef={inputRef}
          placeholder={resolvedPlaceholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus || true}
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start" sx={{ mr: 0.5 }}>
                  <SearchIcon fontSize="small" color="primary" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end" sx={{ m: 0 }}>
                  <IconButton
                    size="small"
                    aria-label="clear and collapse search"
                    onClick={handleClear}
                    edge="end"
                    sx={{ p: 0.25, color: 'text.secondary' }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{
            width: '100%',
            animation: 'fadeIn 200ms ease-in',
            '@keyframes fadeIn': {
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
            '& .MuiInput-root': {
              height: 36,
              pt: 0,
              pb: 0,
            },
            '& .MuiInput-input': {
              py: 0.5,
            },
          }}
        />
      )}
    </Box>
  );
};
