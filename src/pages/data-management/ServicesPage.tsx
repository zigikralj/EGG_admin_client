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
  Autocomplete,
  Tooltip,
} from '@mui/material';

import type { Service, CustomFieldDefinition, TableViewProps } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { TableOptionsSelector, type ColumnDef } from '../../components/common/ColumnSelector';
import { TableFilterSelector } from '../../components/common/TableFilterSelector';
import { TableSearchInput } from '../../components/common/TableSearchInput';
import { ServiceModal } from '../../components/service';
import { type ModalMode } from '../../components/common/modal/ViewEditModalBase';
import { ErrorDialog } from '../../components/common/dialogs/ErrorDialog';
import { CustomDataModelModal } from '../../components/service/CustomDataModelModal';
import { useTableView } from '../../hooks/useTableView';
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  SettingsIcon,
  ArrowUpwardIcon,
  ArrowDownwardIcon,
  RefreshIcon,
} from '../../components/icons';

interface Props extends Partial<TableViewProps> {}

const DEFAULT_COLUMNS = ['name', 'group', 'frequency', 'description', 'customData'];

import { useServicesQuery, useServicesMutations, useCategoriesQuery, useTablePreferences } from '../../queries';
import { ConfirmDialog } from '../../components/common/dialogs/ConfirmDialog';

