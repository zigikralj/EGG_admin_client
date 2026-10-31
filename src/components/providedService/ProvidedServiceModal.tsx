import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Typography,
  Box,
  Autocomplete,
  Grid,
} from '@mui/material';
import { SettingsIcon, AddIcon } from '../icons';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useLinkedListOptions } from '../../hooks/useLinkedListOptions';
import { WasteCatalogAutocomplete } from '../common/WasteCatalogAutocomplete';
import { ProvidedServiceInvoiceSection } from './ProvidedServiceInvoiceSection';
import {
  ClientAutocomplete,
  ProjectAutocomplete,
  ServiceAutocomplete,
} from '../common/autocomplete';
import { ViewEditModalBase, type ModalMode } from '../common/modal/ViewEditModalBase';
import type {
  ProvidedService,
  Service,
  Client,
  CustomFieldDefinition,
  SaveResult,
  Invoice,
} from '../../types';

export interface ProvidedServiceModalProps {
  open: boolean;
  onClose: () => void;
  editingItem: ProvidedService | null;
  services: Service[];
  clients: Client[];
  invoices?: Invoice[];
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  isViewMode?: boolean;
  mode?: ModalMode;
  initialMode?: ModalMode;
  onModeChange?: (mode: ModalMode) => void;
  onDeleteProvidedService?: (id: string) => void;
  onSaveProvidedService: (payload: Partial<ProvidedService>) => Promise<SaveResult>;
  onSaveInvoice: (invoice: any) => Promise<SaveResult>;
  onDeleteInvoice: (id: string) => Promise<void>;
  onStatusChangeInvoice: (id: string, status: string, paymentDate?: string | null) => Promise<any>;
  onOpenCustomModelModal?: (service: Service) => void;
  getCustomModelForService: (serviceId: string) => CustomFieldDefinition[];
  onError?: (message: string) => void;
}

