import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { HistoryIcon, RestoreIcon, CompareArrowsIcon, CloseIcon } from '../icons';

export interface NoteHistoryDiffModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onRestored?: () => void;
}

export const NoteHistoryDiffModal: React.FC<NoteHistoryDiffModalProps> = ({
  open,
  onClose,
  projectId,
  projectName,
  onRestored,
}) => {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();

  const [vFrom, setVFrom] = useState<number | null>(null);
  const [vTo, setVTo] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // 1. Fetch revisions list
  const { data: revisionsData, isLoading: isLoadingRevisions } = useQuery({
    queryKey: ['projects', 'note', 'revisions', projectId],
    queryFn: async () => {
      const res = await apiFetch(`/api/projects/${projectId}/note/history`);
      if (!res.ok) throw new Error('Failed to fetch note history');
      return res.json();
    },
    enabled: open && Boolean(projectId),
  });

  const versions = revisionsData?.versions || [];

  // Auto-select latest two versions
  useEffect(() => {
    if (versions.length >= 2 && vFrom === null && vTo === null) {
      setVFrom(versions[1].version);
      setVTo(versions[0].version);
    } else if (versions.length === 1 && vFrom === null) {
      setVFrom(versions[0].version);
      setVTo(versions[0].version);
    }
  }, [versions, vFrom, vTo]);

  // 2. Fetch diff between selected versions/dates
  const { data: diffData, isLoading: isLoadingDiff } = useQuery({
    queryKey: ['projects', 'note', 'diff', projectId, vFrom, vTo, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateFrom && dateTo) {
        params.set('dateFrom', dateFrom);
        params.set('dateTo', dateTo);
      } else if (vFrom !== null && vTo !== null) {
        params.set('vFrom', String(vFrom));
        params.set('vTo', String(vTo));
      } else {
        return null;
      }
      const res = await apiFetch(`/api/projects/${projectId}/note/diff?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch note diff');
      return res.json();
    },
    enabled: open && Boolean(projectId) && ((vFrom !== null && vTo !== null) || Boolean(dateFrom && dateTo)),
  });

  // 3. Restore mutation
  const restoreMutation = useMutation({
    mutationFn: async (targetVersion: number) => {
      const res = await apiFetch(`/api/projects/${projectId}/note/restore/${targetVersion}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to restore note version');
      return res.json();
    },
    onSuccess: (restoredData) => {
      // Update cache
      queryClient.setQueryData(['projects', 'note', projectId], restoredData);
      queryClient.setQueriesData({ queryKey: ['projects'] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((p: any) =>
          p.id === projectId ? { ...p, notesPreview: restoredData.notesPreview } : p
        );
      });
      queryClient.invalidateQueries({ queryKey: ['projects', 'note', 'revisions', projectId] });
      onRestored?.();
      onClose();
    },
  });

  const renderDiffContent = () => {
    if (isLoadingDiff) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!diffData || !diffData.diff) {
      return (
        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          {t('selectVersionsToCompare') || 'Select two revisions or dates to compare changes.'}
        </Box>
      );
    }

    if (diffData.diff.length === 0) {
      return (
        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          {t('noDifferencesFound') || 'No differences between selected versions.'}
        </Box>
      );
    }

    return (
      <Box sx={{ p: 3, fontFamily: 'inherit', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {diffData.diff.map((part: { op: 'insert' | 'delete' | 'equal'; text: string }, index: number) => {
          if (part.op === 'insert') {
            return (
              <Box
                component="span"
                key={index}
                sx={{
                  bgcolor: 'rgba(46, 125, 50, 0.25)',
                  color: 'success.main',
                  px: 0.5,
                  py: 0.2,
                  borderRadius: 0.5,
                  fontWeight: 600,
                }}
              >
                {part.text}
              </Box>
            );
          }
          if (part.op === 'delete') {
            return (
              <Box
                component="span"
                key={index}
                sx={{
                  bgcolor: 'rgba(211, 47, 47, 0.25)',
                  color: 'error.main',
                  textDecoration: 'line-through',
                  px: 0.5,
                  py: 0.2,
                  borderRadius: 0.5,
                  opacity: 0.85,
                }}
              >
                {part.text}
              </Box>
            );
          }
          return <span key={index}>{part.text}</span>;
        })}
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('projectNotesHistory') || 'Project Notes History & Diff'}: {projectName}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, display: 'flex', height: 600 }}>
        {/* Left pane: Revisions list */}
        <Box sx={{ width: 320, borderRight: '1px solid', borderColor: 'divider', overflowY: 'auto' }}>
          <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {t('revisionTimeline') || 'Revision Timeline'} ({versions.length})
            </Typography>
          </Box>
          {isLoadingRevisions ? (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : versions.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="body2">{t('noRevisionsRecorded') || 'No revisions recorded yet.'}</Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {versions.map((ver: any) => {
                const isSelected = vTo === ver.version;
                const isBaseline = vFrom === ver.version;
                const dateStr = new Date(ver.createdAt).toLocaleString(language === 'sr-Latn' || language === 'sr-Cyrl' ? 'sr-RS' : 'en-US');
                const delta = ver.charDelta || 0;

                return (
                  <ListItemButton
                    key={ver.version}
                    selected={isSelected || isBaseline}
                    onClick={() => {
                      if (vFrom === null || (vFrom !== null && vTo !== null)) {
                        setVTo(ver.version);
                        setDateFrom('');
                        setDateTo('');
                      } else {
                        setVFrom(ver.version);
                        setDateFrom('');
                        setDateTo('');
                      }
                    }}
                    sx={{
                      py: 1,
                      px: 2,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&.Mui-selected': {
                        bgcolor: isSelected ? 'action.selected' : 'action.hover',
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            v{ver.version} {ver.kind === 'S' && <Chip label="Snapshot" size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />}
                          </Typography>
                          <Chip
                            label={delta > 0 ? `+${delta}` : String(delta)}
                            size="small"
                            color={delta > 0 ? 'success' : delta < 0 ? 'error' : 'default'}
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {dateStr}
                          </Typography>
                          <Typography variant="caption" color="text.primary" sx={{ display: 'block' }}>
                            {ver.authorName || ver.authorId || 'System'}
                          </Typography>
                          {ver.reason && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              {ver.reason}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Box>

        {/* Right pane: Diff comparison */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Controls Bar */}
          <Box
            sx={{
              p: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              bgcolor: 'action.hover',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <TextField
                select
                size="small"
                label={t('compareFromBaseline')}
                value={vFrom ?? ''}
                onChange={(e) => {
                  setVFrom(Number(e.target.value));
                  setDateFrom('');
                  setDateTo('');
                }}
                slotProps={{ select: { native: true } }}
                sx={{ minWidth: 150 }}
              >
                {versions.map((v: any) => (
                  <option key={v.version} value={v.version}>
                    v{v.version} ({new Date(v.createdAt).toLocaleDateString(language)})
                  </option>
                ))}
              </TextField>

              <CompareArrowsIcon color="action" />

              <TextField
                select
                size="small"
                label={t('compareToTarget')}
                value={vTo ?? ''}
                onChange={(e) => {
                  setVTo(Number(e.target.value));
                  setDateFrom('');
                  setDateTo('');
                }}
                slotProps={{ select: { native: true } }}
                sx={{ minWidth: 150 }}
              >
                {versions.map((v: any) => (
                  <option key={v.version} value={v.version}>
                    v{v.version} ({new Date(v.createdAt).toLocaleDateString(language)})
                  </option>
                ))}
              </TextField>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

              {/* Optional Date Pickers */}
              <TextField
                type="date"
                size="small"
                label={t('lblFromDate')}
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setVFrom(null);
                  setVTo(null);
                }}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 145 }}
              />
              <TextField
                type="date"
                size="small"
                label={t('lblToDate')}
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setVFrom(null);
                  setVTo(null);
                }}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 145 }}
              />
            </Box>

            {vTo !== null && (
              <Button
                variant="outlined"
                color="warning"
                size="small"
                startIcon={<RestoreIcon />}
                onClick={() => restoreMutation.mutate(vTo)}
                disabled={restoreMutation.isPending}
              >
                {t('restoreToVersion', { version: vTo }) || `Restore to v${vTo}`}
              </Button>
            )}
          </Box>

          {/* Diff View Content */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>{renderDiffContent()}</Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose}>{t('btnClose')}</Button>
      </DialogActions>
    </Dialog>
  );
};
