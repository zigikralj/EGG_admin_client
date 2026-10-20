import { useMemo } from 'react';
import type { ActivityLog, User } from '../../types';
import type {
  AccumulatedActivity,
  Session,
  UserActivityGroup,
  KpiStats,
  TimeRangeFilter
} from './types';
import {
  LIFECYCLE_TYPES,
  isEmptyUpdateLog,
  getCanonicalPagePath,
  getPathLabelAndIcon
} from './utils';

export interface UseActivityLogsDataParams {
  logs?: ActivityLog[];
  users?: User[];
  timeRangeFilter: TimeRangeFilter;
  selectedUserFilter: string;
  searchQuery: string;
  t: (key: any) => string;
  language: string;
}

export function clusterUserLogsIntoSessions(
  userLogs: ActivityLog[],
  userId: string,
  userName: string,
  t: (key: any) => string,
  language: string
): Session[] {
  if (!userLogs || userLogs.length === 0) return [];
  const now = Date.now();

  const sessionMap = new Map<string, ActivityLog[]>();

  const sortedAsc = [...userLogs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let currentSessionId = '';
  let lastTimestamp = 0;
  let lastType = '';

  for (const log of sortedAsc) {
    const logTime = new Date(log.timestamp).getTime();
    const isGap = lastTimestamp > 0 && (logTime - lastTimestamp > 30 * 60 * 1000);
    const wasLogout = lastType === 'LOGOUT';
    const hasSubstantialGap = lastTimestamp > 0 && (logTime - lastTimestamp > 5 * 60 * 1000);
    const isDifferentSessionId = Boolean(log.sessionId && currentSessionId && log.sessionId !== currentSessionId);
    const isLogin = log.type === 'LOGIN';

    let shouldStartNewSession = false;
    if (!currentSessionId) {
      shouldStartNewSession = true;
    } else if (wasLogout) {
      shouldStartNewSession = true;
    } else if (isGap) {
      shouldStartNewSession = true;
    } else if (isDifferentSessionId && hasSubstantialGap) {
      shouldStartNewSession = true;
    } else if (isLogin && (hasSubstantialGap || wasLogout)) {
      shouldStartNewSession = true;
    }

    if (shouldStartNewSession) {
      currentSessionId = log.sessionId || `synth_${userId}_${logTime}`;
      if (!sessionMap.has(currentSessionId)) {
        sessionMap.set(currentSessionId, []);
      }
    }

    sessionMap.get(currentSessionId)!.push(log);
    lastTimestamp = logTime;
    lastType = log.type;
  }

  const sessionList: Session[] = [];

  sessionMap.forEach((sLogs, sId) => {
    const sortedDesc = [...sLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const startTime = new Date(sortedDesc[sortedDesc.length - 1].timestamp);
    const endTime = new Date(sortedDesc[0].timestamp);

    let totalDuration = sortedDesc.reduce((sum, item) => sum + (item.durationSeconds || 0), 0);
    if (totalDuration === 0 && sortedDesc.length > 1) {
      totalDuration = Math.max(0, Math.floor((endTime.getTime() - startTime.getTime()) / 1000));
    }

    const isOnlyLifecycle = sLogs.every(l => l.type === 'LOGIN' || l.type === 'LOGOUT');
    const sessionSpanSeconds = Math.max(
      totalDuration,
      Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
    );
    if (isOnlyLifecycle && sessionSpanSeconds < 5) {
      return;
    }

    const latestLog = sortedDesc[0];
    const isActive =
      now - endTime.getTime() < 10 * 60 * 1000 &&
      latestLog.type !== 'OFFLINE' &&
      latestLog.type !== 'LOGOUT';

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
      if (LIFECYCLE_TYPES.has(log.type) || isEmptyUpdateLog(log)) {
        continue;
      }

      const canonicalPath = getCanonicalPagePath(log.path);
      const key = canonicalPath ? `path:${canonicalPath}` : `type:${log.type}`;
      const { label } = getPathLabelAndIcon(canonicalPath, log.type, t, language);

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

  sessionList.sort((a, b) => b.endTime.getTime() - a.endTime.getTime());

  sessionList.forEach((sess, idx) => {
    if (idx > 0) {
      sess.isActive = false;
    }
  });

  return sessionList;
}

export function useActivityLogsData({
  logs,
  users,
  timeRangeFilter,
  selectedUserFilter,
  searchQuery,
  t,
  language
}: UseActivityLogsDataParams) {
  // Process logs into User -> Session -> Accumulated Activities hierarchy
  const processedData = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    // 1. Filter by time range if set
    let filteredLogs = logs;
    const cutoff = new Date();
    if (timeRangeFilter === 'TODAY') {
      cutoff.setHours(0, 0, 0, 0);
    } else if (timeRangeFilter === 'WEEK') {
      cutoff.setDate(cutoff.getDate() - 7);
    } else if (timeRangeFilter === 'MONTH') {
      cutoff.setDate(cutoff.getDate() - 30);
    }
    filteredLogs = logs.filter(l => new Date(l.timestamp).getTime() >= cutoff.getTime());

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

      const sessionList = clusterUserLogsIntoSessions(userLogs, userId, userName, t, language);

      // Overall user stats
      const totalUserDuration = sessionList.reduce((sum, s) => sum + s.totalDurationSeconds, 0);
      const totalActivitiesCount = userLogs.filter(l => !LIFECYCLE_TYPES.has(l.type) && !isEmptyUpdateLog(l)).length;
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
  const kpiStats: KpiStats = useMemo(() => {
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

  return {
    processedData,
    filteredUsers,
    kpiStats
  };
}
