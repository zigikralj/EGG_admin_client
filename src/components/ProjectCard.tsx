import React from 'react';
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
import LockIcon from '@mui/icons-material/Lock';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { Project } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface Props {
  project: Project;
  onToggleDone: (id: string) => void;
  onMarkSampled?: (id: string) => void;
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
  return new Date(p.deadline) < new Date(new Date().toDateString());
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
  onToggleDone,
  onEdit,
}) => {
  const { t, getServiceLabel } = useLanguage();
  const { canEditProject } = useAuth();

  const canEdit = canEditProject(p);
  const late = isLate(p);
  const stale = isStale(p);

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderColor: stale ? 'warning.main' : 'divider',
        bgcolor: stale ? 'warning.50' : 'background.paper',
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, minHeight: 28 }}>
          <Box>
            {stale && (
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

        <Typography variant="h6" sx={{ mb: 1, lineHeight: 1.3, fontWeight: 700 }}>
          {p.name}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
          <Chip
            label={getServiceLabel(p.type)}
            size="small"
            color={p.done ? 'default' : 'primary'}
            variant={p.done ? 'outlined' : 'filled'}
          />
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('responsible')}: <strong>{p.responsible || '—'}</strong>
        </Typography>

        <Box sx={{ mb: 2 }}>
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
            color={p.done ? 'info' : p.progress > 75 ? 'success' : 'primary'}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', mb: 0.5, color: 'text.secondary' }}>
          <span>{t('start')}: {fmtDate(p.start)}</span>
          <span>
            {t('deadline')}:{' '}
            <strong style={{ color: late ? '#d32f2f' : 'inherit' }}>
              {fmtDate(p.deadline)}
            </strong>
          </span>
        </Box>
      </CardContent>
    </Card>
  );
};


