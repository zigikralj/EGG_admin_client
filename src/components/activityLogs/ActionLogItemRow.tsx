import React from 'react';
import { Box, Typography, CircularProgress, alpha } from '@mui/material';
import { useActivityLogDetailsQuery } from '../../queries';
import type { ActivityLog } from '../../types';
import { getActionChip } from './utils';
import { LogDiffView } from './LogDiffView';

export interface ActionLogItemRowProps {
  actItem: ActivityLog;
  isExpanded: boolean;
  isDark: boolean;
  language: string;
}

export const ActionLogItemRow: React.FC<ActionLogItemRowProps> = ({
  actItem,
  isExpanded,
  isDark,
  language
}) => {
  const { data: fullLog, isLoading } = useActivityLogDetailsQuery(
    actItem.id,
    Boolean(isExpanded && !actItem.details)
  );

  const detailsStr = actItem.details || fullLog?.details;
  let subDetails: any = null;
  if (detailsStr) {
    try {
      subDetails = JSON.parse(detailsStr);
    } catch (e) {}
  }

  const actionChip = getActionChip(subDetails?.action, actItem.type);

  const formattedTime = new Date(actItem.timestamp).toLocaleString(
    language === 'en' ? 'en-US' : 'sr-RS',
    {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }
  );

  return (
    <Box
      sx={{
        py: 0.8,
        px: 1.2,
        borderRadius: 1.2,
        bgcolor: isDark ? alpha('#fff', 0.03) : '#ffffff',
        border: '1px solid',
        borderColor: 'divider',
        maxWidth: 750
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {formattedTime}
        </Typography>
        {actionChip}
        {subDetails?.model && (
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            • {subDetails.model}
          </Typography>
        )}
      </Box>

      {/* Render Diff if details present or show subtle loading */}
      {isLoading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.8, py: 0.5 }}>
          <CircularProgress size={14} thickness={4} />
          <Typography variant="caption" color="text.secondary">
            {language === 'en' ? 'Loading change details...' : 'Učitavanje detalja izmene...'}
          </Typography>
        </Box>
      ) : detailsStr ? (
        <LogDiffView detailsStr={detailsStr} isDark={isDark} language={language} />
      ) : null}
    </Box>
  );
};
