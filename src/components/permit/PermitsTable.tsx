import React from 'react';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TableSortLabel,
  IconButton,
  Chip,
  Box,
  Typography,
  Tooltip,
} from '@mui/material';
import type { Permit, Client, Reminder } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import {
  EditIcon,
  DeleteIcon,
  NotificationsActiveIcon,
  AddIcon,
  FilterListIcon,
  HistoryIcon,
} from '../icons';
import { ExpandableChipList } from '../common/ExpandableChipList';
import { PermitStatusBadge } from './PermitStatusBadge';

export interface PermitsTableProps {
  permits: Permit[];
  activeCols: string[];
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  onSort: (col: string) => void;
  filterPermitType: string;
  onFilterPermitTypeChange: (type: string) => void;
  onOpenPermitTypeFilterMenu: (anchor: HTMLElement) => void;
  getPermitTypeLabel: (type: string) => string;
  getLinkedClient: (permit: Permit) => Client | null;
  permitRemindersMap: Map<string, Reminder[]>;
  canEdit: boolean;
  canDelete: boolean;
  canViewHistory: boolean;
  canCreateReminder: boolean;
  hasAnyRowAction: boolean;
  onRowClick: (permit: Permit) => void;
  onEditPermit: (permit: Permit) => void;
  onDeletePermit: (id: string) => void;
  onOpenHistory: (permit: Permit) => void;
  onAddReminderForPermit: (permit: Permit) => void;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  try {
    const parts = iso.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}.`;
    }
    return iso;
  } catch {
    return iso;
  }
}

export const PermitsTable: React.FC<PermitsTableProps> = ({
  permits,
  activeCols,
  sortColumn,
  sortDirection,
  onSort,
  filterPermitType,
  onFilterPermitTypeChange,
  onOpenPermitTypeFilterMenu,
  getPermitTypeLabel,
  getLinkedClient,
  permitRemindersMap,
  canEdit,
  canDelete,
  canViewHistory,
  canCreateReminder,
  hasAnyRowAction,
  onRowClick,
  onEditPermit,
  onDeletePermit,
  onOpenHistory,
  onAddReminderForPermit,
}) => {
  const { t } = useLanguage();

  return (
    <TableContainer sx={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
      <Table stickyHeader sx={{ width: '100%', minWidth: 650 }}>
        <TableHead>
          <TableRow>
            {activeCols.includes('indexNumber') && (
              <TableCell>
                <TableSortLabel
                  active={sortColumn === 'indexNumber'}
                  direction={sortColumn === 'indexNumber' ? sortDirection : 'asc'}
                  onClick={() => onSort('indexNumber')}
                >
                  {t('colIndexNumber')}
                </TableSortLabel>
              </TableCell>
            )}
            {activeCols.includes('permitNumber') && (
              <TableCell>
                <TableSortLabel
                  active={sortColumn === 'permitNumber'}
                  direction={sortColumn === 'permitNumber' ? sortDirection : 'asc'}
                  onClick={() => onSort('permitNumber')}
                >
                  {t('colPermitNumber')}
                </TableSortLabel>
              </TableCell>
            )}
            {activeCols.includes('permitTypes') && (
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
                  <TableSortLabel
                    active={sortColumn === 'permitTypes'}
                    direction={sortColumn === 'permitTypes' ? sortDirection : 'asc'}
                    onClick={() => onSort('permitTypes')}
                  >
                    {t('colPermitType')}
                  </TableSortLabel>
                  <Tooltip
                    title={
                      filterPermitType !== 'all'
                        ? `${t('filterPermitType')}: ${getPermitTypeLabel(filterPermitType)}`
                        : t('filterPermitType')
                    }
                  >
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPermitTypeFilterMenu(e.currentTarget);
                      }}
                      color={filterPermitType !== 'all' ? 'primary' : 'default'}
                      sx={{
                        p: 0.4,
                        border: filterPermitType !== 'all' ? 1 : 0,
                        borderColor: 'primary.main',
                        bgcolor: filterPermitType !== 'all' ? 'action.selected' : 'transparent',
                      }}
                    >
                      <FilterListIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            )}
            {activeCols.includes('client') && (
              <TableCell>
                <TableSortLabel
                  active={sortColumn === 'client'}
                  direction={sortColumn === 'client' ? sortDirection : 'asc'}
                  onClick={() => onSort('client')}
                >
                  {t('colClientName')}
                </TableSortLabel>
              </TableCell>
            )}
            {activeCols.includes('startDate') && (
              <TableCell>
                <TableSortLabel
                  active={sortColumn === 'startDate'}
                  direction={sortColumn === 'startDate' ? sortDirection : 'asc'}
                  onClick={() => onSort('startDate')}
                >
                  {t('colStartDate')}
                </TableSortLabel>
              </TableCell>
            )}
            {activeCols.includes('endDate') && (
              <TableCell>
                <TableSortLabel
                  active={sortColumn === 'endDate'}
                  direction={sortColumn === 'endDate' ? sortDirection : 'asc'}
                  onClick={() => onSort('endDate')}
                >
                  {t('colEndDate')}
                </TableSortLabel>
              </TableCell>
            )}
            {activeCols.includes('status') && (
              <TableCell>
                {t('colStatus')}
              </TableCell>
            )}
            {activeCols.includes('reminders') && (
              <TableCell>
                {t('linkedReminders')}
              </TableCell>
            )}
            {activeCols.includes('notes') && (
              <TableCell>
                {t('colNotes')}
              </TableCell>
            )}
            {hasAnyRowAction && (
              <TableCell align="right" sx={{ width: 120 }}>
                {t('colActions')}
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {permits.length === 0 ? (
            <TableRow>
              <TableCell colSpan={activeCols.length + (hasAnyRowAction ? 1 : 0)} align="center" sx={{ py: 6 }}>
                <Typography variant="body1" color="text.secondary">
                  {t('emptyPermits')}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            permits.map((permit) => {
              const linkedClient = getLinkedClient(permit);
              const clientDisplay =
                linkedClient?.name ||
                (permit.clients?.length ? permit.clients.map((c) => c.name).join(', ') : null) ||
                permit.clientName ||
                '—';
              const linkedRems = permitRemindersMap.get(permit.id) || [];

              return (
                <TableRow
                  key={permit.id}
                  hover
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    cursor: 'pointer',
                  }}
                  onClick={() => onRowClick(permit)}
                >
                  {activeCols.includes('indexNumber') && (
                    <TableCell>
                      {(() => {
                        const wcs = permit.wasteCatalogs?.length
                          ? permit.wasteCatalogs
                          : (permit.wasteCatalog ? [permit.wasteCatalog] : []);
                        if (!wcs.length && !permit.indexNumber) {
                          return (
                            <Typography variant="body2" color="text.disabled">
                              —
                            </Typography>
                          );
                        }
                        if (wcs.length > 0) {
                          return <ExpandableChipList wcs={wcs} max={2} />;
                        }
                        return (
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {permit.indexNumber}
                          </Typography>
                        );
                      })()}
                    </TableCell>
                  )}
                  {activeCols.includes('permitNumber') && (
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {permit.permitNumber}
                      </Typography>
                    </TableCell>
                  )}
                  {activeCols.includes('permitTypes') && (
                    <TableCell>
                      {permit.permitTypes && permit.permitTypes.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {permit.permitTypes.map((pt) => {
                            const isSelected = filterPermitType === pt;
                            return (
                              <Tooltip
                                key={pt}
                                title={
                                  isSelected
                                    ? t('btnClearFilters')
                                    : `${t('filterPermitType')}: ${getPermitTypeLabel(pt)}`
                                }
                              >
                                <Chip
                                  label={getPermitTypeLabel(pt)}
                                  size="small"
                                  variant={isSelected ? 'filled' : 'outlined'}
                                  color={isSelected ? 'primary' : 'default'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onFilterPermitTypeChange(isSelected ? 'all' : pt);
                                  }}
                                  sx={{
                                    fontSize: '0.725rem',
                                    fontWeight: isSelected ? 700 : 500,
                                    height: 22,
                                    cursor: 'pointer',
                                    bgcolor: isSelected ? undefined : 'action.hover',
                                    '&:hover': {
                                      bgcolor: isSelected ? undefined : 'action.selected',
                                    },
                                  }}
                                />
                              </Tooltip>
                            );
                          })}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </TableCell>
                  )}
                  {activeCols.includes('client') && (
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {clientDisplay}
                      </Typography>
                    </TableCell>
                  )}
                  {activeCols.includes('startDate') && (
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(permit.startDate)}
                      </Typography>
                    </TableCell>
                  )}
                  {activeCols.includes('endDate') && (
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatDate(permit.endDate)}
                      </Typography>
                    </TableCell>
                  )}
                  {activeCols.includes('status') && (
                    <TableCell>
                      <PermitStatusBadge endDate={permit.endDate} />
                    </TableCell>
                  )}
                  {activeCols.includes('reminders') && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        {linkedRems.length > 0 ? (
                          <Chip
                            icon={<NotificationsActiveIcon fontSize="small" />}
                            label={`${linkedRems.length}`}
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            -
                          </Typography>
                        )}
                        {canCreateReminder && (
                          <Tooltip title={t('btnAddReminderForPermit')}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => onAddReminderForPermit(permit)}
                              sx={{ p: 0.4 }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  )}
                  {activeCols.includes('notes') && (
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          maxWidth: 220,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {permit.notes || '-'}
                      </Typography>
                    </TableCell>
                  )}
                  {hasAnyRowAction && (
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        {canViewHistory && (
                          <Tooltip title={t('historyModalTitle')}>
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() => onOpenHistory(permit)}
                            >
                              <HistoryIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canEdit && (
                          <Tooltip title={t('btnEdit')}>
                            <IconButton
                              size="small"
                              onClick={() => onEditPermit(permit)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canDelete && (
                          <Tooltip title={t('btnDelete')}>
                            <IconButton
                              size="small"
                              onClick={() => onDeletePermit(permit.id)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
