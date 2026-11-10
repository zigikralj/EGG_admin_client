import React, { useState, useMemo } from 'react';
import {
  Card,
  TablePagination,
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  VisibilityIcon,
  DescriptionIcon,
  NotificationsActiveIcon,
  FolderIcon,
} from '../../components/icons';
import {
  usePaginatedContractsQuery,
  useContractsMutations,
  usePaginatedContractTemplatesQuery,
  useContractTemplatesMutations,
  useClientsSummaryQuery,
  useTablePreferences,
  useRemindersMutations,
} from '../../queries';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { TableSearchInput } from '../../components/common/TableSearchInput';
import { TableQuickFilters, type QuickFilterItem } from '../../components/common/TableQuickFilters';
import { DateRangeFilter } from '../../components/common/DateRangeFilter';
import { ErrorDialog } from '../../components/common/dialogs/ErrorDialog';
import { ConfirmDeleteDialog } from '../../components/common/dialogs/ConfirmDeleteDialog';
import { ContractModal, type ContractModalSaveData, type StagedReminderItem } from '../../components/contract/ContractModal';
import { ContractTemplateModal } from '../../components/contract/ContractTemplateModal';
import { ContractStatusBadge } from '../../components/contract/ContractStatusBadge';
import type { ModalMode } from '../../components/common/modal/ViewEditModalBase';
import type { Contract, ContractTemplate } from '../../types';

