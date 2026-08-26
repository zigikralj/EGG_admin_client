import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
} from '@mui/material';


import { useLanguage } from '../context/LanguageContext';
import { WarningAmberIcon, CheckCircleOutlinedIcon } from './icons';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  iconType?: 'warning' | 'success' | 'info';
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel,
  confirmColor = 'primary',
  iconType = 'warning',
  onConfirm,
  onClose,
}) => {
  const { t } = useLanguage();

  const getIcon = () => {
    if (iconType === 'success') {
      return (
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: 'success.50',
            color: 'success.main',
          }}
        >
          <CheckCircleOutlinedIcon fontSize="medium" color="success" />
        </Box>
      );
    }
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: '50%',
          bgcolor: confirmColor === 'error' ? 'error.50' : 'primary.50',
          color: `${confirmColor}.main`,
        }}
      >
        <WarningAmberIcon fontSize="medium" color={confirmColor} />
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            p: 1,
            boxShadow: '0px 10px 30px rgba(0,0,0,0.2)',
          },
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700, pb: 1 }}>
        {getIcon()}
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: 'text.primary', fontSize: '0.95rem', pt: 0.5 }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          color="inherit"
          variant="outlined"
          sx={{ borderRadius: 2, px: 2.5 }}
        >
          {t('btnCancel')}
        </Button>
        <Button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          color={confirmColor}
          variant="contained"
          disableElevation
          sx={{ borderRadius: 2, px: 2.5 }}
        >
          {confirmLabel || t('btnConfirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
