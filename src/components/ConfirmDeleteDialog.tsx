import React from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { useLanguage } from '../context/LanguageContext';

interface ConfirmDeleteDialogProps {
  open: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  open,
  title,
  message,
  onConfirm,
  onClose,
}) => {
  const { t } = useLanguage();

  return (
    <ConfirmDialog
      open={open}
      title={title || t('confirmDeleteTitle')}
      message={message}
      confirmLabel={t('btnDelete')}
      confirmColor="error"
      iconType="warning"
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
};

