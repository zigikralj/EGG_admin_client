import React from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { formatDiffValue } from './utils';

export interface LogDiffViewProps {
  detailsStr?: string | null;
  isDark: boolean;
  language: string;
}

export const LogDiffView: React.FC<LogDiffViewProps> = ({ detailsStr, isDark, language }) => {
  if (!detailsStr) return null;
  let detailsObj: any = null;
  try {
    detailsObj = JSON.parse(detailsStr);
  } catch (e) {
    return (
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, p: 0.8, bgcolor: 'divider', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.73rem' }}>
        {detailsStr}
      </Typography>
    );
  }

  if (!detailsObj) return null;

  const diff = detailsObj.diff;
  if (!diff || typeof diff !== 'object') return null;

  // Filter diff entries: for update, only show fields where old !== new
  const entries = Object.entries(diff).filter(([_, val]: [string, any]) => {
    if (val && typeof val === 'object' && ('old' in val || 'new' in val)) {
      return JSON.stringify(val.old) !== JSON.stringify(val.new);
    }
    return true;
  });

  if (entries.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', mt: 0.5 }}>
        {language === 'en' ? '(No fields modified)' : '(Nema izmenjenih polja)'}
      </Typography>
    );
  }

  return (
    <Box sx={{
      mt: 0.8,
      p: 0.8,
      px: 1.2,
      bgcolor: isDark ? alpha('#000', 0.4) : alpha('#f1f5f9', 0.8),
      borderRadius: 1,
      border: '1px solid',
      borderColor: 'divider',
      display: 'flex',
      flexDirection: 'column',
      gap: 0.35,
      width: '100%',
      maxWidth: { xs: '100%', sm: 600, md: 750 }
    }}>
      {entries.map(([key, val]: [string, any]) => {
        const isOldNew = val && typeof val === 'object' && ('old' in val || 'new' in val);
        const hasOld = isOldNew && val.old !== undefined && val.old !== null;
        const hasNew = isOldNew && val.new !== undefined && val.new !== null;

        return (
          <Box
            key={key}
            sx={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 0.8,
              fontSize: '0.73rem',
              fontFamily: 'monospace',
              lineHeight: 1.4,
              flexWrap: 'wrap'
            }}
          >
            <Typography
              component="span"
              sx={{
                fontWeight: 700,
                color: 'text.secondary',
                fontFamily: 'monospace',
                fontSize: '0.73rem',
                whiteSpace: 'nowrap'
              }}
            >
              {key}:
            </Typography>

            {isOldNew ? (
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, flexWrap: 'wrap' }}>
                {hasOld && (
                  <Typography
                    component="span"
                    sx={{
                      textDecoration: 'line-through',
                      color: '#ef4444',
                      fontFamily: 'monospace',
                      fontSize: '0.73rem'
                    }}
                  >
                    {formatDiffValue(val.old)}
                  </Typography>
                )}
                {hasOld && hasNew && (
                  <Typography
                    component="span"
                    sx={{
                      color: 'text.disabled',
                      fontSize: '0.73rem',
                      userSelect: 'none'
                    }}
                  >
                    →
                  </Typography>
                )}
                {hasNew && (
                  <Typography
                    component="span"
                    sx={{
                      color: '#10b981',
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      fontSize: '0.73rem'
                    }}
                  >
                    {formatDiffValue(val.new)}
                  </Typography>
                )}
                {!hasOld && !hasNew && (
                  <Typography
                    component="span"
                    sx={{ color: 'text.disabled', fontFamily: 'monospace', fontSize: '0.73rem' }}
                  >
                    (empty)
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography
                component="span"
                sx={{
                  color: '#10b981',
                  fontWeight: 600,
                  fontFamily: 'monospace',
                  fontSize: '0.73rem'
                }}
              >
                {formatDiffValue(val)}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
};