export const ContractsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { t } = useLanguage();

  const canCreate = hasPermission('contracts', 'create');
  const canEdit = hasPermission('contracts', 'edit');
  const canDelete = hasPermission('contracts', 'delete');

  // Subtab: 0 = Contracts, 1 = Templates / Boilerplate
  const [subTab, setSubTab] = useState<number>(0);

  // Table Preferences & Pagination
  const tablePrefs = useTablePreferences('contracts');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(tablePrefs.rowsPerPage || 25);
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals state
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractModalMode, setContractModalMode] = useState<ModalMode>('create');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateModalMode, setTemplateModalMode] = useState<ModalMode>('create');
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);

  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    open: boolean;
    title?: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, message: '', onConfirm: () => {} });

  const [errorDialogState, setErrorDialogState] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  // Queries
  const { data: contractsData, isLoading: isContractsLoading } = usePaginatedContractsQuery(
    { page, rowsPerPage, searchQuery: search },
    {
      status: quickFilter,
      dateFrom,
      dateTo,
      dateField: 'endDate',
    },
    { enabled: subTab === 0 }
  );

  const { data: templatesData, isLoading: isTemplatesLoading } = usePaginatedContractTemplatesQuery(
    { page, rowsPerPage, searchQuery: search },
    {},
    { enabled: subTab === 1 }
  );

  const { data: clients = [] } = useClientsSummaryQuery({ enabled: isContractModalOpen });

  // Mutations
  const { handleSave: saveContract, handleDelete: deleteContract } = useContractsMutations();
  const { handleSave: saveTemplate, handleDelete: deleteTemplate } = useContractTemplatesMutations();
  const { handleSave: saveReminder } = useRemindersMutations();

  const contractsList = contractsData?.items || [];
  const contractsTotal = contractsData?.total || 0;

  const templatesList = templatesData?.items || [];
  const templatesTotal = templatesData?.total || 0;

  const quickFilterItems: QuickFilterItem[] = useMemo(
    () => [
      { key: 'all', label: t('quickFilterAllContracts') },
      { key: 'active', label: t('quickFilterActive') },
      { key: 'expiring', label: t('quickFilterExpiringContracts') },
      { key: 'expired', label: t('quickFilterExpiredContracts') },
      { key: 'draft', label: t('quickFilterDraftContracts') },
    ],
    [t]
  );

  const handleOpenCreateContract = () => {
    setSelectedContract(null);
    setContractModalMode('create');
    setIsContractModalOpen(true);
  };

  const handleOpenViewContract = (c: Contract) => {
    setSelectedContract(c);
    setContractModalMode('view');
    setIsContractModalOpen(true);
  };

  const handleOpenEditContract = (c: Contract) => {
    setSelectedContract(c);
    setContractModalMode('edit');
    setIsContractModalOpen(true);
  };

  const handleDeleteContractClick = (c: Contract) => {
    setDeleteConfirmState({
      open: true,
      title: t('confirmDeleteContractTitle'),
      message: t('confirmDeleteContractMsg').replace('{name}', `${c.contractNumber} — ${c.title}`),
      onConfirm: async () => {
        deleteContract(c.id);
        setDeleteConfirmState({ open: false, message: '', onConfirm: () => {} });
      },
    });
  };

  const handleSaveContractModal = async (
    data: ContractModalSaveData,
    stagedNewReminders: StagedReminderItem[],
    stagedLinkReminderIds: string[]
  ): Promise<boolean> => {
    const res = await saveContract(data as any);
    if (!res.success) {
      setErrorDialogState({ open: true, message: res.error || t('errSaveContract') });
      return false;
    }

    const savedId = data.id || res.id;
    if (savedId) {
      // Save staged manual reminders
      for (const r of stagedNewReminders) {
        await saveReminder({
          title: r.title,
          dueDate: r.dueDate || null,
          notes: r.notes || null,
          contractId: savedId,
          contractNumber: data.contractNumber,
          clientId: data.clientId,
          clientName: data.clientName,
          status: 'Pending',
        });
      }

      for (const linkId of stagedLinkReminderIds) {
        await saveReminder({
          id: linkId,
          contractId: savedId,
          contractNumber: data.contractNumber,
          clientId: data.clientId,
          clientName: data.clientName,
        });
      }
    }

    setIsContractModalOpen(false);
    return true;
  };

  const handleSaveTemplateModal = async (data: Partial<ContractTemplate>): Promise<boolean> => {
    const res = await saveTemplate(data);
    if (!res.success) {
      setErrorDialogState({ open: true, message: res.error || t('errSaveTemplate') });
      return false;
    }
    setIsTemplateModalOpen(false);
    return true;
  };

  return (
    <Box sx={{ width: '100%', py: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header and SubTabs */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('contractsAndTemplates')}
          </Typography>
          <Chip
            size="small"
            color="primary"
            label={subTab === 0 ? `${contractsTotal} ${t('contractsCount')}` : `${templatesTotal} ${t('templatesCount')}`}
            sx={{ fontWeight: 700 }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {subTab === 0 && canCreate && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateContract}
              size="small"
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
            >
              {t('btnNewContract')}
            </Button>
          )}
          {subTab === 1 && canCreate && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedTemplate(null);
                setTemplateModalMode('create');
                setIsTemplateModalOpen(true);
              }}
              size="small"
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
            >
              {t('btnNewTemplate')}
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs navigation */}
      <Tabs
        value={subTab}
        onChange={(_, val) => {
          setSubTab(val);
          setPage(0);
          setSearch('');
        }}
        sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 38 }}
      >
        <Tab
          label={t('tabContracts')}
          icon={<FolderIcon fontSize="small" />}
          iconPosition="start"
          sx={{ minHeight: 38, textTransform: 'none', fontWeight: 600 }}
        />
        <Tab
          label={t('tabTemplates')}
          icon={<DescriptionIcon fontSize="small" />}
          iconPosition="start"
          sx={{ minHeight: 38, textTransform: 'none', fontWeight: 600 }}
        />
      </Tabs>

      {/* SubTab 0: Contracts Table */}
      {subTab === 0 && (
        <Card variant="outlined" sx={{ borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
          {/* Controls bar */}
          <Box
            sx={{
              p: 1.5,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1.5,
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <TableQuickFilters
              options={quickFilterItems}
              selectedKeys={[quickFilter]}
              onChange={(keys) => {
                const next = keys[keys.length - 1] || 'all';
                setQuickFilter(next);
                setPage(0);
              }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <DateRangeFilter
                startDate={dateFrom}
                endDate={dateTo}
                onDateChange={({ startDate, endDate }) => {
                  setDateFrom(startDate);
                  setDateTo(endDate);
                  setPage(0);
                }}
              />
              <TableSearchInput
                value={search}
                onChange={(val) => {
                  setSearch(val);
                  setPage(0);
                }}
                placeholder={t('phSearchContracts')}
              />
            </Box>
          </Box>

          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 700 }}>{t('colContractNumber')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('colContractSubject')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('colClient')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('colStartDate')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('colEndDate')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('colStatus')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('colReminders')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{t('colActions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contractsList.map((c) => {
                  const autoReminder = c.reminders?.find((r) => r.isAutoContractReminder);
                  const manualRemindersCount = (c.reminders?.length || 0) - (autoReminder ? 1 : 0);

                  return (
                    <TableRow key={c.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{c.contractNumber}</TableCell>
                      <TableCell>{c.title}</TableCell>
                      <TableCell>{c.clientName}</TableCell>
                      <TableCell>{c.startDate ? c.startDate.slice(0, 10) : '-'}</TableCell>
                      <TableCell>{c.endDate ? c.endDate.slice(0, 10) : t('contractIndefinite')}</TableCell>
                      <TableCell>
                        <ContractStatusBadge status={c.status} endDate={c.endDate} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                          {autoReminder && (
                            <Tooltip title={`${t('contractAutoReminderScheduled')}${autoReminder.dueDate}`}>
                              <Chip
                                size="small"
                                color="primary"
                                variant="outlined"
                                icon={<NotificationsActiveIcon sx={{ fontSize: '13px !important' }} />}
                                label="45d"
                                sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                              />
                            </Tooltip>
                          )}
                          {manualRemindersCount > 0 && (
                            <Chip
                              size="small"
                              variant="outlined"
                              label={`+${manualRemindersCount}`}
                              sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={t('tooltipViewContract')}>
                          <IconButton size="small" onClick={() => handleOpenViewContract(c)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {canEdit && (
                          <Tooltip title={t('tooltipEditContract')}>
                            <IconButton size="small" onClick={() => handleOpenEditContract(c)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canDelete && (
                          <Tooltip title={t('tooltipDeleteContract')}>
                            <IconButton size="small" color="error" onClick={() => handleDeleteContractClick(c)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {contractsList.length === 0 && !isContractsLoading && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      {t('emptyContracts')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={contractsTotal}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[15, 25, 50]}
          />
        </Card>
      )}

      {/* SubTab 1: Templates & Boilerplate Table */}
      {subTab === 1 && (
        <Card variant="outlined" sx={{ borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <TableSearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(0);
              }}
              placeholder={t('phSearchTemplates')}
            />
          </Box>

          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 700 }}>{t('colTemplateName')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('colCategory')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('colTemplateDescription')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{t('colActions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templatesList.map((tpl) => (
                  <TableRow key={tpl.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{tpl.name}</TableCell>
                    <TableCell>
                      <Chip size="small" label={tpl.category} sx={{ fontWeight: 600, fontSize: '0.72rem' }} />
                    </TableCell>
                    <TableCell>{tpl.description || '-'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title={t('tooltipViewContract')}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedTemplate(tpl);
                            setTemplateModalMode('view');
                            setIsTemplateModalOpen(true);
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canEdit && (
                        <Tooltip title={t('tooltipEditTemplate')}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedTemplate(tpl);
                              setTemplateModalMode('edit');
                              setIsTemplateModalOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title={t('tooltipDeleteTemplate')}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setDeleteConfirmState({
                                open: true,
                                title: t('confirmDeleteTemplateTitle'),
                                message: t('confirmDeleteTemplateMsg').replace('{name}', tpl.name),
                                onConfirm: () => {
                                  deleteTemplate(tpl.id);
                                  setDeleteConfirmState({ open: false, message: '', onConfirm: () => {} });
                                },
                              });
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {templatesList.length === 0 && !isTemplatesLoading && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      {t('emptyTemplates')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={templatesTotal}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[15, 25, 50]}
          />
        </Card>
      )}

      {/* Contract Modal (View / Edit / Create) */}
      {isContractModalOpen && (
        <ContractModal
          open={isContractModalOpen}
          onClose={() => setIsContractModalOpen(false)}
          editingContract={selectedContract}
          mode={contractModalMode}
          onModeChange={setContractModalMode}
          clients={clients}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
          onSave={handleSaveContractModal}
          onDelete={(id) => {
            deleteContract(id);
            setIsContractModalOpen(false);
          }}
        />
      )}

      {/* Contract Template Modal */}
      {isTemplateModalOpen && (
        <ContractTemplateModal
          open={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          editingTemplate={selectedTemplate}
          mode={templateModalMode}
          onModeChange={setTemplateModalMode}
          canEdit={canEdit}
          canDelete={canDelete}
          onSave={handleSaveTemplateModal}
          onDelete={(id) => {
            deleteTemplate(id);
            setIsTemplateModalOpen(false);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteConfirmState.open}
        title={deleteConfirmState.title}
        message={deleteConfirmState.message}
        onConfirm={deleteConfirmState.onConfirm}
        onClose={() => setDeleteConfirmState({ open: false, message: '', onConfirm: () => {} })}
      />

      {/* Error Dialog */}
      <ErrorDialog
        open={errorDialogState.open}
        message={errorDialogState.message}
        onClose={() => setErrorDialogState({ open: false, message: '' })}
      />
    </Box>
  );
};

export default ContractsPage;
