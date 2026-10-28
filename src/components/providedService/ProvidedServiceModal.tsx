import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import { DeleteIcon, SettingsIcon, AddIcon } from '../icons';
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
import type {
  ProvidedService,
  Service,
  Client,
  CustomFieldDefinition,
  SaveResult,
} from '../../types';

export interface ProvidedServiceModalProps {
  open: boolean;
  onClose: () => void;
  editingItem: ProvidedService | null;
  services: Service[];
  clients: Client[];
  canCreate?: boolean;
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
    const canEdit = hasPermission('providedServices', 'edit') || (Boolean(isWaste) && hasPermission('wasteDisposal', 'edit'));
    const canDelete = hasPermission('providedServices', 'delete') || (Boolean(isWaste) && hasPermission('wasteDisposal', 'delete'));
    return { canEdit, canDelete };
  }, [hasPermission, services, canCreate]);

  useEffect(() => {
    if (open) {
      if (editingItem) {
        setSelectedServiceId(editingItem.serviceId);
        setSelectedClientId(editingItem.clientId);
        setSelectedClientName(editingItem.client?.name || '');
        setSelectedProjectId(editingItem.projectId || '');
        setSelectedProjectName(editingItem.project?.name || '');
        setSelectedInvoiceId(editingItem.invoiceId || '');
        setStatus(editingItem.status);
        setLocation(editingItem.location || '');
        setScheduledDate(editingItem.scheduledDate ? editingItem.scheduledDate.substring(0, 10) : '');
        setCompletionDate(editingItem.completionDate ? editingItem.completionDate.substring(0, 10) : '');
        setNotes(editingItem.notes || '');

        const initialCustomData: Record<string, any> = {};
        const fields = getCustomModelForService(editingItem.serviceId);
        const savedCustomData = editingItem.customData || {};

        fields.forEach((f) => {
          if (savedCustomData[f.id] !== undefined) {
            initialCustomData[f.id] = savedCustomData[f.id];
          } else {
            const legacyKey = f.name.toLowerCase().replace(/\s+/g, '_');
            if (savedCustomData[legacyKey] !== undefined) {
              initialCustomData[f.id] = savedCustomData[legacyKey];
            } else {
              initialCustomData[f.id] = f.type === 'number' ? '' : f.type === 'list' && (f.linkedList === 'index_number' || f.id === 'indeksni_broj') ? [] : '';
            }
          }
        });

        for (const [k, v] of Object.entries(savedCustomData)) {
          if (initialCustomData[k] === undefined) {
            initialCustomData[k] = v;
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
    }
  }, [open, editingItem, getCustomModelForService]);

  const getPermitTypeLabel = (pType: string) => {
    const key = `permitType${pType}`;
    const translated = t(key as any);
    return translated !== key ? translated : pType;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          if (currentCustomFields.length > 0) {
            if (currentCustomFields.some((f) => f.id === k)) {
              cleaned[k] = v;
            }
          } else if (!k.startsWith('field_')) {
            cleaned[k] = v;
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
        status: status || 'PENDING',
        scheduledDate: scheduledDate ? scheduledDate : null,
        completionDate: completionDate ? completionDate : null,
        location: location.trim() ? location.trim() : null,
        notes: notes.trim() ? notes.trim() : null,
        customData: cleanCustomData,
      };

      const res = await onSaveProvidedService(payload);

      if (res.success) {
        onClose();
      } else if (res.error) {
        onError?.(res.error || t('errorSaving' as any));
      }
    } catch (err: any) {
      onError?.(err?.message || t('errorSaving' as any));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: handleSubmit,
          sx: {
            maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      <DialogTitle component="div" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {editingItem ? t('modalEditProvidedService') : t('modalNewProvidedService')}
        </Typography>
        {editingItem && getItemPermissions(editingItem).canDelete && onDeleteProvidedService && (
          <Button
            color="error"
            size="small"
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={() => {
              onDeleteProvidedService(editingItem.id);
              onClose();
            }}
          >
            {t('btnDelete')}
          </Button>
        )}
      </DialogTitle>
      <DialogContent dividers sx={{ flex: 1, overflowY: 'auto' }}>
        <Grid container spacing={2} sx={{ pt: 1 }}>
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
            />
          </Grid>

          {/* Status */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
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
              disabled={!getItemPermissions(editingItem).canEdit}
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
                {getItemPermissions(editingItem).canEdit && onOpenCustomModelModal && (
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
                  {getItemPermissions(editingItem).canEdit && onOpenCustomModelModal && (
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
                            value={customData[field.id] || null}
                            onChange={(_, selectedName) => {
                              setCustomData((prev) => ({ ...prev, [field.id]: selectedName || '' }));
                            }}
                            helperText={field.permitTypeFilter ? `${t('lblFilteredByPermit')}: ${getPermitTypeLabel(field.permitTypeFilter)}` : undefined}
                          />
                        ) : (
                          <Autocomplete
                            size="small"
                            fullWidth
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
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, flexShrink: 0 }}>
        <Button onClick={onClose} variant="outlined" disabled={isSaving}>
          {t('btnCancel')}
        </Button>
        <Button type="submit" variant="contained" color="primary" disabled={isSaving}>
          {isSaving ? '...' : t('btnSave')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProvidedServiceModal;
