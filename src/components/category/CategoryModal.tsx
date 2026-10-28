import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  Typography,
  Grid,
} from '@mui/material';
import { useLanguage } from '../../context/LanguageContext';
import { ViewEditModalBase, type ModalMode } from '../common/modal/ViewEditModalBase';
import { ViewEditField } from '../common/modal/ViewEditField';
import type { Category } from '../../types';

export interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  editingCategory: Category | null;
  mode?: ModalMode;
  initialMode?: ModalMode;
  onModeChange?: (mode: ModalMode) => void;
  canDelete?: boolean;
  canEdit?: boolean;
  canCreate?: boolean;
  onDeleteCategory?: (id: string) => void;
  onSaveCategory: (categoryData: Partial<Category>) => Promise<{ success: boolean; error?: string }>;
  onError?: (message: string) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  open,
  onClose,
  editingCategory,
  mode: controlledMode,
  initialMode,
  onModeChange: onModeChangeProp,
  canDelete = false,
  canEdit = true,
  canCreate = true,
  onDeleteCategory,
  onSaveCategory,
  onError,
}) => {
  const { t } = useLanguage();

  const [internalMode, setInternalMode] = useState<ModalMode>(() => {
    if (controlledMode) return controlledMode;
    if (initialMode) return initialMode;
    return editingCategory ? 'view' : 'create';
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
        setInternalMode(editingCategory ? 'view' : 'create');
      }
    }
  }, [open, editingCategory?.id, initialMode, controlledMode]);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const populateFromCategory = useCallback((c: Category | null) => {
    if (c) {
      setCode(c.code || '');
      setName(c.name || '');
      setDescription(c.description || '');
    } else {
      setCode('');
      setName('');
      setDescription('');
    }
  }, []);

  useEffect(() => {
    if (open) {
      populateFromCategory(editingCategory);
    }
  }, [open, editingCategory, populateFromCategory]);

  const handleCancel = () => {
    if (currentMode === 'edit' && editingCategory) {
      populateFromCategory(editingCategory);
      handleModeChange('view');
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isView) return;
    if (!canEdit && !canCreate) return;
    if (!code.trim() || !name.trim()) {
      onError?.(t('alertCategoryRequired'));
      return;
    }

    setIsSaving(true);
    try {
      const res = await onSaveCategory({
        id: editingCategory?.id,
        code: editingCategory ? editingCategory.code : code.trim(),
        name: name.trim(),
        description: description.trim() ? description.trim() : undefined,
      });

      if (res.success) {
        onClose();
      } else if (res.error) {
        onError?.(res.error || t('errorSavingCategory'));
      }
    } catch (err: any) {
      onError?.(err?.message || t('errorSavingCategory'));
    } finally {
      setIsSaving(false);
    }
  };

  const modalTitle = currentMode === 'create'
    ? t('modalNewCategory')
    : currentMode === 'edit'
    ? t('modalEditCategory')
    : (editingCategory?.name || t('btnDetails'));

  return (
    <ViewEditModalBase
      open={open}
      onClose={onClose}
      mode={currentMode}
      onModeChange={handleModeChange}
      title={modalTitle}
      subtitle={editingCategory?.code}
      canEdit={canEdit}
      canDelete={Boolean(editingCategory && canDelete && onDeleteCategory)}
      onDelete={() => {
        if (editingCategory) {
          onDeleteCategory?.(editingCategory.id);
          onClose();
        }
      }}
      isSaving={isSaving}
      onSave={handleSubmit}
      onCancel={handleCancel}
      maxWidth="sm"
    >
      <Grid container spacing={2}>
        {/* Category Code */}
        <Grid size={{ xs: 12 }}>
          <ViewEditField
            mode={currentMode}
            label={t('lblCategoryCode')}
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
              label={t('lblCategoryCode')}
              placeholder={t('phCategoryCode')}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={Boolean(editingCategory)}
              required
            />
          </ViewEditField>
        </Grid>

        {/* Category Name */}
        <Grid size={{ xs: 12 }}>
          <ViewEditField
            mode={currentMode}
            label={t('lblCategoryName')}
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
              label={t('lblCategoryName')}
              placeholder={t('phCategoryName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
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
      </Grid>
    </ViewEditModalBase>
  );
};

export default CategoryModal;
