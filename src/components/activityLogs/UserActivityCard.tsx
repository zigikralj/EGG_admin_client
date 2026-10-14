import React from 'react';
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
  useTheme,
  alpha
} from '@mui/material';
import {
  ExpandMoreIcon,
  ExpandLessIcon
} from '../icons';
import type { UserActivityGroup, Session } from './types';
import {
  formatDuration,
  formatDateTime,
  MODULE_COLORS
} from './utils';
import { SessionAccordion } from './SessionAccordion';

export interface UserActivityCardProps {
  userGroup: UserActivityGroup;
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
  userGroup,
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
  const hasActiveSession = userGroup.sessions.some(s => s.isActive);

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
              src={userGroup.user?.avatarUrl || undefined}
              sx={{
                width: 46,
                height: 46,
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                color: theme.palette.primary.main,
                fontWeight: 700,
                fontSize: '1.1rem'
              }}
            >
              {userGroup.userName.charAt(0).toUpperCase()}
            </Avatar>
          </Badge>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {userGroup.userName}
              </Typography>
              {userGroup.user?.role && (
                <Chip
                  label={userGroup.user.role}
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
              {userGroup.user?.email || `ID: ${userGroup.userId}`} • {t('lastActive')}: {formatDateTime(userGroup.lastActive, language)}
            </Typography>
          </Box>
        </Box>

        {/* Right: Quick metrics & expand chevron */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {formatDuration(userGroup.totalDurationSeconds)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {userGroup.totalSessionsCount} {language === 'en' ? (userGroup.totalSessionsCount === 1 ? 'session' : 'sessions') : 'sesija'} • {userGroup.totalActivitiesCount} {language === 'en' ? 'events' : 'radnji'}
            </Typography>
          </Box>

          {/* Mini Visual Distribution */}
          {userGroup.accumulatedActivities.length > 0 && (
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
      <Collapse in={isExpanded}>
        <Box sx={{ p: { xs: 1.5, sm: 2.5 }, pt: 0, bgcolor: isDark ? alpha('#000', 0.15) : alpha('#f8fafc', 0.6) }}>
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
              {t('totalSessions')} ({userGroup.sessions.length})
            </Typography>

            <Stack spacing={2}>
              {userGroup.sessions.map((session, sIdx) => (
                <SessionAccordion
                  key={session.sessionId}
                  session={session}
                  userName={userGroup.userName}
                  isExpanded={expandedSessions[session.sessionId] ?? (sIdx === 0)}
                  onToggle={() => onToggleSession(session.sessionId, sIdx === 0)}
                  expandedRows={expandedRows}
                  onToggleRowDetail={onToggleRowDetail}
                  onDeleteSession={onDeleteSession}
                  isDark={isDark}
                  language={language}
                  t={t}
                />
              ))}
            </Stack>
          </Box>
        </Box>
      </Collapse>
    </Card>
  );
};
