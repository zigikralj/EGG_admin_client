import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Grid,
  TextField,
  Button,
  IconButton,
  Chip,
  Box,
  Typography,
  Autocomplete,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Card,
} from '@mui/material';
import {
  CloseIcon,
  DeleteIcon,
  AddIcon,
  NotificationsActiveIcon,
  CalendarTodayIcon,
  LinkIcon,
  LinkOffIcon,
  EditIcon,
} from '../icons';
import {
  PERMIT_TYPE_OPTIONS,
  type Client,
  type Permit,
  type PermitType,
  type Reminder,
  type WasteCatalog,
} from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { WasteCatalogAutocomplete } from '../common/WasteCatalogAutocomplete';
import { ErrorDialog } from '../common/dialogs/ErrorDialog';
import { useRemindersQuery } from '../../queries';
import { ClientAutocomplete, ReminderAutocomplete } from '../common/autocomplete';
import { ViewEditModalBase, type ModalMode } from '../common/modal/ViewEditModalBase';
import { ViewEditField } from '../common/modal/ViewEditField';
import { PermitStatusBadge } from './PermitStatusBadge';

export interface StagedReminderItem {
  id: string;
  title: string;
  dueDate?: string;
  notes?: string;
}

export interface PermitModalSaveData {
  id?: string;
  permitNumber: string;
  permitTypes: PermitType[];
  wasteCatalogIds: string[];
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  clientId: string | null;
}

export interface PermitModalProps {
  open: boolean;
  onClose: () => void;
  editingPermit: Permit | null;
  mode?: ModalMode;
  initialMode?: ModalMode;
  onModeChange?: (mode: ModalMode) => void;
  clients?: Client[];
  reminders?: Reminder[];
  canEdit: boolean;
  canCreate: boolean;
  canDelete?: boolean;
  canCreateReminder?: boolean;
  canEditReminder?: boolean;
  canDeleteReminder?: boolean;
  onSave: (
    data: PermitModalSaveData,
    stagedNewReminders: StagedReminderItem[],
    stagedLinkReminderIds: string[]
  ) => Promise<boolean>;
  onDelete?: (id: string) => void;
  onOpenEditReminder?: (rem: Reminder) => void;
  onUnlinkReminder?: (remId: string) => void;
  onDeleteReminder?: (remId: string) => void;
}

