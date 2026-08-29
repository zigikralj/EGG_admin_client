import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  TableSortLabel,
  TextField,
  Button,
  IconButton,
  Chip,
  Box,
  Typography,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
} from '@mui/material';

import type { Service, Category, SaveResult, CustomFieldDefinition } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ColumnSelector, type ColumnDef } from '../ColumnSelector';
import { TableFilterSelector } from '../TableFilterSelector';
import { ErrorDialog } from '../ErrorDialog';
import { CustomDataModelModal } from '../CustomDataModelModal';
import {
  SearchIcon,
  AddIcon,
  EditIcon,
  DeleteIcon,
  LockIcon,
  SettingsIcon,
  ArrowUpwardIcon,
  ArrowDownwardIcon,
} from '../icons';

interface Props {
  services: Service[];
  categories?: Category[];
  onSaveService: (service: Partial<Service>) => Promise<SaveResult | void> | void;
  onDeleteService: (id: string) => void;
  visibleColumns?: string[];
  onVisibleColumnsChange?: (cols: string[]) => void;
  sortState?: { field: string; direction: 'asc' | 'desc' };
  onSortChange?: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
}

const DEFAULT_COLUMNS = ['name', 'group', 'frequency', 'description', 'customData'];

const ServicesView: React.FC<Props> = ({
  services,
  categories = [],
  onSaveService,
  onDeleteService,
  visibleColumns = DEFAULT_COLUMNS,
  onVisibleColumnsChange,
  sortState,
  onSortChange,
}) => {
  const { t, getServiceLabel } = useLanguage();
  const { canManageServices } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [localColumns, setLocalColumns] = useState<string[]>(visibleColumns);
  const [isSaving, setIsSaving] = useState(false);
  const [errorDialogState, setErrorDialogState] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  // Custom data model state
  const [isCustomModelModalOpen, setIsCustomModelModalOpen] = useState(false);
  const [activeModelService, setActiveModelService] = useState<Service | null>(null);

  const getCustomModelForService = (serviceId: string): CustomFieldDefinition[] => {
    if (!serviceId) return [];
    const matchedService = services.find((s) => s.id === serviceId);
    if (matchedService?.customDataModel && Array.isArray(matchedService.customDataModel)) {
      return matchedService.customDataModel;
    }
    return [];
  };

  const handleSaveCustomModel = async (serviceId: string, fields: CustomFieldDefinition[]) => {
    if (onSaveService) {
      await onSaveService({ id: serviceId, customDataModel: fields });
    }
  };

  const [sortColumn, setSortColumn] = useState<string>(sortState?.field || 'name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(sortState?.direction || 'asc');

  useEffect(() => {
    if (sortState) {
      setSortColumn(sortState.field || 'name');
      setSortDirection(sortState.direction || 'asc');
    }
  }, [sortState]);

  const handleSort = (colId: string) => {
    let newDir: 'asc' | 'desc' = 'asc';
    if (sortColumn === colId) {
      newDir = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    setSortColumn(colId);
    setSortDirection(newDir);
    if (onSortChange) {
      onSortChange({ field: colId, direction: newDir });
    }
  };

  const handleSortColumnChange = (colId: string) => {
    setSortColumn(colId);
    if (onSortChange) {
      onSortChange({ field: colId, direction: sortDirection });
    }
  };

  const handleToggleSortDirection = () => {
    const newDir = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDir);
    if (onSortChange) {
      onSortChange({ field: sortColumn, direction: newDir });
    }
  };

  // Filter states
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterFrequency, setFilterFrequency] = useState<string>('all');

  const activeFilterCount =
    (filterGroup !== 'all' ? 1 : 0) +
    (filterFrequency !== 'all' ? 1 : 0) +
    (sortColumn !== 'name' || sortDirection !== 'asc' ? 1 : 0);

  const clearFilters = () => {
    setFilterGroup('all');
    setFilterFrequency('all');
    setSortColumn('name');
    setSortDirection('asc');
    if (onSortChange) {
      onSortChange({ field: 'name', direction: 'asc' });
    }
  };

  const activeCols = onVisibleColumnsChange ? visibleColumns : localColumns;
  const setCols = (cols: string[]) => {
    setLocalColumns(cols);
    if (onVisibleColumnsChange) onVisibleColumnsChange(cols);
  };

  const columnDefs: ColumnDef[] = [
    { id: 'name', label: t('colServiceName') },
    { id: 'group', label: t('colCategory') },
    { id: 'frequency', label: t('colPeriodicSampling') },
    { id: 'description', label: t('colDescription') },
    { id: 'customData', label: t('colCustomData') },
  ];

  const groupLabels: Record<string, string> = {
    'grp-waste': t('groupWaste'),
    'grp-legal': t('groupLegal'),
    'grp-testing': t('groupTesting'),
    'grp-advisory': t('groupAdvisory'),
    'grp-standards': t('groupStandards'),
    'grp-otpad': t('groupWaste'),
    'grp-pravno': t('groupLegal'),
    'grp-ispitivanje': t('groupTesting'),
    'grp-savetnik': t('groupAdvisory'),
    'grp-standardi': t('groupStandards'),
  };

  const getCategoryName = (grpCode: string) => {
    const matched = categories.find((c) => c.code === grpCode);
    if (matched) return matched.name;
    return groupLabels[grpCode] || grpCode;
  };

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [group, setGroup] = useState('grp-legal');
  const [frequency, setFrequency] = useState(0);
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const openNew = () => {
    if (!canManageServices) return;
    setEditingService(null);
    setCode('');
    setName('');
    setGroup(categories[0]?.code || 'grp-legal');
    setFrequency(0);
    setDescription('');
    setIsOpen(true);
  };

  const openEdit = (s: Service) => {
    if (!canManageServices) return;
    setEditingService(s);
    setCode(s.code);
    setName(s.name || getServiceLabel(s.code));
    setGroup(s.group);
    setFrequency(s.frequency || 0);
    setDescription(s.description || '');
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageServices) return;
    if (!name.trim()) {
      setErrorDialogState({
        open: true,
        message: t('alertServiceNameRequired'),
      });
      return;
    }
    if (!editingService && !code.trim()) {
      setErrorDialogState({
        open: true,
        message: t('alertServiceCodeRequired'),
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await onSaveService({
        id: editingService ? editingService.id : undefined,
        code: editingService ? editingService.code : code,
        name: name.trim(),
        group,
        frequency,
        description: description.trim() ? description.trim() : null,
      });

      if (res && typeof res === 'object' && 'success' in res) {
        if (res.success) {
          setIsOpen(false);
        } else {
          setErrorDialogState({
            open: true,
            message: res.error || t('errorSavingService'),
          });
        }
      } else {
        setIsOpen(false);
      }
    } catch (err: any) {
      setErrorDialogState({
        open: true,
        message: err?.message || t('errorSavingService'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 1. Popover Filters
  const filteredServices = services.filter((s) => {
    if (filterGroup !== 'all' && s.group !== filterGroup) return false;
    if (filterFrequency !== 'all' && String(s.frequency || 0) !== filterFrequency) return false;
    return true;
  });

  // 2. Search
  const searchedServices = filteredServices.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const sName = (s.name || getServiceLabel(s.code)).toLowerCase();
    const sCode = s.code.toLowerCase();
    const sDesc = (s.description || '').toLowerCase();
    const sGroup = getCategoryName(s.group).toLowerCase();
    return sName.includes(q) || sCode.includes(q) || sDesc.includes(q) || sGroup.includes(q);
  });

  // 3. Sort
  const sortedServices = [...searchedServices].sort((a, b) => {
    let res = 0;
    switch (sortColumn) {
      case 'name':
        res = (a.name || getServiceLabel(a.code)).localeCompare(b.name || getServiceLabel(b.code));
        break;
      case 'group':
        res = getCategoryName(a.group).localeCompare(getCategoryName(b.group));
        break;
      case 'frequency':
        res = (a.frequency || 0) - (b.frequency || 0);
        break;
      case 'description':
        res = (a.description || '').localeCompare(b.description || '');
        break;
      case 'createdAt':
        res = (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        break;
      default:
        res = 0;
    }
    return sortDirection === 'asc' ? res : -res;
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, filterGroup, filterFrequency]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedServices = sortedServices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const sortOptions = useMemo(
    () => [
      { value: 'name', label: t('colServiceName') },
      { value: 'group', label: t('colCategory') },
      { value: 'frequency', label: t('colPeriodicSampling') },
      { value: 'createdAt', label: t('lblCreatedDate') },
    ],
    [t]
  );

  const categoryOptions = useMemo(() => {
    if (categories.length > 0) {
      return [
        { value: 'all', label: t('chartFilterAll') },
        ...categories.map((c) => ({ value: c.code, label: c.name })),
      ];
    }
    return [
      { value: 'all', label: t('chartFilterAll') },
      { value: 'grp-waste', label: t('groupWaste') },
      { value: 'grp-legal', label: t('groupLegal') },
      { value: 'grp-testing', label: t('groupTesting') },
      { value: 'grp-advisory', label: t('groupAdvisory') },
      { value: 'grp-standards', label: t('groupStandards') },
    ];
  }, [categories, t]);

  const frequencyOptions = useMemo(
    () => [
      { value: 'all', label: t('chartFilterAll') },
      { value: '0', label: t('freqNoReminder') },
      { value: '1', label: t('freqEveryXMonths', { freq: 1 }) },
      { value: '3', label: t('freqQuarterly') },
      { value: '6', label: t('freqSemiAnnually') },
      { value: '12', label: t('freqEveryXMonths', { freq: 12 }) },
    ],
    [t]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', flex: 1, minHeight: 0 }}>
      {/* TOP ACTION BAR */}
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, alignItems: 'center' }}>
        {canManageServices ? (
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={openNew} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {t('btnNewService')}
          </Button>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
            <LockIcon fontSize="small" />
            <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
              {t('permissionDeniedServices')}
            </Typography>
          </Box>
        )}
      </Box>

      {/* TABLE CARD */}
      <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Box
          sx={{
            p: { xs: 1.5, sm: 2 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('servicesListTitle', { count: sortedServices.length })}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
            <TextField
              size="small"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ width: { xs: '100%', sm: 200 } }}
            />

            <TableFilterSelector
              activeCount={activeFilterCount}
              onClear={clearFilters}
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
                    value={sortOptions.find((o) => o.value === sortColumn) || sortOptions[0]}
                    onChange={(_, newValue) => {
                      if (newValue) handleSortColumnChange(newValue.value as any);
                    }}
                    renderInput={(params) => <TextField {...params} label={t('lblSortBy')} size="small" />}
                  />
                  <IconButton
                    size="small"
                    onClick={handleToggleSortDirection}
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
                    options={categoryOptions}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, val) => option.value === val.value}
                    value={categoryOptions.find((o) => o.value === filterGroup) || null}
                    onChange={(_, newValue) => setFilterGroup(newValue ? newValue.value : 'all')}
                    renderInput={(params) => <TextField {...params} label={t('lblCategoryGroup')} size="small" />}
                  />

                  <Autocomplete
                    size="small"
                    fullWidth
                    disablePortal
                    options={frequencyOptions}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, val) => option.value === val.value}
                    value={frequencyOptions.find((o) => o.value === filterFrequency) || null}
                    onChange={(_, newValue) => setFilterFrequency(newValue ? newValue.value : 'all')}
                    renderInput={(params) => <TextField {...params} label={t('lblFrequencyMonths')} size="small" />}
                  />
                </>
              }
            />

            <ColumnSelector columns={columnDefs} visibleColumns={activeCols} onChange={setCols} />
          </Box>
        </Box>

        <TableContainer sx={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          <Table stickyHeader sx={{ width: '100%', minWidth: 700 }}>
            <TableHead>
              <TableRow>
                {activeCols.includes('name') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'name'}
                      direction={sortColumn === 'name' ? sortDirection : 'asc'}
                      onClick={() => handleSort('name')}
                    >
                      {t('colServiceName')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('group') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'group'}
                      direction={sortColumn === 'group' ? sortDirection : 'asc'}
                      onClick={() => handleSort('group')}
                    >
                      {t('colCategory')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('frequency') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'frequency'}
                      direction={sortColumn === 'frequency' ? sortDirection : 'asc'}
                      onClick={() => handleSort('frequency')}
                    >
                      {t('colPeriodicSampling')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('description') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'description'}
                      direction={sortColumn === 'description' ? sortDirection : 'asc'}
                      onClick={() => handleSort('description')}
                    >
                      {t('colDescription')}
                    </TableSortLabel>
                  </TableCell>
                )}
                {activeCols.includes('customData') && <TableCell>{t('colCustomData')}</TableCell>}
                {canManageServices && <TableCell align="right">{t('colActions')}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeCols.length + (canManageServices ? 1 : 0)} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    {t('emptyServices')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedServices.map((s) => {
                  const fields = getCustomModelForService(s.id);
                  return (
                    <TableRow key={s.id} hover>
                      {activeCols.includes('name') && (
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {s.name || getServiceLabel(s.code)}
                          </Typography>
                        </TableCell>
                      )}
                      {activeCols.includes('group') && (
                        <TableCell>
                          <Chip
                            label={getCategoryName(s.group)}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                      )}
                      {activeCols.includes('frequency') && (
                        <TableCell>
                          {s.frequency === 0
                            ? t('freqNoReminder')
                            : s.frequency === 3
                            ? t('freqQuarterly')
                            : s.frequency === 6
                            ? t('freqSemiAnnually')
                            : t('freqEveryXMonths', { freq: s.frequency })}
                        </TableCell>
                      )}
                      {activeCols.includes('description') && (
                        <TableCell sx={{ maxWidth: { xs: 180, sm: 260, md: 320 } }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'text.secondary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {s.description || '—'}
                          </Typography>
                        </TableCell>
                      )}
                      {activeCols.includes('customData') && (
                        <TableCell sx={{ maxWidth: { xs: 180, sm: 240 } }}>
                          {fields.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              —
                            </Typography>
                          ) : (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {fields.map((f) => (
                                <Chip
                                  key={f.id}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  label={`${f.name}${f.unit ? ` (${f.unit})` : ''}`}
                                  sx={{ fontSize: '0.75rem', height: 22 }}
                                />
                              ))}
                            </Box>
                          )}
                        </TableCell>
                      )}
                      {canManageServices && (
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              color="primary"
                              title={t('btnEditCustomDataModel')}
                              onClick={() => {
                                setActiveModelService(s);
                                setIsCustomModelModalOpen(true);
                              }}
                            >
                              <SettingsIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="info" onClick={() => openEdit(s)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => onDeleteService(s.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
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

        <TablePagination
          rowsPerPageOptions={[15, 25, 50]}
          component="div"
          count={sortedServices.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      </Card>

      {/* SERVICE DIALOG */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editingService ? t('modalEditService') : t('modalNewService')}
            </Typography>
            {editingService && canManageServices && (
              <Button
                color="error"
                size="small"
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  onDeleteService(editingService.id);
                  setIsOpen(false);
                }}
              >
                {t('btnDelete')}
              </Button>
            )}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('lblServiceCode')}
                  placeholder={t('phServiceCode')}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={Boolean(editingService)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('lblServiceName')}
                  placeholder={t('phServiceName')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('lblCategoryGroup')}</InputLabel>
                  <Select
                    value={group}
                    label={t('lblCategoryGroup')}
                    onChange={(e) => setGroup(e.target.value as string)}
                  >
                    {categories.length > 0
                      ? categories.map((c) => (
                          <MenuItem key={c.id} value={c.code}>
                            {c.name}
                          </MenuItem>
                        ))
                      : [
                          <MenuItem key="grp-waste" value="grp-waste">{t('groupWaste')}</MenuItem>,
                          <MenuItem key="grp-legal" value="grp-legal">{t('groupLegal')}</MenuItem>,
                          <MenuItem key="grp-testing" value="grp-testing">{t('groupTesting')}</MenuItem>,
                          <MenuItem key="grp-advisory" value="grp-advisory">{t('groupAdvisory')}</MenuItem>,
                          <MenuItem key="grp-standards" value="grp-standards">{t('groupStandards')}</MenuItem>,
                        ]}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  slotProps={{ htmlInput: { min: 0, max: 24 } }}
                  label={t('lblFrequencyMonths')}
                  value={frequency}
                  onChange={(e) => setFrequency(Number(e.target.value))}
                  helperText={t('hintFrequencyZero')}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  label={t('lblDescription')}
                  placeholder={t('phDescription')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Grid>

              {/* CUSTOM DATA MODEL SECTION IN EDIT DIALOG */}
              {editingService && (
                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{
                      mt: 1,
                      p: 2,
                      bgcolor: 'action.hover',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {t('customDataSection')}
                      </Typography>
                      {canManageServices && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<SettingsIcon />}
                          onClick={() => {
                            setActiveModelService(editingService);
                            setIsCustomModelModalOpen(true);
                          }}
                          sx={{ textTransform: 'none' }}
                        >
                          {t('btnEditCustomDataModel')}
                        </Button>
                      )}
                    </Box>

                    {(() => {
                      const fields = getCustomModelForService(editingService.id);
                      if (fields.length === 0) {
                        return (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {t('noCustomFieldsDefined')}
                            </Typography>
                            {canManageServices && (
                              <Button
                                size="small"
                                variant="text"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                  setActiveModelService(editingService);
                                  setIsCustomModelModalOpen(true);
                                }}
                                sx={{ textTransform: 'none' }}
                              >
                                {t('btnDefineModel')}
                              </Button>
                            )}
                          </Box>
                        );
                      }
                      return (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
                          {fields.map((f) => (
                            <Chip
                              key={f.id}
                              size="small"
                              variant="outlined"
                              color="primary"
                              label={`${f.name} (${f.type}${f.unit ? ` - ${f.unit}` : ''})`}
                            />
                          ))}
                        </Box>
                      );
                    })()}
                  </Box>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setIsOpen(false)} variant="outlined" disabled={isSaving}>
              {t('btnCancel')}
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={isSaving}>
              {isSaving ? '...' : t('btnSave')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* CUSTOM DATA MODEL DEFINITION MODAL */}
      <CustomDataModelModal
        isOpen={isCustomModelModalOpen}
        onClose={() => setIsCustomModelModalOpen(false)}
        service={activeModelService}
        initialFields={activeModelService ? getCustomModelForService(activeModelService.id) : []}
        onSave={handleSaveCustomModel}
      />

      <ErrorDialog
        open={errorDialogState.open}
        message={errorDialogState.message}
        onClose={() => setErrorDialogState((prev) => ({ ...prev, open: false }))}
      />
    </Box>
  );
};

export default ServicesView;
