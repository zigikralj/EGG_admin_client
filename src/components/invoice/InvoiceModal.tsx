import React, { useState, useEffect, useMemo } from 'react';
import {
  Grid,
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Paper,
  Chip,
} from '@mui/material';
import type {
  Invoice,
  Client,
  Project,
  ProvidedService,
  InvoiceStatus,
  InvoiceCurrency,
  InvoiceType,
} from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { parseInvoiceNotes, serializeInvoiceNotes } from '../../utils/invoiceUtils';
import { AddIcon, DeleteIcon, LinkIcon, ReceiptLongIcon } from '../icons';
import {
  ClientAutocomplete,
  ProjectAutocomplete,
  InvoiceAutocomplete,
  ProvidedServiceAutocomplete,
} from '../common/autocomplete';
import { ViewEditModalBase, type ModalMode } from '../common/modal/ViewEditModalBase';
import { ViewEditField } from '../common/modal/ViewEditField';

export interface InvoiceModalProps {
  open: boolean;
  onClose: () => void;
  editingInvoice: Invoice | null;
  clients?: Client[];
  projects?: Project[];
  providedServices?: ProvidedService[];
  invoices?: Invoice[];
  onSave: (
    payload: Partial<Invoice>,
    providedServiceId?: string,
    initialProvidedServiceId?: string
  ) => Promise<boolean | void>;
  isSaving?: boolean;
  isViewMode?: boolean;
  onToggleEditMode?: () => void;
  initialMode?: ModalMode;
}

