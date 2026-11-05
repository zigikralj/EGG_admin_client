import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField
} from '@mui/material';
import type { DeleteDialogState } from './types';

export interface ActivityLogsDialogsProps {
  deleteDialog: DeleteDialogState;
  onCloseDeleteDialog: () => void;
  onConfirmDelete: () => void;
  confirmDeactivateOpen: boolean;
  onCloseDeactivateDialog: () => void;
  onConfirmDeactivate: () => void;
  customRetentionOpen: boolean;
  onCloseCustomRetentionDialog: () => void;
  onSubmitCustomRetention: () => void;
  customDaysInput: string;
  onCustomDaysInputChange: (val: string) => void;
  isCustomRetentionPending: boolean;
  language?: string;
  t: (key: any, params?: Record<string, string | number>) => string;
}

export const ActivityLogsDialogs: React.FC<ActivityLogsDialogsProps> = ({
  deleteDialog,
  onCloseDeleteDialog,
  onConfirmDelete,
  confirmDeactivateOpen,
  onCloseDeactivateDialog,
  onConfirmDeactivate,
  customRetentionOpen,
  onCloseCustomRetentionDialog,
  onSubmitCustomRetention,
  customDaysInput,
  onCustomDaysInputChange,
  isCustomRetentionPending,
  t
}) => {
  const parsedDays = parseInt(customDaysInput, 10);
  const isCustomDaysValid =
    Boolean(customDaysInput) &&
    !isNaN(parsedDays) &&
    parsedDays >= 1 &&
    parsedDays <= 3650;

  return (
    <>
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.isOpen}
        onClose={onCloseDeleteDialog}
      >
        <DialogTitle>
          {deleteDialog.type === 'all' && t('clearAllLogsTitle')}
          {deleteDialog.type === 'session' && t('deleteSessionTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteDialog.type === 'all' && t('clearAllLogsConfirm')}
            {deleteDialog.type === 'session' &&
              t('deleteSessionConfirm', { label: deleteDialog.label || '' })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseDeleteDialog}>
            {t('btnCancel')}
          </Button>
          <Button color="error" variant="contained" onClick={onConfirmDelete}>
            {t('btnDelete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Deactivate Dialog */}
      <Dialog
        open={confirmDeactivateOpen}
        onClose={onCloseDeactivateDialog}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2.5 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t('activityLogsDeactivateTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
            {t('activityLogsDeactivateMessage')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button
            onClick={onCloseDeactivateDialog}
            variant="outlined"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            {t('btnCancel')}
          </Button>
          <Button
            onClick={onConfirmDeactivate}
            variant="contained"
            color="warning"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            {t('btnDeactivate')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Retention Days Dialog */}
      <Dialog
        open={customRetentionOpen}
        onClose={onCloseCustomRetentionDialog}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2.5 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t('retentionCustomTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, fontSize: '0.9rem', color: 'text.secondary' }}>
            {t('retentionCustomPrompt')}
          </DialogContentText>
          <TextField
            autoFocus
            type="number"
            label={t('retentionCustomDaysLabel')}
            value={customDaysInput}
            onChange={(e) => onCustomDaysInputChange(e.target.value)}
            fullWidth
            size="small"
            slotProps={{ htmlInput: { min: 1, max: 3650 } }}
            helperText={t('activityLogsRetentionHelper')}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button
            onClick={onCloseCustomRetentionDialog}
            variant="outlined"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            {t('btnCancel')}
          </Button>
          <Button
            onClick={onSubmitCustomRetention}
            variant="contained"
            disabled={!isCustomDaysValid || isCustomRetentionPending}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            {t('btnSave')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