const ServicesPage: React.FC<Props> = ({
  visibleColumns: visibleColumnsProp,
  onVisibleColumnsChange: onVisibleColumnsChangeProp,
  rowsPerPageOptions: rowsPerPageOptionsProp,
  onRowsPerPageOptionsChange: onRowsPerPageOptionsChangeProp,
  rowsPerPage: rowsPerPageProp,
  onRowsPerPageChange: onRowsPerPageChangeProp,
  sortState: sortStateProp,
  onSortChange: onSortChangeProp,
}) => {
  const tablePrefs = useTablePreferences('services');
  const visibleColumns = visibleColumnsProp ?? tablePrefs.visibleColumns ?? DEFAULT_COLUMNS;
  const onVisibleColumnsChange = onVisibleColumnsChangeProp ?? tablePrefs.onVisibleColumnsChange;
  const rowsPerPageOptions = rowsPerPageOptionsProp ?? tablePrefs.rowsPerPageOptions;
  const onRowsPerPageOptionsChange = onRowsPerPageOptionsChangeProp ?? tablePrefs.onRowsPerPageOptionsChange;
  const rowsPerPage = rowsPerPageProp ?? tablePrefs.rowsPerPage;
  const onRowsPerPageChange = onRowsPerPageChangeProp ?? tablePrefs.onRowsPerPageChange;
  const sortState = sortStateProp ?? tablePrefs.sortState;
  const onSortChange = onSortChangeProp ?? tablePrefs.onSortChange;
  const { t, getServiceLabel } = useLanguage();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('services', 'create');
  const canEdit = hasPermission('services', 'edit');
  const canDelete = hasPermission('services', 'delete');
  const hasAnyRowAction = canEdit || canDelete;
  const [isOpen, setIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('view');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const {
    activeCols,
    setCols,
    activeRowsPerPage,
    activeRowsPerPageOptions,
    setRowsPerPageValue,
    setRowsPerPageOptionsValue,
    page,
    setPage,
    sortColumn,
    sortDirection,
    handleSort,
    handleSortColumnChange,
    handleToggleSortDirection,
    resetSort,
    isRefreshing,
    handleRefresh,
    errorDialogState,
    setErrorDialogState,
  } = useTableView({
    defaultColumns: DEFAULT_COLUMNS,
    visibleColumns,
    onVisibleColumnsChange,
    rowsPerPageProp: rowsPerPage,
    onRowsPerPageChange,
    rowsPerPageOptionsProp: rowsPerPageOptions,
    onRowsPerPageOptionsChange,
    sortState,
    onSortChange,
    onRefresh: () => { refetchServices(); },
  });

  const { data: services = [], refetch: refetchServices } = useServicesQuery();
  const { data: categories = [] } = useCategoriesQuery();
  const { handleSave, handleDelete } = useServicesMutations();

  const [deleteConfirmState, setDeleteConfirmState] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });
  const onDeleteService = (id: string) => handleDelete(id, (msg, cb) => setDeleteConfirmState({ open: true, message: msg, onConfirm: cb }));

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
    await handleSave({ id: serviceId, customDataModel: fields });
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
    resetSort();
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

  const [searchQuery, setSearchQuery] = useState('');

  const openNew = () => {
    if (!canCreate) return;
    setEditingService(null);
    setModalMode('create');
    setIsOpen(true);
  };

  const openView = (s: Service) => {
    setEditingService(s);
    setModalMode('view');
    setIsOpen(true);
  };

  const openEdit = (s: Service) => {
    if (!canEdit) return;
    setEditingService(s);
    setModalMode('edit');
    setIsOpen(true);
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

  useEffect(() => {
    setPage(0);
  }, [searchQuery, filterGroup, filterFrequency, setPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(event.target.value, 10);
    setRowsPerPageValue(val);
    setPage(0);
  };

  const paginatedServices = sortedServices.slice(page * activeRowsPerPage, page * activeRowsPerPage + activeRowsPerPage);

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
      {canCreate && (
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, alignItems: 'center' }}>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={openNew} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {t('btnNewService')}
          </Button>
        </Box>
      )}

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('servicesListTitle', { count: sortedServices.length })}
            </Typography>
              <Tooltip title={t('btnRefresh')}>
                <span>
                  <IconButton
                    size="small"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    color="primary"
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 0.7,
                    }}
                  >
                    <RefreshIcon
                      fontSize="small"
                      sx={{
                        animation: isRefreshing ? 'spin 1s linear infinite' : undefined,
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' },
                        },
                      }}
                    />
                  </IconButton>
                </span>
              </Tooltip>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
            <TableSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
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

            {/* TABLE OPTIONS SELECTOR */}
            <TableOptionsSelector
              columns={columnDefs}
              visibleColumns={activeCols}
              onChange={setCols}
              rowsPerPageOptions={activeRowsPerPageOptions}
              onRowsPerPageOptionsChange={setRowsPerPageOptionsValue}
              rowsPerPage={activeRowsPerPage}
              onRowsPerPageChange={setRowsPerPageValue}
            />
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
                {hasAnyRowAction && <TableCell align="right">{t('colActions')}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeCols.length + (hasAnyRowAction ? 1 : 0)} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    {t('emptyServices')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedServices.map((s) => {
                  const fields = getCustomModelForService(s.id);
                  return (
                    <TableRow key={s.id} hover sx={{ cursor: 'pointer' }} onClick={() => openView(s)}>
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
                      {hasAnyRowAction && (
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            {canEdit && (
                              <>
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
                              </>
                            )}
                            {canDelete && (
                              <IconButton size="small" color="error" onClick={() => onDeleteService(s.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
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

        <TablePagination
          rowsPerPageOptions={activeRowsPerPageOptions}
          component="div"
          count={sortedServices.length}
          rowsPerPage={activeRowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      </Card>

      {/* SERVICE MODAL */}
      <ServiceModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        editingService={editingService}
        mode={modalMode}
        onModeChange={setModalMode}
        categories={categories}
        getServiceLabel={getServiceLabel}
        canDelete={canDelete}
        canEdit={canEdit}
        canCreate={canCreate}
        onDeleteService={onDeleteService}
        onSaveService={handleSave}
        onOpenCustomModelModal={(srv) => {
          setActiveModelService(srv);
          setIsCustomModelModalOpen(true);
        }}
        getCustomModelForService={getCustomModelForService}
        onError={(message) => setErrorDialogState({ open: true, message })}
      />

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
      <ConfirmDialog
        open={deleteConfirmState.open}
        title={t('confirmDeleteTitle')}
        message={deleteConfirmState.message}
        confirmLabel={t('btnDelete')}
        onConfirm={deleteConfirmState.onConfirm}
        onClose={() => setDeleteConfirmState((prev) => ({ ...prev, open: false }))}
        confirmColor="warning"
      />
    </Box>
  );
};

export default ServicesPage;
