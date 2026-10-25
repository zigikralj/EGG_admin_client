import React, { useMemo, useState } from 'react';
import { ProjectNotesPreview } from './ProjectNotesPreview';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Box,
  Stack,
  Checkbox,
  IconButton,
  Tooltip,
} from '@mui/material';

import type { Project, Service, Reminder, Invoice } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { stripHtmlToText } from '../common/RichTextEditor';
import {
  EditIcon,
  VisibilityIcon,
  WarningAmberIcon,
  ErrorIcon,
  NotificationsActiveIcon,
  ReceiptLongIcon,
} from '../icons';

interface Props {
  project: Project;
  services?: Service[];
  reminders?: Reminder[];
  invoices?: Invoice[];
  onToggleDone: (id: string) => void;
  onView?: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete?: (id: string) => void;
}

function fmtDate(d: string | null): string {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y}.`;
}

function isLate(p: Project): boolean {
  if (p.done || !p.deadline) return false;
  const clean = p.deadline.split('T')[0];
  const parts = clean.split('-').map(Number);
  if (parts.length !== 3) return false;
  const [y, m, d] = parts;
  const deadlineDate = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return deadlineDate < today;
}

function isNearDeadline(p: Project, days = 14): boolean {
  if (p.done || !p.deadline) return false;
  const clean = p.deadline.split('T')[0];
  const parts = clean.split('-').map(Number);
  if (parts.length !== 3) return false;
  const [y, m, d] = parts;
  const deadlineDate = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
}

function isStale(p: Project): boolean {
  if (p.done || !p.start) return false;
  const start = new Date(p.start);
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 2);
  return start < cutoff;
}

export { ProjectNotesPreview } from './ProjectNotesPreview';


export const ProjectCard: React.FC<Props> = ({
  project: p,
  services = [],
  reminders = [],
  invoices = [],
  onToggleDone,
  onView,
  onEdit,
}) => {
  const { t, getServiceLabel, getResponsibleLabel } = useLanguage();
  const { canEditProject, users } = useAuth();

  const [notesExpanded, setNotesExpanded] = useState(false);
  const canEdit = canEditProject(p);
  const late = isLate(p);
  const nearDeadline = !late && isNearDeadline(p);
  const stale = isStale(p);
  const hasNotes = Boolean((p.notesPreview && p.notesPreview.trim().length > 0) || (p.notes && stripHtmlToText(p.notes).length > 0));

  // Match reminders for this project
  const projectReminders = useMemo(() => {
    const list: (Reminder | { id: string; title?: string | null; projectName?: string | null; dueDate?: string | null; status?: string; notes?: string | null; responsible?: string | null })[] = [];

    if (reminders && reminders.length > 0) {
      const matched = reminders.filter(
        (r) =>
          (r.projectId && r.projectId === p.id) ||
          (!r.projectId && r.projectName && r.projectName.trim().toLowerCase() === p.name.trim().toLowerCase())
      );
      list.push(...matched);
    } else if (p.reminders && p.reminders.length > 0) {
      list.push(...p.reminders);
    }

    return list;
  }, [reminders, p]);

  // Match invoices for this project
  const projectInvoices = useMemo(() => {
    if (invoices && invoices.length > 0) {
      return invoices.filter(
        (inv) =>
          (inv.projectId && inv.projectId === p.id) ||
          (!inv.projectId && inv.projectName && inv.projectName.trim().toLowerCase() === p.name.trim().toLowerCase())
      );
    }
    if (p.invoices && p.invoices.length > 0) {
      return p.invoices;
    }
    return [];
  }, [invoices, p]);

  // Reminder urgency and status priority
  const reminderUrgency = useMemo(() => {
    if (projectReminders.length === 0) return null;

    const today = new Date(new Date().toDateString());

    const isCompleted = (status?: string | null) => {
      if (!status) return false;
      const s = status.toLowerCase();
      return s === 'completed' || s === 'završeno' || s === 'завршено';
    };

    const isOverdue = (r: typeof projectReminders[0]) => {
      if (isCompleted(r.status)) return false;
      const s = (r.status || '').toLowerCase();
      if (s === 'overdue' || s === 'prekoračeno' || s === 'прекорачено' || s === 'kasni' || s === 'касни') return true;
      if (!r.dueDate) return false;
      const due = new Date(r.dueDate.split('T')[0]);
      return due < today;
    };

    const isApproaching = (r: typeof projectReminders[0]) => {
      if (isCompleted(r.status) || isOverdue(r)) return false;
      if (!r.dueDate) return false;
      const due = new Date(r.dueDate.split('T')[0]);
      const diffDays = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 10;
    };

    const hasOverdue = projectReminders.some(isOverdue);
    const hasApproaching = projectReminders.some(isApproaching);
    const hasInProgress = projectReminders.some((r) => {
      const s = (r.status || '').toLowerCase();
      return !isCompleted(r.status) && (s === 'in progress' || s === 'u toku' || s === 'у току');
    });
    const allCompleted = projectReminders.length > 0 && projectReminders.every((r) => isCompleted(r.status));

    let color: 'error' | 'warning' | 'info' | 'success' | 'default' = 'default';
    if (hasOverdue) {
      color = 'error';
    } else if (hasApproaching) {
      color = 'warning';
    } else if (hasInProgress) {
      color = 'info';
    } else if (allCompleted) {
      color = 'success';
    } else {
      color = 'default';
    }

    return {
      color,
      count: projectReminders.length,
      hasOverdue,
      hasApproaching,
    };
  }, [projectReminders]);

  // Invoice urgency and status priority
  const invoiceUrgency = useMemo(() => {
    if (projectInvoices.length === 0) return null;

    const today = new Date(new Date().toDateString());

    const isOverdue = (inv: Invoice) => {
      const s = (inv.status || '').toLowerCase();
      if (s === 'overdue' || s === 'prekoračeno' || s === 'kasni') return true;
      if (s === 'paid' || s === 'plaćeno' || s === 'плаћено' || s === 'cancelled' || s === 'otkazano' || s === 'отказано') return false;
      if (!inv.dueDate) return false;
      const due = new Date(inv.dueDate.split('T')[0]);
      return due < today;
    };

    const isDraft = (inv: Invoice) => {
      const s = (inv.status || '').toLowerCase();
      return s === 'draft' || s === 'kreirano' || s === 'креирано' || !inv.status;
    };

    const isSent = (inv: Invoice) => {
      const s = (inv.status || '').toLowerCase();
      return s === 'sent' || s === 'poslato' || s === 'послато';
    };

    const isPaid = (inv: Invoice) => {
      const s = (inv.status || '').toLowerCase();
      return s === 'paid' || s === 'plaćeno' || s === 'плаћено';
    };

    const isCancelled = (inv: Invoice) => {
      const s = (inv.status || '').toLowerCase();
      return s === 'cancelled' || s === 'otkazano' || s === 'отказано';
    };

    const hasOverdue = projectInvoices.some(isOverdue);
    const hasDraft = projectInvoices.some(isDraft);
    const hasSent = projectInvoices.some(isSent);
    const allPaid = projectInvoices.length > 0 && projectInvoices.every(isPaid);
    const allCancelled = projectInvoices.length > 0 && projectInvoices.every(isCancelled);

    let color: 'error' | 'warning' | 'info' | 'success' | 'default' = 'default';
    if (hasOverdue) {
      color = 'error';
    } else if (hasDraft) {
      color = 'warning';
    } else if (hasSent) {
      color = 'info';
    } else if (allPaid) {
      color = 'success';
    } else if (allCancelled) {
      color = 'default';
    } else {
      color = 'default';
    }

    const totalAmount = projectInvoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
    const currency = projectInvoices[0]?.currency || 'RSD';

    return {
      color,
      count: projectInvoices.length,
      totalAmount,
      currency,
    };
  }, [projectInvoices]);

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        zIndex: notesExpanded ? 20 : 1,
        borderColor: late
          ? 'error.main'
          : nearDeadline
          ? '#ff9800'
          : stale
          ? 'warning.main'
          : 'divider',
        borderWidth: late || nearDeadline ? 2 : 1,
        borderStyle: 'solid',
        bgcolor: late
          ? 'rgba(211, 47, 47, 0.03)'
          : nearDeadline
          ? 'rgba(255, 152, 0, 0.04)'
          : stale
          ? 'warning.50'
          : 'background.paper',
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: late
            ? '0 4px 14px rgba(211, 47, 47, 0.2)'
            : nearDeadline
            ? '0 4px 14px rgba(255, 152, 0, 0.2)'
            : '0 4px 12px rgba(0,0,0,0.08)',
        },
      }}
    >
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          '&:last-child': { pb: 2 },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, minHeight: 28 }}>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {late && (
              <Chip
                icon={<ErrorIcon fontSize="small" />}
                label={t('statOverdueUrgent')}
                color="error"
                size="small"
                sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 700 }}
              />
            )}
            {stale && !late && (
              <Chip
                icon={<WarningAmberIcon fontSize="small" />}
                label={t('staleFlag')}
                color="warning"
                size="small"
                sx={{ height: 22, fontSize: '0.6875rem' }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title={t('btnView')}>
              <IconButton
                size="small"
                onClick={() => (onView ? onView(p) : onEdit(p))}
                color="default"
                sx={{ p: 0.5 }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canEdit && (
              <>
                <Tooltip title={p.done ? t('btnReturnToProgress') : t('btnMarkDone')}>
                  <Checkbox
                    checked={p.done}
                    onChange={() => onToggleDone(p.id)}
                    size="small"
                    color="success"
                    sx={{ p: 0.5 }}
                  />
                </Tooltip>
                <Tooltip title={t('btnEdit')}>
                  <IconButton
                    size="small"
                    onClick={() => onEdit(p)}
                    color="primary"
                    sx={{ p: 0.5 }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>

        {/* CLIENT NAME */}
        {p.clientName && (
          <Typography
            variant="h6"
            sx={{
              color: 'primary.main',
              fontWeight: 700,
              fontSize: '1rem',
              lineHeight: 1.3,
              mb: 0.25,
            }}
          >
            {p.clientName}
          </Typography>
        )}

        <Typography
          variant="h6"
          onClick={() => (onView ? onView(p) : onEdit(p))}
          sx={{
            mb: 1,
            lineHeight: 1.3,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'color 0.15s ease',
            '&:hover': {
              color: 'primary.main',
            },
          }}
        >
          {p.name}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
          <Chip
            label={getServiceLabel(p.type, services)}
            size="small"
            color={p.done ? 'default' : 'primary'}
            variant={p.done ? 'outlined' : 'filled'}
          />

          {reminderUrgency && (
            <Chip
              icon={<NotificationsActiveIcon sx={{ fontSize: '0.85rem !important' }} />}
              label={`${t('lblRemindersChip')} (${reminderUrgency.count})`}
              size="small"
              color={reminderUrgency.color}
              variant={reminderUrgency.color === 'default' ? 'outlined' : 'filled'}
              onClick={() => (onView ? onView(p) : onEdit(p))}
              sx={{
                height: 24,
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.85,
                },
              }}
            />
          )}

          {invoiceUrgency && (
            <Chip
              icon={<ReceiptLongIcon sx={{ fontSize: '0.85rem !important' }} />}
              label={`${t('lblInvoicesChip')} (${invoiceUrgency.count})`}
              size="small"
              color={invoiceUrgency.color}
              variant={invoiceUrgency.color === 'default' ? 'outlined' : 'filled'}
              onClick={() => (onView ? onView(p) : onEdit(p))}
              sx={{
                height: 24,
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.85,
                },
              }}
            />
          )}

        </Stack>

        {/* INLINE NOTES PREVIEW WITH CLICK-TO-LOCK HOVER OVERLAY */}
        {hasNotes && (
          <ProjectNotesPreview
            projectId={p.id}
            notes={p.notes}
            notesPreview={p.notesPreview}
            onOpenModal={() => (onView ? onView(p) : onEdit(p))}
            onExpandedChange={setNotesExpanded}
          />
        )}

        {/* BOTTOM SECTION: Responsible person, progress and dates aligned to bottom */}
        <Box sx={{ mt: 'auto', pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {getResponsibleLabel(p.responsible, users)}: <strong>{p.responsible || '—'}</strong>
          </Typography>

          <Box
            onClick={() => (onView ? onView(p) : onEdit(p))}
            sx={{
              mb: 2,
              cursor: 'pointer',
              borderRadius: 1,
              p: 0.5,
              mx: -0.5,
              transition: 'background-color 0.15s ease',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {t('progress') || 'Progress'}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                {p.progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={p.progress}
              color={p.done ? 'info' : late ? 'error' : p.progress > 75 ? 'success' : 'primary'}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'text.secondary' }}>
            <span>{t('start')}: {fmtDate(p.start)}</span>
            <span style={{ fontSize: late ? '0.875rem' : 'inherit' }}>
              {t('deadline')}:{' '}
              <strong
                style={{
                  color: late ? '#d32f2f' : nearDeadline ? '#ed6c02' : 'inherit',
                  fontWeight: late || nearDeadline ? 800 : 700,
                  fontSize: late ? '0.925rem' : 'inherit',
                }}
              >
                {fmtDate(p.deadline)}
              </strong>
            </span>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};


