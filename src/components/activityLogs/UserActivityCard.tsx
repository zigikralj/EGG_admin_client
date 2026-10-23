import React, { useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Chip,
  IconButton,
  Avatar,
  Badge,
  Stack,
  Collapse,
  Button,
  CircularProgress,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  ExpandMoreIcon,
  ExpandLessIcon,
  RefreshIcon
} from '../icons';
import type { User } from '../../types';
import type { UserActivityGroup, UserSummary, Session } from './types';
import {
  formatDuration,
  formatDateTime,
  MODULE_COLORS
} from './utils';
import { SessionAccordion } from './SessionAccordion';
import { clusterUserLogsIntoSessions } from './useActivityLogsData';
import { useUserActivityLogsQuery } from '../../queries';

export interface UserActivityCardProps {
  userSummary?: UserSummary;
  userGroup?: UserActivityGroup;
  user?: User;
  fromIso?: string;
  isExpanded: boolean;
  onToggleUser: () => void;
  expandedSessions: Record<string, boolean>;
  onToggleSession: (sessionId: string, defaultExpanded?: boolean) => void;
  expandedRows: Record<string, boolean>;
  onToggleRowDetail: (rowKey: string) => void;
  onDeleteSession: (session: Session) => void;
  isDark: boolean;
  language: string;
  t: (key: any) => string;
}

