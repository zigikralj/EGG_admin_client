import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Grid,
  TextField,
  Button,
  IconButton,
  Chip,
  Box,
  Typography,
  Divider,
  Card,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Paper,
  InputAdornment,
} from '@mui/material';
import {
  CloseIcon,
  AddIcon,
  NotificationsActiveIcon,
  PrintIcon,
  DescriptionIcon,
  FolderIcon,
  VisibilityIcon,
  EditIcon,
  SearchIcon,
} from '../icons';
import type { Client, Contract, Reminder, ContractTemplate } from '../../types';
import { ClientAutocomplete, ProjectAutocomplete, UserAutocomplete } from '../common/autocomplete';
import { ViewEditModalBase, type ModalMode } from '../common/modal/ViewEditModalBase';
import { ViewEditField } from '../common/modal/ViewEditField';
import { ContractStatusBadge } from './ContractStatusBadge';
import { TipTapEditor } from '../common/tiptap/TipTapEditor';
import { useCompanyInfoQuery, useContractTemplatesSummaryQuery } from '../../queries';
import { useLanguage } from '../../context/LanguageContext';
import { stripHtmlToText } from '../../utils/stripHtmlToText';
import { AVAILABLE_PLACEHOLDERS, resolveContractPlaceholders } from '../../utils/contractTemplatePlaceholders';

export interface StagedReminderItem {
  id: string;
  title: string;
  dueDate?: string;
  notes?: string;
}

export interface ContractModalSaveData {
  id?: string;
  contractNumber: string;
  title: string;
  clientId: string;
  clientName?: string;
  projectId?: string | null;
  projectName?: string | null;
  responsibleId?: string | null;
  responsible?: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  content: string | null;
  notes: string | null;
}

export interface ContractModalProps {
  open: boolean;
  onClose: () => void;
  editingContract: Contract | null;
  mode?: ModalMode;
  initialMode?: ModalMode;
  onModeChange?: (mode: ModalMode) => void;
  clients?: Client[];
  canEdit: boolean;
  canCreate: boolean;
  canDelete?: boolean;
  onSave: (
    data: ContractModalSaveData,
    stagedNewReminders: StagedReminderItem[],
    stagedLinkReminderIds: string[]
  ) => Promise<boolean>;
  onDelete?: (id: string) => void;
}

const EMPTY_CLIENTS: Client[] = [];

