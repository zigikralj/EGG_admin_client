import React from 'react';
import { FormGroup, FormControlLabel, Checkbox, Typography, type SxProps, type Theme } from '@mui/material';

export interface QuickFilterItem {
  key: string;
  label: React.ReactNode;
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'default';
  labelColor?: string;
  hidden?: boolean;
}

interface Props {
  options: QuickFilterItem[];
  selectedKeys: string[];
  onChange: (selectedKeys: string[]) => void;
  sx?: SxProps<Theme>;
}

export const TableQuickFilters: React.FC<Props> = ({ options, selectedKeys, onChange, sx }) => {
  const visibleOptions = options.filter((opt) => !opt.hidden);
  if (visibleOptions.length === 0) return null;

  return (
    <FormGroup row sx={{ gap: 1, alignItems: 'center', ...sx }}>
      {visibleOptions.map((opt) => {
        const isChecked = selectedKeys.includes(opt.key);
        return (
          <FormControlLabel
            key={opt.key}
            control={
              <Checkbox
                size="small"
                checked={isChecked}
                onChange={(e) => {
                  const updated = e.target.checked
                    ? [...selectedKeys, opt.key]
                    : selectedKeys.filter((k) => k !== opt.key);
                  onChange(updated);
                }}
                color={opt.color || 'primary'}
              />
            }
            label={
              typeof opt.label === 'string' ? (
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    ...(opt.labelColor ? { color: opt.labelColor } : {}),
                  }}
                >
                  {opt.label}
                </Typography>
              ) : (
                opt.label
              )
            }
          />
        );
      })}
    </FormGroup>
  );
};
