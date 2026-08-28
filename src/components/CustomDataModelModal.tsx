import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
} from '@mui/material';
import type { Service, CustomFieldDefinition, CustomFieldType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { AddIcon, DeleteIcon } from './icons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  initialFields: CustomFieldDefinition[];
  onSave: (serviceId: string, fields: CustomFieldDefinition[]) => Promise<void> | void;
}

export const CustomDataModelModal: React.FC<Props> = ({
  isOpen,
  onClose,
  service,
  initialFields,
  onSave,
}) => {
  const { t, getServiceLabel } = useLanguage();
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFields(initialFields ? JSON.parse(JSON.stringify(initialFields)) : []);
      setError(null);
    }
  }, [isOpen, initialFields]);

  const handleAddField = () => {
    const newField: CustomFieldDefinition = {
      id: `field_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: '',
      type: 'text',
      options: [],
    };
    setFields((prev) => [...prev, newField]);
  };

  const handleUpdateField = (index: number, updates: Partial<CustomFieldDefinition>) => {
    setFields((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleDeleteField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    // Validation: make sure all fields have a name
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      if (!f.name.trim()) {
        setError(t('alertServiceRequired'));
        return;
      }
      if (f.type === 'list' && (!f.options || f.options.length === 0)) {
        setError(t('phListOptions'));
        return;
      }
    }

    setIsSaving(true);
    try {
      await onSave(service.id, fields);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save custom data model');
    } finally {
      setIsSaving(false);
    }
  };

  const serviceTitle = service ? (service.name || getServiceLabel(service.code)) : '';

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('modalCustomDataModelTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {serviceTitle ? `${t('modalCustomDataModelDesc')}: ${serviceTitle}` : t('modalCustomDataModelDesc')}
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2.5 }}>
          {error && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'error.main', color: 'error.contrastText', borderRadius: 1 }}>
              <Typography variant="body2">{error}</Typography>
            </Box>
          )}

          {fields.length === 0 ? (
            <Box
              sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: 'action.hover',
                borderRadius: 2,
                border: '1px dashed',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {t('noCustomFieldsDefined')}
              </Typography>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddField}>
                {t('btnAddField')}
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {fields.map((field, idx) => (
                <Paper
                  key={field.id || idx}
                  variant="outlined"
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      #{idx + 1}
                    </Typography>
                    <IconButton size="small" color="error" onClick={() => handleDeleteField(idx)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t('lblFieldName')}
                      placeholder={t('phFieldName')}
                      value={field.name}
                      onChange={(e) => handleUpdateField(idx, { name: e.target.value })}
                      required
                    />

                    <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 } }}>
                      <InputLabel>{t('lblFieldType')}</InputLabel>
                      <Select
                        value={field.type}
                        label={t('lblFieldType')}
                        onChange={(e) => {
                          const newType = e.target.value as CustomFieldType;
                          handleUpdateField(idx, {
                            type: newType,
                            options:
                              newType === 'list'
                                ? field.options?.length
                                  ? field.options
                                  : ['Opcija 1', 'Opcija 2']
                                : undefined,
                            unit: newType === 'number' ? field.unit || '' : undefined,
                          });
                        }}
                      >
                        <MenuItem value="text">{t('typeText')}</MenuItem>
                        <MenuItem value="number">{t('typeNumber')}</MenuItem>
                        <MenuItem value="list">{t('typeList')}</MenuItem>
                      </Select>
                    </FormControl>

                    {field.type === 'number' && (
                      <TextField
                        size="small"
                        label={t('lblUnit')}
                        placeholder={t('phUnit')}
                        value={field.unit || ''}
                        onChange={(e) => handleUpdateField(idx, { unit: e.target.value })}
                        sx={{ minWidth: { xs: '100%', sm: 150 } }}
                      />
                    )}
                  </Box>

                  {field.type === 'list' && (
                    <TextField
                      fullWidth
                      size="small"
                      label={t('lblListOptions')}
                      placeholder={t('phListOptions')}
                      value={(field.options || []).join(', ')}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const opts = raw.split(',').map((s) => s.trim()).filter(Boolean);
                        handleUpdateField(idx, { options: opts });
                      }}
                      helperText={t('phListOptions')}
                    />
                  )}
                </Paper>
              ))}

              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddField}>
                  {t('btnAddField')}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined" disabled={isSaving}>
            {t('btnCancel')}
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={isSaving}>
            {isSaving ? '...' : t('btnSave')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
export default CustomDataModelModal;
