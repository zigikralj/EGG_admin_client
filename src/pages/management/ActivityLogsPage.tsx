import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Avatar,
  Stack,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
  Collapse,
  Badge,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Switch,
  FormControlLabel,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  AccessTimeIcon,
  RefreshIcon,
  SearchIcon,
  ExpandMoreIcon,
  ExpandLessIcon,
  CheckCircleIcon,
  DashboardIcon,
  AssignmentIcon,
  BusinessIcon,
  AssignmentTurnedInIcon,
  PeopleIcon,
  BuildIcon,
  HandymanIcon,
  CategoryIcon,
  NotificationsActiveIcon,
  ReceiptLongIcon,
  SecurityIcon,
  TimelineIcon,
  DonutLargeIcon,
  CalendarMonthIcon,
  WebIcon,
  LoginIcon,
  LogoutIcon,
  CloudOffIcon,
  DeleteIcon
} from '../../components/icons';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  useActivityLogsQuery,
  useActivityLogDetailsQuery,
  useUsersQuery,
  useActivityLogsMutations,
  useActivityLogStatusQuery,
  useActivityLogToggleMutation,
  useActivityLogUpdateSettingsMutation,
} from '../../queries';
import type { ActivityLog, User } from '../../types';

export interface AccumulatedActivity {
  key: string;
  label: string;
  path?: string;
  type: string;
  totalDurationSeconds: number;
  count: number;
  percentage: number;
  firstTimestamp: string;
  lastTimestamp: string;
  items: ActivityLog[];
}

export interface Session {
  sessionId: string;
  userId: string;
  userName?: string;
  startTime: Date;
  endTime: Date;
  totalDurationSeconds: number;
  isActive: boolean;
  logs: ActivityLog[];
  accumulatedActivities: AccumulatedActivity[];
}

export interface UserActivityGroup {
  userId: string;
  userName: string;
  user?: User;
  totalDurationSeconds: number;
  totalSessionsCount: number;
  totalActivitiesCount: number;
  lastActive: Date;
  sessions: Session[];
  accumulatedActivities: AccumulatedActivity[];
}

const MODULE_COLORS = [
  '#2e7d32', // green
  '#0284c7', // sky
  '#7c3aed', // purple
  '#d97706', // amber
  '#059669', // emerald
  '#e11d48', // rose
  '#475569', // slate
];

const getActionChip = (action?: string, type?: string) => {
  const act = (action || type || '').toLowerCase();
  if (act === 'update') {
    return (
      <Chip
        label="UPDATE"
        size="small"
        sx={{
          height: 18,
          fontSize: '0.62rem',
          fontWeight: 700,
          bgcolor: alpha('#f59e0b', 0.15),
          color: '#d97706'
        }}
      />
    );
  }
  if (act === 'create') {
    return (
      <Chip
        label="CREATE"
        size="small"
        sx={{
          height: 18,
          fontSize: '0.62rem',
          fontWeight: 700,
          bgcolor: alpha('#10b981', 0.15),
          color: '#059669'
        }}
      />
    );
  }
  if (act === 'delete') {
    return (
      <Chip
        label="DELETE"
        size="small"
        sx={{
          height: 18,
          fontSize: '0.62rem',
          fontWeight: 700,
          bgcolor: alpha('#ef4444', 0.15),
          color: '#dc2626'
        }}
      />
    );
  }
  return null;
};

