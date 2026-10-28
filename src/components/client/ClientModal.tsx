import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Grid,
} from '@mui/material';
import { DeleteIcon } from '../icons';
import { useLanguage } from '../../context/LanguageContext';
import { PermitAutocomplete } from '../common/autocomplete';
import type { Client, Permit } from '../../types';

export interface ClientModalProps {
  open: boolean;
  onClose: () => void;
  editingClient: Client | null;
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
  canDelete = false,
  canEdit = true,
  canCreate = true,
  onDeleteClient,
  onSaveClient,
  onError,
}) => {
  const { t } = useLanguage();

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

  useEffect(() => {
    if (open) {
      if (editingClient) {
        setName(editingClient.name || '');
        setContactPerson(editingClient.contactPerson || '');
        setEmail(editingClient.email || '');
        setPhone(editingClient.phone || '');
        setCity(editingClient.city || '');
        const clientPermits = getClientPermits(editingClient);
        setSelectedPermitIds(clientPermits.map((p) => p.id));
      } else {
        setName('');
        setContactPerson('');
        setEmail('');
        setPhone('');
        setCity('');
        setSelectedPermitIds([]);
      }
    }
  }, [open, editingClient, getClientPermits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
      <DialogTitle
        component="div"
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {editingClient ? t('modalEditClient') : t('modalNewClient')}
        </Typography>
        {editingClient && canDelete && onDeleteClient && (
          <Button
            color="error"
            size="small"
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={() => {
              onDeleteClient(editingClient.id);
              onClose();
            }}
          >
            {t('btnDelete')}
          </Button>
        )}
      </DialogTitle>
      <DialogContent dividers sx={{ flex: 1, overflowY: 'auto' }}>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              label={t('lblClientCompany')}
              placeholder={t('phClientCompany')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              label={t('lblCity')}
              placeholder={t('phCity')}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              label={t('lblContactPerson')}
              placeholder={t('phContactPerson')}
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              type="email"
              label={t('lblEmail')}
              placeholder={t('phEmail')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              label={t('lblPhone')}
              placeholder={t('phPhone')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
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

export default ClientModal;
