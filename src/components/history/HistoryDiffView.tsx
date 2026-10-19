import React from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { formatDiffValue } from '../activityLogs/utils';

export interface HistoryDiffViewProps {
  diff?: Record<string, { old: any; new: any }> | null;
  isDark?: boolean;
  language?: string;
  emptyMessage?: string;
}

export const HistoryDiffView: React.FC<HistoryDiffViewProps> = ({
  diff,
  isDark = false,
  language = 'en',
  emptyMessage,
}) => {
  if (!diff || typeof diff !== 'object') {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
        {emptyMessage || (language === 'en' ? 'No difference detected.' : 'Nema detektovanih razlika.')}
      </Typography>
    );
  }

  const entries = Object.entries(diff).filter(([_, val]) => {
    if (val && typeof val === 'object' && ('old' in val || 'new' in val)) {
      return JSON.stringify(val.old) !== JSON.stringify(val.new);
    }
    return true;
  });

  if (entries.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
        {emptyMessage || (language === 'en' ? 'No fields modified between these versions.' : 'Nema izmenjenih polja između ovih verzija.')}
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        mt: 1,
        p: 1.5,
        bgcolor: isDark ? alpha('#000000', 0.35) : alpha('#f8fafc', 0.9),
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.8,
        width: '100%',
      }}
    >
      {entries.map(([key, val]) => {
        const isOldNew = val && typeof val === 'object' && ('old' in val || 'new' in val);
        const hasOld = isOldNew && val.old !== undefined && val.old !== null;
        const hasNew = isOldNew && val.new !== undefined && val.new !== null;

        return (
          <Box
            key={key}
            sx={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 1,
              fontSize: '0.82rem',
              fontFamily: 'monospace',
              lineHeight: 1.5,
              flexWrap: 'wrap',
              py: 0.25,
              borderBottom: '1px dashed',
              borderColor: alpha(isDark ? '#ffffff' : '#000000', 0.08),
              '&:last-child': { borderBottom: 'none' },
            }}
          >
            <Typography
              component="span"
              sx={{
                fontWeight: 700,
                color: 'text.secondary',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                minWidth: 120,
              }}
            >
              {key}:
            </Typography>

            {isOldNew ? (
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                {hasOld && (
                  <Typography
                    component="span"
                    sx={{
                      textDecoration: 'line-through',
                      color: isDark ? '#f87171' : '#dc2626',
                      bgcolor: isDark ? alpha('#ef4444', 0.15) : alpha('#ef4444', 0.1),
                      px: 0.6,
                      py: 0.2,
                      borderRadius: 0.8,
                      fontFamily: 'monospace',
                      fontSize: '0.82rem',
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
                      fontSize: '0.82rem',
                      userSelect: 'none',
                    }}
                  >
                    →
                  </Typography>
                )}
                {hasNew && (
                  <Typography
                    component="span"
                    sx={{
                      color: isDark ? '#4ade80' : '#16a34a',
                      bgcolor: isDark ? alpha('#22c55e', 0.15) : alpha('#22c55e', 0.1),
                      px: 0.6,
                      py: 0.2,
                      borderRadius: 0.8,
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      fontSize: '0.82rem',
                    }}
                  >
                    {formatDiffValue(val.new)}
                  </Typography>
                )}
                {!hasOld && !hasNew && (
                  <Typography
                    component="span"
                    sx={{ color: 'text.disabled', fontFamily: 'monospace', fontSize: '0.82rem' }}
                  >
                    (empty)
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography
                component="span"
                sx={{
                  color: isDark ? '#4ade80' : '#16a34a',
                  fontWeight: 600,
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
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
