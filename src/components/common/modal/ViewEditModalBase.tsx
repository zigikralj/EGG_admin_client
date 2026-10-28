import React from 'react';
import {
  Button,
  Box,
  CircularProgress,
} from '@mui/material';
import { BaseModal, type BaseModalProps } from './BaseModal';
import { EditIcon, SaveIcon, DeleteIcon } from '../../icons';
import { useLanguage } from '../../../context/LanguageContext';

export type ModalMode = 'view' | 'edit' | 'create';

export interface ViewEditModalBaseProps
  extends Omit<BaseModalProps, 'title' | 'actions' | 'onSubmit' | 'headerAdornment'> {
  mode: ModalMode;
  onModeChange?: (newMode: ModalMode) => void;
  title: React.ReactNode | ((mode: ModalMode) => React.ReactNode);
  statusChip?: React.ReactNode;
  canEdit?: boolean;
  canDelete?: boolean;
  isSaving?: boolean;
  onSave?: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  onDelete?: () => void;
  onCancel?: () => void;
  extraHeaderActions?: React.ReactNode | ((mode: ModalMode) => React.ReactNode);
  extraFooterActions?: React.ReactNode | ((mode: ModalMode) => React.ReactNode);
  showFooterEditButton?: boolean;
  showHeaderEditButton?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  editLabel?: string;
  closeLabel?: string;
  deleteLabel?: string;
}

export const ViewEditModalBase: React.FC<ViewEditModalBaseProps> = ({
  mode,
  onModeChange,
  title,
  statusChip,
  canEdit = true,
  canDelete = false,
  isSaving = false,
  onSave,
  onDelete,
  onCancel,
  extraHeaderActions,
  extraFooterActions,
  showFooterEditButton = true,
  showHeaderEditButton = false,
  saveLabel,
  cancelLabel,
  editLabel,
  closeLabel,
  deleteLabel,
  onClose,
  ...baseModalProps
}) => {
  const { t } = useLanguage();

  const isView = mode === 'view';
  const isEdit = mode === 'edit';

  const resolvedTitle = typeof title === 'function' ? title(mode) : title;
  const resolvedExtraHeaderActions =
    typeof extraHeaderActions === 'function' ? extraHeaderActions(mode) : extraHeaderActions;
  const resolvedExtraFooterActions =
    typeof extraFooterActions === 'function' ? extraFooterActions(mode) : extraFooterActions;

  const handleEditClick = () => {
    if (onModeChange) {
      onModeChange('edit');
    }
  };

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    if (isEdit && onModeChange) {
      onModeChange('view');
    } else {
      onClose();
    }
  };

  const headerActionsContent = (
    <>
      {resolvedExtraHeaderActions}

      {isView && canDelete && onDelete && (
        <Button
          color="error"
          variant="outlined"
          size="small"
          onClick={onDelete}
          startIcon={<DeleteIcon />}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
        >
          {deleteLabel || t('btnDelete')}
        </Button>
      )}

      {isView && canEdit && onModeChange && showHeaderEditButton && (
        <Button
          color="primary"
          variant="outlined"
          size="small"
          onClick={handleEditClick}
          startIcon={<EditIcon />}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
        >
          {editLabel || t('btnEdit')}
        </Button>
      )}
    </>
  );

  const footerActionsContent = (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        {isView && canEdit && onModeChange && showFooterEditButton && (
          <Button
            onClick={handleEditClick}
            variant="outlined"
            color="primary"
            startIcon={<EditIcon />}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
          >
            {editLabel || t('btnEdit')}
          </Button>
        )}
        {resolvedExtraFooterActions}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
        {isView ? (
          <Button
            onClick={onClose}
            variant="contained"
            color="inherit"
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
          >
            {closeLabel || t('btnClose')}
          </Button>
        ) : (
          <>
            <Button
              onClick={handleCancelClick}
              variant="outlined"
              color="inherit"
              disabled={isSaving}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
            >
              {cancelLabel || t('btnCancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSaving}
              startIcon={
                isSaving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />
              }
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
            >
              {saveLabel || t('btnSave')}
            </Button>
          </>
        )}
      </Box>
    </>
  );

  return (
    <BaseModal
      {...baseModalProps}
      title={resolvedTitle}
      headerAdornment={statusChip}
      headerActions={headerActionsContent}
      actions={footerActionsContent}
      onSubmit={!isView && onSave ? onSave : undefined}
      onClose={onClose}
    />
  );
};

export default ViewEditModalBase;
