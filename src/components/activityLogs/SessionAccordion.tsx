import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import {
  AccessTimeIcon,
  CalendarMonthIcon,
  ExpandMoreIcon,
  ExpandLessIcon,
  DeleteIcon
} from '../icons';
import type { Session } from './types';
import {
  formatDateOnly,
  formatDateTime,
  formatTimeOnly,
  formatDuration,
  LIFECYCLE_TYPES,
  isEmptyUpdateLog
} from './utils';
import { ActivityTableRow } from './ActivityTableRow';

export interface SessionAccordionProps {
  session: Session;
  userName: string;
  isExpanded: boolean;
  onToggle: () => void;
  expandedRows: Record<string, boolean>;
  onToggleRowDetail: (rowKey: string) => void;
  onDeleteSession: (session: Session) => void;
  isDark: boolean;
  language: string;
  t: (key: any) => string;
}

export const SessionAccordion: React.FC<SessionAccordionProps> = ({
  session,
  isExpanded,
  onToggle,
  expandedRows,
  onToggleRowDetail,
  onDeleteSession,
  isDark,
  language,
  t
}) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: session.isActive ? alpha(theme.palette.primary.main, 0.4) : 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: isDark ? theme.palette.background.paper : '#ffffff'
      }}
    >
      {/* Session Header */}
      <Box
        onClick={onToggle}
        sx={{
          p: 1.8,
          px: 2,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          cursor: 'pointer',
          bgcolor: isDark
            ? alpha('#ffffff', 0.02)
            : session.isActive ? alpha(theme.palette.primary.main, 0.04) : '#ffffff',
          '&:hover': {
            bgcolor: isDark ? alpha('#ffffff', 0.04) : alpha('#000000', 0.015)
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: session.isActive ? alpha('#16a34a', 0.15) : alpha(theme.palette.primary.main, 0.08),
              color: session.isActive ? '#16a34a' : theme.palette.primary.main
            }}
          >
            <CalendarMonthIcon sx={{ fontSize: 18 }} />
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {t('sessionNumber')} {formatDateOnly(session.startTime, language)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                • {formatDateTime(session.startTime, language)}
                {session.startTime.toDateString() === session.endTime.toDateString()
                  ? ` — ${formatTimeOnly(session.endTime, language)}`
                  : ` — ${formatDateTime(session.endTime, language)}`}
              </Typography>
              {session.isActive ? (
                <Chip
                  label={t('activeSession')}
                  size="small"
                  color="success"
                  sx={{ height: 18, fontSize: '0.68rem', fontWeight: 700 }}
                />
              ) : (
                <Chip
                  label={t('completedSession')}
                  size="small"
                  variant="outlined"
                  sx={{ height: 18, fontSize: '0.68rem' }}
                />
              )}
            </Box>
          </Box>
        </Box>

        {/* Session Right Stats */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
            label={formatDuration(session.totalDurationSeconds)}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600, height: 24 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            {session.logs.filter(l => !LIFECYCLE_TYPES.has(l.type) && !isEmptyUpdateLog(l)).length} {language === 'en' ? 'events' : 'događaja'}
          </Typography>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
          <Tooltip title={language === 'en' ? 'Delete session' : 'Obriši sesiju'}>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(session);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Session Details / Content */}
      <Collapse in={isExpanded}>
        <Box sx={{ p: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>{language === 'en' ? 'Page / Activity' : 'Stranica / Aktivnost'}</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>{t('colDuration')}</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textAlign: 'center' }}>{t('visitsCount')}</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>{language === 'en' ? 'Time Window' : 'Vreme posete'}</TableCell>
                  <TableCell sx={{ width: 40 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {session.accumulatedActivities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 2.5, color: 'text.secondary' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {language === 'en' ? 'No page activity recorded in this session' : 'Nema zabeleženih aktivnosti na stranicama u ovoj sesiji'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  session.accumulatedActivities.map((act) => (
                    <ActivityTableRow
                      key={act.key}
                      sessionId={session.sessionId}
                      act={act}
                      isRowExpanded={expandedRows[`${session.sessionId}_${act.key}`] || false}
                      onToggleRowDetail={onToggleRowDetail}
                      isDark={isDark}
                      language={language}
                      t={t}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Collapse>
    </Paper>
  );
};
