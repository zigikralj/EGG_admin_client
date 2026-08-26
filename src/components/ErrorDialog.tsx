import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
} from '@mui/material';


import { useLanguage } from '../context/LanguageContext';
import { WarningAmberIcon, HighlightOffIcon } from './icons';

export interface ErrorDialogProps {
  open: boolean;
  title?: string;
  message: string;
  buttonLabel?: string;
  severity?: 'error' | 'warning';
  onClose: () => void;
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({
  open,
  title,
  message,
  buttonLabel,
  severity = 'warning',
  onClose,
}) => {
  const { t, getErrorMessage } = useLanguage();

  const isError = severity === 'error';
  const displayMessage = getErrorMessage(message);

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
            boxShadow: '0px 12px 36px rgba(0,0,0,0.25)',
          },
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700, pb: 1 }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: '50%',
            bgcolor: isError ? 'error.50' : 'warning.50',
            color: isError ? 'error.main' : 'warning.main',
            flexShrink: 0,
          }}
        >
          {isError ? (
            <HighlightOffIcon fontSize="medium" color="error" />
          ) : (
            <WarningAmberIcon fontSize="medium" color="warning" />
          )}
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          {title || t('errorDialogTitle')}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText
          sx={{
            color: 'text.primary',
            fontSize: '0.95rem',
            pt: 0.5,
            lineHeight: 1.5,
          }}
        >
          {displayMessage}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 1, justifyContent: 'flex-end' }}>
        <Button
          onClick={onClose}
          color="primary"
          variant="contained"
          disableElevation
          autoFocus
          sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}
        >
          {buttonLabel || t('btnContinueEditing')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ErrorDialog;