export const PermitModal: React.FC<PermitModalProps> = React.memo(({
  open,
  onClose,
  editingPermit,
  mode: controlledMode,
  initialMode,
  onModeChange: onModeChangeProp,
  clients = [],
  reminders,
  canEdit,
  canCreate,
  canDelete,
  canCreateReminder,
  canEditReminder,
  canDeleteReminder,
  onSave,
  onDelete,
  onOpenEditReminder,
  onUnlinkReminder,
  onDeleteReminder,
}) => {
  const { t } = useLanguage();

  // Mode state: 'view' | 'edit' | 'create'
  const [internalMode, setInternalMode] = useState<ModalMode>(() => {
    if (controlledMode) return controlledMode;
    if (initialMode) return initialMode;
    return editingPermit ? 'view' : 'create';
  });

  const currentMode = controlledMode || internalMode;
  const isView = currentMode === 'view';

  const handleModeChange = (newMode: ModalMode) => {
    setInternalMode(newMode);
    onModeChangeProp?.(newMode);
  };

  useEffect(() => {
    if (open) {
      if (controlledMode) {
        setInternalMode(controlledMode);
      } else if (initialMode) {
        setInternalMode(initialMode);
      } else {
        setInternalMode(editingPermit ? 'view' : 'create');
      }
    }
  }, [open, editingPermit?.id, initialMode, controlledMode]);

  // Form states isolated inside modal
  const [permitNumber, setPermitNumber] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [permitTypes, setPermitTypes] = useState<PermitType[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedWasteCatalogIds, setSelectedWasteCatalogIds] = useState<string[]>([]);
  const [selectedCatalogItems, setSelectedCatalogItems] = useState<WasteCatalog[]>([]);
  const [notes, setNotes] = useState('');

  // Staged reminders states
  const [isAddingReminderInline, setIsAddingReminderInline] = useState(false);
  const [addReminderMode, setAddReminderMode] = useState<'new' | 'existing'>('new');
  const [inlineReminderTitle, setInlineReminderTitle] = useState('');
  const [inlineReminderDueDate, setInlineReminderDueDate] = useState('');
  const [inlineReminderNotes, setInlineReminderNotes] = useState('');
  const [selectedExistingReminderId, setSelectedExistingReminderId] = useState('');
  const [stagedNewReminders, setStagedNewReminders] = useState<StagedReminderItem[]>([]);
  const [stagedLinkReminderIds, setStagedLinkReminderIds] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [errorDialogState, setErrorDialogState] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  const getLinkedClient = useCallback((p: Permit | null | undefined): Client | null => {
    if (!p) return null;
    if (p.client) return p.client;
    if (p.clientId) {
      const found = clients.find((c) => c.id === p.clientId);
      if (found) return found;
    }
    if (p.clients && p.clients.length > 0) return p.clients[0];
    const foundInClients = clients.find(
      (c) =>
        c.permits?.some((cp) => cp.id === p.id) ||
        c.permitId === p.id ||
        c.extraData?.permitId === p.id
    );
    return foundInClients || null;
  }, [clients]);

  const getPermitTypeLabel = useCallback(
    (type: string) => {
      switch (type) {
        case 'Sakupljanje':
          return t('permitTypeSakupljanje');
        case 'Transport':
          return t('permitTypeTransport');
        case 'Skladistenje':
          return t('permitTypeSkladistenje');
        case 'Tretman':
          return t('permitTypeTretman');
        case 'Odlaganje':
          return t('permitTypeOdlaganje');
        default:
          return type;
      }
    },
    [t]
  );

  const formatDate = useCallback((iso: string | null | undefined) => {
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
  }, []);

  const getLinkedClientRef = useRef(getLinkedClient);
  getLinkedClientRef.current = getLinkedClient;

  const populateFromPermit = useCallback((p: Permit | null) => {
    if (p) {
      const linkedClient = getLinkedClientRef.current(p);
      setSelectedClientId(linkedClient?.id || p.clientId || '');

      const ids = (p.wasteCatalogIds?.length
        ? p.wasteCatalogIds
        : p.permitWastes?.map((pw) => pw.wasteCatalogId).filter(Boolean) ||
          (p.wasteCatalogId ? [p.wasteCatalogId] : [])) as string[];
      const items = (p.wasteCatalogs?.length
        ? p.wasteCatalogs
        : p.permitWastes?.map((pw) => pw.wasteCatalog).filter(Boolean) ||
          (p.wasteCatalog ? [p.wasteCatalog] : [])) as WasteCatalog[];

      setSelectedWasteCatalogIds(ids);
      setSelectedCatalogItems(items);
      setPermitNumber(p.permitNumber || '');
      setPermitTypes(((p.permitTypes as PermitType[]) || []));
      setStartDate(p.startDate ? p.startDate.split('T')[0] : '');
      setEndDate(p.endDate ? p.endDate.split('T')[0] : '');
      setNotes(p.notes || '');
    } else {
      setSelectedWasteCatalogIds([]);
      setSelectedCatalogItems([]);
      setPermitNumber('');
      setPermitTypes([]);
      setSelectedClientId('');
      setStartDate('');
      setEndDate('');
      setNotes('');
    }
    setIsAddingReminderInline(false);
    setStagedNewReminders([]);
    setStagedLinkReminderIds([]);
    setInlineReminderTitle('');
    setInlineReminderDueDate('');
    setInlineReminderNotes('');
    setSelectedExistingReminderId('');
  }, []);

  // Initialize form state when opened or permit changes
  useEffect(() => {
    if (open) {
      populateFromPermit(editingPermit);
    }
  }, [open, editingPermit, populateFromPermit]);

  const handleWasteCatalogChange = useCallback((validValues: WasteCatalog[]) => {
    setSelectedCatalogItems(validValues);
    setSelectedWasteCatalogIds(validValues.map((v) => v.id));
  }, []);

  const { data: fetchedReminders = [] } = useRemindersQuery({
    enabled: open && stagedLinkReminderIds.length > 0,
  });
  const allReminders = reminders && reminders.length > 0 ? reminders : fetchedReminders;

  const existingLinkedReminders = useMemo(() => {
    if (!editingPermit) return [];
    if ((editingPermit as any).reminders) {
      return (editingPermit as any).reminders as Reminder[];
    }
    if (!allReminders) return [];
    return allReminders.filter((r) => r.permitId === editingPermit.id);
  }, [editingPermit, allReminders]);

  const totalRemindersCount = useMemo(() => {
    return existingLinkedReminders.length + stagedNewReminders.length + stagedLinkReminderIds.length;
  }, [existingLinkedReminders.length, stagedNewReminders.length, stagedLinkReminderIds.length]);

  const handleAddStagedReminder = () => {
    if (addReminderMode === 'new') {
      if (!inlineReminderTitle.trim()) {
        setErrorDialogState({
          open: true,
          message: t('alertReminderTitleRequired') || 'Naziv podsetnika je obavezan.',
        });
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
    } else {
      if (!selectedExistingReminderId) return;
      if (!stagedLinkReminderIds.includes(selectedExistingReminderId)) {
        setStagedLinkReminderIds((prev) => [...prev, selectedExistingReminderId]);
      }
      setSelectedExistingReminderId('');
      setIsAddingReminderInline(false);
    }
  };

  const handleCancel = () => {
    if (currentMode === 'edit' && editingPermit) {
      populateFromPermit(editingPermit);
      handleModeChange('view');
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isView) return;
    if (!canEdit && !canCreate) return;
    if (!permitNumber.trim() || selectedWasteCatalogIds.length === 0 || !startDate || !endDate) {
      setErrorDialogState({
        open: true,
        message: t('alertPermitRequired'),
      });
      return;
    }

    if (!selectedClientId) {
      setErrorDialogState({
        open: true,
        message: t('alertClientRequired'),
      });
      return;
    }

    if (!permitTypes || permitTypes.length === 0) {
      setErrorDialogState({
        open: true,
        message: t('alertPermitTypeRequired'),
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setErrorDialogState({
        open: true,
        message: t('alertPermitDatesOrder') || 'Datum početka ne može biti posle datuma isteka.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const ok = await onSave(
        {
          id: editingPermit?.id,
          permitNumber: permitNumber.trim(),
          permitTypes,
          wasteCatalogIds: selectedWasteCatalogIds,
          startDate: startDate ? new Date(startDate).toISOString() : null,
          endDate: endDate ? new Date(endDate).toISOString() : null,
          notes: notes.trim() || null,
          clientId: selectedClientId || null,
        },
        stagedNewReminders,
        stagedLinkReminderIds
      );
      if (ok) {
        onClose();
      }
    } catch (err: any) {
      setErrorDialogState({
        open: true,
        message: err?.message || t('errorSavingProject'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const modalTitle = currentMode === 'create'
    ? t('modalNewPermit')
    : currentMode === 'edit'
    ? t('modalEditPermit')
    : (editingPermit?.permitNumber || t('btnDetails'));

  const selectedClient = clients.find((c) => c.id === selectedClientId) || editingPermit?.client || null;

  return (
    <>
      <ViewEditModalBase
        open={open}
        onClose={onClose}
        mode={currentMode}
        onModeChange={handleModeChange}
        title={modalTitle}
        subtitle={editingPermit?.permitNumber}
        statusChip={editingPermit ? <PermitStatusBadge endDate={editingPermit.endDate} /> : undefined}
        canEdit={canEdit}
        canDelete={Boolean(editingPermit && canDelete && onDelete)}
        onDelete={() => {
          if (editingPermit) {
            onDelete?.(editingPermit.id);
            onClose();
          }
        }}
        isSaving={isSaving}
        onSave={handleSubmit}
        onCancel={handleCancel}
        maxWidth="md"
      >
        <Grid container spacing={2}>
          {/* Permit Number */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <ViewEditField
              mode={currentMode}
              label={t('lblPermitNumber')}
              value={permitNumber}
              viewRender={() => (
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {permitNumber || '—'}
                </Typography>
              )}
            >
              <TextField
                fullWidth
                required
                size="small"
                label={t('lblPermitNumber')}
                placeholder={t('phPermitNumber')}
                value={permitNumber}
                onChange={(e) => setPermitNumber(e.target.value)}
              />
            </ViewEditField>
          </Grid>

          {/* Client (Required) */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <ViewEditField
              mode={currentMode}
              label={t('colClientName')}
              value={selectedClient?.name || '—'}
              viewRender={() => (
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {selectedClient ? `${selectedClient.name}${selectedClient.city ? ` (${selectedClient.city})` : ''}` : '—'}
                </Typography>
              )}
            >
              <ClientAutocomplete
                size="small"
                value={selectedClientId}
                initialOption={
                  editingPermit?.client ||
                  (selectedClientId && clients ? clients.find((c) => c.id === selectedClientId) || null : null)
                }
                onChange={(id) => {
                  setSelectedClientId(id || '');
                }}
                required
                showCity
                label={t('colClientName')}
                placeholder={t('phClient')}
              />
            </ViewEditField>
          </Grid>

          {/* Permit Type (Multiple Select) */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <ViewEditField
              mode={currentMode}
              label={t('lblPermitType')}
              value={permitTypes.map(getPermitTypeLabel).join(', ')}
              viewRender={() => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {permitTypes.length > 0 ? (
                    permitTypes.map((pt) => (
                      <Chip
                        key={pt}
                        label={getPermitTypeLabel(pt)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      —
                    </Typography>
                  )}
                </Box>
              )}
            >
              <Autocomplete
                multiple
                size="small"
                options={PERMIT_TYPE_OPTIONS}
                getOptionLabel={(option) => getPermitTypeLabel(option)}
                value={permitTypes}
                onChange={(_, newValue) => {
                  setPermitTypes((newValue as PermitType[]) || []);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('lblPermitType')}
                    placeholder={permitTypes.length === 0 ? t('phSelectPermitType') : ''}
                    required={permitTypes.length === 0}
                  />
                )}
              />
            </ViewEditField>
          </Grid>

          {/* Start Date (Required) */}
          <Grid size={{ xs: 12, sm: 3 }}>
            <ViewEditField
              mode={currentMode}
              label={t('colStartDate')}
              value={formatDate(startDate)}
            >
              <TextField
                fullWidth
                required
                type="date"
                size="small"
                label={t('colStartDate')}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </ViewEditField>
          </Grid>

          {/* End Date (Required) */}
          <Grid size={{ xs: 12, sm: 3 }}>
            <ViewEditField
              mode={currentMode}
              label={t('colEndDate')}
              value={formatDate(endDate)}
            >
              <TextField
                fullWidth
                required
                type="date"
                size="small"
                label={t('colEndDate')}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </ViewEditField>
          </Grid>

          {/* Index Number (Waste Catalog) */}
          <Grid size={{ xs: 12 }}>
            <ViewEditField
              mode={currentMode}
              label={t('colIndexNumber')}
              value={selectedCatalogItems.map((c) => `${c.code} - ${c.description}`).join('; ')}
              viewRender={() => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {selectedCatalogItems.length > 0 ? (
                    selectedCatalogItems.map((wc) => (
                      <Chip
                        key={wc.id}
                        size="small"
                        label={`${wc.code} - ${wc.description}`}
                        variant="outlined"
                        sx={{ maxWidth: '100%', textOverflow: 'ellipsis' }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      —
                    </Typography>
                  )}
                </Box>
              )}
            >
              <WasteCatalogAutocomplete
                value={selectedCatalogItems}
                onChange={handleWasteCatalogChange}
                required={selectedWasteCatalogIds.length === 0}
                disabled={isView}
              />
            </ViewEditField>
          </Grid>

          {/* Notes */}
          <Grid size={{ xs: 12 }}>
            <ViewEditField
              mode={currentMode}
              label={t('colNotes')}
              value={notes}
              viewRender={() => (
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: notes ? 'text.primary' : 'text.secondary' }}>
                  {notes || '—'}
                </Typography>
              )}
            >
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                label={t('colNotes')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </ViewEditField>
          </Grid>
        </Grid>

        {/* REMINDERS SECTION */}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsActiveIcon color="warning" sx={{ fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t('tabReminders')} ({totalRemindersCount})
            </Typography>
          </Box>
          {!isView && canCreateReminder && (
            <Button
              size="small"
              variant={isAddingReminderInline ? 'outlined' : 'contained'}
              color={isAddingReminderInline ? 'inherit' : 'primary'}
              startIcon={isAddingReminderInline ? <CloseIcon sx={{ fontSize: 14 }} /> : <AddIcon sx={{ fontSize: 14 }} />}
              onClick={() => {
                const willOpen = !isAddingReminderInline;
                setIsAddingReminderInline(willOpen);
                if (willOpen) {
                  setAddReminderMode('new');
                  const idxStr = selectedCatalogItems.length > 0 ? selectedCatalogItems[0].code : '';
                  setInlineReminderTitle(
                    permitNumber.trim()
                      ? `${t('lblPermit')}: ${permitNumber.trim()}${idxStr ? ` (${idxStr})` : ''}`
                      : ''
                  );
                  setInlineReminderDueDate(endDate || '');
                  setInlineReminderNotes('');
                  setSelectedExistingReminderId('');
                }
              }}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              {isAddingReminderInline ? t('btnCancel') : t('btnAddReminder')}
            </Button>
          )}
        </Box>

        {/* INLINE ADD REMINDER FORM (Only during Edit / Create) */}
        {!isView && isAddingReminderInline && (
          <Card
            variant="outlined"
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              bgcolor: 'action.hover',
              borderStyle: 'dashed',
            }}
          >
            <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'center' }}>
              <ToggleButtonGroup
                size="small"
                value={addReminderMode}
                exclusive
                onChange={(_, next) => next && setAddReminderMode(next)}
                sx={{ bgcolor: 'background.paper' }}
              >
                <ToggleButton value="new" sx={{ textTransform: 'none', px: 2 }}>
                  Novi podsetnik
                </ToggleButton>
                <ToggleButton value="existing" sx={{ textTransform: 'none', px: 2 }}>
                  Poveži postojeći
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {addReminderMode === 'new' ? (
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <TextField
                    fullWidth
                    required
                    size="small"
                    label={t('lblReminderTitle')}
                    value={inlineReminderTitle}
                    onChange={(e) => setInlineReminderTitle(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    type="date"
                    size="small"
                    label={t('lblDueDate')}
                    value={inlineReminderDueDate}
                    onChange={(e) => setInlineReminderDueDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('colNotes')}
                    value={inlineReminderNotes}
                    onChange={(e) => setInlineReminderNotes(e.target.value)}
                  />
                </Grid>
              </Grid>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <ReminderAutocomplete
                  size="small"
                  label="Izaberite podsetnik"
                  placeholder="Izaberite podsetnik"
                  value={selectedExistingReminderId}
                  onChange={(val) => setSelectedExistingReminderId(val || '')}
                  excludePermitId={editingPermit?.id}
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.5 }}>
              <Button
                size="small"
                color="inherit"
                onClick={() => setIsAddingReminderInline(false)}
                sx={{ textTransform: 'none' }}
              >
                {t('btnCancel')}
              </Button>
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={handleAddStagedReminder}
                sx={{ textTransform: 'none' }}
              >
                {t('btnAddReminder')}
              </Button>
            </Box>
          </Card>
        )}

        {/* REMINDERS LIST (Staged + Existing) */}
        {totalRemindersCount === 0 && !isAddingReminderInline ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
            Nema povezanih podsetnika.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Staged New Reminders */}
            {!isView && stagedNewReminders.map((rem) => (
              <Card
                key={rem.id}
                variant="outlined"
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: 'action.hover',
                  borderStyle: 'dashed',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                  <NotificationsActiveIcon fontSize="small" color="primary" />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rem.title}
                    </Typography>
                    {rem.dueDate && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarTodayIcon sx={{ fontSize: 13 }} />
                        {formatDate(rem.dueDate)}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={t('statusDraft') || 'Novo'} size="small" color="info" variant="outlined" sx={{ fontWeight: 600 }} />
                  <Tooltip title={t('btnDelete')}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setStagedNewReminders((prev) => prev.filter((r) => r.id !== rem.id))}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Card>
            ))}

            {/* Staged Linked Reminders */}
            {!isView && stagedLinkReminderIds.map((remId) => {
              const rem = allReminders.find((r) => r.id === remId);
              if (!rem) return null;
              return (
                <Card
                  key={rem.id}
                  variant="outlined"
                  sx={{
                    p: 1.2,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: 'action.hover',
                    borderStyle: 'dashed',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                    <LinkIcon fontSize="small" color="secondary" />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {rem.title || rem.projectName}
                      </Typography>
                      {rem.dueDate && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarTodayIcon sx={{ fontSize: 13 }} />
                          {formatDate(rem.dueDate)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="Povezano" size="small" color="secondary" variant="outlined" sx={{ fontWeight: 600 }} />
                    <Tooltip title={t('btnCancel')}>
                      <IconButton
                        size="small"
                        color="inherit"
                        onClick={() => setStagedLinkReminderIds((prev) => prev.filter((id) => id !== remId))}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              );
            })}

            {/* Existing linked reminders if editing an existing permit */}
            {editingPermit &&
              existingLinkedReminders.map((rem) => (
                <Card
                  key={rem.id}
                  variant="outlined"
                  sx={{
                    p: 1.2,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: 'background.paper',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                    <NotificationsActiveIcon fontSize="small" color="primary" />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {rem.title}
                      </Typography>
                      {rem.dueDate && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarTodayIcon sx={{ fontSize: 13 }} />
                          {formatDate(rem.dueDate)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip
                      label={rem.status}
                      size="small"
                      color={rem.status === 'Completed' ? 'success' : rem.status === 'Overdue' ? 'error' : 'warning'}
                      sx={{ fontWeight: 600 }}
                    />
                    {!isView && canEditReminder && onOpenEditReminder && (
                      <Tooltip title={t('btnEdit')}>
                        <IconButton size="small" color="primary" onClick={() => onOpenEditReminder(rem)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {!isView && onUnlinkReminder && (
                      <Tooltip title={t('btnUnlinkReminder')}>
                        <IconButton size="small" color="warning" onClick={() => onUnlinkReminder(rem.id)}>
                          <LinkOffIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {!isView && onDeleteReminder && canDeleteReminder && (
                      <Tooltip title={t('btnDelete')}>
                        <IconButton size="small" color="error" onClick={() => onDeleteReminder(rem.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Card>
              ))}
          </Box>
        )}
      </ViewEditModalBase>

      <ErrorDialog
        open={errorDialogState.open}
        message={errorDialogState.message}
        onClose={() => setErrorDialogState({ open: false, message: '' })}
      />
    </>
  );
});

PermitModal.displayName = 'PermitModal';
