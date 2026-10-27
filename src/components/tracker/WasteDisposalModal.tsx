import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  Typography,
  Box,
  Autocomplete,
  Grid,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SettingsIcon from '@mui/icons-material/Settings';
import { useLanguage } from '../../context/LanguageContext';
import { useLinkedListOptions } from '../../hooks/useLinkedListOptions';
import { WasteCatalogAutocomplete } from '../common/WasteCatalogAutocomplete';
import { CustomDataModelModal } from '../dialogs/CustomDataModelModal';
import { ProvidedServiceInvoiceSection } from '../providedService/ProvidedServiceInvoiceSection';
import {
  ClientAutocomplete,
  ProjectAutocomplete,
  ServiceAutocomplete,
} from '../common/autocomplete';
import { isWasteDisposalService } from '../../utils/serviceUtils';
import { isKeyMatch } from '../../utils/customFields';
import type {
  Client,
  Project,
  Service,
  Invoice,
  ProvidedService,
  CustomFieldDefinition,
  SaveResult,
} from '../../types';

const EMPTY_ARRAY: any[] = [];

interface FastTextFieldProps {
  label: string;
  value: string | number;
  type?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  placeholder?: string;
  helperText?: React.ReactNode;
  slotProps?: any;
  valueRef?: React.MutableRefObject<any>;
  onChange: (value: any) => void;
  onFastChange?: (value: any) => void;
}

const FastTextField: React.FC<FastTextFieldProps> = React.memo(({
  label,
  value,
  type = 'text',
  disabled = false,
  multiline = false,
  rows,
  fullWidth = true,
  size = 'small',
  placeholder,
  helperText,
  slotProps,
  valueRef,
  onChange,
  onFastChange,
}) => {
  const [localVal, setLocalVal] = useState<string | number>(value ?? '');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValRef = useRef<string | number>(value ?? '');

  useEffect(() => {
    setLocalVal(value ?? '');
    latestValRef.current = value ?? '';
    if (valueRef) {
      valueRef.current = value ?? '';
    }
  }, [value, valueRef]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const raw = e.target.value;
    const nextVal = type === 'number' ? (raw === '' ? '' : Number(raw)) : raw;
    setLocalVal(raw);
    latestValRef.current = nextVal;
    if (valueRef) {
      valueRef.current = nextVal;
    }
    if (onFastChange) {
      onFastChange(nextVal);
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(nextVal);
    }, 150);
  };

  const handleBlur = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onChange(latestValRef.current);
  };

  return (
    <TextField
      fullWidth={fullWidth}
      size={size}
      type={type}
      label={label}
      value={localVal}
      disabled={disabled}
      multiline={multiline}
      rows={rows}
      placeholder={placeholder}
      helperText={helperText}
      slotProps={slotProps}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
});

interface CustomFieldItemProps {
  field: CustomFieldDefinition;
  value: any;
  disabled?: boolean;
  resolvedOptions: string[];
  onChange: (fieldId: string, value: any) => void;
  customDataRef: React.MutableRefObject<Record<string, any>>;
  t: (key: string) => string;
  getPermitTypeLabel: (type: string) => string;
}

