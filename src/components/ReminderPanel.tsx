import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TablePagination,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  Paper,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Autocomplete,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import type { Project, Reminder, Client, User, SaveResult } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { TableFilterSelector } from './TableFilterSelector';
import { ErrorDialog } from './ErrorDialog';

interface Props {
  projects?: Project[];
  reminders?: Reminder[];
  clients?: Client[];
  users?: User[];
  onMarkSampled?: (id: string) => void;
  onSaveReminder?: (reminder: Partial<Reminder>) => Promise<SaveResult | void> | void;
  onDeleteReminder?: (id: string) => void;
  onStatusChangeReminder?: (id: string, status: string) => void;
  isFullHeight?: boolean;
  hideNotch?: boolean;
  myRemindersOnly?: boolean;
  onMyRemindersOnlyChange?: (val: boolean) => void;
}

interface ReminderItem {
  id: string;
  title?: string | null;
  projectName: string;
  clientName: string;
  responsible: string;
  dueDate: string | null;
  status?: string;
  notes?: string | null;
  projectId?: string | null;
  clientId?: string | null;
  responsibleId?: string | null;
  createdAt?: string;
}

function fmtDate(d: string | null): string {
  if (!d) return '—';
  const clean = d.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [y, m, day] = parts;
    return `${day}.${m}.${y}.`;
  }
  return d;
}

const isCompletedStatus = (status?: string): boolean => {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === 'completed' || s === 'završeno' || s === 'завршено';
};

const isOverdueItem = (item: ReminderItem): boolean => {
  if (isCompletedStatus(item.status)) return false;
  if (!item.status) return false;
  const s = item.status.toLowerCase();
  if (s === 'overdue' || s === 'prekoračeno' || s === 'прекорачено') return true;
  if (!item.dueDate) return false;
  const due = new Date(item.dueDate.split('T')[0]);
  const today = new Date(new Date().toDateString());
  return due < today;
};

const isApproachingItem = (item: ReminderItem): boolean => {
  if (isCompletedStatus(item.status) || isOverdueItem(item)) return false;
  if (!item.dueDate) return false;
  const due = new Date(item.dueDate.split('T')[0]);
  const today = new Date(new Date().toDateString());
  const diffTime = due.getTime() - today.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 10;
};

