import React from 'react';
import { Select, MenuItem, FormControl } from '@mui/material';

import { useLanguage } from '../context/LanguageContext';
import type { Language } from '../i18n/translations';
import { LanguageIcon } from './icons';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const options: { code: Language; label: string }[] = [
    { code: 'en', label: '🇬🇧 EN' },
    { code: 'sr-Latn', label: '🇷🇸 SR' },
    { code: 'sr-Cyrl', label: '🇷🇸 СР' },
  ];

  return (
    <FormControl size="small" variant="outlined">
      <Select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        aria-label="Select language"
        startAdornment={<LanguageIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
        sx={{
          bgcolor: 'background.paper',
          fontSize: '0.875rem',
          borderRadius: 2,
          '& .MuiSelect-select': {
            py: 0.75,
            px: 1.5,
            display: 'flex',
            alignItems: 'center',
          },
        }}
      >
        {options.map((opt) => (
          <MenuItem key={opt.code} value={opt.code} sx={{ fontSize: '0.875rem' }}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
