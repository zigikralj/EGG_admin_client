import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TextField,
  Typography,
  Box,
  Chip,
  Grid,
  Button,
} from '@mui/material';
import { SettingsIcon, AddIcon } from '../icons';
import { useLanguage } from '../../context/LanguageContext';
import { CategoryAutocomplete } from '../common/autocomplete';
import { ViewEditModalBase, type ModalMode } from '../common/modal/ViewEditModalBase';
import { ViewEditField } from '../common/modal/ViewEditField';
import type { Service, Category, CustomFieldDefinition } from '../../types';

export interface ServiceModalProps {
  open: boolean;
  onClose: () => void;
  editingService: Service | null;
  mode?: ModalMode;
  initialMode?: ModalMode;
  onModeChange?: (mode: ModalMode) => void;
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
  mode: controlledMode,
  initialMode,
  onModeChange: onModeChangeProp,
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

  const [internalMode, setInternalMode] = useState<ModalMode>(() => {
    if (controlledMode) return controlledMode;
    if (initialMode) return initialMode;
    return editingService ? 'view' : 'create';
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
        setInternalMode(editingService ? 'view' : 'create');
      }
    }
  }, [open, editingService?.id, initialMode, controlledMode]);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [group, setGroup] = useState('grp-legal');
  const [frequency, setFrequency] = useState(0);
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const populateFromService = useCallback((s: Service | null) => {
    if (s) {
      setCode(s.code || '');
      setName(s.name || (getServiceLabel ? getServiceLabel(s.code) : s.code) || '');
      setGroup(s.group || categories[0]?.code || 'grp-legal');
      setFrequency(s.frequency || 0);
      setDescription(s.description || '');
    } else {
      setCode('');
      setName('');
      setGroup(categories[0]?.code || 'grp-legal');
      setFrequency(0);
      setDescription('');
    }
  }, [categories, getServiceLabel]);

  useEffect(() => {
    if (open) {
      populateFromService(editingService);
    }
  }, [open, editingService, populateFromService]);

  const handleCancel = () => {
    if (currentMode === 'edit' && editingService) {
      populateFromService(editingService);
      handleModeChange('view');
    } else {
      onClose();
    }
  };

  const getCategoryName = useCallback(
    (grpCode: string) => {
      const found = categories.find((c) => c.code === grpCode);
      return found ? found.name : grpCode;
    },
    [categories]
  );

  const formatFrequency = useCallback(
    (freq: number) => {
      if (freq === 0) return t('freqNoReminder');
      if (freq === 3) return t('freqQuarterly');
      if (freq === 6) return t('freqSemiAnnually');
      return t('freqEveryXMonths', { freq });
    },
    [t]
  );

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isView) return;
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

  const modalTitle = currentMode === 'create'
    ? t('modalNewService')
    : currentMode === 'edit'
    ? t('modalEditService')
    : (editingService?.name || t('btnDetails'));

  const customFields = useMemo(() => {
    if (!editingService || !getCustomModelForService) return [];
    return getCustomModelForService(editingService.id);
  }, [editingService, getCustomModelForService]);

  return (
    <ViewEditModalBase
      open={open}
      onClose={onClose}
      mode={currentMode}
      onModeChange={handleModeChange}
      title={modalTitle}
      subtitle={editingService?.code}
      statusChip={editingService ? (
        <Chip
          label={getCategoryName(group)}
          size="small"
          color="primary"
          variant="outlined"
        />
      ) : undefined}
      canEdit={canEdit}
      canDelete={Boolean(editingService && canDelete && onDeleteService)}
      onDelete={() => {
        if (editingService) {
          onDeleteService?.(editingService.id);
          onClose();
        }
      }}
      isSaving={isSaving}
      onSave={handleSubmit}
      onCancel={handleCancel}
      maxWidth="sm"
    >
      <Grid container spacing={2}>
        {/* Service Code */}
        <Grid size={{ xs: 12 }}>
          <ViewEditField
            mode={currentMode}
            label={t('lblServiceCode')}
            value={code}
            viewRender={() => (
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {code || '—'}
              </Typography>
            )}
          >
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
          </ViewEditField>
        </Grid>

        {/* Service Name */}
        <Grid size={{ xs: 12 }}>
          <ViewEditField
            mode={currentMode}
            label={t('lblServiceName')}
            value={name}
            viewRender={() => (
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {name || '—'}
              </Typography>
            )}
          >
            <TextField
              fullWidth
              size="small"
              label={t('lblServiceName')}
              placeholder={t('phServiceName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </ViewEditField>
        </Grid>

        {/* Category Group */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <ViewEditField
            mode={currentMode}
            label={t('lblCategoryGroup')}
            value={getCategoryName(group)}
            viewRender={() => (
              <Chip
                label={getCategoryName(group)}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          >
            <CategoryAutocomplete
              size="small"
              fullWidth
              value={group}
              valueMode="code"
              onChange={(val) => setGroup(val || '')}
              label={t('lblCategoryGroup')}
            />
          </ViewEditField>
        </Grid>

        {/* Frequency */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <ViewEditField
            mode={currentMode}
            label={t('lblFrequencyMonths')}
            value={formatFrequency(frequency)}
            viewRender={() => (
              <Typography variant="body2">
                {formatFrequency(frequency)}
              </Typography>
            )}
          >
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
          </ViewEditField>
        </Grid>

        {/* Description */}
        <Grid size={{ xs: 12 }}>
          <ViewEditField
            mode={currentMode}
            label={t('lblDescription')}
            value={description}
            viewRender={() => (
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: description ? 'text.primary' : 'text.secondary' }}>
                {description || '—'}
              </Typography>
            )}
          >
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
          </ViewEditField>
        </Grid>

        {/* CUSTOM DATA MODEL SECTION IN EDIT / VIEW DIALOG */}
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
                {!isView && canEdit && onOpenCustomModelModal && (
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

              {customFields.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('noCustomFieldsDefined')}
                  </Typography>
                  {!isView && canEdit && onOpenCustomModelModal && (
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
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
                  {customFields.map((f) => (
                    <Chip
                      key={f.id}
                      size="small"
                      variant="outlined"
                      color="primary"
                      label={`${f.name} (${f.type}${f.unit ? ` - ${f.unit}` : ''})`}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Grid>
        )}
      </Grid>
    </ViewEditModalBase>
  );
};

export default ServiceModal;
