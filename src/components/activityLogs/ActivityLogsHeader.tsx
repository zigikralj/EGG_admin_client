import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AccessTimeIcon,
  RefreshIcon,
  DeleteIcon,
  InsightsIcon,
} from '../icons';

export interface ActivityLogsHeaderProps {
  isFetching: boolean;
  onAnalyticsClick?: () => void;
  onClearAllClick?: () => void;
  onRefreshClick: () => void;
  language?: string;
  t: (key: any) => string;
}

export const ActivityLogsHeader: React.FC<ActivityLogsHeaderProps> = ({
  isFetching,
  onAnalyticsClick,
  onClearAllClick,
  onRefreshClick,
  t,
}) => {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <AccessTimeIcon sx={{ color: 'primary.main', fontSize: 30 }} />
          {t('tabActivityLogs')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t('activityLogsSubtitle')}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        {onAnalyticsClick && (
          <Button
            variant="contained"
            size="small"
            color="primary"
            onClick={onAnalyticsClick}
            startIcon={<InsightsIcon />}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
          >
            {t('activityAnalytics')}
          </Button>
        )}
        {onClearAllClick && (
          <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={onClearAllClick}
            startIcon={<DeleteIcon />}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            {t('btnClearAll')}
          </Button>
        )}
        <Tooltip title={t('refreshData')}>
          <span>
            <IconButton
              onClick={onRefreshClick}
              disabled={isFetching}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                animation: isFetching ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};