const CustomFieldItem: React.FC<CustomFieldItemProps> = React.memo(({
  field,
  value,
  disabled,
  resolvedOptions,
  onChange,
  customDataRef,
  t,
  getPermitTypeLabel,
}) => {
  const val = value ?? '';
  const isListOrClient = field.type === 'list' || field.type === 'client';
  const optionsToDisplay = useMemo(() => {
    return val && typeof val === 'string' && !resolvedOptions.includes(val)
      ? [val, ...resolvedOptions]
      : resolvedOptions;
  }, [val, resolvedOptions]);

  const handleFastTextOrNumber = useCallback(
    (nextVal: any) => {
      if (customDataRef.current) {
        customDataRef.current[field.id] = nextVal;
      }
    },
    [customDataRef, field.id]
  );

  const handleCommitValue = useCallback(
    (committedVal: any) => {
      onChange(field.id, committedVal);
    },
    [onChange, field.id]
  );

  if ((field.type === 'list' && field.linkedList === 'index_number') || field.id === 'indeksni_broj') {
    return (
      <WasteCatalogAutocomplete
        multiple={true}
        size="small"
        fullWidth
        disabled={disabled}
        label={field.name}
        placeholder={t('lblNoneOptional')}
        value={val || EMPTY_ARRAY}
        onChange={(_, codes) => {
          handleFastTextOrNumber(codes || []);
          handleCommitValue(codes || []);
        }}
      />
    );
  }

  if (field.type === 'client' || field.linkedList === 'clients') {
    return (
      <ClientAutocomplete
        size="small"
        fullWidth
        disabled={disabled}
        label={field.name}
        placeholder={t('lblNoneOptional')}
        permitTypeFilter={field.permitTypeFilter}
        valueMode="name"
        value={val || null}
        onChange={(_, selectedName) => {
          handleFastTextOrNumber(selectedName || '');
          handleCommitValue(selectedName || '');
        }}
        helperText={
          field.permitTypeFilter
            ? `${t('lblFilteredByPermit')}: ${getPermitTypeLabel(field.permitTypeFilter)}`
            : undefined
        }
      />
    );
  }

  if (isListOrClient && (optionsToDisplay.length > 0 || field.type === 'list')) {
    return (
      <Autocomplete
        size="small"
        fullWidth
        disabled={disabled}
        options={optionsToDisplay}
        value={val || null}
        onChange={(_, newValue) => {
          handleFastTextOrNumber(newValue || '');
          handleCommitValue(newValue || '');
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={field.name}
            placeholder={t('lblNoneOptional')}
            helperText={
              field.permitTypeFilter
                ? `${t('lblFilteredByPermit')}: ${getPermitTypeLabel(field.permitTypeFilter)}`
                : undefined
            }
          />
        )}
      />
    );
  }

  if (field.type === 'number') {
    return (
      <FastTextField
        fullWidth
        size="small"
        type="number"
        label={field.unit ? `${field.name} (${field.unit})` : field.name}
        value={val}
        disabled={disabled}
        onFastChange={handleFastTextOrNumber}
        onChange={handleCommitValue}
      />
    );
  }

  return (
    <FastTextField
      fullWidth
      size="small"
      label={field.name}
      value={val}
      disabled={disabled}
      onFastChange={handleFastTextOrNumber}
      onChange={handleCommitValue}
    />
  );
});

interface CustomFieldsSectionProps {
  activeCustomFields: CustomFieldDefinition[];
  customData: Record<string, any>;
  customDataRef: React.MutableRefObject<Record<string, any>>;
  resolvedListOptionsMap: Map<string, string[]>;
  isViewMode: boolean;
  canManageServices: boolean;
  selectedService: Service | null | undefined;
  onOpenCustomModelModal: () => void;
  onCustomFieldChange: (fieldId: string, value: any) => void;
  t: (key: string) => string;
  getPermitTypeLabel: (type: string) => string;
}