export const ContractModal: React.FC<ContractModalProps> = React.memo(({
  open,
  onClose,
  editingContract,
  mode: controlledMode,
  initialMode,
  onModeChange: onModeChangeProp,
  clients = EMPTY_CLIENTS,
  canEdit,
  canDelete,
  onSave,
  onDelete,
}) => {
  const { t } = useLanguage();

  const [internalMode, setInternalMode] = useState<ModalMode>(() => {
    if (controlledMode) return controlledMode;
    if (initialMode) return initialMode;
    return editingContract ? 'view' : 'create';
  });

  const currentMode = controlledMode || internalMode;
  const isView = currentMode === 'view';

  // Workspace tab: 'details' (Workspace 1) | 'editor' (Workspace 2)
  const [activeWorkspace, setActiveWorkspace] = useState<'details' | 'editor'>('details');

  // Right Side Panel in Editor Studio
  const [drawerSearch, setDrawerSearch] = useState('');

  // Editor instance reference for direct cursor insertions
  const editorRef = useRef<any>(null);

  const handleModeChange = (newMode: ModalMode) => {
    setInternalMode(newMode);
    onModeChangeProp?.(newMode);
  };

  useEffect(() => {
    if (open) {
      const targetMode = controlledMode || initialMode || (editingContract ? 'view' : 'create');
      setInternalMode(targetMode);
      setActiveWorkspace('details');
    }
  }, [open, editingContract?.id, initialMode, controlledMode]);

  // Lazy supporting queries (only when modal is open)
  const { data: companyInfo } = useCompanyInfoQuery(open);
  const { data: contractTemplates = [] } = useContractTemplatesSummaryQuery({ enabled: open });

  // Form states
  const [contractNumber, setContractNumber] = useState('');
  const [title, setTitle] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedClientItem, setSelectedClientItem] = useState<Client | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [responsibleId, setResponsibleId] = useState<string | null>(null);
  const [responsible, setResponsible] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('Draft');
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState('');

  // Staged manual reminders
  const [isAddingReminderInline, setIsAddingReminderInline] = useState(false);
  const [inlineReminderTitle, setInlineReminderTitle] = useState('');
  const [inlineReminderDueDate, setInlineReminderDueDate] = useState('');
  const [inlineReminderNotes, setInlineReminderNotes] = useState('');
  const [stagedNewReminders, setStagedNewReminders] = useState<StagedReminderItem[]>([]);
  const [stagedLinkReminders] = useState<Reminder[]>([]);
  const stagedLinkReminderIds = useMemo(() => stagedLinkReminders.map((r) => r.id), [stagedLinkReminders]);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const populateFromContract = useCallback((c: Contract | null) => {
    if (c) {
      setContractNumber(c.contractNumber || '');
      setTitle(c.title || '');
      setSelectedClientId(c.clientId || '');
      setSelectedClientItem(c.client || clients.find((cl) => cl.id === c.clientId) || null);
      setProjectId(c.projectId || null);
      setProjectName(c.projectName || c.project?.name || null);
      setResponsibleId(c.responsibleId || null);
      setResponsible(c.responsible || c.responsibleUser?.name || null);
      setStartDate(c.startDate ? c.startDate.slice(0, 10) : '');
      setEndDate(c.endDate ? c.endDate.slice(0, 10) : '');
      setStatus(c.status || 'Draft');
      setContent(c.content || '');
      setNotes(c.notes || '');
    } else {
      setContractNumber('');
      setTitle('');
      setSelectedClientId('');
      setSelectedClientItem(null);
      setProjectId(null);
      setProjectName(null);
      setResponsibleId(null);
      setResponsible(null);
      setStartDate(new Date().toISOString().slice(0, 10));
      setEndDate('');
      setStatus('Draft');
      setContent('');
      setNotes('');
    }
    setIsAddingReminderInline(false);
    setStagedNewReminders([]);
    setErrorMsg('');
  }, [clients]);

  useEffect(() => {
    if (open) {
      populateFromContract(editingContract);
    }
  }, [open, editingContract?.id, populateFromContract]);

  // Selected client details
  const currentClient = useMemo(() => {
    if (selectedClientItem) return selectedClientItem;
    if (selectedClientId) return clients.find((c) => c.id === selectedClientId) || null;
    return null;
  }, [selectedClientItem, selectedClientId, clients]);

  // TODO: Replace placeholder client legal details (PIB, MB, street address) once the backend schema
  // and clients table are expanded to include official company registration and fiscal fields.
  const clientCompanyDetails = useMemo(() => {
    const name = currentClient?.name || editingContract?.clientName;
    if (!name && !currentClient) return null;

    // Use actual client fields if available, otherwise generate consistent deterministic placeholder values based on ID / name
    const seed = (currentClient?.id || name || 'client')
      .split('')
      .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 100000000, 10839214);

    const pib = (currentClient as any)?.taxId || `10${String(seed).slice(0, 7).padStart(7, '4')}`;
    const mb = (currentClient as any)?.registrationNumber || `08${String(seed).slice(0, 6).padStart(6, '2')}`;
    const address = (currentClient as any)?.streetAddress || `Bulevar oslobođenja ${((seed % 150) + 1)}`;
    const city = currentClient?.city || 'Beograd';
    const contactPerson = currentClient?.contactPerson || null;
    const email = currentClient?.email || `kontakt@${(name || 'klijent').toLowerCase().replace(/[^a-z0-9]/g, '') || 'klijent'}.rs`;
    const phone = currentClient?.phone || `+381 11 ${(seed % 900) + 100} ${(seed % 9000) + 1000}`;

    return {
      pib,
      mb,
      address,
      city,
      contactPerson,
      email,
      phone,
    };
  }, [currentClient, editingContract?.clientName]);

  // Context for template placeholder injection
  const placeholderContext = useMemo(() => ({
    ekos: companyInfo || undefined,
    client: currentClient || undefined,
    contract: {
      contractNumber,
      title,
      startDate,
      endDate,
    },
  }), [companyInfo, currentClient, contractNumber, title, startDate, endDate]);

  // Auto 45-day calculated reminder date
  const autoReminderDate = useMemo(() => {
    if (!endDate) return null;
    try {
      const match = endDate.split('T')[0];
      const dateObj = new Date(match);
      if (isNaN(dateObj.getTime())) return null;
      const reminderDateObj = new Date(dateObj.getTime() - 45 * 24 * 60 * 60 * 1000);
      return reminderDateObj.toISOString().slice(0, 10);
    } catch {
      return null;
    }
  }, [endDate]);

  // Document Content Metrics
  const docMetrics = useMemo(() => {
    const rawText = stripHtmlToText(content || '').trim();
    const words = rawText ? rawText.split(/\s+/).length : 0;
    const chars = rawText.length;
    const hasContent = rawText.length > 0;
    return { rawText, words, chars, hasContent };
  }, [content]);

  const handlePrint = () => {
    window.print();
  };

  const handleInsertPlaceholder = (placeholderKey: string) => {
    if (editorRef.current) {
      editorRef.current.chain().focus().insertContent(` ${placeholderKey} `).run();
    } else {
      setContent((prev) => `${prev} ${placeholderKey} `);
    }
  };

  const handleInsertTemplate = (tpl: ContractTemplate) => {
    if (!editorRef.current) return;
    const resolvedHtml = resolveContractPlaceholders(tpl.content, placeholderContext);
    const wrappedHtml = `<div data-contract-template-block="true" data-template-id="${tpl.id}" data-template-name="${tpl.name}">${resolvedHtml}</div>`;
    editorRef.current.chain().focus().insertContent(wrappedHtml).run();
  };

  const handleAddStagedReminder = () => {
    if (!inlineReminderTitle.trim()) {
      setErrorMsg(t('errReminderTitleRequired'));
      return;
    }
    setStagedNewReminders((prev) => [
      ...prev,
      {
        id: `staged_${Date.now()}_${Math.random()}`,
        title: inlineReminderTitle.trim(),
        dueDate: inlineReminderDueDate || undefined,
        notes: inlineReminderNotes.trim() || undefined,
      },
    ]);
    setInlineReminderTitle('');
    setInlineReminderDueDate('');
    setInlineReminderNotes('');
    setIsAddingReminderInline(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isView) return;
    if (!contractNumber.trim()) {
      setErrorMsg(t('errContractNumberRequired'));
      setActiveWorkspace('details');
      return;
    }
    if (!title.trim()) {
      setErrorMsg(t('errContractTitleRequired'));
      setActiveWorkspace('details');
      return;
    }
    if (!selectedClientId) {
      setErrorMsg(t('errContractClientRequired'));
      setActiveWorkspace('details');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      const success = await onSave(
        {
          id: editingContract?.id,
          contractNumber: contractNumber.trim(),
          title: title.trim(),
          clientId: selectedClientId,
          clientName: currentClient?.name,
          projectId: projectId || null,
          projectName: projectName || null,
          responsibleId: responsibleId || null,
          responsible: responsible || null,
          startDate: startDate || null,
          endDate: endDate || null,
          status,
          content: content || null,
          notes: notes.trim() || null,
        },
        stagedNewReminders,
        stagedLinkReminderIds
      );

      if (success) {
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || t('errSaveContract'));
    } finally {
      setIsSaving(false);
    }
  };

  // Filter templates in drawer
  const filteredTemplates = useMemo(() => {
    if (!drawerSearch.trim()) return contractTemplates;
    const q = drawerSearch.toLowerCase();
    return contractTemplates.filter(
      (tpl) =>
        tpl.name.toLowerCase().includes(q) ||
        tpl.category.toLowerCase().includes(q) ||
        (tpl.description && tpl.description.toLowerCase().includes(q))
    );
  }, [contractTemplates, drawerSearch]);

  // Header workspace switcher
  const headerSwitcher = (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={activeWorkspace}
      onChange={(_, val) => {
        if (val) setActiveWorkspace(val);
      }}
      sx={{
        bgcolor: 'action.hover',
        borderRadius: 2,
        p: 0.25,
        border: '1px solid',
        borderColor: 'divider',
        '& .MuiToggleButton-root': {
          px: 1.5,
          py: 0.5,
          border: 0,
          borderRadius: 1.5,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.8rem',
          gap: 0.75,
          '&.Mui-selected': {
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          },
        },
      }}
    >
      <ToggleButton value="details">
        <FolderIcon sx={{ fontSize: 16 }} />
        {t('contractTabDetails')}
      </ToggleButton>
      <ToggleButton value="editor">
        <DescriptionIcon sx={{ fontSize: 16 }} />
        {t('contractTabDocument')}
        {docMetrics.hasContent && (
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              bgcolor: activeWorkspace === 'editor' ? '#fff' : 'primary.main',
            }}
          />
        )}
      </ToggleButton>
    </ToggleButtonGroup>
  );

  return (
    <ViewEditModalBase
      open={open}
      onClose={onClose}
      mode={currentMode}
      onModeChange={handleModeChange}
      canEdit={canEdit}
      canDelete={canDelete}
      isSaving={isSaving}
      title={
        editingContract
          ? `${editingContract.contractNumber} — ${editingContract.title}`
          : t('modalNewContract')
      }
      onSave={handleSubmit}
      onDelete={editingContract && onDelete ? () => onDelete(editingContract.id) : undefined}
      dialogProps={{ fullScreen: true }}
      maxWidth={false}
      height="100vh"
      maxHeight="100vh"
      paperSx={{ borderRadius: 0, m: 0, width: '100vw', height: '100vh', maxHeight: '100vh' }}
      contentSx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      statusChip={
        editingContract && (
          <ContractStatusBadge status={editingContract.status} endDate={editingContract.endDate} />
        )
      }
      extraHeaderActions={headerSwitcher}
    >
      {/* Workspace 1: Contract Details Dashboard */}
      {activeWorkspace === 'details' && (
        <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, sm: 2.5, md: 3 } }}>
          <Box sx={{ maxWidth: 1400, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {errorMsg && (
              <Typography variant="body2" color="error" sx={{ fontWeight: 600 }}>
                {errorMsg}
              </Typography>
            )}

            {/* Contracting Parties Banner */}
            <Card
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'primary.light',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', display: 'block', mb: 1.5, letterSpacing: 0.5 }}>
                {t('contractPartiesTitle')}
              </Typography>
              <Grid container spacing={2}>
                {/* Party 1: Ekos */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {isView ? (
                      <>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {companyInfo?.legalName || 'EKOS GREEN GROUP DOO Kraljevo'}
                        </Typography>
                        <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            PIB: {companyInfo?.taxId || '113207057'} • MB: {companyInfo?.registrationNumber || '21823759'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Adresa: {companyInfo?.streetAddress || 'Heroja Maričića 18'}, {companyInfo?.city || 'Kraljevo'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Email: {companyInfo?.email || 'office@ekosgroup.rs'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Telefon: {(companyInfo as any)?.phone || '+381 36 331 880'}
                          </Typography>
                        </Box>
                      </>
                    ) : (
                      <>
                        <TextField
                          fullWidth
                          size="small"
                          value={companyInfo?.legalName || 'EKOS GREEN GROUP DOO Kraljevo'}
                          label={companyInfo?.name || 'EKOS GREEN GROUP'}
                          slotProps={{
                            input: {
                              readOnly: true,
                              sx: { bgcolor: 'action.hover', fontWeight: 600, fontSize: '0.875rem' },
                            },
                          }}
                        />
                        <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            PIB: {companyInfo?.taxId || '113207057'} • MB: {companyInfo?.registrationNumber || '21823759'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Adresa: {companyInfo?.streetAddress || 'Heroja Maričića 18'}, {companyInfo?.city || 'Kraljevo'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Email: {companyInfo?.email || 'office@ekosgroup.rs'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Telefon: {(companyInfo as any)?.phone || '+381 36 331 880'}
                          </Typography>
                        </Box>
                      </>
                    )}
                  </Box>
                </Grid>

                {/* Party 2: Client */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {isView ? (
                      <>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {currentClient?.name || editingContract?.clientName || '-'}
                        </Typography>
                        {clientCompanyDetails && (
                          <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              PIB: {clientCompanyDetails.pib} • MB: {clientCompanyDetails.mb}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Adresa: {clientCompanyDetails.address}, {clientCompanyDetails.city}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Email: {clientCompanyDetails.email}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Telefon: {clientCompanyDetails.phone}
                            </Typography>
                          </Box>
                        )}
                      </>
                    ) : (
                      <>
                        <ClientAutocomplete
                          value={selectedClientId}
                          onChange={(clientId) => {
                            setSelectedClientId(clientId || '');
                            const found = clients.find((c) => c.id === clientId) || null;
                            setSelectedClientItem(found);
                          }}
                          required
                          label={t('phSelectClient')}
                        />
                        {clientCompanyDetails && (
                          <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              PIB: {clientCompanyDetails.pib} • MB: {clientCompanyDetails.mb}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Adresa: {clientCompanyDetails.address}, {clientCompanyDetails.city}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Email: {clientCompanyDetails.email}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Telefon: {clientCompanyDetails.phone}
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Card>

            {/* Two-Column Details Layout */}
            <Grid container spacing={2.5}>
              {/* Left Column (7/12): Contract Core Metadata, Project, Responsible & Internal Notes */}
              <Grid size={{ xs: 12, lg: 7 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Core Metadata Card */}
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary' }}>
                      {t('contractCoreMetadata')}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <ViewEditField
                          mode={currentMode}
                          label={t('colContractNumber')}
                          value={contractNumber}
                        >
                          <TextField
                            fullWidth
                            size="small"
                            label={t('colContractNumber')}
                            required
                            value={contractNumber}
                            onChange={(e) => setContractNumber(e.target.value)}
                            placeholder={t('phContractNumber')}
                          />
                        </ViewEditField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <ViewEditField
                          mode={currentMode}
                          label={t('colStatus')}
                          value={<ContractStatusBadge status={status} endDate={endDate} />}
                        >
                          <FormControl fullWidth size="small">
                            <InputLabel>{t('colStatus')}</InputLabel>
                            <Select value={status} label={t('colStatus')} onChange={(e) => setStatus(e.target.value)}>
                              <MenuItem value="Draft">{t('contractStatusDraft')}</MenuItem>
                              <MenuItem value="Active">{t('contractStatusActive')}</MenuItem>
                              <MenuItem value="Terminated">{t('contractStatusTerminated')}</MenuItem>
                              <MenuItem value="Expired">{t('contractStatusExpired')}</MenuItem>
                            </Select>
                          </FormControl>
                        </ViewEditField>
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <ViewEditField
                          mode={currentMode}
                          label={t('colContractSubject')}
                          value={title}
                        >
                          <TextField
                            fullWidth
                            size="small"
                            label={t('colContractSubject')}
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t('phContractTitle')}
                          />
                        </ViewEditField>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <ViewEditField
                          mode={currentMode}
                          label={t('colStartDate')}
                          value={startDate || '-'}
                        >
                          <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label={t('colStartDate')}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                          />
                        </ViewEditField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <ViewEditField
                          mode={currentMode}
                          label={t('colEndDate')}
                          value={endDate || t('contractIndefinite')}
                        >
                          <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label={t('colEndDate')}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                          />
                        </ViewEditField>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <ViewEditField
                          mode={currentMode}
                          label={t('colProject')}
                          value={projectName || '-'}
                        >
                          <ProjectAutocomplete
                            clientId={selectedClientId}
                            value={projectId || ''}
                            onChange={(pId, opt) => {
                              setProjectId(pId || null);
                              setProjectName((opt as any)?.name || null);
                            }}
                            label={t('colProject')}
                          />
                        </ViewEditField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <ViewEditField
                          mode={currentMode}
                          label={t('lblResponsiblePerson')}
                          value={responsible || '-'}
                        >
                          <UserAutocomplete
                            value={responsible || ''}
                            onChange={(usrName, opt) => {
                              setResponsible(usrName || null);
                              setResponsibleId((opt as any)?.id || null);
                            }}
                            label={t('lblResponsiblePerson')}
                          />
                        </ViewEditField>
                      </Grid>
                    </Grid>
                  </Card>

                  {/* Internal Notes Card */}
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
                      {t('lblContractInternalNotes')}
                    </Typography>
                    <ViewEditField
                      mode={currentMode}
                      label={t('lblContractInternalNotes')}
                      value={notes || '-'}
                    >
                      <TextField
                        fullWidth
                        multiline
                        label={t('lblContractInternalNotes')}
                        minRows={3}
                        maxRows={6}
                        size="small"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t('phContractInternalNotes')}
                      />
                    </ViewEditField>
                  </Card>
                </Box>
              </Grid>

              {/* Right Column (5/12): Document Summary Card & Reminders */}
              <Grid size={{ xs: 12, lg: 5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Document Summary Card */}
                  <Card
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                      border: '1px solid',
                      borderColor: docMetrics.hasContent ? 'primary.light' : 'divider',
                      bgcolor: docMetrics.hasContent ? 'action.hover' : 'background.paper',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DescriptionIcon color={docMetrics.hasContent ? 'primary' : 'action'} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {t('contractDocSummaryTitle')}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={docMetrics.hasContent ? t('contractDocPopulated') : t('contractDocEmpty')}
                        color={docMetrics.hasContent ? 'primary' : 'default'}
                        variant={docMetrics.hasContent ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                      />
                    </Box>

                    {/* Stats & Snippet */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {t('contractDocWords', { count: docMetrics.words })} • {t('contractDocChars', { count: docMetrics.chars })}
                      </Typography>
                    </Box>

                    {/* Text Preview Snippet Box */}
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        bgcolor: 'background.paper',
                        maxHeight: 110,
                        overflow: 'hidden',
                        fontFamily: '"Times New Roman", Times, serif',
                        fontSize: '0.85rem',
                        lineHeight: 1.4,
                        color: docMetrics.hasContent ? 'text.primary' : 'text.disabled',
                        fontStyle: docMetrics.hasContent ? 'normal' : 'italic',
                      }}
                    >
                      {docMetrics.hasContent
                        ? `${docMetrics.rawText.slice(0, 220)}...`
                        : t('contractDocEmpty')}
                    </Paper>

                    {/* Document Launch Action Buttons */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', pt: 0.5 }}>
                      {isView ? (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<VisibilityIcon fontSize="small" />}
                            onClick={() => setActiveWorkspace('editor')}
                            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
                          >
                            {t('btnPreviewDocument')}
                          </Button>
                          {canEdit && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              startIcon={<EditIcon fontSize="small" />}
                              onClick={() => {
                                handleModeChange('edit');
                                setActiveWorkspace('editor');
                              }}
                              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
                            >
                              {t('btnEditDocument')}
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<EditIcon fontSize="small" />}
                          onClick={() => setActiveWorkspace('editor')}
                          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
                        >
                          {t('btnEditDocument')}
                        </Button>
                      )}

                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PrintIcon fontSize="small" />}
                        onClick={handlePrint}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5, ml: 'auto' }}
                      >
                        {t('btnPrintPdfA4')}
                      </Button>
                    </Box>
                  </Card>

                  {/* Linked Reminders Card */}
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NotificationsActiveIcon color="action" fontSize="small" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {t('contractRemindersTitle')}
                        </Typography>
                      </Box>
                      {!isView && !isAddingReminderInline && (
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => setIsAddingReminderInline(true)}
                          sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }}
                        >
                          {t('btnAddManualReminder')}
                        </Button>
                      )}
                    </Box>

                    {/* Auto 45-day Reminder Indicator */}
                    <Box
                      sx={{
                        p: 1.25,
                        borderRadius: 1.5,
                        bgcolor: autoReminderDate ? 'primary.50' : 'action.hover',
                        border: '1px solid',
                        borderColor: autoReminderDate ? 'primary.light' : 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <NotificationsActiveIcon color={autoReminderDate ? 'primary' : 'disabled'} fontSize="small" />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                          {t('contractAutoReminder45dTitle')}
                        </Typography>
                        <Typography variant="caption" color={autoReminderDate ? 'primary.dark' : 'text.secondary'} sx={{ fontWeight: 600 }}>
                          {autoReminderDate
                            ? t('contractAutoReminderActive', { date: autoReminderDate })
                            : t('contractAutoReminderNoDate')}
                        </Typography>
                      </Box>
                    </Box>

                    {/* List of manual reminders */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {editingContract?.reminders?.filter((r) => !r.isAutoContractReminder).map((rem) => (
                        <Box key={rem.id} sx={{ p: 1, borderRadius: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {rem.title}
                          </Typography>
                          <Chip size="small" label={rem.dueDate || '-'} variant="outlined" />
                        </Box>
                      ))}

                      {/* Staged new reminders */}
                      {stagedNewReminders.map((rem) => (
                        <Box key={rem.id} sx={{ p: 1, borderRadius: 1.5, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.light', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip size="small" label="Novi" color="warning" sx={{ fontWeight: 700, fontSize: '0.68rem' }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {rem.title}
                            </Typography>
                          </Box>
                          <IconButton size="small" onClick={() => setStagedNewReminders((prev) => prev.filter((r) => r.id !== rem.id))}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}

                      {/* Inline Add Reminder Form */}
                      {isAddingReminderInline && (
                        <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 1.5, mb: 1 }}>
                            <TextField
                              size="small"
                              label={t('lblReminderTitle')}
                              value={inlineReminderTitle}
                              onChange={(e) => setInlineReminderTitle(e.target.value)}
                              required
                            />
                            <TextField
                              size="small"
                              type="date"
                              label={t('colDueDate')}
                              value={inlineReminderDueDate}
                              onChange={(e) => setInlineReminderDueDate(e.target.value)}
                              slotProps={{ inputLabel: { shrink: true } }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Button size="small" onClick={() => setIsAddingReminderInline(false)} color="inherit">
                              {t('btnCancel')}
                            </Button>
                            <Button size="small" variant="contained" onClick={handleAddStagedReminder}>
                              {t('btnAddReminder')}
                            </Button>
                          </Box>
                        </Card>
                      )}
                    </Box>
                  </Card>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      )}

      {/* Workspace 2: Dedicated Full-Height Document Editor Studio */}
      {activeWorkspace === 'editor' && (
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
          {/* Main Editor Center Canvas */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
            <TipTapEditor
              value={content}
              onChange={setContent}
              readOnly={isView}
              a4PageMode
              fullHeight
              onEditorReady={(ed) => {
                editorRef.current = ed;
              }}
              contractTemplates={contractTemplates}
              contractContext={placeholderContext}
              autoSaveEnabled={false}
              onPrint={handlePrint}
            />
          </Box>

          {/* Permanent Right Side Panel: Live Context, Dynamic Placeholders, Boilerplates */}
          <Box
            sx={{
              width: { xs: 280, sm: 340 },
              flexShrink: 0,
              borderLeft: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            {/* Panel Content */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Live Context Summary Card */}
                <Card variant="outlined" sx={{ p: 1.25, borderRadius: 1.5, bgcolor: 'action.hover' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                    {t('sidebarContractContext').toUpperCase()}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    <strong>{t('colContractNumber')}:</strong> {contractNumber || '—'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    <strong>{t('colContractSubject')}:</strong> {title || '—'}
                  </Typography>
                  <Divider sx={{ my: 0.75 }} />
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    <strong>{t('colClient')}:</strong> {currentClient?.name || editingContract?.clientName || '—'}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    <strong>{t('colStartDate')}:</strong> {startDate || '—'} • <strong>{t('colEndDate')}:</strong> {endDate || t('contractIndefinite')}
                  </Typography>
                </Card>

                {/* Dynamic Variables Section */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    {t('sidebarDynamicVariables').toUpperCase()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    {t('sidebarInsertAtCursor')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                    {AVAILABLE_PLACEHOLDERS.map((ph) => (
                      <Tooltip key={ph.key} title={`${ph.label}: ${resolveContractPlaceholders(ph.key, placeholderContext)}`}>
                        <Chip
                          size="small"
                          label={ph.label}
                          onClick={() => handleInsertPlaceholder(ph.key)}
                          clickable={!isView}
                          variant="outlined"
                          color={ph.category === 'ekos' ? 'primary' : ph.category === 'client' ? 'secondary' : 'default'}
                          sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                        />
                      </Tooltip>
                    ))}
                  </Box>
                </Box>

                <Divider />

                {/* Templates & Clauses Section */}
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                    {t('sidebarTemplatesAndClauses').toUpperCase()}
                  </Typography>
                  <TextField
                    size="small"
                    placeholder={t('phSearchTemplates')}
                    value={drawerSearch}
                    onChange={(e) => setDrawerSearch(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{ mb: 1 }}
                  />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {filteredTemplates.map((tpl) => (
                      <Paper
                        key={tpl.id}
                        variant="outlined"
                        onClick={() => !isView && handleInsertTemplate(tpl)}
                        sx={{
                          p: 1.25,
                          borderRadius: 1.5,
                          cursor: isView ? 'default' : 'pointer',
                          transition: 'all 0.15s ease-in-out',
                          '&:hover': isView
                            ? {}
                            : {
                                borderColor: 'primary.main',
                                bgcolor: 'action.hover',
                              },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {tpl.name}
                          </Typography>
                          <Chip size="small" label={tpl.category} sx={{ fontSize: '0.65rem', height: 18 }} />
                        </Box>
                        {tpl.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {tpl.description}
                          </Typography>
                        )}
                      </Paper>
                    ))}
                    {filteredTemplates.length === 0 && (
                      <Typography variant="caption" color="text.secondary" align="center" sx={{ py: 2 }}>
                        {t('emptyTemplates')}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
    </ViewEditModalBase>
  );
});

export default ContractModal;
