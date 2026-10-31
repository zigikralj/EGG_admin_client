import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  Grid,
  Chip,
  Box,
} from '@mui/material';
import { useLanguage } from '../../context/LanguageContext';
import { PermitAutocomplete } from '../common/autocomplete';
import { ViewEditModalBase, type ModalMode } from '../common/modal/ViewEditModalBase';
import { ViewEditField } from '../common/modal/ViewEditField';
import type { Client, Permit } from '../../types';

export interface ClientModalProps {
  open: boolean;
  onClose: () => void;
  editingClient: Client | null;
  mode?: ModalMode;
  initialMode?: ModalMode;
  onModeChange?: (mode: ModalMode) => void;
  canDelete?: boolean;
  canEdit?: boolean;
  canCreate?: boolean;
  onDeleteClient?: (id: string) => void;
  onSaveClient: (clientData: Partial<Client>) => Promise<{ success: boolean; error?: string }>;
  onError?: (message: string) => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  open,
  onClose,
  editingClient,
  mode: controlledMode,
  initialMode,
  onModeChange: onModeChangeProp,
  canDelete = false,
  canEdit = true,
  canCreate = true,
  onDeleteClient,
  onSaveClient,
  onError,
}) => {
  const { t } = useLanguage();

  // Mode state: 'view' | 'edit' | 'create'
  const [internalMode, setInternalMode] = useState<ModalMode>(() => {
    if (controlledMode) return controlledMode;
    if (initialMode) return initialMode;
    return editingClient ? 'view' : 'create';
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
        setInternalMode(editingClient ? 'view' : 'create');
      }
    }
  }, [open, editingClient?.id, initialMode, controlledMode]);

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [selectedPermitIds, setSelectedPermitIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const getClientPermits = useCallback((c: Client): Permit[] => {
    if (c.permits && c.permits.length > 0) return c.permits;
    if (c.permit) return [c.permit];
    return [];
  }, []);

  const resetFormToClient = useCallback((client: Client | null) => {
    if (client) {
      setName(client.name || '');
      setContactPerson(client.contactPerson || '');
      setEmail(client.email || '');
      setPhone(client.phone || '');
      setCity(client.city || '');
      const clientPermits = getClientPermits(client);
      setSelectedPermitIds(clientPermits.map((p) => p.id));
    } else {
      setName('');
      setContactPerson('');
      setEmail('');
      setPhone('');
      setCity('');
      setSelectedPermitIds([]);
    }
  }, [getClientPermits]);

  useEffect(() => {
    if (open) {
      resetFormToClient(editingClient);
    }
  }, [open, editingClient, resetFormToClient]);

  const handleCancel = () => {
    if (currentMode === 'edit' && editingClient) {
      resetFormToClient(editingClient);
      handleModeChange('view');
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isView) return;
    if (!canEdit && !canCreate) return;
    if (!name.trim()) {
      onError?.(t('alertClientNameRequired'));
      return;
    }
    setIsSaving(true);
    try {
      const res = await onSaveClient({
        id: editingClient?.id,
        name: name.trim(),
        contactPerson: contactPerson.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        city: city.trim() || null,
        permitId: selectedPermitIds[0] || null,
        permitIds: selectedPermitIds,
      } as any);

      if (res.success) {
        onClose();
      } else if (res.error) {
        onError?.(res.error || t('errorSavingClient'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const modalTitle = (m: ModalMode) => {
    if (m === 'view') return editingClient?.name || t('btnDetails');
    if (m === 'edit') return t('modalEditClient');
    return t('modalNewClient');
  };

  const clientPermits = editingClient ? getClientPermits(editingClient) : [];

  return (
    <ViewEditModalBase
      open={open}
      onClose={onClose}
      mode={currentMode}
      onModeChange={handleModeChange}
      title={modalTitle}
      maxWidth="sm"
      canEdit={canEdit}
      canDelete={canDelete && Boolean(editingClient?.id)}
      onDelete={onDeleteClient && editingClient ? () => { onDeleteClient(editingClient.id); onClose(); } : undefined}
      onSave={handleSubmit}
      onCancel={handleCancel}
      isSaving={isSaving}
    >
      <Grid container spacing={2}>
        {/* Client Name */}
        <Grid size={{ xs: 12 }}>
          <ViewEditField
            label={t('lblClientCompany')}
            isViewMode={isView}
            viewValue={name}
          >
            <TextField
              fullWidth
              size="small"
              label={t('lblClientCompany')}
              placeholder={t('phClientCompany')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </ViewEditField>
        </Grid>

        {/* City */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <ViewEditField
            label={t('lblCity')}
            isViewMode={isView}
            viewValue={city}
          >
            <TextField
              fullWidth
              size="small"
              label={t('lblCity')}
              placeholder={t('phCity')}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </ViewEditField>
        </Grid>

        {/* Contact Person */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <ViewEditField
            label={t('lblContactPerson')}
            isViewMode={isView}
            viewValue={contactPerson}
          >
            <TextField
              fullWidth
              size="small"
              label={t('lblContactPerson')}
              placeholder={t('phContactPerson')}
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
            />
          </ViewEditField>
        </Grid>

        {/* Email */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <ViewEditField
            label={t('lblEmail')}
            isViewMode={isView}
            viewValue={email}
          >
            <TextField
              fullWidth
              size="small"
              type="email"
              label={t('lblEmail')}
              placeholder={t('phEmail')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </ViewEditField>
        </Grid>

        {/* Phone */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <ViewEditField
            label={t('lblPhone')}
            isViewMode={isView}
            viewValue={phone}
          >
            <TextField
              fullWidth
              size="small"
              label={t('lblPhone')}
              placeholder={t('phPhone')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </ViewEditField>
        </Grid>

        {/* Permits */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <ViewEditField
            label={t('lblPermit')}
            isViewMode={isView}
            viewValue={
              clientPermits.length > 0 ? (
                <Box sx={{ display: 'inline-flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {clientPermits.map((p) => (
                    <Chip key={p.id} label={p.permitNumber} size="small" variant="outlined" color="primary" />
                  ))}
                </Box>
              ) : undefined
            }
          >
            <PermitAutocomplete
              multiple
              size="small"
              value={selectedPermitIds}
              initialOption={editingClient?.permits}
              onChange={(ids) => {
                setSelectedPermitIds(ids || []);
              }}
              label={t('lblPermit')}
              placeholder={t('phSelectPermit')}
            />
          </ViewEditField>
        </Grid>
      </Grid>
    </ViewEditModalBase>
  );
};

export default ClientModal;