const CustomFieldsSection: React.FC<CustomFieldsSectionProps> = React.memo(({
  activeCustomFields,
  customData,
  customDataRef,
  resolvedListOptionsMap,
  isViewMode,
  canManageServices,
  selectedService,
  onOpenCustomModelModal,
  onCustomFieldChange,
  t,
  getPermitTypeLabel,
}) => {
  if (activeCustomFields.length === 0) return null;

  return (
    <Grid size={{ xs: 12 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
          {t('customDataSection')}
        </Typography>
        {!isViewMode && canManageServices && selectedService && (
          <Button
            size="small"
            variant="text"
            startIcon={<SettingsIcon sx={{ fontSize: '15px !important' }} />}
            onClick={onOpenCustomModelModal}
            sx={{ textTransform: 'none', py: 0 }}
          >
            {t('btnDefineModel')}
          </Button>
        )}
      </Box>
      <Grid container spacing={2}>
        {activeCustomFields.map((field) => {
          const val = customData[field.id];
          const isListOrClient = field.type === 'list' || field.type === 'client';
          const resolvedOptions = isListOrClient ? (resolvedListOptionsMap.get(field.id) || EMPTY_ARRAY) : EMPTY_ARRAY;
          return (
            <Grid size={{ xs: 12, md: 6 }} key={field.id}>
              <CustomFieldItem
                field={field}
                value={val}
                disabled={isViewMode}
                resolvedOptions={resolvedOptions}
                onChange={onCustomFieldChange}
                customDataRef={customDataRef}
                t={t}
                getPermitTypeLabel={getPermitTypeLabel}
              />
            </Grid>
          );
        })}
      </Grid>
    </Grid>
  );
});

export interface WasteDisposalModalProps {
  open: boolean;
  onClose: () => void;
  editingItem: ProvidedService | null;
  isViewMode: boolean;
  onEdit?: () => void;
  onSave: (payload: Partial<ProvidedService>) => Promise<boolean | void>;
  isSaving: boolean;
  targetWasteService: Service | null;
  isWasteServiceLoading?: boolean;
  services: Service[];
  clients: Client[];
  projects: Project[];
  invoices: Invoice[];
  canEdit?: boolean;
  canManageServices?: boolean;
  onSaveCustomModel?: (serviceId: string, fields: CustomFieldDefinition[]) => Promise<void>;
  onSaveInvoice?: (invoice: Partial<Invoice>) => Promise<SaveResult | void> | void;
  onDeleteInvoice?: (id: string) => void;
  onStatusChangeInvoice?: (id: string, status: string, paymentDate?: string) => void;
  setErrorDialogState: (state: { open: boolean; message: string }) => void;
}

interface FormData {
  serviceId: string;
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
  invoiceId: string;
  status: string;
  scheduledDate: string;
  completionDate: string;
  location: string;
  notes: string;
  customData: Record<string, any>;
}

export const WasteDisposalModal: React.FC<WasteDisposalModalProps> = React.memo(({
  open,
  onClose,
  editingItem,
  isViewMode,
  onEdit,
  onSave,
  isSaving,
  targetWasteService,
  isWasteServiceLoading = false,
  services,
  clients,
  projects,
  canEdit = false,
  canManageServices = false,
  onSaveCustomModel,
  onSaveInvoice,
  onDeleteInvoice,
  onStatusChangeInvoice,
  setErrorDialogState,
}) => {
  const { t, getPermitTypeLabel } = useLanguage();
  const [isCustomModelModalOpen, setIsCustomModelModalOpen] = useState(false);

  const prepareCustomDataForForm = (item: ProvidedService) => {
    const rawCustomData: Record<string, any> = item.customData ? { ...item.customData } : {};
    const itemService = item.service || services.find((s) => String(s.id) === String(item.serviceId));
    const serviceFields =
      itemService?.customDataModel && Array.isArray(itemService.customDataModel)
        ? itemService.customDataModel
        : [];
    const initialCustomData: Record<string, any> = {};

    if (serviceFields.length > 0) {
      serviceFields.forEach((field) => {
        let val = rawCustomData[field.id];
        const isValEmpty = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
        if (isValEmpty) {
          for (const [k, v] of Object.entries(rawCustomData)) {
            if (v !== undefined && v !== null && v !== '' && (!Array.isArray(v) || v.length > 0) && isKeyMatch(k, field)) {
              val = v;
              break;
            }
          }
        }
        if (val !== undefined && val !== null && val !== '' && (!Array.isArray(val) || val.length > 0)) {
          initialCustomData[field.id] = val;
        }
      });
      // Preserve any other non-matched keys
      for (const [k, v] of Object.entries(rawCustomData)) {
        if (initialCustomData[k] === undefined && !serviceFields.some((f) => isKeyMatch(k, f))) {
          initialCustomData[k] = v;
        }
      }
    } else {
      Object.assign(initialCustomData, rawCustomData);
    }
    return initialCustomData;
  };

  const [formData, setFormData] = useState<FormData>(() => ({
    serviceId: targetWasteService?.id || '',
    clientId: '',
    clientName: '',
    projectId: '',
    projectName: '',
    invoiceId: '',
    status: 'Planned',
    scheduledDate: new Date().toISOString().slice(0, 10),
    completionDate: '',
    location: '',
    notes: '',
    customData: {},
  }));

  const locationRef = useRef<string>(formData.location);
  const notesRef = useRef<string>(formData.notes);
  const customDataRef = useRef<Record<string, any>>(formData.customData);

  // Re-sync local formData when dialog opens or editing item changes
  useEffect(() => {
    if (!open) return;
    if (editingItem) {
      const initialCustom = prepareCustomDataForForm(editingItem);
      locationRef.current = editingItem.location || '';
      notesRef.current = editingItem.notes || '';
      customDataRef.current = initialCustom;
      setFormData({
        serviceId: editingItem.serviceId || '',
        clientId: editingItem.clientId || '',
        clientName: editingItem.client?.name || '',
        projectId: editingItem.projectId || '',
        projectName: editingItem.project?.name || '',
        invoiceId: editingItem.invoiceId || '',
        status: editingItem.status || 'Planned',
        scheduledDate: editingItem.scheduledDate ? editingItem.scheduledDate.slice(0, 10) : '',
        completionDate: editingItem.completionDate ? editingItem.completionDate.slice(0, 10) : '',
        location: editingItem.location || '',
        notes: editingItem.notes || '',
        customData: initialCustom,
      });
    } else {
      locationRef.current = '';
      notesRef.current = '';
      customDataRef.current = {};
      setFormData({
        serviceId: targetWasteService?.id || '',
        clientId: '',
        clientName: '',
        projectId: '',
        projectName: '',
        invoiceId: '',
        status: 'Planned',
        scheduledDate: new Date().toISOString().slice(0, 10),
        completionDate: '',
        location: '',
        notes: '',
        customData: {},
      });
    }
  }, [open, editingItem]);

  // When targetWasteService finishes loading after modal was opened in new mode
  useEffect(() => {
    if (open && !editingItem && !formData.serviceId && targetWasteService?.id) {
      setFormData((prev) => ({
        ...prev,
        serviceId: targetWasteService.id,
      }));
    }
  }, [open, editingItem, formData.serviceId, targetWasteService]);

  const selectedService = useMemo(() => {
    if (targetWasteService && String(targetWasteService.id) === String(formData.serviceId)) {
      return targetWasteService;
    }
    return (
      services.find((s) => String(s.id) === String(formData.serviceId)) ||
      (editingItem?.serviceId === formData.serviceId ? editingItem?.service : undefined)
    );
  }, [services, formData.serviceId, editingItem, targetWasteService]);

  const activeCustomFields: CustomFieldDefinition[] = useMemo(() => {
    if (selectedService?.customDataModel && Array.isArray(selectedService.customDataModel) && selectedService.customDataModel.length > 0) {
      return selectedService.customDataModel;
    }
    return [
      { id: 'vrsta_otpada', name: 'Vrsta otpada', type: 'text' },
      { id: 'kolicina', name: 'Količina (kg)', type: 'number', unit: 'kg' },
      { id: 'indeksni_broj', name: 'Indeksni broj otpada', type: 'text' },
      { id: 'kretanje_otpada_br', name: 'Dokument o kretanju otpada br.', type: 'text' },
    ];
  }, [selectedService]);

  const { resolveListOptions } = useLinkedListOptions({
    enabled: open,
    fields: activeCustomFields,
    clients,
  });

  // Performance: memoize list options per field to prevent recalculating permits & sorting on every keystroke
  const resolvedListOptionsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    activeCustomFields.forEach((field) => {
      if (field.type === 'list' && field.linkedList !== 'clients' && field.linkedList !== 'index_number') {
        map.set(field.id, resolveListOptions(field));
      }
    });
    return map;
  }, [activeCustomFields, resolveListOptions]);

  // Performance: memoize autocomplete initial options to avoid triggering CustomAutocomplete cache effects
  const serviceInitialOption = useMemo(() => {
    return (
      editingItem?.service ||
      (targetWasteService && String(targetWasteService.id) === String(formData.serviceId) ? targetWasteService : undefined) ||
      services.find((s) => s.id === formData.serviceId)
    );
  }, [editingItem?.service, targetWasteService, formData.serviceId, services]);

  const clientInitialOption = useMemo(() => {
    if (editingItem?.client) return editingItem.client;
    if (formData.clientId && formData.clientName) {
      return { id: formData.clientId, name: formData.clientName } as any;
    }
    return null;
  }, [editingItem?.client, formData.clientId, formData.clientName]);

  const projectInitialOption = useMemo(() => {
    if (editingItem?.project) return editingItem.project;
    if (formData.projectId && formData.projectName) {
      return { id: formData.projectId, name: formData.projectName } as any;
    }
    return null;
  }, [editingItem?.project, formData.projectId, formData.projectName]);

  const handleServiceChange = useCallback((val: string | null) => {
    setFormData((prev) => ({ ...prev, serviceId: val || '' }));
  }, []);

  const handleClientChange = useCallback((newClientId: string | null, opt?: Client) => {
    setFormData((prev) => {
      const clientChanged = prev.clientId !== (newClientId || '');
      const matchingProjects = newClientId ? projects.filter((p) => p.clientId === newClientId) : [];
      const singleProject = matchingProjects.length === 1 ? matchingProjects[0] : null;
      const newLocation = opt?.city ? opt.city : (clientChanged ? '' : prev.location);
      locationRef.current = newLocation;
      return {
        ...prev,
        clientId: newClientId || '',
        clientName: opt?.name || '',
        projectId: clientChanged ? (singleProject ? singleProject.id : '') : prev.projectId,
        projectName: clientChanged ? (singleProject ? singleProject.name : '') : prev.projectName,
        invoiceId: clientChanged ? '' : prev.invoiceId,
        location: newLocation,
      };
    });
  }, [projects]);

  const handleProjectChange = useCallback((newProjectId: string | null, opt?: Project) => {
    setFormData((prev) => {
      const updates: Partial<typeof prev> = {
        projectId: newProjectId || '',
        projectName: opt?.name || '',
      };
      if (opt && !prev.clientId && (opt.clientId || opt.clientName)) {
        updates.clientId = opt.clientId || '';
        updates.clientName = opt.clientName || '';
      }
      return {
        ...prev,
        ...updates,
      };
    });
  }, []);

  const handleStatusChange = useCallback((e: any) => {
    setFormData((prev) => ({ ...prev, status: e.target.value }));
  }, []);

  const handleScheduledDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, scheduledDate: e.target.value }));
  }, []);

  const handleCompletionDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, completionDate: e.target.value }));
  }, []);

  const handleLocationChange = useCallback((newLoc: string) => {
    locationRef.current = newLoc;
    setFormData((prev) => (prev.location === newLoc ? prev : { ...prev, location: newLoc }));
  }, []);

  const handleNotesChange = useCallback((newNotes: string) => {
    notesRef.current = newNotes;
    setFormData((prev) => (prev.notes === newNotes ? prev : { ...prev, notes: newNotes }));
  }, []);

  const handleCustomFieldChange = useCallback((fieldId: string, val: any) => {
    if (customDataRef.current) {
      customDataRef.current[fieldId] = val;
    }
    setFormData((prev) => ({
      ...prev,
      customData: {
        ...prev.customData,
        [fieldId]: val,
      },
    }));
  }, []);

  const handleOpenCustomModelModal = useCallback(() => {
    setIsCustomModelModalOpen(true);
  }, []);

  const handleSelectInvoiceId = useCallback((invId: string) => {
    setFormData((prev) => (prev.invoiceId === invId ? prev : { ...prev, invoiceId: invId }));
  }, []);

  const invoicesListProp = useMemo(() => {
    return editingItem?.invoice ? [editingItem.invoice] : EMPTY_ARRAY;
  }, [editingItem?.invoice?.id]);

  const handleSave = async () => {
    if (!formData.serviceId) {
      setErrorDialogState({ open: true, message: t('alertServiceRequired') });
      return;
    }
    if (!formData.clientId) {
      setErrorDialogState({ open: true, message: t('alertClientRequired') });
      return;
    }

    const effectiveLocation = locationRef.current !== undefined ? locationRef.current : formData.location;
    const effectiveNotes = notesRef.current !== undefined ? notesRef.current : formData.notes;
    const effectiveCustomData = customDataRef.current !== undefined ? customDataRef.current : formData.customData;

    const payload: Partial<ProvidedService> = {
      ...(editingItem?.id ? { id: editingItem.id } : {}),
      serviceId: formData.serviceId,
      clientId: formData.clientId,
      projectId: formData.projectId || null,
      invoiceId: formData.invoiceId || null,
      status: formData.status,
      scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate).toISOString() : null,
      completionDate: formData.completionDate ? new Date(formData.completionDate).toISOString() : null,
      location: effectiveLocation || null,
      notes: effectiveNotes || null,
      customData: Object.keys(effectiveCustomData).length > 0 ? effectiveCustomData : null,
    };

    await onSave(payload);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {isViewMode
            ? t('providedServicesSummary')
            : editingItem
            ? t('modalEditWasteDisposal')
            : t('modalNewWasteDisposal')}
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* SERVICE SELECTOR */}
            <Grid size={{ xs: 12, md: 6 }}>
              <ServiceAutocomplete
                size="small"
                fullWidth
                value={formData.serviceId}
                initialOption={serviceInitialOption}
                valueMode="id"
                onChange={handleServiceChange}
                readOnly={
                  isViewMode ||
                  (!editingItem
                    ? Boolean(isWasteServiceLoading || targetWasteService)
                    : isWasteDisposalService(editingItem?.service))
                }
                disabled={isViewMode}
                required
                label={t('colService')}
              />
            </Grid>

            {/* CLIENT SELECTOR */}
            <Grid size={{ xs: 12, md: 6 }}>
              <ClientAutocomplete
                size="small"
                fullWidth
                disabled={isViewMode}
                value={formData.clientId}
                initialOption={clientInitialOption}
                valueMode="id"
                onChange={handleClientChange}
                required
                label={t('colClient')}
              />
            </Grid>

            {/* PROJECT SELECTOR (OPTIONAL) */}
            <Grid size={{ xs: 12, md: 6 }}>
              <ProjectAutocomplete
                size="small"
                fullWidth
                disabled={isViewMode}
                value={formData.projectId}
                clientId={formData.clientId || undefined}
                initialOption={projectInitialOption}
                valueMode="id"
                onChange={handleProjectChange}
                label={t('colProject')}
                placeholder={t('lblNoneOptional')}
              />
            </Grid>

            {/* STATUS SELECTOR */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth size="small" disabled={isViewMode}>
                <InputLabel>{t('colStatus')}</InputLabel>
                <Select
                  value={formData.status}
                  label={t('colStatus')}
                  onChange={handleStatusChange}
                >
                  <MenuItem value="Planned">{t('statusPlanned')}</MenuItem>
                  <MenuItem value="In Progress">{t('statusInProgress')}</MenuItem>
                  <MenuItem value="Completed">{t('statusCompleted')}</MenuItem>
                  <MenuItem value="Cancelled">{t('statusCancelled')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* SCHEDULED DATE */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label={t('colScheduledDate')}
                slotProps={{ inputLabel: { shrink: true } }}
                value={formData.scheduledDate}
                disabled={isViewMode}
                onChange={handleScheduledDateChange}
              />
            </Grid>

            {/* COMPLETION DATE */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label={t('colCompletionDate')}
                slotProps={{ inputLabel: { shrink: true } }}
                value={formData.completionDate}
                disabled={isViewMode}
                onChange={handleCompletionDateChange}
              />
            </Grid>

            {/* LOCATION */}
            <Grid size={{ xs: 12 }}>
              <FastTextField
                fullWidth
                size="small"
                label={t('colLocation')}
                value={formData.location}
                disabled={isViewMode}
                valueRef={locationRef}
                onChange={handleLocationChange}
              />
            </Grid>

            {/* DYNAMIC CUSTOM FIELDS */}
            <CustomFieldsSection
              activeCustomFields={activeCustomFields}
              customData={formData.customData}
              customDataRef={customDataRef}
              resolvedListOptionsMap={resolvedListOptionsMap}
              isViewMode={isViewMode}
              canManageServices={canManageServices}
              selectedService={selectedService}
              onOpenCustomModelModal={handleOpenCustomModelModal}
              onCustomFieldChange={handleCustomFieldChange}
              t={t}
              getPermitTypeLabel={getPermitTypeLabel}
            />

            {/* INVOICE LINKING SECTION */}
            <Grid size={{ xs: 12 }}>
              <ProvidedServiceInvoiceSection
                clientId={formData.clientId}
                clientName={formData.clientName}
                projectId={formData.projectId}
                projectName={formData.projectName}
                selectedInvoiceId={formData.invoiceId}
                onSelectInvoiceId={handleSelectInvoiceId}
                initialInvoice={editingItem?.invoice}
                invoices={invoicesListProp}
                onSaveInvoice={onSaveInvoice}
                onDeleteInvoice={onDeleteInvoice}
                onStatusChangeInvoice={onStatusChangeInvoice}
                setErrorDialogState={setErrorDialogState}
                disabled={isViewMode}
              />
            </Grid>

            {/* NOTES */}
            <Grid size={{ xs: 12 }}>
              <FastTextField
                fullWidth
                multiline
                rows={3}
                size="small"
                label={t('lblNotes')}
                value={formData.notes}
                disabled={isViewMode}
                valueRef={notesRef}
                onChange={handleNotesChange}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          {isViewMode ? (
            <>
              {canEdit && onEdit && (
                <Button
                  variant="outlined"
                  onClick={onEdit}
                  startIcon={<EditIcon />}
                >
                  {t('btnEdit')}
                </Button>
              )}
              <Button onClick={onClose}>{t('btnClose')}</Button>
            </>
          ) : (
            <>
              <Button onClick={onClose} disabled={isSaving}>
                {t('btnCancel')}
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={isSaving}
              >
                {t('btnSave')}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {onSaveCustomModel && isCustomModelModalOpen && (
        <CustomDataModelModal
          isOpen={isCustomModelModalOpen}
          onClose={() => setIsCustomModelModalOpen(false)}
          service={selectedService || null}
          initialFields={
            selectedService?.customDataModel && Array.isArray(selectedService.customDataModel)
              ? selectedService.customDataModel
              : EMPTY_ARRAY
          }
          onSave={onSaveCustomModel}
        />
      )}
    </>
  );
});