const formatDiffValue = (v: any) => {
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

const LogDiffView: React.FC<{ detailsStr?: string | null; isDark: boolean; language: string }> = ({ detailsStr, isDark, language }) => {
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

const ActionLogItemRow: React.FC<{
  actItem: ActivityLog;
  isExpanded: boolean;
  isDark: boolean;
  language: string;
}> = ({ actItem, isExpanded, isDark, language }) => {
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

export const ActivityLogsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Filters & Controls state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');
  const [timeRangeFilter, setTimeRangeFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const fromIso = useMemo(() => {
    if (timeRangeFilter === 'ALL') return undefined;
    const cutoff = new Date();
    if (timeRangeFilter === 'TODAY') {
      cutoff.setHours(0, 0, 0, 0);
    } else if (timeRangeFilter === 'WEEK') {
      cutoff.setDate(cutoff.getDate() - 7);
    } else if (timeRangeFilter === 'MONTH') {
      cutoff.setDate(cutoff.getDate() - 30);
    }
    return cutoff.toISOString();
  }, [timeRangeFilter]);

  const { data: logs, isLoading, isFetching, error, refetch } = useActivityLogsQuery(fromIso);
  const { data: users } = useUsersQuery();
  const { clearAllMutation, deleteSessionMutation } = useActivityLogsMutations();

  const { hasPermission } = useAuth();
  const { data: statusData, isLoading: isStatusLoading } = useActivityLogStatusQuery();
  const toggleMutation = useActivityLogToggleMutation();
  const updateSettingsMutation = useActivityLogUpdateSettingsMutation();

  const isLoggingEnabled = statusData?.enabled ?? true;
  const retentionDays = statusData?.retentionDays ?? 90;
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const [customRetentionOpen, setCustomRetentionOpen] = useState(false);
  const [customDaysInput, setCustomDaysInput] = useState<string>('90');

  const handleToggleClick = (nextChecked: boolean) => {
    if (!nextChecked) {
      setConfirmDeactivateOpen(true);
    } else {
      toggleMutation.mutate(true);
    }
  };

  const handleDeactivateConfirm = () => {
    setConfirmDeactivateOpen(false);
    toggleMutation.mutate(false);
  };

  const handleRetentionSelect = (value: number | 'custom') => {
    if (value === 'custom') {
      setCustomDaysInput(String(retentionDays));
      setCustomRetentionOpen(true);
    } else {
      updateSettingsMutation.mutate({ retentionDays: value });
    }
  };

  const handleCustomRetentionSubmit = () => {
    const parsed = parseInt(customDaysInput, 10);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 3650) {
      updateSettingsMutation.mutate({ retentionDays: parsed });
      setCustomRetentionOpen(false);
    }
  };

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    type: 'all' | 'session';
    id?: string;
    ids?: string[];
    label?: string;
  }>({ isOpen: false, type: 'all' });

  const handleDeleteConfirm = async () => {
    try {
      if (deleteDialog.type === 'all') {
        await clearAllMutation.mutateAsync();
      } else if (deleteDialog.type === 'session') {
        if (deleteDialog.ids && deleteDialog.ids.length > 0) {
          await deleteSessionMutation.mutateAsync({ ids: deleteDialog.ids });
        } else if (deleteDialog.id) {
          await deleteSessionMutation.mutateAsync({ sessionId: deleteDialog.id });
        }
      }
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setDeleteDialog({ isOpen: false, type: 'all' });
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds && seconds !== 0) return '-';
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m < 60) return `${m}m ${s > 0 ? `${s}s` : ''}`.trim();
    const h = Math.floor(m / 60);
    const remainingM = m % 60;
    return `${h}h ${remainingM > 0 ? `${remainingM}m` : ''}`.trim();
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString(language === 'en' ? 'en-US' : 'sr-RS', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDateOnly = (date: Date) => {
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'sr-RS', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeOnly = (date: Date) => {
    return date.toLocaleTimeString(language === 'en' ? 'en-US' : 'sr-RS', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getCanonicalPagePath = (rawPath?: string): string => {
    if (!rawPath) return '';
    if (rawPath.startsWith('/api/')) {
      const resource = rawPath.replace('/api/', '').split('?')[0].split('/')[0];
      if (resource === 'providedservices' || resource === 'provided-services') {
        return '/data-management/provided-services';
      }
      return `/data-management/${resource}`;
    }
    return rawPath;
  };

  const getPathLabelAndIcon = (path?: string, type?: string) => {
    if (type === 'LOGIN') {
      return { label: language === 'en' ? 'Login' : 'Prijava', icon: <LoginIcon fontSize="small" sx={{ color: '#16a34a' }} /> };
    }
    if (type === 'LOGOUT') {
      return { label: language === 'en' ? 'Logout' : 'Odjava', icon: <LogoutIcon fontSize="small" sx={{ color: '#dc2626' }} /> };
    }
    if (type === 'OFFLINE') {
      return { label: language === 'en' ? 'Offline' : 'Neaktivan', icon: <CloudOffIcon fontSize="small" sx={{ color: '#94a3b8' }} /> };
    }
    if (type === 'ONLINE') {
      return { label: language === 'en' ? 'Online' : 'Aktivan', icon: <CheckCircleIcon fontSize="small" sx={{ color: '#16a34a' }} /> };
    }

    if (!path) {
      return { label: type || 'General', icon: <WebIcon fontSize="small" /> };
    }

    if (path.startsWith('/project-tracker')) {
      return { label: t('tabDashboard'), icon: <DashboardIcon fontSize="small" sx={{ color: '#059669' }} /> };
    }
    if (path.includes('/projects')) {
      return { label: t('tabProjects'), icon: <AssignmentIcon fontSize="small" sx={{ color: '#2563eb' }} /> };
    }
    if (path.includes('/clients')) {
      return { label: t('tabClients'), icon: <BusinessIcon fontSize="small" sx={{ color: '#7c3aed' }} /> };
    }
    if (path.includes('/permits')) {
      return { label: t('tabPermits'), icon: <AssignmentTurnedInIcon fontSize="small" sx={{ color: '#0891b2' }} /> };
    }
    if (path.includes('/users')) {
      return { label: t('tabUsers'), icon: <PeopleIcon fontSize="small" sx={{ color: '#ea580c' }} /> };
    }
    if (path.includes('/services')) {
      return { label: t('tabServices'), icon: <BuildIcon fontSize="small" sx={{ color: '#4f46e5' }} /> };
    }
    if (path.includes('/provided-services')) {
      return { label: t('tabProvidedServices'), icon: <HandymanIcon fontSize="small" sx={{ color: '#0d9488' }} /> };
    }
    if (path.includes('/categories')) {
      return { label: t('tabCategories'), icon: <CategoryIcon fontSize="small" sx={{ color: '#ca8a04' }} /> };
    }
    if (path.includes('/reminders')) {
      return { label: t('tabReminders'), icon: <NotificationsActiveIcon fontSize="small" sx={{ color: '#e11d48' }} /> };
    }
    if (path.includes('/invoices')) {
      return { label: t('tabInvoices'), icon: <ReceiptLongIcon fontSize="small" sx={{ color: '#16a34a' }} /> };
    }
    if (path.includes('/roles')) {
      return { label: 'Roles', icon: <SecurityIcon fontSize="small" sx={{ color: '#9333ea' }} /> };
    }
    if (path.includes('/activity-logs')) {
      return { label: t('tabActivityLogs'), icon: <AccessTimeIcon fontSize="small" sx={{ color: '#475569' }} /> };
    }
    if (path.includes('/login')) {
      return { label: language === 'en' ? 'Login' : 'Prijava', icon: <LoginIcon fontSize="small" /> };
    }

    return { label: path, icon: <WebIcon fontSize="small" /> };
  };

  // Process logs into User -> Session -> Accumulated Activities hierarchy
  const processedData = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    const now = Date.now();

    // 1. Filter by time range if set
    let filteredLogs = logs;
    if (timeRangeFilter !== 'ALL') {
      const cutoff = new Date();
      if (timeRangeFilter === 'TODAY') {
        cutoff.setHours(0, 0, 0, 0);
      } else if (timeRangeFilter === 'WEEK') {
        cutoff.setDate(cutoff.getDate() - 7);
      } else if (timeRangeFilter === 'MONTH') {
        cutoff.setDate(cutoff.getDate() - 30);
      }
      filteredLogs = logs.filter(l => new Date(l.timestamp).getTime() >= cutoff.getTime());
    }

    // 2. Group by user
    const userGroupsMap = new Map<string, ActivityLog[]>();
    for (const log of filteredLogs) {
      const uId = log.userId;
      if (!userGroupsMap.has(uId)) {
        userGroupsMap.set(uId, []);
      }
      userGroupsMap.get(uId)!.push(log);
    }

    const userGroupList: UserActivityGroup[] = [];

    userGroupsMap.forEach((userLogs, userId) => {
      // Find full user if available
      const matchedUser = users?.find(u => u.id === userId);
      const userName = matchedUser?.name || userLogs[0]?.userName || userId;

      // Group logs into sessions:
      // A) logs with explicit sessionId
      // B) legacy logs clustered by 30min gap or LOGIN
      const sessionMap = new Map<string, ActivityLog[]>();

      // Sort user logs chronologically ascending for clustering
      const sortedAsc = [...userLogs].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      let currentSyntheticSessionId = '';
      let lastTimestamp = 0;

      for (const log of sortedAsc) {
        const logTime = new Date(log.timestamp).getTime();

        if (log.sessionId) {
          if (!sessionMap.has(log.sessionId)) {
            sessionMap.set(log.sessionId, []);
          }
          sessionMap.get(log.sessionId)!.push(log);
        } else {
          // Check if should start a new session (gap > 30 mins or LOGIN event)
          const isGap = logTime - lastTimestamp > 30 * 60 * 1000;
          const isLogin = log.type === 'LOGIN';
          if (!currentSyntheticSessionId || isGap || isLogin) {
            currentSyntheticSessionId = `synth_${userId}_${logTime}`;
          }

          if (!sessionMap.has(currentSyntheticSessionId)) {
            sessionMap.set(currentSyntheticSessionId, []);
          }
          sessionMap.get(currentSyntheticSessionId)!.push(log);
          lastTimestamp = logTime;
        }
      }

      // Convert sessions to Session objects
      const sessionList: Session[] = [];

      sessionMap.forEach((sLogs, sId) => {
        // Sort descending (newest first)
        const sortedDesc = [...sLogs].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        const startTime = new Date(sortedDesc[sortedDesc.length - 1].timestamp);
        const endTime = new Date(sortedDesc[0].timestamp);

        // Sum duration
        let totalDuration = sortedDesc.reduce((sum, item) => sum + (item.durationSeconds || 0), 0);
        if (totalDuration === 0 && sortedDesc.length > 1) {
          totalDuration = Math.max(0, Math.floor((endTime.getTime() - startTime.getTime()) / 1000));
        }

        // Active check: latest activity within 10 minutes and not OFFLINE or LOGOUT
        const latestLog = sortedDesc[0];
        const isActive =
          now - endTime.getTime() < 10 * 60 * 1000 &&
          latestLog.type !== 'OFFLINE' &&
          latestLog.type !== 'LOGOUT';

        // Accumulate activities within the session
        const activityMap = new Map<string, {
          key: string;
          label: string;
          path?: string;
          type: string;
          totalDurationSeconds: number;
          count: number;
          firstTimestamp: string;
          lastTimestamp: string;
          items: ActivityLog[];
        }>();

        for (const log of sortedDesc) {
          const canonicalPath = getCanonicalPagePath(log.path);
          const key = canonicalPath ? `path:${canonicalPath}` : `type:${log.type}`;
          const { label } = getPathLabelAndIcon(canonicalPath, log.type);

          if (!activityMap.has(key)) {
            activityMap.set(key, {
              key,
              label,
              path: canonicalPath || log.path,
              type: log.type,
              totalDurationSeconds: log.durationSeconds || 0,
              count: 1,
              firstTimestamp: log.timestamp,
              lastTimestamp: log.timestamp,
              items: [log]
            });
          } else {
            const entry = activityMap.get(key)!;
            entry.totalDurationSeconds += log.durationSeconds || 0;
            entry.count += 1;
            entry.items.push(log);
            if (new Date(log.timestamp).getTime() < new Date(entry.firstTimestamp).getTime()) {
              entry.firstTimestamp = log.timestamp;
            }
            if (new Date(log.timestamp).getTime() > new Date(entry.lastTimestamp).getTime()) {
              entry.lastTimestamp = log.timestamp;
            }
          }
        }

        const accumulatedActivities: AccumulatedActivity[] = Array.from(activityMap.values())
          .map(item => ({
            ...item,
            percentage: totalDuration > 0 ? Math.min(100, Math.round((item.totalDurationSeconds / totalDuration) * 100)) : 0
          }))
          .sort((a, b) => b.totalDurationSeconds - a.totalDurationSeconds || b.count - a.count);

        sessionList.push({
          sessionId: sId,
          userId,
          userName,
          startTime,
          endTime,
          totalDurationSeconds: totalDuration,
          isActive,
          logs: sortedDesc,
          accumulatedActivities
        });
      });

      // Sort sessions newest first
      sessionList.sort((a, b) => b.endTime.getTime() - a.endTime.getTime());

      // Overall user stats
      const totalUserDuration = sessionList.reduce((sum, s) => sum + s.totalDurationSeconds, 0);
      const totalActivitiesCount = userLogs.length;
      const lastActive = sessionList.length > 0 ? sessionList[0].endTime : new Date(0);

      // User-level accumulated activities
      const userActivityMap = new Map<string, AccumulatedActivity>();
      for (const s of sessionList) {
        for (const act of s.accumulatedActivities) {
          if (!userActivityMap.has(act.key)) {
            userActivityMap.set(act.key, {
              ...act,
              items: [...act.items]
            });
          } else {
            const existing = userActivityMap.get(act.key)!;
            existing.totalDurationSeconds += act.totalDurationSeconds;
            existing.count += act.count;
            existing.items.push(...act.items);
            if (new Date(act.firstTimestamp).getTime() < new Date(existing.firstTimestamp).getTime()) {
              existing.firstTimestamp = act.firstTimestamp;
            }
            if (new Date(act.lastTimestamp).getTime() > new Date(existing.lastTimestamp).getTime()) {
              existing.lastTimestamp = act.lastTimestamp;
            }
          }
        }
      }

      const userAccumulated = Array.from(userActivityMap.values())
        .map(item => ({
          ...item,
          percentage: totalUserDuration > 0 ? Math.min(100, Math.round((item.totalDurationSeconds / totalUserDuration) * 100)) : 0
        }))
        .sort((a, b) => b.totalDurationSeconds - a.totalDurationSeconds || b.count - a.count);

      userGroupList.push({
        userId,
        userName,
        user: matchedUser,
        totalDurationSeconds: totalUserDuration,
        totalSessionsCount: sessionList.length,
        totalActivitiesCount,
        lastActive,
        sessions: sessionList,
        accumulatedActivities: userAccumulated
      });
    });

    // Sort users by last active descending
    userGroupList.sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());

    return userGroupList;
  }, [logs, users, timeRangeFilter, language, t]);

  // Filter processed data by user dropdown & search
  const filteredUsers = useMemo(() => {
    let result = processedData;

    if (selectedUserFilter !== 'ALL') {
      result = result.filter(u => u.userId === selectedUserFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(u => {
        const matchesUser = u.userName.toLowerCase().includes(q) || u.user?.email?.toLowerCase().includes(q);
        const matchesActivity = u.accumulatedActivities.some(
          a => a.label.toLowerCase().includes(q) || (a.path && a.path.toLowerCase().includes(q))
        );
        return matchesUser || matchesActivity;
      });
    }

    return result;
  }, [processedData, selectedUserFilter, searchQuery]);

  // Overall KPI metrics
  const kpiStats = useMemo(() => {
    const totalUsers = processedData.length;
    const totalSessions = processedData.reduce((acc, u) => acc + u.totalSessionsCount, 0);
    const totalTrackedSeconds = processedData.reduce((acc, u) => acc + u.totalDurationSeconds, 0);

    // Active users in last 24h
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const activeToday = processedData.filter(u => u.lastActive.getTime() >= oneDayAgo).length;

    // Find top module across all users
    const moduleTimes = new Map<string, { label: string; duration: number }>();
    for (const u of processedData) {
      for (const act of u.accumulatedActivities) {
        if (act.path) {
          const prev = moduleTimes.get(act.label) || { label: act.label, duration: 0 };
          prev.duration += act.totalDurationSeconds;
          moduleTimes.set(act.label, prev);
        }
      }
    }

    let topModule = '-';
    let topModulePercent = 0;
    if (moduleTimes.size > 0 && totalTrackedSeconds > 0) {
      const sortedModules = Array.from(moduleTimes.values()).sort((a, b) => b.duration - a.duration);
      topModule = sortedModules[0].label;
      topModulePercent = Math.round((sortedModules[0].duration / totalTrackedSeconds) * 100);
    }

    return {
      totalUsers,
      activeToday,
      totalSessions,
      totalTrackedSeconds,
      topModule,
      topModulePercent
    };
  }, [processedData]);

  const toggleUserAccordion = (userId: string, defaultExpanded: boolean = true) => {
    setExpandedUsers(prev => {
      const current = prev[userId] !== undefined ? prev[userId] : defaultExpanded;
      return {
        ...prev,
        [userId]: !current
      };
    });
  };

  const toggleSessionAccordion = (sessionId: string, defaultExpanded: boolean = false) => {
    setExpandedSessions(prev => {
      const current = prev[sessionId] !== undefined ? prev[sessionId] : defaultExpanded;
      return {
        ...prev,
        [sessionId]: !current
      };
    });
  };

  const toggleRowDetail = (rowKey: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowKey]: !prev[rowKey]
    }));
  };


  if (!hasPermission('activityLogs', 'view')) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="error" variant="h6" sx={{ fontWeight: 600 }}>
          {t('activityLogsAdminOnly')}
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 350, gap: 2 }}>
        <CircularProgress size={44} color="primary" />
        <Typography variant="body2" color="text.secondary">
          {language === 'en' ? 'Loading activity history...' : 'Učitavanje istorije aktivnosti...'}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">{language === 'en' ? 'Error loading activity logs.' : 'Greška pri učitavanju istorije aktivnosti.'}</Typography>
        <Button variant="outlined" onClick={() => refetch()} sx={{ mt: 2 }}>
          {language === 'en' ? 'Try Again' : 'Pokušaj ponovo'}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Page Title & Refresh Header */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <AccessTimeIcon sx={{ color: 'primary.main', fontSize: 30 }} />
            {t('tabActivityLogs')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {language === 'en'
              ? 'Grouped user sessions and accumulated active usage insights'
              : 'Grupisano po korisnicima i sesijama sa zbirnim prikazom aktivnosti'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Active / Paused Switch */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1.5,
              py: 0.4,
              borderRadius: 2,
              border: '1px solid',
              borderColor: isLoggingEnabled
                ? (isDark ? alpha('#16a34a', 0.4) : alpha('#16a34a', 0.3))
                : 'divider',
              bgcolor: isLoggingEnabled
                ? (isDark ? alpha('#16a34a', 0.12) : alpha('#16a34a', 0.06))
                : (isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02)),
              transition: 'all 0.2s ease',
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={isLoggingEnabled}
                  onChange={(e) => handleToggleClick(e.target.checked)}
                  color="success"
                  size="small"
                  disabled={toggleMutation.isPending || isStatusLoading}
                />
              }
              label={
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    color: isLoggingEnabled ? 'success.main' : 'text.secondary',
                    userSelect: 'none',
                  }}
                >
                  {isLoggingEnabled ? t('activityLogsStatusActive') : t('activityLogsStatusPaused')}
                </Typography>
              }
              sx={{ m: 0 }}
            />
          </Box>

          {/* Retention Period Setting */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.8,
              px: 1.2,
              py: 0.35,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02),
              transition: 'all 0.2s ease',
            }}
          >
            <AccessTimeIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 18 }} />
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.82rem',
                color: 'text.secondary',
                fontWeight: 500,
                display: { xs: 'none', sm: 'inline' },
                userSelect: 'none',
              }}
            >
              {t('activityLogsRetention')}:
            </Typography>
            <Select
              size="small"
              variant="standard"
              disableUnderline
              value={[30, 60, 90, 180, 365].includes(retentionDays) ? retentionDays : 'custom'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'custom') {
                  handleRetentionSelect('custom');
                } else {
                  handleRetentionSelect(Number(val));
                }
              }}
              disabled={updateSettingsMutation.isPending || isStatusLoading}
              sx={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'text.primary',
                '& .MuiSelect-select': {
                  py: 0.2,
                  pr: '20px !important',
                },
              }}
            >
              <MenuItem value={30}>{t('retention30Days')}</MenuItem>
              <MenuItem value={60}>{t('retention60Days')}</MenuItem>
              <MenuItem value={90}>{t('retention90Days')}</MenuItem>
              <MenuItem value={180}>{t('retention180Days')}</MenuItem>
              <MenuItem value={365}>{t('retention365Days')}</MenuItem>
              <MenuItem value="custom">
                {![30, 60, 90, 180, 365].includes(retentionDays)
                  ? `${retentionDays} ${t('activityLogsRetentionDays')} (${t('retentionCustom')})`
                  : t('retentionCustom')}
              </MenuItem>
            </Select>
          </Box>

          <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={() => setDeleteDialog({ isOpen: true, type: 'all' })}
            startIcon={<DeleteIcon />}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            {language === 'en' ? 'Clear All' : 'Obriši sve'}
          </Button>
          <Tooltip title={language === 'en' ? 'Refresh data' : 'Osveži podatke'}>
            <span>
              <IconButton
                onClick={() => refetch()}
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

      {/* Banner if logging is deactivated */}
      {!isLoggingEnabled && (
        <Alert
          severity="warning"
          variant="outlined"
          sx={{
            mb: 3,
            borderRadius: 2.5,
            bgcolor: isDark ? alpha('#f59e0b', 0.08) : alpha('#fef3c7', 0.45),
            borderColor: isDark ? alpha('#f59e0b', 0.3) : alpha('#f59e0b', 0.4),
          }}
        >
          <AlertTitle sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
            {t('activityLogsStatusPaused')}
          </AlertTitle>
          {t('activityLogsDeactivatedBanner')}
        </Alert>
      )}

      {/* KPI Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        {/* Metric 1: Tracked Users */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: isDark ? alpha('#2e7d32', 0.08) : '#fbfdfb' }}>
          <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {t('totalTrackedUsers')}
              </Typography>
              <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(theme.palette.primary.main, 0.15), color: theme.palette.primary.main }}>
                <PeopleIcon fontSize="small" />
              </Avatar>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {kpiStats.totalUsers}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {kpiStats.activeToday} {language === 'en' ? 'active in the last 24h' : 'aktivno u poslednja 24h'}
            </Typography>
          </CardContent>
        </Card>

        {/* Metric 2: Total Sessions */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: isDark ? alpha('#0284c7', 0.08) : '#f8fbfe' }}>
          <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {t('totalSessions')}
              </Typography>
              <Avatar sx={{ width: 36, height: 36, bgcolor: alpha('#0284c7', 0.15), color: '#0284c7' }}>
                <TimelineIcon fontSize="small" />
              </Avatar>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {kpiStats.totalSessions}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {kpiStats.totalUsers > 0 ? `~${Math.round(kpiStats.totalSessions / kpiStats.totalUsers)} ${language === 'en' ? 'sessions / user' : 'sesija po korisniku'}` : '-'}
            </Typography>
          </CardContent>
        </Card>

        {/* Metric 3: Total Tracked Time */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: isDark ? alpha('#7c3aed', 0.08) : '#faf8fe' }}>
          <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {t('totalTrackedTime')}
              </Typography>
              <Avatar sx={{ width: 36, height: 36, bgcolor: alpha('#7c3aed', 0.15), color: '#7c3aed' }}>
                <AccessTimeIcon fontSize="small" />
              </Avatar>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {formatDuration(kpiStats.totalTrackedSeconds)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {kpiStats.totalSessions > 0
                ? `${formatDuration(Math.round(kpiStats.totalTrackedSeconds / kpiStats.totalSessions))} ${language === 'en' ? 'avg per session' : 'prosečno po sesiji'}`
                : '-'}
            </Typography>
          </CardContent>
        </Card>

        {/* Metric 4: Top Module */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: isDark ? alpha('#d97706', 0.08) : '#fefbf6' }}>
          <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {t('topModule')}
              </Typography>
              <Avatar sx={{ width: 36, height: 36, bgcolor: alpha('#d97706', 0.15), color: '#d97706' }}>
                <DonutLargeIcon fontSize="small" />
              </Avatar>
            </Box>
            <Typography variant="h5" noWrap sx={{ fontWeight: 700, textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {kpiStats.topModule}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {kpiStats.topModulePercent > 0 ? `${kpiStats.topModulePercent}% ${language === 'en' ? 'of overall usage' : 'ukupnog korišćenja'}` : '-'}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filter and Search Bar */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, mb: 3 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center', width: '100%' }}>
            {/* Search Input */}
            <TextField
              size="small"
              placeholder={t('searchActivities')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  )
                }
              }}
              sx={{ flexGrow: 1 }}
            />

            {/* User Dropdown */}
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}>
              <InputLabel id="user-filter-label">{t('colUser')}</InputLabel>
              <Select
                labelId="user-filter-label"
                value={selectedUserFilter}
                label={t('colUser')}
                onChange={e => setSelectedUserFilter(e.target.value)}
              >
                <MenuItem value="ALL">{t('allUsers')}</MenuItem>
                {processedData.map(u => (
                  <MenuItem key={u.userId} value={u.userId}>
                    {u.userName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Time Period Filter */}
            <ToggleButtonGroup
              size="small"
              value={timeRangeFilter}
              exclusive
              onChange={(_, next) => {
                if (next) setTimeRangeFilter(next);
              }}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                display: 'flex',
                flexShrink: 0,
                height: 40,
                alignSelf: { xs: 'stretch', md: 'center' },
                '& .MuiToggleButton-root': {
                  px: { xs: 1, sm: 1.5 },
                  py: 0,
                  textTransform: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  lineHeight: '38px',
                }
              }}
            >
              <ToggleButton value="ALL">{t('filterAllTime')}</ToggleButton>
              <ToggleButton value="TODAY">{t('filterToday')}</ToggleButton>
              <ToggleButton value="WEEK">{t('filterLast7Days')}</ToggleButton>
              <ToggleButton value="MONTH">{t('filterLast30Days')}</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </CardContent>
      </Card>

      {/* Grouped User List */}
      {filteredUsers.length === 0 ? (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, p: 5, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {t('noSessionsFound')}
          </Typography>
        </Card>
      ) : (
        <Stack spacing={2.5}>
          {filteredUsers.map(userGroup => {
            const isUserExpanded = expandedUsers[userGroup.userId] ?? true;
            const hasActiveSession = userGroup.sessions.some(s => s.isActive);

            return (
              <Card
                key={userGroup.userId}
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
                  onClick={() => toggleUserAccordion(userGroup.userId)}
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
                          bgcolor: hasActiveSession ? '#16a34a' : 'transparent',
                          boxShadow: hasActiveSession ? '0 0 0 2px #fff' : 'none',
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
                        {userGroup.user?.email || `ID: ${userGroup.userId}`} • {t('lastActive')}: {formatDateTime(userGroup.lastActive)}
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
                        {userGroup.totalSessionsCount} {userGroup.totalSessionsCount === 1 ? 'sesija' : 'sesija'} • {userGroup.totalActivitiesCount} {language === 'en' ? 'events' : 'radnji'}
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
                        toggleUserAccordion(userGroup.userId);
                      }}
                    >
                      {isUserExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                </Box>

                {/* Collapsible Content: User's Sessions */}
                <Collapse in={isUserExpanded}>
                  <Box sx={{ p: { xs: 1.5, sm: 2.5 }, pt: 0, bgcolor: isDark ? alpha('#000', 0.15) : alpha('#f8fafc', 0.6) }}>
                    <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
                        {t('totalSessions')} ({userGroup.sessions.length})
                      </Typography>

                      <Stack spacing={2}>
                        {userGroup.sessions.map((session, sIdx) => {
                          const isSessionExpanded = expandedSessions[session.sessionId] ?? (sIdx === 0);

                          return (
                            <Paper
                              key={session.sessionId}
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
                                onClick={() => toggleSessionAccordion(session.sessionId, sIdx === 0)}
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
                                        {t('sessionNumber')} {formatDateOnly(session.startTime)}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        • {formatDateTime(session.startTime)}
                                        {session.startTime.toDateString() === session.endTime.toDateString()
                                          ? ` — ${formatTimeOnly(session.endTime)}`
                                          : ` — ${formatDateTime(session.endTime)}`}
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
                                    {session.logs.length} {language === 'en' ? 'events' : 'događaja'}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSessionAccordion(session.sessionId, sIdx === 0);
                                    }}
                                  >
                                    {isSessionExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                  </IconButton>
                                  <Tooltip title={language === 'en' ? 'Delete session' : 'Obriši sesiju'}>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteDialog({
                                          isOpen: true,
                                          type: 'session',
                                          id: session.sessionId,
                                          ids: session.logs.map(l => l.id),
                                          label: `${t('sessionNumber')} ${formatDateOnly(session.startTime)} (${userGroup.userName})`
                                        });
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>

                              {/* Session Details / Content */}
                              <Collapse in={isSessionExpanded}>
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
                                          {session.accumulatedActivities.map((act) => {
                                            const { icon } = getPathLabelAndIcon(act.path, act.type);
                                            const rowKey = `${session.sessionId}_${act.key}`;
                                            const isRowExpanded = expandedRows[rowKey] || false;
                                            const visits = act.items.filter(i => i.type === 'PAGE_VIEW');
                                            const actions = act.items.filter(
                                              i => (i.type && !['PAGE_VIEW', 'ONLINE', 'OFFLINE', 'LOGIN', 'LOGOUT'].includes(i.type)) || i.details
                                            );
                                            const hasMutations = actions.length > 0;
                                            const isRowExpandable = hasMutations;

                                            return (
                                              <React.Fragment key={act.key}>
                                                <TableRow
                                                  hover
                                                  sx={{
                                                    cursor: isRowExpandable ? 'pointer' : 'default',
                                                    '& > *': { borderBottom: isRowExpanded ? 'none' : undefined }
                                                  }}
                                                  onClick={() => {
                                                    if (isRowExpandable) {
                                                      toggleRowDetail(rowKey);
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
                                                      {formatTimeOnly(new Date(act.firstTimestamp))}
                                                      {act.firstTimestamp !== act.lastTimestamp && ` — ${formatTimeOnly(new Date(act.lastTimestamp))}`}
                                                    </Typography>
                                                  </TableCell>
                                                  <TableCell align="right">
                                                    {isRowExpandable && (
                                                      <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          toggleRowDetail(rowKey);
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
                                          })}
                                        </TableBody>
                                      </Table>
                                    </TableContainer>
                                </Box>
                              </Collapse>
                            </Paper>
                          );
                        })}
                      </Stack>
                    </Box>
                  </Box>
                </Collapse>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, type: 'all' })}
      >
        <DialogTitle>
          {deleteDialog.type === 'all' && (language === 'en' ? 'Clear All Activity Logs' : 'Brisanje svih logova')}
          {deleteDialog.type === 'session' && (language === 'en' ? 'Delete Session' : 'Brisanje sesije')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteDialog.type === 'all' && (language === 'en'
              ? 'Are you sure you want to delete ALL activity logs? This action cannot be undone.'
              : 'Da li ste sigurni da želite da obrišete SVE logove aktivnosti? Ova radnja se ne može opozvati.')}
            {deleteDialog.type === 'session' && (language === 'en'
              ? `Are you sure you want to delete all activity logs for ${deleteDialog.label}? This action cannot be undone.`
              : `Da li ste sigurni da želite da obrišete sve logove aktivnosti za ${deleteDialog.label}? Ova radnja se ne može opozvati.`)}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ isOpen: false, type: 'all' })}>
            {language === 'en' ? 'Cancel' : 'Otkaži'}
          </Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm}>
            {language === 'en' ? 'Delete' : 'Obriši'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Deactivate Dialog */}
      <Dialog
        open={confirmDeactivateOpen}
        onClose={() => setConfirmDeactivateOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2.5 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t('activityLogsDeactivateTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
            {t('activityLogsDeactivateMessage')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button
            onClick={() => setConfirmDeactivateOpen(false)}
            variant="outlined"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            {language === 'en' ? 'Cancel' : 'Otkaži'}
          </Button>
          <Button
            onClick={handleDeactivateConfirm}
            variant="contained"
            color="warning"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            {language === 'en' ? 'Deactivate' : 'Deaktiviraj'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Retention Days Dialog */}
      <Dialog
        open={customRetentionOpen}
        onClose={() => setCustomRetentionOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2.5 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t('retentionCustomTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, fontSize: '0.9rem', color: 'text.secondary' }}>
            {t('retentionCustomPrompt')}
          </DialogContentText>
          <TextField
            autoFocus
            type="number"
            label={t('retentionCustomDaysLabel')}
            value={customDaysInput}
            onChange={(e) => setCustomDaysInput(e.target.value)}
            fullWidth
            size="small"
            slotProps={{ htmlInput: { min: 1, max: 3650 } }}
            helperText={t('activityLogsRetentionHelper')}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button
            onClick={() => setCustomRetentionOpen(false)}
            variant="outlined"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            {language === 'en' ? 'Cancel' : 'Otkaži'}
          </Button>
          <Button
            onClick={handleCustomRetentionSubmit}
            variant="contained"
            disabled={
              !customDaysInput ||
              isNaN(parseInt(customDaysInput, 10)) ||
              parseInt(customDaysInput, 10) < 1 ||
              parseInt(customDaysInput, 10) > 3650 ||
              updateSettingsMutation.isPending
            }
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            {language === 'en' ? 'Save' : 'Sačuvaj'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActivityLogsPage;
