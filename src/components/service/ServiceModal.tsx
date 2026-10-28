import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Chip,
  Grid,
} from '@mui/material';
import { DeleteIcon, SettingsIcon, AddIcon } from '../icons';
import { useLanguage } from '../../context/LanguageContext';
import { CategoryAutocomplete } from '../common/autocomplete';
import type { Service, Category, CustomFieldDefinition } from '../../types';

export interface ServiceModalProps {
  open: boolean;
  onClose: () => void;
  editingService: Service | null;
  categories: Category[];
  getServiceLabel?: (code: string) => string;
  canDelete?: boolean;
  canEdit?: boolean;
  canCreate?: boolean;
  onDeleteService?: (id: string) => void;
  onSaveService: (serviceData: any) => Promise<{ success: boolean; error?: string }>;
  onOpenCustomModelModal?: (service: Service) => void;
  getCustomModelForService?: (serviceId: string) => CustomFieldDefinition[];
  onError?: (message: string) => void;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  open,
  onClose,
  editingService,
  categories,
  getServiceLabel,
  canDelete = false,
  canEdit = true,
  canCreate = true,
  onDeleteService,
  onSaveService,
  onOpenCustomModelModal,
  getCustomModelForService,
  onError,
}) => {
  const { t } = useLanguage();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [group, setGroup] = useState('grp-legal');
  const [frequency, setFrequency] = useState(0);
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingService) {
        setCode(editingService.code);
        setName(editingService.name || (getServiceLabel ? getServiceLabel(editingService.code) : editingService.code));
        setGroup(editingService.group);
        setFrequency(editingService.frequency || 0);
        setDescription(editingService.description || '');
      } else {
        setCode('');
        setName('');
        setGroup(categories[0]?.code || 'grp-legal');
        setFrequency(0);
        setDescription('');
      }
    }
  }, [open, editingService, categories, getServiceLabel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit && !canCreate) return;
    if (!name.trim()) {
      onError?.(t('alertServiceNameRequired'));
      return;
    }
    if (!editingService && !code.trim()) {
      onError?.(t('alertServiceCodeRequired'));
      return;
    }

    setIsSaving(true);
    try {
      const res = await onSaveService({
        id: editingService?.id,
        code: editingService ? editingService.code : code,
        name: name.trim(),
        group: group.trim(),
        frequency,
        description: description.trim() ? description.trim() : undefined,
      });

      if (res.success) {
        onClose();
      } else if (res.error) {
        onError?.(res.error || t('errorSavingService'));
      }
    } catch (err: any) {
      onError?.(err?.message || t('errorSavingService'));
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
          {editingService ? t('modalEditService') : t('modalNewService')}
        </Typography>
        {editingService && canDelete && onDeleteService && (
          <Button
            color="error"
            size="small"
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={() => {
              onDeleteService(editingService.id);
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
              label={t('lblServiceCode')}
              placeholder={t('phServiceCode')}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={Boolean(editingService)}
              required
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              label={t('lblServiceName')}
              placeholder={t('phServiceName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CategoryAutocomplete
              size="small"
              fullWidth
              value={group}
              valueMode="code"
              onChange={(val) => setGroup(val || '')}
              label={t('lblCategoryGroup')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              slotProps={{ htmlInput: { min: 0, max: 24 } }}
              label={t('lblFrequencyMonths')}
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              helperText={t('hintFrequencyZero')}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={3}
              label={t('lblDescription')}
              placeholder={t('phDescription')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Grid>

          {/* CUSTOM DATA MODEL SECTION IN EDIT DIALOG */}
          {editingService && (
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  mt: 1,
                  p: 2,
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {t('customDataSection')}
                  </Typography>
                  {canEdit && onOpenCustomModelModal && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<SettingsIcon />}
                      onClick={() => onOpenCustomModelModal(editingService)}
                      sx={{ textTransform: 'none' }}
                    >
                      {t('btnEditCustomDataModel')}
                    </Button>
                  )}
                </Box>

                {(() => {
                  const fields = getCustomModelForService ? getCustomModelForService(editingService.id) : [];
                  if (fields.length === 0) {
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {t('noCustomFieldsDefined')}
                        </Typography>
                        {canEdit && onOpenCustomModelModal && (
                          <Button
                            size="small"
                            variant="text"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => onOpenCustomModelModal(editingService)}
                            sx={{ textTransform: 'none' }}
                          >
                            {t('btnDefineModel')}
                          </Button>
                        )}
                      </Box>
                    );
                  }
                  return (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
                      {fields.map((f) => (
                        <Chip
                          key={f.id}
                          size="small"
                          variant="outlined"
                          color="primary"
                          label={`${f.name} (${f.type}${f.unit ? ` - ${f.unit}` : ''})`}
                        />
                      ))}
                    </Box>
                  );
                })()}
              </Box>
            </Grid>
          )}
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

export default ServiceModal;