export const UserActivityCard: React.FC<UserActivityCardProps> = ({
  userSummary,
  userGroup,
  user,
  fromIso,
  isExpanded,
  onToggleUser,
  expandedSessions,
  onToggleSession,
  expandedRows,
  onToggleRowDetail,
  onDeleteSession,
  isDark,
  language,
  t
}) => {
  const theme = useTheme();

  const userId = userSummary?.userId || userGroup?.userId || '';
  const userName = userSummary?.userName || userGroup?.userName || '';
  const effectiveUser = user || userGroup?.user;
  const hasActiveSession = userSummary
    ? userSummary.hasActiveSession
    : (userGroup?.sessions.some(s => s.isActive) ?? false);
  const totalDurationSeconds = userSummary?.totalDurationSeconds ?? userGroup?.totalDurationSeconds ?? 0;
  const totalSessionsCount = userSummary?.totalSessionsCount ?? userGroup?.totalSessionsCount ?? 0;
  const totalActivitiesCount = userSummary?.totalActivitiesCount ?? userGroup?.totalActivitiesCount ?? 0;
  const lastActiveStr = userSummary?.lastActive || (userGroup?.lastActive ? userGroup.lastActive.toISOString() : '');
  const topModules = userSummary?.topModules ?? [];

  // Lazily load logs only when this user accordion is expanded and no pre-processed userGroup was passed
  const isLazy = Boolean(userSummary && !userGroup);
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isFetching
  } = useUserActivityLogsQuery(
    userId,
    fromIso,
    isLazy && isExpanded
  );

  const rawLogs = useMemo(() => {
    if (userGroup) return userGroup.sessions.flatMap(s => s.logs);
    return infiniteData?.pages.flat() ?? [];
  }, [userGroup, infiniteData]);

  const sessions = useMemo(() => {
    if (userGroup) return userGroup.sessions;
    return clusterUserLogsIntoSessions(rawLogs, userId, userName, t, language);
  }, [userGroup, rawLogs, userId, userName, t, language]);

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: hasActiveSession ? alpha(theme.palette.primary.main, 0.4) : 'divider',
        borderRadius: 2.5,
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          borderColor: alpha(theme.palette.primary.main, 0.5)
        }
      }}
    >
      {/* User Header Accordion Trigger */}
      <Box
        onClick={onToggleUser}
        sx={{
          p: { xs: 2, sm: 2.5 },
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          cursor: 'pointer',
          bgcolor: isDark
            ? alpha(theme.palette.background.paper, 0.8)
            : hasActiveSession ? alpha(theme.palette.primary.main, 0.03) : '#ffffff'
        }}
      >
        {/* Left: User Avatar + Name + Role + Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            sx={{
              '& .MuiBadge-badge': {
                bgcolor: hasActiveSession ? '#16a34a' : (isDark ? '#64748b' : '#94a3b8'),
                boxShadow: isDark ? '0 0 0 2px #1e293b' : '0 0 0 2px #fff',
                width: 10,
                height: 10,
                borderRadius: '50%'
              }
            }}
          >
            <Avatar
              src={effectiveUser?.avatarUrl || undefined}
              sx={{
                width: 46,
                height: 46,
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                color: theme.palette.primary.main,
                fontWeight: 700,
                fontSize: '1.1rem'
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </Avatar>
          </Badge>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {userName}
              </Typography>
              {effectiveUser?.role && (
                <Chip
                  label={effectiveUser.role}
                  size="small"
                  sx={{ height: 20, fontSize: '0.72rem', fontWeight: 600 }}
                />
              )}
              {hasActiveSession && (
                <Chip
                  label={t('activeSession')}
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.72rem', fontWeight: 600 }}
                />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {effectiveUser?.email || `ID: ${userId}`} • {t('lastActive')}: {lastActiveStr ? formatDateTime(new Date(lastActiveStr), language) : '—'}
            </Typography>
          </Box>
        </Box>

        {/* Right: Quick metrics & expand chevron */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {formatDuration(totalDurationSeconds)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {totalSessionsCount} {language === 'en' ? (totalSessionsCount === 1 ? 'session' : 'sessions') : 'sesija'} • {totalActivitiesCount} {language === 'en' ? 'events' : 'radnji'}
            </Typography>
          </Box>

          {/* Mini Visual Distribution */}
          {topModules.length > 0 ? (
            <Box sx={{ width: { xs: 80, sm: 120 }, display: { xs: 'none', md: 'block' } }}>
              <Box sx={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', bgcolor: 'divider' }}>
                {topModules.slice(0, 4).map((mod, idx) => (
                  <Box
                    key={mod.path}
                    sx={{
                      width: `${mod.percentage}%`,
                      bgcolor: MODULE_COLORS[idx % MODULE_COLORS.length]
                    }}
                  />
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.68rem', textAlign: 'center' }}>
                {topModules[0]?.path.split('/').pop()} ({topModules[0]?.percentage}%)
              </Typography>
            </Box>
          ) : userGroup && userGroup.accumulatedActivities.length > 0 ? (
            <Box sx={{ width: { xs: 80, sm: 120 }, display: { xs: 'none', md: 'block' } }}>
              <Box sx={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', bgcolor: 'divider' }}>
                {userGroup.accumulatedActivities.slice(0, 4).map((act, idx) => (
                  <Box
                    key={act.key}
                    sx={{
                      width: `${act.percentage}%`,
                      bgcolor: MODULE_COLORS[idx % MODULE_COLORS.length]
                    }}
                  />
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.68rem', textAlign: 'center' }}>
                {userGroup.accumulatedActivities[0]?.label} ({userGroup.accumulatedActivities[0]?.percentage}%)
              </Typography>
            </Box>
          ) : null}

          {/* Per-user refresh button */}
          {isLazy && (
            <Tooltip title={language === 'en' ? 'Refresh user activity' : 'Osveži aktivnosti korisnika'}>
              <IconButton
                size="small"
                sx={{ color: 'text.secondary' }}
                onClick={(e) => {
                  e.stopPropagation();
                  void refetch();
                }}
                disabled={isFetching}
              >
                {isFetching ? <CircularProgress size={16} /> : <RefreshIcon sx={{ fontSize: '1.1rem' }} />}
              </IconButton>
            </Tooltip>
          )}

          <IconButton
            size="small"
            sx={{ color: 'text.secondary' }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleUser();
            }}
          >
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Collapsible Content: User's Sessions */}
      <Collapse in={isExpanded} unmountOnExit>
        <Box sx={{ p: { xs: 1.5, sm: 2.5 }, pt: 0, bgcolor: isDark ? alpha('#000', 0.15) : alpha('#f8fafc', 0.6) }}>
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
              {t('totalSessions')} ({sessions.length})
            </Typography>

            {isFetching && rawLogs.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : sessions.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                {t('noSessionsFound')}
              </Typography>
            ) : (
              <Stack spacing={2}>
                {sessions.map((session) => (
                  <SessionAccordion
                    key={session.sessionId}
                    session={session}
                    userName={userName}
                    isExpanded={expandedSessions[session.sessionId] ?? false}
                    onToggle={() => onToggleSession(session.sessionId, false)}
                    expandedRows={expandedRows}
                    onToggleRowDetail={onToggleRowDetail}
                    onDeleteSession={onDeleteSession}
                    isDark={isDark}
                    language={language}
                    t={t}
                  />
                ))}
              </Stack>
            )}

            {hasNextPage && (
              <Box sx={{ textAlign: 'center', mt: 2.5 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <CircularProgress size={18} />
                  ) : (
                    language === 'en' ? 'Load older activities' : 'Učitaj starije aktivnosti'
                  )}
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Collapse>
    </Card>
  );
};
