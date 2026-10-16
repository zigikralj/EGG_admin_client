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
  language: string;
  t: (key: any) => string;
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
  language,
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
          {deleteDialog.type === 'all' && (language === 'en' ? 'Clear All Activity Logs' : 'Brisanje svih logova')}
          {deleteDialog.type === 'session' && (language === 'en' ? 'Delete Session' : 'Brisanje sesije')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteDialog.type === 'all' && (language === 'en'
              ? 'Are you sure you want to delete ALL activity logs? This action cannot be undone.'
              : 'Da li ste sigurni da želite da obrišete SVE logove aktivnosti? Ova radnja se ne može opozvati.')}
            {deleteDialog.type === 'session' && (language === 'en'
              ? `Are you sure you want to delete all activity logs for ${deleteDialog.label}? This action cannot be undone.`
              : `Da li ste sigurni da želite da obrišete sve logove aktivnosti za ${deleteDialog.label}? Ova radnja se ne može opozvati.`)}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseDeleteDialog}>
            {language === 'en' ? 'Cancel' : 'Otkaži'}
          </Button>
          <Button color="error" variant="contained" onClick={onConfirmDelete}>
            {language === 'en' ? 'Delete' : 'Obriši'}
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
            {language === 'en' ? 'Cancel' : 'Otkaži'}
          </Button>
          <Button
            onClick={onConfirmDeactivate}
            variant="contained"
            color="warning"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            {language === 'en' ? 'Deactivate' : 'Deaktiviraj'}
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
            {language === 'en' ? 'Cancel' : 'Otkaži'}
          </Button>
          <Button
            onClick={onSubmitCustomRetention}
            variant="contained"
            disabled={!isCustomDaysValid || isCustomRetentionPending}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            {language === 'en' ? 'Save' : 'Sačuvaj'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