export const ReminderPanel: React.FC<Props> = ({
  projects = [],
  reminders = [],
  clients = [],
  users = [],
  onSaveReminder,
  onDeleteReminder,
  onStatusChangeReminder,
  isFullHeight = false,
  hideNotch = false,
  myRemindersOnly: myRemindersOnlyProp = false,
  onMyRemindersOnlyChange,
}) => {
  const { t } = useLanguage();
  const { currentUser, isAdmin, isManager } = useAuth();

  // Filters and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [myRemindersOnly, setMyRemindersOnly] = useState(myRemindersOnlyProp);

  useEffect(() => {
    if (myRemindersOnlyProp !== undefined) {
      setMyRemindersOnly(myRemindersOnlyProp);
      if (myRemindersOnlyProp && currentUser?.name) {
        setFilterResponsible(currentUser.name);
      }
    }
  }, [myRemindersOnlyProp, currentUser?.name]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterResponsible, setFilterResponsible] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'dueDate' | 'title' | 'project' | 'client' | 'responsible' | 'status' | 'createdAt'>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal / Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<ReminderItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorDialogState, setErrorDialogState] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  // Form states for create / edit dialog
  const [title, setTitle] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projectName, setProjectName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [selectedResponsibleId, setSelectedResponsibleId] = useState<string>('');
  const [responsible, setResponsible] = useState('');
  const [status, setStatus] = useState('Pending');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Reset pagination when filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, myRemindersOnly, filterStatus, filterClient, filterResponsible, sortOption, sortDirection]);

  const handleToggleMyReminders = (val: boolean) => {
    setMyRemindersOnly(val);
    onMyRemindersOnlyChange?.(val);
    if (val && currentUser?.name) {
      setFilterResponsible(currentUser.name);
    } else if (!val && currentUser?.name && filterResponsible === currentUser.name) {
      setFilterResponsible('all');
    }
  };

  const handleFilterResponsibleChange = (val: string) => {
    setFilterResponsible(val);
    if (currentUser?.name && val === currentUser.name) {
      setMyRemindersOnly(true);
      onMyRemindersOnlyChange?.(true);
    } else if (myRemindersOnly) {
      setMyRemindersOnly(false);
      onMyRemindersOnlyChange?.(false);
    }
  };

  const handleClearAllFilters = () => {
    setMyRemindersOnly(false);
    onMyRemindersOnlyChange?.(false);
    setFilterStatus('all');
    setFilterClient('all');
    setFilterResponsible('all');
    setSearchQuery('');
    setSortOption('dueDate');
    setSortDirection('asc');
  };

  const rawItems: ReminderItem[] = useMemo(() => {
    if (reminders && reminders.length > 0) {
      return reminders.map((r) => ({
        id: r.id,
        title: r.title || null,
        projectName: r.projectName || '',
        clientName: r.clientName || '',
        responsible: r.responsible || '—',
        dueDate: r.dueDate || null,
        status: r.status || 'Pending',
        notes: r.notes || null,
        projectId: r.projectId || null,
        clientId: r.clientId || null,
        responsibleId: r.responsibleId || null,
        createdAt: r.createdAt,
      }));
    }
    return projects
      .filter((p) => p.nextSample && !p.done)
      .map((p) => ({
        id: p.id,
        title: p.name,
        projectName: p.name,
        clientName: p.clientName,
        responsible: p.responsible || '—',
        dueDate: p.nextSample,
        status: 'Pending',
        notes: null,
        projectId: p.id,
        clientId: p.clientId || null,
        responsibleId: (p as any).responsibleId || null,
        createdAt: p.createdAt,
      }));
  }, [reminders, projects]);

  const uniqueClients = useMemo(() => {
    const set = new Set<string>();
    rawItems.forEach((r) => {
      if (r.clientName && r.clientName.trim()) set.add(r.clientName.trim());
    });
    clients.forEach((c) => {
      if (c.name && c.name.trim()) set.add(c.name.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rawItems, clients]);

  const otherResponsibles = useMemo(() => {
    const currentName = currentUser?.name?.trim().toLowerCase();
    const set = new Set<string>();
    rawItems.forEach((r) => {
      if (r.responsible && r.responsible !== '—' && r.responsible.trim()) {
        set.add(r.responsible.trim());
      }
    });
    users.forEach((u) => {
      if (u.name && u.name.trim()) set.add(u.name.trim());
    });
    return Array.from(set)
      .filter((r) => !currentName || r.trim().toLowerCase() !== currentName)
      .sort((a, b) => a.localeCompare(b));
  }, [rawItems, users, currentUser]);

  const responsibleOptions = useMemo(() => {
    const list: string[] = [];
    if (currentUser?.name) {
      list.push(currentUser.name);
    }
    otherResponsibles.forEach((r) => {
      if (!list.includes(r)) list.push(r);
    });
    return list;
  }, [currentUser, otherResponsibles]);

  const sortOptions = useMemo(() => [
    { value: 'dueDate', label: t('lblDueDate') },
    { value: 'title', label: t('colTitle') },
    { value: 'project', label: t('colProject') },
    { value: 'client', label: t('colClient') },
    { value: 'responsible', label: t('colResponsible') },
    { value: 'status', label: t('colStatus') },
    { value: 'createdAt', label: t('lblCreatedDate') },
  ], [t]);

  const statusOptions = useMemo(() => [
    { value: 'Pending', label: t('statusPending') },
    { value: 'In Progress', label: t('statusInProgress') },
    { value: 'Overdue', label: t('statusOverdue') },
  ], [t]);

  const filteredAndSortedItems = useMemo(() => {
    return rawItems
      .filter((item) => {
        // Exclude completed reminders completely
        if (isCompletedStatus(item.status)) return false;

        // Quick filter: My Reminders
        if (myRemindersOnly && currentUser) {
          const isMyName =
            item.responsible &&
            item.responsible !== '—' &&
            currentUser.name &&
            item.responsible.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
          const isMyId = item.responsibleId && item.responsibleId === currentUser.id;
          if (!isMyName && !isMyId) return false;
        }

        const isLate = isOverdueItem(item);

        // Popover dropdown filters
        if (filterStatus !== 'all') {
          if (filterStatus === 'Overdue' && !isLate) return false;
          if (filterStatus === 'Pending' && item.status?.toLowerCase() !== 'pending' && item.status !== 'Na čekanju' && item.status !== 'На чекању') {
            return false;
          }
          if (filterStatus === 'In Progress' && item.status?.toLowerCase() !== 'in progress' && item.status !== 'U toku' && item.status !== 'У току') {
            return false;
          }
        }

        if (filterClient !== 'all' && item.clientName !== filterClient) return false;
        if (filterResponsible !== 'all') {
          const isMyName =
            currentUser?.name &&
            filterResponsible === currentUser.name &&
            ((item.responsible &&
              item.responsible !== '—' &&
              currentUser.name &&
              item.responsible.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) ||
              (item.responsibleId && item.responsibleId === currentUser.id));
          if (!isMyName && item.responsible !== filterResponsible) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = item.title && item.title.toLowerCase().includes(q);
          const matchesProject = item.projectName && item.projectName.toLowerCase().includes(q);
          const matchesClient = item.clientName && item.clientName.toLowerCase().includes(q);
          const matchesResp = item.responsible && item.responsible.toLowerCase().includes(q);
          const matchesNotes = item.notes && item.notes.toLowerCase().includes(q);
          const matchesStatus = item.status && item.status.toLowerCase().includes(q);
          if (!matchesTitle && !matchesProject && !matchesClient && !matchesResp && !matchesNotes && !matchesStatus) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let res = 0;
        switch (sortOption) {
          case 'dueDate': {
            const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
            const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
            res = aTime - bTime;
            break;
          }
          case 'title': {
            const aTitle = a.title || a.projectName || '';
            const bTitle = b.title || b.projectName || '';
            res = aTitle.localeCompare(bTitle);
            break;
          }
          case 'project': {
            res = (a.projectName || '').localeCompare(b.projectName || '');
            break;
          }
          case 'client': {
            res = (a.clientName || '').localeCompare(b.clientName || '');
            break;
          }
          case 'responsible': {
            const aResp = a.responsible === '—' ? '' : a.responsible;
            const bResp = b.responsible === '—' ? '' : b.responsible;
            res = aResp.localeCompare(bResp);
            break;
          }
          case 'status': {
            res = (a.status || '').localeCompare(b.status || '');
            break;
          }
          case 'createdAt': {
            const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            res = aCreated - bCreated;
            break;
          }
          default:
            res = 0;
        }
        return sortDirection === 'asc' ? res : -res;
      });
  }, [rawItems, myRemindersOnly, filterStatus, filterClient, filterResponsible, searchQuery, sortOption, sortDirection, currentUser]);

  const activeFilterCount =
    (myRemindersOnly ? 1 : 0) +
    (filterStatus !== 'all' ? 1 : 0) +
    (filterClient !== 'all' ? 1 : 0) +
    (filterResponsible !== 'all' ? 1 : 0) +
    (sortOption !== 'dueDate' || sortDirection !== 'asc' ? 1 : 0);

  const canEditSelected = useMemo(() => {
    if (!selectedReminder) return true; // new reminder
    if (isAdmin || isManager) return true;
    if (!currentUser) return false;
    const respName = (selectedReminder.responsible || '').trim().toLowerCase();
    const curName = (currentUser.name || '').trim().toLowerCase();
    return respName !== '' && respName === curName;
  }, [isAdmin, isManager, currentUser, selectedReminder]);

  const handleOpenNew = () => {
    setSelectedReminder(null);
    setTitle('');
    setSelectedProjectId('');
    setProjectName('');
    setSelectedClientId('');
    setClientName('');
    setSelectedResponsibleId(currentUser?.id || '');
    setResponsible(currentUser?.name || '');
    setStatus('Pending');
    setDueDate('');
    setNotes('');
    setIsDialogOpen(true);
  };

  const handleOpenDetails = (item: ReminderItem) => {
    setSelectedReminder(item);
    setTitle(item.title || item.projectName || '');
    setSelectedProjectId(item.projectId || '');
    setProjectName(item.projectName);
    setSelectedClientId(item.clientId || '');
    setClientName(item.clientName);
    setSelectedResponsibleId(item.responsibleId || '');
    setResponsible(item.responsible === '—' ? '' : item.responsible);
    setStatus(item.status || 'Pending');
    setDueDate(item.dueDate ? item.dueDate.split('T')[0] : '');
    setNotes(item.notes || '');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedReminder(null);
  };

  const handleProjectSelect = (projId: string) => {
    setSelectedProjectId(projId);
    if (!projId) return;
    const proj = projects.find((p) => p.id === projId);
    if (proj) {
      if (!title) {
        setTitle(proj.name);
      }
      setProjectName(proj.name);
      if (proj.clientId) {
        setSelectedClientId(proj.clientId);
        setClientName(proj.clientName);
      } else {
        setClientName(proj.clientName || '');
      }
      if (proj.responsible) {
        setResponsible(proj.responsible);
        const usr = users.find((u) => u.name === proj.responsible);
        if (usr) setSelectedResponsibleId(usr.id);
      }
    }
  };

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditSelected) return;
    const finalTitle = title.trim() || projectName.trim();
    if (!finalTitle) {
      setErrorDialogState({
        open: true,
        message: t('alertReminderTitleRequired'),
      });
      return;
    }
    if (onSaveReminder) {
      setIsSaving(true);
      try {
        const res = await onSaveReminder({
          id: selectedReminder?.id,
          title: finalTitle,
          projectId: selectedProjectId || null,
          projectName: projectName.trim() || null,
          clientId: selectedClientId || null,
          clientName: clientName.trim() || null,
          responsibleId: selectedResponsibleId || null,
          responsible: responsible || null,
          status,
          dueDate: dueDate || null,
          notes: notes || null,
        });

        if (res && typeof res === 'object' && 'success' in res) {
          if (res.success) {
            handleCloseDialog();
          } else {
            setErrorDialogState({
              open: true,
              message: res.error || t('errorSavingReminder'),
            });
          }
        } else {
          handleCloseDialog();
        }
      } catch (err: any) {
        setErrorDialogState({
          open: true,
          message: err?.message || t('errorSavingReminder'),
        });
      } finally {
        setIsSaving(false);
      }
    } else {
      handleCloseDialog();
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusChip = (st?: string) => {
    if (!st) return null;
    switch (st.toLowerCase()) {
      case 'completed':
      case 'završeno':
      case 'завршено':
        return <Chip label={t('statusCompleted')} color="success" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />;
      case 'in progress':
      case 'u toku':
      case 'у току':
        return <Chip label={t('statusInProgress')} color="info" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />;
      case 'overdue':
      case 'prekoračeno':
      case 'прекорачено':
        return <Chip label={t('statusOverdue')} color="error" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />;
      case 'pending':
      case 'na čekanju':
      case 'на чекању':
      default:
        return <Chip label={t('statusPending')} color="warning" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />;
    }
  };

  const paginatedItems = filteredAndSortedItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          position: 'relative',
          height: '100%',
          width: '100%',
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'visible',
          mt: hideNotch ? 0 : 1,
          boxSizing: 'border-box',
        }}
      >
        {/* NOTCHED TITLE */}
        {!hideNotch && (
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              top: -8,
              left: 20,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              px: 0.75,
              py: 0.1,
              color: 'text.secondary',
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.4px',
              lineHeight: 1,
              zIndex: 1,
            }}
          >
            {t('remindersTitle')}
          </Typography>
        )}

        <CardContent sx={{ p: 2, pt: hideNotch ? 2 : 2.25, pb: '4px !important', flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          {/* TOOLBAR: SEARCH, MY REMINDERS & POPOVER FILTER & NEW BUTTON */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              justifyContent: 'space-between',
              gap: 1.5,
              mb: 1.5,
              pb: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            {/* SEARCH FIELD */}
            <TextField
              size="small"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ width: { xs: '100%', sm: 220 } }}
            />

            {/* RIGHT CONTROLS: MY REMINDERS + FILTER POPOVER + CREATE BUTTON */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: { xs: 'space-between', sm: 'flex-end' }, flexWrap: 'wrap' }}>
              {/* MY REMINDERS FILTER */}
              {currentUser && (
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={myRemindersOnly}
                      onChange={(e) => handleToggleMyReminders(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {t('quickFilterMyReminders')}
                    </Typography>
                  }
                  sx={{ mr: 0 }}
                />
              )}
              <TableFilterSelector
                activeCount={activeFilterCount}
                onClear={handleClearAllFilters}
                sortingContent={
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Autocomplete
                      size="small"
                      fullWidth
                      disablePortal
                      disableClearable
                      options={sortOptions}
                      getOptionLabel={(option) => option.label}
                      isOptionEqualToValue={(option, val) => option.value === val.value}
                      value={sortOptions.find((o) => o.value === sortOption) || sortOptions[0]}
                      onChange={(_, newValue) => {
                        if (newValue) setSortOption(newValue.value as any);
                      }}
                      renderInput={(params) => <TextField {...params} label={t('lblSortBy')} size="small" />}
                    />
                    <IconButton
                      size="small"
                      onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                      title={sortDirection === 'asc' ? t('sortAscending') : t('sortDescending')}
                      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 0.75 }}
                    >
                      {sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                    </IconButton>
                  </Box>
                }
                filteringContent={
                  <>
                    <Autocomplete
                      size="small"
                      fullWidth
                      disablePortal
                      options={statusOptions}
                      getOptionLabel={(option) => option.label}
                      isOptionEqualToValue={(option, val) => option.value === val.value}
                      value={statusOptions.find((o) => o.value === filterStatus) || null}
                      onChange={(_, newValue) => setFilterStatus(newValue ? newValue.value : 'all')}
                      renderInput={(params) => <TextField {...params} label={t('colStatus')} size="small" />}
                    />

                    <Autocomplete
                      size="small"
                      fullWidth
                      disablePortal
                      options={uniqueClients}
                      value={filterClient === 'all' ? null : filterClient}
                      onChange={(_, newValue) => setFilterClient(newValue || 'all')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t('colClient')}
                        />
                      )}
                    />

                    <Autocomplete
                      size="small"
                      fullWidth
                      disablePortal
                      options={responsibleOptions}
                      getOptionLabel={(option) => {
                        if (currentUser?.name && option === currentUser.name) {
                          return `${t('lblMe')} (${currentUser.name})`;
                        }
                        return option;
                      }}
                      value={filterResponsible === 'all' ? null : filterResponsible}
                      onChange={(_, newValue) => handleFilterResponsibleChange(newValue || 'all')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t('colResponsible')}
                        />
                      )}
                    />
                  </>
                }
              />

              {onSaveReminder && (
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleOpenNew}
                  sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                >
                  {t('btnNewReminder')}
                </Button>
              )}
            </Box>
          </Box>

          {/* LIST OF REMINDERS */}
          <Box
            sx={{
              maxHeight: isFullHeight ? 'none' : 320,
              overflowY: isFullHeight ? 'visible' : 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              width: '100%',
              flex: 1,
              pb: 1,
            }}
          >
            {filteredAndSortedItems.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('emptyReminders')}
                </Typography>
              </Paper>
            ) : (
              paginatedItems.map((item) => {
                const isCompleted = isCompletedStatus(item.status);
                const isLate = isOverdueItem(item);
                const isApproaching = isApproachingItem(item);

                const itemCanEdit =
                  isAdmin ||
                  isManager ||
                  (currentUser &&
                    item.responsible &&
                    item.responsible.trim().toLowerCase() === (currentUser.name || '').trim().toLowerCase());

                return (
                  <Box
                    key={item.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.25,
                      px: 1.5,
                      bgcolor: isLate ? 'error.lighter' : isApproaching ? 'warning.lighter' : 'background.paper',
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: isLate ? 'error.light' : isApproaching ? '#ff9800' : 'divider',
                      opacity: isCompleted ? 0.75 : 1,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: isLate ? 'error.lighter' : isApproaching ? 'warning.lighter' : 'action.hover',
                      },
                    }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25, flexWrap: 'wrap' }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            textDecoration: isCompleted ? 'line-through' : 'none',
                            color: isCompleted ? 'text.secondary' : 'text.primary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.title || item.projectName || '—'}
                        </Typography>
                        {item.clientName && (
                          <Chip
                            label={item.clientName}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                          />
                        )}
                        {item.projectName && item.projectName !== item.title && (
                          <Chip
                            label={item.projectName}
                            size="small"
                            variant="outlined"
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', color: 'text.secondary', fontSize: '0.75rem' }}>
                        {item.dueDate && (
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              color: isLate ? 'error.main' : isApproaching ? '#ed6c02' : 'text.secondary',
                              fontWeight: isLate || isApproaching ? 700 : 400,
                            }}
                          >
                            <CalendarTodayIcon sx={{ fontSize: '0.8rem' }} />
                            {fmtDate(item.dueDate)}
                          </Typography>
                        )}
                        {item.responsible && item.responsible !== '—' && (
                          <Typography variant="caption" color="text.secondary">
                            • {item.responsible}
                          </Typography>
                        )}
                        {getStatusChip(isLate && !isCompleted ? 'Overdue' : item.status)}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1, flexShrink: 0 }}>
                      <Tooltip title={isCompleted ? t('statusPending') : t('statusCompleted')}>
                        <IconButton
                          size="small"
                          color={isCompleted ? 'default' : 'success'}
                          onClick={() => {
                            if (onStatusChangeReminder) {
                              onStatusChangeReminder(item.id, isCompleted ? 'Pending' : 'Completed');
                            } else if (onSaveReminder) {
                              onSaveReminder({ id: item.id, status: isCompleted ? 'Pending' : 'Completed' });
                            }
                          }}
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={itemCanEdit ? t('btnEdit') : t('btnDetails')}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDetails(item)}
                        >
                          {itemCanEdit ? <EditIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      {onDeleteReminder && itemCanEdit && (
                        <Tooltip title={t('btnDelete')}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDeleteReminder(item.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>

          {filteredAndSortedItems.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[10, 20, 50]}
              component="div"
              count={filteredAndSortedItems.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ borderTop: 1, borderColor: 'divider', mt: 0.5, flexShrink: 0 }}
            />
          )}
        </CardContent>
      </Card>

      {/* REMINDER DETAILS / EDIT / CREATE DIALOG */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmitDetails}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {selectedReminder
              ? canEditSelected
                ? t('modalEditReminder')
                : t('modalReminderDetails')
              : t('modalNewReminder')}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              {/* Reminder Title */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('lblReminderTitle')}
                  placeholder={t('phReminderTitle')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={!canEditSelected}
                  required
                  autoFocus
                />
              </Grid>

              {/* Project Selection / Custom Name */}
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  freeSolo
                  size="small"
                  disabled={!canEditSelected}
                  options={projects}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return `${option.name} (${option.clientName})`;
                  }}
                  value={
                    selectedProjectId
                      ? projects.find((p) => p.id === selectedProjectId) || projectName
                      : projectName
                  }
                  onChange={(_, newValue) => {
                    if (typeof newValue === 'string') {
                      setSelectedProjectId('');
                      setProjectName(newValue);
                    } else if (newValue) {
                      handleProjectSelect(newValue.id);
                    } else {
                      setSelectedProjectId('');
                      setProjectName('');
                    }
                  }}
                  onInputChange={(_, newInputValue, reason) => {
                    if (reason === 'input') {
                      setSelectedProjectId('');
                      setProjectName(newInputValue);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('colProject')}
                    />
                  )}
                />
              </Grid>

              {/* Client Selection / Custom Name */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  freeSolo
                  size="small"
                  disabled={!canEditSelected}
                  options={clients}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return option.name;
                  }}
                  value={
                    selectedClientId
                      ? clients.find((c) => c.id === selectedClientId) || clientName
                      : clientName
                  }
                  onChange={(_, newValue) => {
                    if (typeof newValue === 'string') {
                      setSelectedClientId('');
                      setClientName(newValue);
                    } else if (newValue) {
                      setSelectedClientId(newValue.id);
                      setClientName(newValue.name);
                    } else {
                      setSelectedClientId('');
                      setClientName('');
                    }
                  }}
                  onInputChange={(_, newInputValue, reason) => {
                    if (reason === 'input') {
                      setSelectedClientId('');
                      setClientName(newInputValue);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('colClient')}
                    />
                  )}
                />
              </Grid>

              {/* Responsible Person */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  freeSolo
                  size="small"
                  disabled={!canEditSelected}
                  options={users}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return option.name;
                  }}
                  value={
                    selectedResponsibleId
                      ? users.find((u) => u.id === selectedResponsibleId) || responsible
                      : responsible
                  }
                  onChange={(_, newValue) => {
                    if (typeof newValue === 'string') {
                      setSelectedResponsibleId('');
                      setResponsible(newValue);
                    } else if (newValue) {
                      setSelectedResponsibleId(newValue.id);
                      setResponsible(newValue.name);
                    } else {
                      setSelectedResponsibleId('');
                      setResponsible('');
                    }
                  }}
                  onInputChange={(_, newInputValue, reason) => {
                    if (reason === 'input') {
                      setSelectedResponsibleId('');
                      setResponsible(newInputValue);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('colResponsible')}
                    />
                  )}
                />
              </Grid>

              {/* Status & Due Date */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small" disabled={!canEditSelected}>
                  <InputLabel>{t('lblStatus')}</InputLabel>
                  <Select value={status} label={t('lblStatus')} onChange={(e) => setStatus(e.target.value)}>
                    <MenuItem value="Pending">{t('statusPending')}</MenuItem>
                    <MenuItem value="In Progress">{t('statusInProgress')}</MenuItem>
                    <MenuItem value="Completed">{t('statusCompleted')}</MenuItem>
                    <MenuItem value="Overdue">{t('statusOverdue')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={t('lblDueDate')}
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={!canEditSelected}
                />
              </Grid>

              {/* Notes */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  label={t('lblNotes')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={!canEditSelected}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            {canEditSelected ? (
              <>
                <Button onClick={handleCloseDialog} color="inherit" disabled={isSaving}>
                  {t('btnCancel')}
                </Button>
                <Button type="submit" variant="contained" color="primary" disabled={isSaving}>
                  {isSaving ? '...' : t('btnSave')}
                </Button>
              </>
            ) : (
              <Button onClick={handleCloseDialog} color="primary" variant="contained">
                {t('btnClose')}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>

      <ErrorDialog
        open={errorDialogState.open}
        message={errorDialogState.message}
        onClose={() => setErrorDialogState((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
};
