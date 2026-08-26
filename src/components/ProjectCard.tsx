import React, { useMemo } from 'react';
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
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LockIcon from '@mui/icons-material/Lock';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import NotesIcon from '@mui/icons-material/Notes';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import type { Project, Service, Reminder, Invoice } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface Props {
  project: Project;
  services?: Service[];
  reminders?: Reminder[];
  invoices?: Invoice[];
  onToggleDone: (id: string) => void;
  onMarkSampled?: (id: string) => void;
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

  const canEdit = canEditProject(p);
  const late = isLate(p);
  const nearDeadline = !late && isNearDeadline(p);
  const stale = isStale(p);

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

    // Fallback: if no reminders in list but project has nextSample and is not done
    if (list.length === 0 && p.nextSample && !p.done) {
      list.push({
        id: `sample-${p.id}`,
        title: t('btnSampled'),
        projectName: p.name,
        dueDate: p.nextSample,
        status: 'Pending',
        notes: null,
        responsible: p.responsible,
      });
    }

    return list;
  }, [reminders, p, t]);

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

  const tooltipSlotProps = {
    tooltip: {
      sx: {
        bgcolor: '#1e293b',
        color: '#f8fafc',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)',
        border: '1px solid #334155',
        p: 1.25,
        borderRadius: '8px',
        opacity: '1 !important',
        '& .MuiTooltip-arrow': {
          color: '#1e293b',
        },
      },
    },
  };

  const renderRemindersTooltip = () => {
    return (
      <Box sx={{ p: 0.5, minWidth: 260, maxWidth: 340 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, pb: 0.75, borderBottom: '1px solid #334155' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <NotificationsActiveIcon sx={{ fontSize: '1rem', color: '#ffb74d' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#f8fafc' }}>
              {t('lblRemindersChip')} ({projectReminders.length})
            </Typography>
          </Box>
        </Box>
        <Stack spacing={1} sx={{ maxHeight: 240, overflowY: 'auto' }}>
          {projectReminders.map((r, idx) => {
            const s = (r.status || '').toLowerCase();
            const isComp = s === 'completed' || s === 'završeno' || s === 'завршено';
            const isLateRem = !isComp && (
              s === 'overdue' || s === 'kasni' || (r.dueDate && new Date(r.dueDate.split('T')[0]) < new Date(new Date().toDateString()))
            );
            const isApprRem = !isComp && !isLateRem && r.dueDate && (() => {
              const diff = (new Date(r.dueDate.split('T')[0]).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000;
              return diff >= 0 && diff <= 10;
            })();

            const statusColor: 'error' | 'warning' | 'info' | 'success' | 'default' = isLateRem
              ? 'error'
              : isApprRem
              ? 'warning'
              : isComp
              ? 'success'
              : s === 'in progress' || s === 'u toku' || s === 'у току'
              ? 'info'
              : 'default';

            const statusLabel = isLateRem
              ? t('statusOverdue')
              : isApprRem
              ? t('statusPending')
              : isComp
              ? t('statusCompleted')
              : s === 'in progress' || s === 'u toku' || s === 'у току'
              ? t('statusInProgress')
              : t('statusPending');

            return (
              <Box
                key={r.id || idx}
                sx={{
                  p: 1,
                  borderRadius: 1.5,
                  bgcolor: '#0f172a',
                  border: '1px solid #334155',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.2, color: '#f8fafc' }}>
                    {r.title || (r as any).projectName || t('lblRemindersChip')}
                  </Typography>
                  <Chip
                    label={statusLabel}
                    size="small"
                    color={statusColor}
                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
                  <span>{t('lblDueDate')}: {fmtDate(r.dueDate || null)}</span>
                  {r.responsible && <span>{r.responsible}</span>}
                </Box>
                {r.notes && (
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#cbd5e1', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {r.notes}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Stack>
      </Box>
    );
  };

  const renderInvoicesTooltip = () => {
    const formatAmount = (amount?: number | null, curr?: string | null) => {
      const val = amount || 0;
      const c = curr || 'RSD';
      return `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`;
    };

    const getStatusLabel = (st?: string) => {
      switch (st) {
        case 'Draft': return t('statusDraft');
        case 'Sent': return t('statusSent');
        case 'Paid': return t('statusPaid');
        case 'Overdue': return t('statusOverdue');
        case 'Cancelled': return t('statusCancelled');
        default: return st || t('statusDraft');
      }
    };

    const getStatusColor = (st?: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
      switch (st) {
        case 'Paid': return 'success';
        case 'Sent': return 'info';
        case 'Overdue': return 'error';
        case 'Cancelled': return 'default';
        case 'Draft':
        default: return 'warning';
      }
    };

    return (
      <Box sx={{ p: 0.5, minWidth: 260, maxWidth: 340 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, pb: 0.75, borderBottom: '1px solid #334155' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <ReceiptLongIcon sx={{ fontSize: '1rem', color: '#64b5f6' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#f8fafc' }}>
              {t('lblInvoicesChip')} ({projectInvoices.length})
            </Typography>
          </Box>
        </Box>
        <Stack spacing={1} sx={{ maxHeight: 240, overflowY: 'auto' }}>
          {projectInvoices.map((inv) => (
            <Box
              key={inv.id}
              sx={{
                p: 1,
                borderRadius: 1.5,
                bgcolor: '#0f172a',
                border: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem', lineHeight: 1.2, color: '#f8fafc' }}>
                  {inv.invoiceNumber}
                </Typography>
                <Chip
                  label={getStatusLabel(inv.status)}
                  size="small"
                  color={getStatusColor(inv.status)}
                  sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
                <span>{t('lblDueDate')}: {fmtDate(inv.dueDate || inv.dateCreated || null)}</span>
                <strong style={{ color: '#38bdf8' }}>{formatAmount(inv.totalAmount, inv.currency)}</strong>
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>
    );
  };

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
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
            {canEdit ? (
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
            ) : (
              <Tooltip title={t('permissionDeniedOnlyOwnProjects')}>
                <LockIcon fontSize="small" color="action" />
              </Tooltip>
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
            <Tooltip title={renderRemindersTooltip()} arrow enterDelay={100} leaveDelay={200} slotProps={tooltipSlotProps}>
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
            </Tooltip>
          )}

          {invoiceUrgency && (
            <Tooltip title={renderInvoicesTooltip()} arrow enterDelay={100} leaveDelay={200} slotProps={tooltipSlotProps}>
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
            </Tooltip>
          )}

          {p.notes && (
            <Tooltip
              slotProps={tooltipSlotProps}
              title={
                <Box
                  sx={{
                    p: 0.5,
                    maxHeight: 250,
                    maxWidth: 300,
                    overflowY: 'auto',
                    fontSize: '0.8rem',
                    color: '#f8fafc',
                    '& p': { m: 0, mb: 0.5 },
                    '& ul, & ol': { m: 0, pl: 2 },
                    '& blockquote': { m: 0, pl: 1, borderLeft: '2px solid #64748b' },
                  }}
                  dangerouslySetInnerHTML={{ __html: p.notes }}
                />
              }
              arrow
            >
              <Chip
                icon={<NotesIcon sx={{ fontSize: '0.9rem !important' }} />}
                label={t('lblProjectNotes')}
                size="small"
                variant="outlined"
                onClick={() => (onView ? onView(p) : onEdit(p))}
                sx={{
                  height: 24,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  borderColor: 'primary.light',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              />
            </Tooltip>
          )}
        </Stack>

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


