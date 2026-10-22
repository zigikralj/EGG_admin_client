import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import type { Permit, Reminder } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { CloseIcon } from '../icons';

interface PermitQuickReminderDialogProps {
  open: boolean;
  permit: Permit | null;
  onClose: () => void;
  onSave: (reminderData: {
    title: string;
    dueDate: string | null;
    notes: string | null;
  }) => Promise<void>;
}

export const PermitQuickReminderDialog: React.FC<PermitQuickReminderDialogProps> = ({
  open,
  permit,
  onClose,
  onSave,
}) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && permit) {
      const idxStr = permit.indexNumber || permit.wasteCatalog?.code || permit.wasteCatalogs?.[0]?.code || '';
      setTitle(`${t('lblPermit')}: ${permit.permitNumber}${idxStr ? ` (${idxStr})` : ''}`);
      setDueDate(permit.endDate ? permit.endDate.split('T')[0] : '');
      setNotes('');
    }
  }, [open, permit, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        dueDate: dueDate || null,
        notes: notes.trim() || null,
      });
    } finally {
      setIsSubmitting(false);
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
          sx: {
            borderRadius: 3,
            maxHeight: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        },
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          maxHeight: 'inherit',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 700,
            p: 2,
            flexShrink: 0,
          }}
        >
          <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
            {t('btnAddReminderForPermit')}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            p: { xs: 2, sm: 2.5 },
            overflowY: 'auto',
            flex: '1 1 auto',
          }}
        >
          <TextField
            fullWidth
            required
            size="small"
            label={t('lblReminderTitle')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            fullWidth
            type="date"
            size="small"
            label={t('colDueDate')}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            size="small"
            label={t('colNotes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, flexShrink: 0, justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>
            {t('btnCancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting || !title.trim()}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {t('btnSave')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

interface PermitEditReminderModalProps {
  reminder: Reminder | null;
  onClose: () => void;
  onSave: (reminderData: {
    id: string;
    title: string;
    dueDate: string | null;
    status: string;
    notes: string | null;
  }) => Promise<void>;
}

export const PermitEditReminderModal: React.FC<PermitEditReminderModalProps> = ({
  reminder,
  onClose,
  onSave,
}) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Pending');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title || '');
      setDueDate(reminder.dueDate ? reminder.dueDate.split('T')[0] : '');
      setStatus(reminder.status || 'Pending');
      setNotes(reminder.notes || '');
    }
  }, [reminder]);

  if (!reminder) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSave({
        id: reminder.id,
        title: title.trim(),
        dueDate: dueDate || null,
        status,
        notes: notes.trim() || null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={Boolean(reminder)}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            maxHeight: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        },
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          maxHeight: 'inherit',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 700,
            p: 2,
            flexShrink: 0,
          }}
        >
          <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
            {t('modalEditReminder')}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            p: { xs: 2, sm: 2.5 },
            overflowY: 'auto',
            flex: '1 1 auto',
          }}
        >
          <TextField
            fullWidth
            required
            size="small"
            label={t('lblReminderTitle')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            fullWidth
            type="date"
            size="small"
            label={t('colDueDate')}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <FormControl size="small" fullWidth>
            <InputLabel>{t('colStatus')}</InputLabel>
            <Select
              value={status}
              label={t('colStatus')}
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="Pending">{t('statusPending')}</MenuItem>
              <MenuItem value="In Progress">{t('statusInProgress')}</MenuItem>
              <MenuItem value="Completed">{t('statusCompleted')}</MenuItem>
              <MenuItem value="Overdue">{t('statusOverdue')}</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={2}
            size="small"
            label={t('colNotes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, flexShrink: 0, justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>
            {t('btnCancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting || !title.trim()}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {t('btnSave')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