export const ProvidedServiceModal: React.FC<ProvidedServiceModalProps> = ({
  open,
  onClose,
  editingItem,
  services,
  clients,
  canCreate = true,
  canEdit: canEditProp,
  canDelete: canDeleteProp,
  isViewMode,
  mode: controlledMode,
  initialMode,
  onModeChange: onModeChangeProp,
  onDeleteProvidedService,
  onSaveProvidedService,
  onSaveInvoice,
  onDeleteInvoice,
  onStatusChangeInvoice,
  onOpenCustomModelModal,
  getCustomModelForService,
  onError,
}) => {
  const { t } = useLanguage();
  const { hasPermission } = useAuth();

  // Mode state: 'view' | 'edit' | 'create'
  const [internalMode, setInternalMode] = useState<ModalMode>(() => {
    if (controlledMode) return controlledMode;
    if (initialMode) return initialMode;
    if (isViewMode !== undefined) return isViewMode ? 'view' : (editingItem ? 'edit' : 'create');
    return editingItem ? 'view' : 'create';
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
      } else if (isViewMode !== undefined) {
        setInternalMode(isViewMode ? 'view' : (editingItem ? 'edit' : 'create'));
      } else {
        setInternalMode(editingItem ? 'view' : 'create');
      }
    }
  }, [open, editingItem?.id, isViewMode, initialMode, controlledMode]);

  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedClientName, setSelectedClientName] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedProjectName, setSelectedProjectName] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [status, setStatus] = useState<string>('Planned');
  const [location, setLocation] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [completionDate, setCompletionDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [customData, setCustomData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  const statusOptions = useMemo(() => [
    { value: 'Planned', label: t('statusPlanned') },
    { value: 'In Progress', label: t('statusInProgress') },
    { value: 'Completed', label: t('statusCompleted') },
    { value: 'Cancelled', label: t('statusCancelled') },
  ], [t]);

  const currentCustomFields = useMemo(() => {
    return getCustomModelForService(selectedServiceId);
  }, [selectedServiceId, getCustomModelForService]);

  const { resolveListOptions } = useLinkedListOptions({
    enabled: open,
    fields: currentCustomFields,
    clients,
  });

  const getItemPermissions = useCallback((item: ProvidedService | null) => {
    if (!item) return { canEdit: canCreate, canDelete: false };
    const srv = item.service || services.find((s) => s.id === item.serviceId);
    const isWaste = srv?.group === 'grp-waste' || srv?.code?.toLowerCase().includes('waste');
    const canEdit = canEditProp ?? (hasPermission('providedServices', 'edit') || (Boolean(isWaste) && hasPermission('wasteDisposal', 'edit')));
    const canDelete = canDeleteProp ?? (hasPermission('providedServices', 'delete') || (Boolean(isWaste) && hasPermission('wasteDisposal', 'delete')));
    return { canEdit, canDelete };
  }, [hasPermission, services, canCreate, canEditProp, canDeleteProp]);

  const resetFormToItem = useCallback((item: ProvidedService | null) => {
    if (item) {
      setSelectedServiceId(item.serviceId);
      setSelectedClientId(item.clientId);
      setSelectedClientName(item.client?.name || '');
      setSelectedProjectId(item.projectId || '');
      setSelectedProjectName(item.project?.name || '');
      setSelectedInvoiceId(item.invoiceId || '');
      setStatus(item.status);
      setLocation(item.location || '');
      setScheduledDate(item.scheduledDate ? item.scheduledDate.substring(0, 10) : '');
      setCompletionDate(item.completionDate ? item.completionDate.substring(0, 10) : '');
      setNotes(item.notes || '');

      const initialCustomData: Record<string, any> = {};
      const fields = getCustomModelForService(item.serviceId);
      const savedCustomData = item.customData || {};

      fields.forEach((f) => {
        let val: any;
        if (savedCustomData[f.id] !== undefined) {
          val = savedCustomData[f.id];
        } else {
          const legacyKey = f.name.toLowerCase().replace(/\s+/g, '_');
          if (savedCustomData[legacyKey] !== undefined) {
            val = savedCustomData[legacyKey];
          } else {
            val = f.type === 'number' ? '' : f.type === 'list' && (f.linkedList === 'index_number' || f.id === 'indeksni_broj') ? [] : '';
          }
        }
        if (typeof val === 'object' && val !== null && !Array.isArray(val) && val.name) {
          val = val.name;
        }
        initialCustomData[f.id] = val;
      });

      for (const [k, v] of Object.entries(savedCustomData)) {
        if (initialCustomData[k] === undefined) {
          let cleanV = v;
          if (typeof cleanV === 'object' && cleanV !== null && !Array.isArray(cleanV) && (cleanV as any).name) {
            cleanV = (cleanV as any).name;
          }
          initialCustomData[k] = cleanV;
        }
      }
      setCustomData(initialCustomData);
    } else {
      setSelectedServiceId('');
      setSelectedClientId('');
      setSelectedClientName('');
      setSelectedProjectId('');
      setSelectedProjectName('');
      setSelectedInvoiceId('');
      setStatus('Planned');
      setLocation('');
      setScheduledDate('');
      setCompletionDate('');
      setNotes('');
      setCustomData({});
    }
  }, [getCustomModelForService]);

  useEffect(() => {
    if (open) {
      resetFormToItem(editingItem);
    }
  }, [open, editingItem, resetFormToItem]);

  const handleCancel = () => {
    if (currentMode === 'edit' && editingItem) {
      resetFormToItem(editingItem);
      handleModeChange('view');
    } else {
      onClose();
    }
  };

  const getPermitTypeLabel = (pType: string) => {
    const key = `permitType${pType}`;
    const translated = t(key as any);
    return translated !== key ? translated : pType;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isView) return;
    if (editingItem && !getItemPermissions(editingItem).canEdit) return;
    if (!editingItem && !canCreate) return;
    if (!selectedServiceId.trim()) {
      onError?.(t('alertServiceRequired'));
      return;
    }
    if (!selectedClientId.trim()) {
      onError?.(t('alertClientRequired'));
      return;
    }

    let cleanCustomData: Record<string, any> | null = null;
    if (customData && Object.keys(customData).length > 0) {
      const cleaned: Record<string, any> = {};
      for (const [k, v] of Object.entries(customData)) {
        if (v !== undefined && v !== null && v !== '' && (!Array.isArray(v) || v.length > 0)) {
          let cleanVal = v;
          if (typeof cleanVal === 'object' && cleanVal !== null && !Array.isArray(cleanVal) && cleanVal.name) {
            cleanVal = cleanVal.name;
          }
          if (currentCustomFields.length > 0) {
            if (currentCustomFields.some((f) => f.id === k)) {
              cleaned[k] = cleanVal;
            }
          } else if (!k.startsWith('field_')) {
            cleaned[k] = cleanVal;
          }
        }
      }
      if (Object.keys(cleaned).length > 0) {
        cleanCustomData = cleaned;
      }
    }

    setIsSaving(true);
    try {
      const payload: Partial<ProvidedService> = {
        id: editingItem?.id,
        serviceId: selectedServiceId || undefined,
        clientId: selectedClientId || undefined,
        projectId: selectedProjectId.trim() ? selectedProjectId : null,
        invoiceId: selectedInvoiceId.trim() ? selectedInvoiceId : null,
        status: status || 'PENDING',
        scheduledDate: scheduledDate ? scheduledDate : null,
        completionDate: completionDate ? completionDate : null,
        location: location.trim() ? location.trim() : null,
        notes: notes.trim() ? notes.trim() : null,
        customData: cleanCustomData,
      };

      const res = await onSaveProvidedService(payload);

      if (res.success) {
        if (editingItem && currentMode === 'edit') {
          handleModeChange('view');
        } else {
          onClose();
        }
      } else if (res.error) {
        onError?.(res.error || (t('errorSaving' as any)));
      }
    } catch (err: any) {
      onError?.(err?.message || (t('errorSaving' as any)));
    } finally {
      setIsSaving(false);
    }
  };

  const selectedServiceObj = services.find((s) => s.id === selectedServiceId) || editingItem?.service;

  const modalTitle = (m: ModalMode) => {
    if (m === 'view') return selectedServiceObj?.name || t('tabProvidedServices');
    if (m === 'edit') return t('modalEditProvidedService');
    return t('modalNewProvidedService');
  };

  const isCompleted = (status || '').toLowerCase() === 'completed' || (status || '').toLowerCase() === 'završeno';

  const handleToggleComplete = async () => {
    const nextStatus = isCompleted ? 'Planned' : 'Completed';
    const nextCompletionDate = !isCompleted ? (completionDate || new Date().toISOString().slice(0, 10)) : '';
    setStatus(nextStatus);
    setCompletionDate(nextCompletionDate);
    await onSaveProvidedService({
      id: editingItem?.id,
      status: nextStatus,
      completionDate: nextCompletionDate || null,
    });
  };

  const canEditItem = getItemPermissions(editingItem).canEdit;
  const canDeleteItem = Boolean(editingItem?.id && getItemPermissions(editingItem).canDelete && onDeleteProvidedService);

  return (
    <ViewEditModalBase
      open={open}
      onClose={() => !isSaving && onClose()}
      mode={currentMode}
      onModeChange={handleModeChange}
      title={modalTitle}
      onComplete={isView && Boolean(editingItem?.id) && canEditItem ? handleToggleComplete : undefined}
      isCompleted={isCompleted}
      completeLabel={isCompleted ? t('statusCompleted') : t('btnMarkDone')}
      maxWidth="md"
      canEdit={canEditItem}
      canDelete={canDeleteItem}
      onDelete={onDeleteProvidedService && editingItem ? () => { onDeleteProvidedService(editingItem.id); onClose(); } : undefined}
      onSave={handleSubmit}
      onCancel={handleCancel}
      isSaving={isSaving}
    >
      <Grid container spacing={2}>
        {/* Service Selection */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <ServiceAutocomplete
            size="small"
            fullWidth
            valueMode="id"
            value={selectedServiceId || null}
            initialOption={editingItem?.service || (editingItem?.serviceId ? services.find((s) => s.id === editingItem.serviceId) : undefined)}
            onChange={(val) => setSelectedServiceId(val || '')}
            label={t('colService')}
            disabled={isView}
            required
          />
        </Grid>

        {/* Client Selection */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <ClientAutocomplete
            size="small"
            fullWidth
            valueMode="id"
            value={selectedClientId || null}
            initialOption={editingItem?.client || (selectedClientId && selectedClientName ? { id: selectedClientId, name: selectedClientName } as any : undefined)}
            onChange={(val, opt) => {
              setSelectedClientId(val || '');
              setSelectedClientName(opt?.name || '');
              if (val !== selectedClientId) {
                setSelectedProjectId('');
                setSelectedProjectName('');
                setSelectedInvoiceId('');
              }
            }}
            label={t('colClient')}
            disabled={isView}
            required
          />
        </Grid>

        {/* Project Selection (Optional) */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <ProjectAutocomplete
            size="small"
            fullWidth
            valueMode="id"
            value={selectedProjectId || null}
            clientId={selectedClientId || undefined}
            initialOption={editingItem?.project || (selectedProjectId && selectedProjectName ? { id: selectedProjectId, name: selectedProjectName } as any : undefined)}
            onChange={(val, opt) => {
              setSelectedProjectId(val || '');
              setSelectedProjectName(opt?.name || '');
            }}
            label={t('colProject')}
            placeholder={t('lblNoneOptional')}
            disabled={isView}
          />
        </Grid>

        {/* Status */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small" disabled={isView}>
            <InputLabel>{t('lblInvoiceStatus')}</InputLabel>
            <Select
              value={status}
              label={t('lblInvoiceStatus')}
              onChange={(e) => setStatus(e.target.value as string)}
            >
              {statusOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Location */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label={t('lblLocation')}
            placeholder={t('phLocation')}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={isView}
          />
        </Grid>

        {/* Scheduled Date */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label={t('lblScheduledDate')}
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            disabled={isView}
          />
        </Grid>

        {/* Completion Date */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label={t('lblCompletionDate')}
            value={completionDate}
            onChange={(e) => setCompletionDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            disabled={isView}
          />
        </Grid>

        {/* INVOICE SECTION */}
        <Grid size={{ xs: 12 }}>
          <ProvidedServiceInvoiceSection
            clientId={selectedClientId}
            clientName={selectedClientName || editingItem?.client?.name}
            projectId={selectedProjectId}
            projectName={selectedProjectName || editingItem?.project?.name}
            selectedInvoiceId={selectedInvoiceId}
            onSelectInvoiceId={(invId) => setSelectedInvoiceId(invId)}
            initialInvoice={editingItem?.invoice}
            invoices={editingItem?.invoice ? [editingItem.invoice] : []}
            onSaveInvoice={onSaveInvoice}
            onDeleteInvoice={onDeleteInvoice}
            onStatusChangeInvoice={onStatusChangeInvoice}
            setErrorDialogState={(dialogState: any) => {
              if (typeof dialogState === 'function') {
                const resolved = dialogState({ open: false, message: '' });
                if (resolved.open && resolved.message) onError?.(resolved.message);
              } else if (dialogState.open && dialogState.message) {
                onError?.(dialogState.message);
              }
            }}
            disabled={isView || !getItemPermissions(editingItem).canEdit}
          />
        </Grid>

        {/* CUSTOM DATA SECTION */}
        <Grid size={{ xs: 12 }}>
          <Box
            sx={{
              mt: 1,
              mb: 1,
              p: 2,
              bgcolor: 'action.hover',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: currentCustomFields.length ? 1.5 : 0,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t('customDataSection')}
              </Typography>
              {!isView && getItemPermissions(editingItem).canEdit && onOpenCustomModelModal && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={() => {
                    const srv = services.find((s) => s.id === selectedServiceId);
                    if (srv) onOpenCustomModelModal(srv);
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  {t('btnEditCustomDataModel')}
                </Button>
              )}
            </Box>

            {currentCustomFields.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('noCustomFieldsDefined')}
                </Typography>
                {!isView && getItemPermissions(editingItem).canEdit && onOpenCustomModelModal && (
                  <Button
                    size="small"
                    variant="text"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      const srv = services.find((s) => s.id === selectedServiceId);
                      if (srv) onOpenCustomModelModal(srv);
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    {t('btnDefineModel')}
                  </Button>
                )}
              </Box>
            ) : (
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                {currentCustomFields.map((field) => (
                  <Grid key={field.id} size={{ xs: 12, sm: 6 }}>
                    {field.type === 'text' && (
                      <TextField
                        fullWidth
                        size="small"
                        label={field.name}
                        value={customData[field.id] || ''}
                        disabled={isView}
                        onChange={(e) =>
                          setCustomData((prev) => ({ ...prev, [field.id]: e.target.value }))
                        }
                      />
                    )}
                    {field.type === 'number' && (
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label={field.unit ? `${field.name} (${field.unit})` : field.name}
                        value={customData[field.id] ?? ''}
                        disabled={isView}
                        onChange={(e) =>
                          setCustomData((prev) => ({
                            ...prev,
                            [field.id]: e.target.value === '' ? '' : Number(e.target.value),
                          }))
                        }
                        slotProps={{
                          htmlInput: { step: 'any' },
                          input: field.unit
                            ? {
                                endAdornment: (
                                  <InputAdornment position="end">{field.unit}</InputAdornment>
                                ),
                              }
                            : undefined,
                        }}
                      />
                    )}
                    {(field.type === 'list' || field.type === 'client') && (
                      (field.type === 'list' && field.linkedList === 'index_number') || field.id === 'indeksni_broj' ? (
                        <WasteCatalogAutocomplete
                          multiple={true}
                          size="small"
                          fullWidth
                          label={field.name}
                          placeholder={t('lblNoneOptional')}
                          value={customData[field.id] || []}
                          disabled={isView}
                          onChange={(_, codes) => {
                            setCustomData((prev) => ({ ...prev, [field.id]: codes || [] }));
                          }}
                        />
                      ) : field.type === 'client' || field.linkedList === 'clients' ? (
                        <ClientAutocomplete
                          size="small"
                          fullWidth
                          label={field.name}
                          placeholder={t('lblNoneOptional')}
                          permitTypeFilter={field.permitTypeFilter}
                          valueMode="name"
                          disabled={isView}
                          value={
                            typeof customData[field.id] === 'object' && customData[field.id] !== null
                              ? customData[field.id].name || ''
                              : customData[field.id] || null
                          }
                          onChange={(selectedVal, selectedOption) => {
                            const finalName =
                              typeof selectedVal === 'string'
                                ? selectedVal
                                : selectedOption?.name || selectedVal?.name || '';
                            setCustomData((prev) => ({ ...prev, [field.id]: finalName }));
                          }}
                          helperText={field.permitTypeFilter ? `${t('lblFilteredByPermit')}: ${getPermitTypeLabel(field.permitTypeFilter)}` : undefined}
                        />
                      ) : (
                        <Autocomplete
                          size="small"
                          fullWidth
                          disabled={isView}
                          options={(() => {
                            const opts = resolveListOptions(field);
                            const currentVal = customData[field.id];
                            if (currentVal && typeof currentVal === 'string' && !opts.includes(currentVal)) {
                              return [currentVal, ...opts];
                            }
                            return opts;
                          })()}
                          value={customData[field.id] || null}
                          onChange={(_, newValue) => {
                            setCustomData((prev) => ({ ...prev, [field.id]: newValue || '' }));
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label={field.name}
                              placeholder={t('lblNoneOptional')}
                              helperText={field.permitTypeFilter ? `${t('lblFilteredByPermit')}: ${getPermitTypeLabel(field.permitTypeFilter)}` : undefined}
                            />
                          )}
                        />
                      )
                    )}
                    {(field.type === 'datetime' || field.type === 'date') && (
                      <TextField
                        fullWidth
                        size="small"
                        type={field.type === 'datetime' ? 'datetime-local' : 'date'}
                        label={field.name}
                        value={customData[field.id] || ''}
                        disabled={isView}
                        onChange={(e) =>
                          setCustomData((prev) => ({ ...prev, [field.id]: e.target.value }))
                        }
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                    )}
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Grid>

        {/* Notes */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            size="small"
            multiline
            rows={3}
            label={t('lblDescription')}
            placeholder={t('phDescription')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isView}
          />
        </Grid>
      </Grid>
    </ViewEditModalBase>
  );
};

export default ProvidedServiceModal;