const EMPTY_PROVIDED_SERVICES: ProvidedService[] = [];
const EMPTY_INVOICES: Invoice[] = [];

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  open,
  onClose,
  editingInvoice,
  clients: _clients,
  projects: _projects,
  providedServices = EMPTY_PROVIDED_SERVICES,
  invoices = EMPTY_INVOICES,
  onSave,
  isSaving = false,
  isViewMode,
  onToggleEditMode,
  initialMode,
}) => {
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('invoices', 'edit');
  const canDelete = hasPermission('invoices', 'delete');

  // Mode state: 'view' | 'edit' | 'create'
  const [mode, setMode] = useState<ModalMode>(() => {
    if (initialMode) return initialMode;
    if (isViewMode !== undefined) return isViewMode ? 'view' : 'edit';
    return editingInvoice ? 'view' : 'create';
  });

  useEffect(() => {
    if (open) {
      if (initialMode) {
        setMode(initialMode);
      } else if (isViewMode !== undefined) {
        setMode(isViewMode ? 'view' : 'edit');
      } else {
        setMode(editingInvoice ? 'view' : 'create');
      }
    }
  }, [open, editingInvoice?.id, isViewMode, initialMode]);

  const isView = mode === 'view';

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceType: 'Standard' as InvoiceType,
    parentInvoiceId: '',
    dateCreated: '',
    dueDate: '',
    paymentDate: '',
    clientId: '',
    clientName: '',
    projectId: '',
    projectName: '',
    providedServiceId: '',
    status: 'Draft' as InvoiceStatus,
    currency: 'RSD' as InvoiceCurrency,
    notes: '',
    items: [
      {
        description: '',
        quantity: 1,
        unitPrice: 0,
        currency: 'RSD' as InvoiceCurrency,
      },
    ],
  });

  const [initialPsId, setInitialPsId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    setErrorMsg('');

    if (editingInvoice) {
      const { invoiceType: parsedType, parentInvoiceId: parsedParentId, cleanNotes } = parseInvoiceNotes(
        editingInvoice.notes
      );
      const linkedPs = (editingInvoice as any)?.providedServices?.[0] || (editingInvoice as any)?.providedService;
      const initialPs = linkedPs ? linkedPs.id : ((editingInvoice as any)?.providedServiceId || '');
      setInitialPsId(initialPs);

      setFormData({
        invoiceNumber: editingInvoice.invoiceNumber || '',
        invoiceType: (editingInvoice.invoiceType || parsedType || 'Standard') as InvoiceType,
        parentInvoiceId: editingInvoice.parentInvoiceId || parsedParentId || '',
        dateCreated: editingInvoice.dateCreated || '',
        dueDate: editingInvoice.dueDate || '',
        paymentDate: editingInvoice.paymentDate || '',
        clientId: editingInvoice.clientId || editingInvoice.client?.id || '',
        clientName: editingInvoice.clientName || editingInvoice.client?.name || '',
        projectId: editingInvoice.projectId || editingInvoice.project?.id || '',
        projectName: editingInvoice.projectName || editingInvoice.project?.name || '',
        providedServiceId: initialPs,
        status: (editingInvoice.status as InvoiceStatus) || 'Draft',
        currency: (editingInvoice.currency as InvoiceCurrency) || 'RSD',
        notes: cleanNotes || '',
        items:
          editingInvoice.items && editingInvoice.items.length > 0
            ? editingInvoice.items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                currency:
                  (item.currency as InvoiceCurrency) ||
                  (editingInvoice.currency as InvoiceCurrency) ||
                  'RSD',
              }))
            : [
                {
                  description: '',
                  quantity: 1,
                  unitPrice: 0,
                  currency: (editingInvoice.currency as InvoiceCurrency) || 'RSD',
                },
              ],
      });
    } else {
      setInitialPsId('');
      setFormData({
        invoiceNumber: '',
        invoiceType: 'Standard',
        parentInvoiceId: '',
        dateCreated: new Date().toISOString().slice(0, 10),
        dueDate: '',
        paymentDate: '',
        clientId: '',
        clientName: '',
        projectId: '',
        projectName: '',
        providedServiceId: '',
        status: 'Draft',
        currency: 'RSD',
        notes: '',
        items: [{ description: '', quantity: 1, unitPrice: 0, currency: 'RSD' }],
      });
    }
  }, [open, editingInvoice]);

  // Available parent invoices for linking
  const availableParentInvoices = useMemo(() => {
    return (invoices || []).filter((inv) => {
      if (editingInvoice && inv.id === editingInvoice.id) return false;
      return true;
    });
  }, [invoices, editingInvoice]);

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { description: '', quantity: 1, unitPrice: 0, currency: prev.currency },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  // Compute live modal total
  const modalTotal = useMemo(() => {
    return formData.items.reduce(
      (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
      0
    );
  }, [formData.items]);

  const formatAmount = (amount?: number | null, currency?: string | null) => {
    const val = amount || 0;
    const curr = currency || 'RSD';
    const formatted = val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatted} ${curr}`;
  };

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return '—';
    try {
      const clean = iso.split('T')[0];
      const parts = clean.split('-');
      if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}.`;
      }
      return iso;
    } catch {
      return iso;
    }
  };

  const getStatusChipColor = (
    status?: string
  ): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Sent':
        return 'info';
      case 'Overdue':
        return 'error';
      case 'Cancelled':
        return 'default';
      case 'Draft':
      default:
        return 'warning';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'Draft':
        return t('statusDraft');
      case 'Sent':
        return t('statusSent');
      case 'Paid':
        return t('statusPaid');
      case 'Overdue':
        return t('statusOverdue');
      case 'Cancelled':
        return t('statusCancelled');
      default:
        return status || t('statusDraft');
    }
  };

  const getInvoiceTypeChip = (type?: string | null) => {
    if (!type || type === 'Standard') {
      return (
        <Chip
          label={t('typeStandard')}
          size="small"
          variant="outlined"
          sx={{ height: 20, fontSize: '0.7rem', fontWeight: 500, color: 'text.secondary', borderColor: 'divider' }}
        />
      );
    }
    switch (type) {
      case 'Advance':
        return (
          <Chip
            label={t('badgeAdvance')}
            size="small"
            color="secondary"
            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, px: 0.25 }}
          />
        );
      case 'Final':
        return (
          <Chip
            label={t('badgeFinal')}
            size="small"
            color="primary"
            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, px: 0.25 }}
          />
        );
      case 'Partial':
        return (
          <Chip
            label={t('badgePartial')}
            size="small"
            color="info"
            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, px: 0.25 }}
          />
        );
      default:
        return <Chip label={type} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />;
    }
  };

  const getLinkedInvoiceLabel = (linkedInv?: Invoice | null) => {
    const type = linkedInv?.invoiceType || 'Standard';
    switch (type) {
      case 'Advance':
        return t('badgeAdvance');
      case 'Final':
        return t('badgeFinal');
      case 'Partial':
        return t('badgePartial');
      default:
        return t('typeStandard');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.invoiceNumber.trim()) {
      setErrorMsg(t('alertInvoiceNumberRequired'));
      return;
    }
    if (!formData.dueDate || !formData.dueDate.trim()) {
      setErrorMsg(t('alertDueDateRequired'));
      return;
    }
    if (!formData.clientId && !formData.clientName) {
      setErrorMsg(t('alertClientRequired'));
      return;
    }

    const combinedNotes = serializeInvoiceNotes(
      formData.notes,
      formData.invoiceType,
      formData.parentInvoiceId
    );

    const payload: Partial<Invoice> = {
      ...(editingInvoice ? { id: editingInvoice.id } : {}),
      invoiceNumber: formData.invoiceNumber.trim(),
      invoiceType: formData.invoiceType,
      parentInvoiceId: formData.parentInvoiceId || null,
      dateCreated: formData.dateCreated || null,
      dueDate: formData.dueDate || null,
      paymentDate: formData.paymentDate || null,
      clientId: formData.clientId || null,
      clientName: formData.clientName || null,
      projectId: formData.projectId || null,
      projectName: formData.projectName || null,
      status: formData.status,
      currency: formData.currency,
      notes: combinedNotes,
      items: formData.items
        .filter((it) => it.description.trim())
        .map((it) => ({
          description: it.description.trim(),
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          currency: it.currency || formData.currency || 'RSD',
        })),
    };

    const res = await onSave(payload, formData.providedServiceId, initialPsId);
    if (res !== false) {
      if (mode === 'edit') {
        setMode('view');
      } else {
        onClose();
      }
    }
  };

  const statusChips = (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, ml: 1 }}>
      {getInvoiceTypeChip(formData.invoiceType)}
      <Chip
        label={getStatusLabel(formData.status)}
        size="small"
        color={getStatusChipColor(formData.status)}
        sx={{ height: 22, fontSize: '0.75rem', fontWeight: 700 }}
      />
    </Box>
  );

  return (
    <ViewEditModalBase
      open={open}
      onClose={onClose}
      mode={mode}
      onModeChange={(newMode) => {
        setMode(newMode);
        if (newMode === 'edit' && onToggleEditMode) {
          onToggleEditMode();
        }
      }}
      title={(currentMode) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptLongIcon color="primary" />
          <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
            {currentMode === 'view'
              ? formData.invoiceNumber || t('modalEditInvoice')
              : editingInvoice
              ? t('modalEditInvoice')
              : t('modalNewInvoice')}
          </Typography>
        </Box>
      )}
      statusChip={statusChips}
      canEdit={canEdit}
      canDelete={canDelete}
      isSaving={isSaving}
      onSave={handleSubmit}
      editLabel={t('btnEdit')}
    >
      {errorMsg && (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'error.main', color: '#fff', borderRadius: 1.5 }}>
          <Typography variant="body2">{errorMsg}</Typography>
        </Box>
      )}

      <Grid container spacing={isView ? 1.5 : 2.5}>
        {/* Unique ID in Edit mode if existing */}
        {!isView && editingInvoice && (
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              label="Unique ID"
              value={editingInvoice.id}
              disabled
              helperText="Immutable unique identifier"
            />
          </Grid>
        )}

        {/* Invoice Number */}
        {!isView && (
          <Grid size={{ xs: 12, sm: 5 }}>
            <TextField
              fullWidth
              size="small"
              required
              label={t('lblInvoiceNumber')}
              placeholder={t('phInvoiceNumber')}
              value={formData.invoiceNumber}
              onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
            />
          </Grid>
        )}

        {/* Invoice Type */}
        {!isView && (
          <Grid size={{ xs: 12, sm: 3.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('lblInvoiceType')}</InputLabel>
              <Select
                value={formData.invoiceType}
                label={t('lblInvoiceType')}
                onChange={(e) =>
                  setFormData({ ...formData, invoiceType: e.target.value as InvoiceType })
                }
              >
                <MenuItem value="Standard">{t('typeStandard')}</MenuItem>
                <MenuItem value="Advance">{t('typeAdvance')}</MenuItem>
                <MenuItem value="Final">{t('typeFinal')}</MenuItem>
                <MenuItem value="Partial">{t('typePartial')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Status */}
        {!isView && (
          <Grid size={{ xs: 12, sm: 3.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('lblInvoiceStatus')}</InputLabel>
              <Select
                value={formData.status}
                label={t('lblInvoiceStatus')}
                onChange={(e) => {
                  const newStatus = e.target.value as InvoiceStatus;
                  setFormData({
                    ...formData,
                    status: newStatus,
                    paymentDate:
                      newStatus === 'Paid' && !formData.paymentDate
                        ? new Date().toISOString().slice(0, 10)
                        : formData.paymentDate,
                  });
                }}
              >
                <MenuItem value="Draft">{t('statusDraft')}</MenuItem>
                <MenuItem value="Sent">{t('statusSent')}</MenuItem>
                <MenuItem value="Paid">{t('statusPaid')}</MenuItem>
                <MenuItem value="Overdue">{t('statusOverdue')}</MenuItem>
                <MenuItem value="Cancelled">{t('statusCancelled')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Client */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <ViewEditField
            mode={mode}
            label={t('lblClient')}
            value={formData.clientName}
            editRender={() => (
              <ClientAutocomplete
                value={formData.clientId}
                initialOption={
                  formData.clientId
                    ? ({ id: formData.clientId, name: formData.clientName } as any)
                    : null
                }
                onChange={(id, opt) => {
                  setFormData({
                    ...formData,
                    clientId: id || '',
                    clientName: opt ? opt.name : '',
                  });
                }}
                required
                label={t('lblClient')}
                placeholder={t('phClient')}
              />
            )}
          />
        </Grid>

        {/* Project */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <ViewEditField
            mode={mode}
            label={t('tabProjects')}
            value={formData.projectName}
            editRender={() => (
              <ProjectAutocomplete
                value={formData.projectId}
                initialOption={
                  formData.projectId
                    ? ({ id: formData.projectId, name: formData.projectName } as any)
                    : null
                }
                clientId={formData.clientId || undefined}
                onChange={(id, opt) => {
                  setFormData({
                    ...formData,
                    projectId: id || '',
                    projectName: opt ? opt.name : '',
                    clientId: opt && opt.clientId ? opt.clientId : formData.clientId,
                    clientName: opt && opt.clientName ? opt.clientName : formData.clientName,
                  });
                }}
                label={t('tabProjects')}
                placeholder={t('phProjectName')}
              />
            )}
          />
        </Grid>

        {/* Linked / Parent Invoice */}
        {(formData.parentInvoiceId || !isView) && (
          <Grid size={{ xs: 12, sm: isView ? 12 : 8 }}>
            <ViewEditField
              mode={mode}
              label={t('lblParentInvoice')}
              value={formData.parentInvoiceId}
              viewRender={() => {
                const parent =
                  (editingInvoice as any)?.parentInvoice ||
                  availableParentInvoices.find((p) => p.id === formData.parentInvoiceId);
                return (
                  <Chip
                    icon={<LinkIcon sx={{ fontSize: '14px !important' }} />}
                    size="small"
                    color="secondary"
                    label={`${getLinkedInvoiceLabel(parent)}: ${
                      parent?.invoiceNumber ||
                      (editingInvoice as any)?.parentInvoiceNumber ||
                      formData.parentInvoiceId
                    }`}
                  />
                );
              }}
              editRender={() => (
                <InvoiceAutocomplete
                  value={formData.parentInvoiceId}
                  initialOption={
                    (editingInvoice as any)?.parentInvoice ||
                    (formData.parentInvoiceId
                      ? ({
                          id: formData.parentInvoiceId,
                          invoiceNumber:
                            (editingInvoice as any)?.parentInvoiceNumber || '',
                        } as any)
                      : null)
                  }
                  onChange={(id) => {
                    setFormData({
                      ...formData,
                      parentInvoiceId: id || '',
                    });
                  }}
                  prioritizeProjectId={formData.projectId || undefined}
                  prioritizeClientId={formData.clientId || undefined}
                  prioritizeClientName={formData.clientName || undefined}
                  excludeIds={editingInvoice ? [editingInvoice.id] : undefined}
                  label={t('lblParentInvoice')}
                  placeholder={t('phSelectParentInvoice')}
                />
              )}
            />
          </Grid>
        )}

        {/* Currency in edit mode */}
        {!isView && (
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('lblCurrency')}</InputLabel>
              <Select
                value={formData.currency}
                label={t('lblCurrency')}
                onChange={(e) => {
                  const newCurr = e.target.value as InvoiceCurrency;
                  setFormData({
                    ...formData,
                    currency: newCurr,
                    items: formData.items.map((it) => ({ ...it, currency: newCurr })),
                  });
                }}
              >
                <MenuItem value="RSD">RSD (Dinar)</MenuItem>
                <MenuItem value="€">€ (Euro)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Provided Service Selection in edit mode */}
        {!isView &&
          (hasPermission('providedServices', 'view') ||
            hasPermission('wasteDisposal', 'view')) && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <ProvidedServiceAutocomplete
                size="small"
                fullWidth
                clientId={formData.clientId || undefined}
                value={formData.providedServiceId}
                initialOption={
                  (editingInvoice as any)?.providedServices?.[0] ||
                  (editingInvoice as any)?.providedService ||
                  (providedServices.find((ps) => ps.id === formData.providedServiceId) || null)
                }
                valueMode="id"
                onChange={(val, opt) => {
                  setFormData((prev) => ({
                    ...prev,
                    providedServiceId: val || '',
                    clientId: opt?.clientId ? opt.clientId : prev.clientId,
                    clientName: opt?.client?.name ? opt.client.name : prev.clientName,
                    projectId: opt?.projectId ? opt.projectId : prev.projectId,
                    projectName: opt?.project?.name ? opt.project.name : prev.projectName,
                  }));
                }}
                label={t('tabProvidedServices')}
                placeholder={t('tabProvidedServices')}
              />
            </Grid>
          )}

        {/* Date Created */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <ViewEditField
            mode={mode}
            label={t('lblDateCreated')}
            value={formData.dateCreated}
            viewRender={formatDate}
            editRender={() => (
              <TextField
                fullWidth
                size="small"
                type="date"
                label={t('lblDateCreated')}
                value={formData.dateCreated}
                onChange={(e) => setFormData({ ...formData, dateCreated: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>

        {/* Due Date */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <ViewEditField
            mode={mode}
            label={t('lblDueDate')}
            value={formData.dueDate}
            viewRender={formatDate}
            editRender={() => (
              <TextField
                fullWidth
                size="small"
                type="date"
                label={t('lblDueDate')}
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>

        {/* Payment Date */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <ViewEditField
            mode={mode}
            label={t('lblPaymentDate')}
            value={formData.paymentDate}
            viewRender={formatDate}
            editRender={() => (
              <TextField
                fullWidth
                size="small"
                type="date"
                label={t('lblPaymentDate')}
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>

        {/* ITEMS SECTION */}
        <Grid size={{ xs: 12 }}>
          <Divider sx={{ my: 1 }} />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1.5,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {t('invoiceItemsSection')}
            </Typography>
            {!isView && (
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddItem}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                {t('btnAddInvoiceItem')}
              </Button>
            )}
          </Box>

          {isView ? (
            <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 2 }}>
              {formData.items.map((item, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    borderBottom: idx < formData.items.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.description || '—'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.quantity} × {formatAmount(item.unitPrice, item.currency || formData.currency)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 100, textAlign: 'right' }}>
                    {formatAmount(item.quantity * item.unitPrice, item.currency || formData.currency)}
                  </Typography>
                </Box>
              ))}
            </Paper>
          ) : (
            formData.items.map((item, index) => (
              <Paper
                key={index}
                variant="outlined"
                sx={{ p: 1.5, mb: 1.5, borderRadius: 2, bgcolor: 'background.paper' }}
              >
                <Grid container spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Grid size={{ xs: 12, sm: 4.5 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t('lblItemDescription')}
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 4, sm: 1.75 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label={t('lblItemQuantity')}
                      slotProps={{ htmlInput: { min: 0.01, step: 'any' } }}
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 4, sm: 2.25 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label={t('lblItemUnitPrice')}
                      slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)
                      }
                    />
                  </Grid>

                  <Grid
                    size={{ xs: 3, sm: 2.75 }}
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                        minWidth: 120,
                      }}
                    >
                      {formatAmount(
                        item.quantity * item.unitPrice,
                        item.currency || formData.currency
                      )}
                    </Typography>
                  </Grid>

                  <Grid
                    size={{ xs: 1, sm: 0.75 }}
                    sx={{
                      textAlign: 'right',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                    }}
                  >
                    {formData.items.length > 1 && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveItem(index)}
                        title={t('btnRemoveInvoiceItem')}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            ))
          )}

          {/* Total Summary */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 2,
              p: 1.5,
              bgcolor: 'action.hover',
              borderRadius: 2,
              mt: 1.5,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {t('colTotalAmount')}:
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
              {formatAmount(modalTotal, formData.currency)}
            </Typography>
          </Box>
        </Grid>

        {/* Notes */}
        {(formData.notes || !isView) && (
          <Grid size={{ xs: 12 }}>
            <ViewEditField
              mode={mode}
              label={t('lblNotes')}
              value={formData.notes}
              viewRender={(val) => (
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {val}
                </Typography>
              )}
              editRender={() => (
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  label={t('lblNotes')}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              )}
            />
          </Grid>
        )}
      </Grid>
    </ViewEditModalBase>
  );
};

export default InvoiceModal;
