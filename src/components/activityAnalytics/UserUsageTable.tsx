import React, { useState } from 'react';
import {
  Card,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import type { ActivityAnalytics } from '../../types';
import { formatDuration, getPathLabelAndIcon } from './utils';
import { useRoleLabels } from '../../hooks/useRoleLabels';

export interface UserUsageTableProps {
  users: ActivityAnalytics['users'];
  t: (key: any) => string;
  language: string;
}

type SortField = 'userName' | 'sessions' | 'activeDays' | 'trackedSeconds' | 'actions' | 'lastActive';
type SortOrder = 'asc' | 'desc';

export const UserUsageTable: React.FC<UserUsageTableProps> = ({
  users,
  t,
  language,
}) => {
  const theme = useTheme();
  const { getRoleBadgeLabel } = useRoleLabels();
  const [sortField, setSortField] = useState<SortField>('trackedSeconds');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'userName') {
      comparison = a.userName.localeCompare(b.userName);
    } else if (sortField === 'sessions') {
      comparison = a.sessions - b.sessions;
    } else if (sortField === 'activeDays') {
      comparison = a.activeDays - b.activeDays;
    } else if (sortField === 'trackedSeconds') {
      comparison = a.trackedSeconds - b.trackedSeconds;
    } else if (sortField === 'actions') {
      comparison = a.actions - b.actions;
    } else if (sortField === 'lastActive') {
      comparison = new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime();
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const paginatedUsers = sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const maxTracked = Math.max(...users.map((u) => u.trackedSeconds), 1);

  return (
    <Card
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        mb: 3,
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
          {t('analyticsTableUsersTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
          {t('analyticsTableUsersSubtitle')}
        </Typography>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'userName'}
                  direction={sortField === 'userName' ? sortOrder : 'asc'}
                  onClick={() => handleSort('userName')}
                >
                  {t('tabUsers')}
                </TableSortLabel>
              </TableCell>
              <TableCell>{t('role')}</TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'sessions'}
                  direction={sortField === 'sessions' ? sortOrder : 'asc'}
                  onClick={() => handleSort('sessions')}
                >
                  {t('analyticsKpiSessions')}
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'activeDays'}
                  direction={sortField === 'activeDays' ? sortOrder : 'asc'}
                  onClick={() => handleSort('activeDays')}
                >
                  {t('activeDays')}
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sx={{ minWidth: 160 }}>
                <TableSortLabel
                  active={sortField === 'trackedSeconds'}
                  direction={sortField === 'trackedSeconds' ? sortOrder : 'asc'}
                  onClick={() => handleSort('trackedSeconds')}
                >
                  {t('analyticsKpiActiveTime')}
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'actions'}
                  direction={sortField === 'actions' ? sortOrder : 'asc'}
                  onClick={() => handleSort('actions')}
                >
                  {t('analyticsKpiActions')}
                </TableSortLabel>
              </TableCell>
              <TableCell>{t('topPage')}</TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'lastActive'}
                  direction={sortField === 'lastActive' ? sortOrder : 'asc'}
                  onClick={() => handleSort('lastActive')}
                >
                  {t('lastActive')}
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => {
                const pct = Math.min(100, Math.round((user.trackedSeconds / maxTracked) * 100));
                const topPageMeta = user.topPath
                  ? getPathLabelAndIcon(user.topPath, undefined, t, language)
                  : null;

                return (
                  <TableRow key={user.userId} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{user.userName}</TableCell>
                    <TableCell>
                      {user.role ? (
                        <Chip
                          size="small"
                          label={getRoleBadgeLabel(user.role)}
                          sx={{
                            height: 20,
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            bgcolor: (th) =>
                              th.palette.mode === 'dark'
                                ? alpha(theme.palette.primary.main, 0.15)
                                : alpha(theme.palette.primary.main, 0.08),
                            color: 'primary.main',
                          }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="right">{user.sessions}</TableCell>
                    <TableCell align="right">{user.activeDays}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.4 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                          {formatDuration(user.trackedSeconds)}
                        </Typography>
                        <Box
                          sx={{
                            width: '100%',
                            height: 4,
                            borderRadius: 1,
                            bgcolor: 'action.hover',
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              width: `${pct}%`,
                              height: '100%',
                              bgcolor: 'primary.main',
                              borderRadius: 1,
                            }}
                          />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {user.actions}
                    </TableCell>
                    <TableCell>
                      {topPageMeta ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          {topPageMeta.icon}
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }} noWrap>
                            {topPageMeta.label}
                          </Typography>
                        </Box>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>
                      {new Date(user.lastActive).toLocaleDateString(
                        language === 'en' ? 'en-US' : language === 'sr-Cyrl' ? 'sr-Cyrl-RS' : 'sr-Latn-RS',
                        {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('noData')}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {users.length > 10 && (
        <TablePagination
          component="div"
          count={users.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      )}
    </Card>
  );
};
