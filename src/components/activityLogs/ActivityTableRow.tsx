import React from 'react';
import {
  TableRow,
  TableCell,
  Box,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Stack,
  alpha
} from '@mui/material';
import {
  ExpandMoreIcon,
  ExpandLessIcon,
  BuildIcon
} from '../icons';
import type { AccumulatedActivity } from './types';
import {
  getPathLabelAndIcon,
  formatDuration,
  formatTimeOnly,
  isEmptyUpdateLog
} from './utils';
import { ActionLogItemRow } from './ActionLogItemRow';

export interface ActivityTableRowProps {
  sessionId: string;
  act: AccumulatedActivity;
  isRowExpanded: boolean;
  onToggleRowDetail: (rowKey: string) => void;
  isDark: boolean;
  language: string;
  t: (key: any) => string;
}

export const ActivityTableRow: React.FC<ActivityTableRowProps> = ({
  sessionId,
  act,
  isRowExpanded,
  onToggleRowDetail,
  isDark,
  language,
  t
}) => {
  const { icon } = getPathLabelAndIcon(act.path, act.type, t, language);
  const rowKey = `${sessionId}_${act.key}`;
  const visits = act.items.filter(i => i.type === 'PAGE_VIEW');
  const actions = act.items.filter(
    i => ((i.type && !['PAGE_VIEW', 'ONLINE', 'OFFLINE', 'LOGIN', 'LOGOUT'].includes(i.type)) || i.details) && !isEmptyUpdateLog(i)
  );
  const hasMutations = actions.length > 0;
  const isRowExpandable = hasMutations;

  return (
    <React.Fragment>
      <TableRow
        hover
        sx={{
          cursor: isRowExpandable ? 'pointer' : 'default',
          '& > *': { borderBottom: isRowExpanded ? 'none' : undefined }
        }}
        onClick={() => {
          if (isRowExpandable) {
            onToggleRowDetail(rowKey);
          }
        }}
      >
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {act.label}
                </Typography>
                {hasMutations && (
                  <Chip
                    label={
                      actions.some(i => i.type === 'UPDATE')
                        ? 'UPDATE'
                        : actions.some(i => i.type === 'CREATE')
                        ? 'CREATE'
                        : actions.some(i => i.type === 'DELETE')
                        ? 'DELETE'
                        : (language === 'en' ? 'CHANGES' : 'IZMENE')
                    }
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      bgcolor: alpha('#f59e0b', 0.15),
                      color: '#d97706'
                    }}
                  />
                )}
              </Box>
              {act.path && (
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                  {act.path}
                </Typography>
              )}
            </Box>
          </Box>
        </TableCell>
        <TableCell sx={{ fontWeight: 600 }}>
          {formatDuration(act.totalDurationSeconds)}
        </TableCell>
        <TableCell sx={{ textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            {visits.length > 0 && (
              <Chip
                label={`${visits.length} ${language === 'en' ? (visits.length === 1 ? 'visit' : 'visits') : 'poseta'}`}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
              />
            )}
            {actions.length > 0 && (
              <Chip
                label={`${actions.length} ${language === 'en' ? (actions.length === 1 ? 'action' : 'actions') : 'akcija'}`}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: alpha('#f59e0b', 0.15), color: '#d97706' }}
              />
            )}
            {visits.length === 0 && actions.length === 0 && (
              <Chip
                label={act.count}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
              />
            )}
          </Box>
        </TableCell>
        <TableCell>
          <Typography variant="caption" color="text.secondary">
            {formatTimeOnly(new Date(act.firstTimestamp), language)}
            {act.firstTimestamp !== act.lastTimestamp && ` — ${formatTimeOnly(new Date(act.lastTimestamp), language)}`}
          </Typography>
        </TableCell>
        <TableCell align="right">
          {isRowExpandable && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onToggleRowDetail(rowKey);
              }}
            >
              {isRowExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          )}
        </TableCell>
      </TableRow>

      {/* Expanded Details for this Activity */}
      {isRowExpandable && (
        <TableRow>
          <TableCell colSpan={5} sx={{ p: 0, bgcolor: isDark ? alpha('#000', 0.25) : alpha('#f8fafc', 0.8) }}>
            <Collapse in={isRowExpanded}>
              <Box sx={{ p: 1.5, pl: { xs: 2, sm: 4 } }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.8, mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  <BuildIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                  {language === 'en' ? `Actions & Data Changes (${actions.length}):` : `Akcije i izmene podataka (${actions.length}):`}
                </Typography>
                <Stack spacing={1}>
                  {actions.map((actItem, aIdx) => (
                    <ActionLogItemRow
                      key={actItem.id || aIdx}
                      actItem={actItem}
                      isExpanded={isRowExpanded}
                      isDark={isDark}
                      language={language}
                    />
                  ))}
                </Stack>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
};
