import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Tooltip,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import {
  CloseIcon,
  HistoryIcon,
  RestoreIcon,
  RefreshIcon,
  ExpandMoreIcon,
  PersonIcon,
  AccessTimeIcon,
} from '../icons';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  useEntityTimelineQuery,
  useVersionDiffQuery,
  useRebuiltVersionQuery,
  useRestoreVersionMutation,
} from '../../queries';
import { HistoryDiffView } from './HistoryDiffView';
import type { EntityVersionSummary } from '../../types';

export interface HistoryTimelineModalProps {
  open: boolean;
  onClose: () => void;
  entityType: string;
  entityId: string;
  entityTitle?: string;
  onRestored?: (restoredRecord: any) => void;
}

interface VersionItemProps {
  version: EntityVersionSummary;
  isLatest: boolean;
  entityType: string;
  entityId: string;
  canRestore: boolean;
  onRestoreClick: (version: number) => void;
  isRestoring: boolean;
}

const VersionItem: React.FC<VersionItemProps> = ({
  version,
  isLatest,
  entityType,
  entityId,
  canRestore,
  onRestoreClick,
  isRestoring,
}) => {
  const { t, language } = useLanguage();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [expanded, setExpanded] = useState<boolean>(false);
  const [showRawState, setShowRawState] = useState<boolean>(false);

  const prevVersion = version.version > 1 ? version.version - 1 : null;
  const { data: diffData, isLoading: isDiffLoading } = useVersionDiffQuery(
    entityType,
    entityId,
    prevVersion,
    version.version,
    expanded && prevVersion !== null
  );

  const { data: rebuiltData, isLoading: isRebuiltLoading } = useRebuiltVersionQuery(
    entityType,
    entityId,
    version.version,
    expanded && showRawState
  );

  const getOpColor = (op: string) => {
    switch (op) {
      case 'I':
        return { label: t('historyOpInsert'), color: 'success' as const };
      case 'U':
        return { label: t('historyOpUpdate'), color: 'info' as const };
      case 'D':
        return { label: t('historyOpDelete'), color: 'error' as const };
      case 'B':
        return { label: t('historyOpBaseline'), color: 'default' as const };
      default:
        return { label: op, color: 'default' as const };
    }
  };

  const opInfo = getOpColor(version.op);

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExp) => setExpanded(isExp)}
      disableGutters
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: isLatest ? 'primary.main' : 'divider',
        borderRadius: 2,
        mb: 1.5,
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        '&:before': { display: 'none' },
        bgcolor: isDark ? alpha('#1e293b', 0.6) : '#ffffff',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          px: 2,
          py: 1,
          '& .MuiAccordionSummary-content': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
            m: 0,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Chip
            label={`v${version.version}`}
            size="small"
            color={isLatest ? 'primary' : 'default'}
            sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.82rem' }}
          />

          <Chip
            label={opInfo.label}
            size="small"
            color={opInfo.color}
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
          />

          <Tooltip
            title={
              version.kind === 'S'
                ? 'Keyframe Snapshot (full record state stored)'
                : 'Delta Compressed (storing only modified attributes)'
            }
          >
            <Chip
              label={version.kind === 'S' ? 'Snapshot' : 'Delta'}
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.7rem',
                opacity: 0.85,
                borderColor: version.kind === 'S' ? 'primary.light' : 'divider',
              }}
            />
          </Tooltip>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
            <PersonIcon sx={{ fontSize: '1rem' }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {version.changeSet.userName || 'System'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
            <AccessTimeIcon sx={{ fontSize: '1rem' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {new Date(version.createdAt).toLocaleString(language === 'en' ? 'en-US' : 'sr-RS')}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1 }}>
          {version.changedFields && version.changedFields.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              {version.changedFields.length} {t('historyChangedFields').toLowerCase()}
            </Typography>
          )}

          {canRestore && !isLatest && (
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<RestoreIcon fontSize="small" />}
              disabled={isRestoring}
              onClick={(e) => {
                e.stopPropagation();
                onRestoreClick(version.version);
              }}
              sx={{ textTransform: 'none', py: 0.25, px: 1, fontSize: '0.75rem' }}
            >
              {t('historyRestore')}
            </Button>
          )}
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ px: 2, pb: 2, pt: 0.5, bgcolor: isDark ? alpha('#0f172a', 0.4) : alpha('#f8fafc', 0.6) }}>
        <Divider sx={{ mb: 1.5 }} />

        {version.changeSet.reason && (
          <Box sx={{ mb: 1.5, p: 1, borderRadius: 1, bgcolor: isDark ? alpha('#000', 0.2) : alpha('#000', 0.04) }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
              Context / Reason:
            </Typography>
            <Typography variant="body2">{version.changeSet.reason}</Typography>
          </Box>
        )}

        {version.changedFields && version.changedFields.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
              {t('historyChangedFields')}:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {version.changedFields.map((field) => (
                <Chip
                  key={field}
                  label={field}
                  size="small"
                  sx={{ fontFamily: 'monospace', fontSize: '0.72rem', height: 22 }}
                />
              ))}
            </Box>
          </Box>
        )}

        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {prevVersion ? `${t('historyDiff')} (v${prevVersion} → v${version.version})` : 'Initial Baseline Data'}
            </Typography>

            <Button
              size="small"
              variant="text"
              onClick={() => setShowRawState((prev) => !prev)}
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}
            >
              {showRawState ? 'Hide Full State' : 'View Full Rebuilt State'}
            </Button>
          </Box>

          {prevVersion ? (
            isDiffLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">
                  Calculating diff...
                </Typography>
              </Box>
            ) : (
              <HistoryDiffView diff={diffData?.diff} isDark={isDark} language={language} />
            )
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 0.5 }}>
              This is the initial baseline record (Version 1).
            </Typography>
          )}

          {showRawState && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                Rebuilt Record State (v{version.version}):
              </Typography>
              {isRebuiltLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="caption">Reconstructing state...</Typography>
                </Box>
              ) : (
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 1.5,
                    bgcolor: isDark ? alpha('#000', 0.5) : '#f1f5f9',
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    maxHeight: 250,
                  }}
                >
                  {JSON.stringify(rebuiltData?.state ?? {}, null, 2)}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export const HistoryTimelineModal: React.FC<HistoryTimelineModalProps> = ({
  open,
  onClose,
  entityType,
  entityId,
  entityTitle,
  onRestored,
}) => {
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const canRestore = hasPermission('history', 'restore');

  const [confirmVersion, setConfirmVersion] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    data: timeline,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useEntityTimelineQuery(entityType, entityId, { enabled: open });

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const restoreMutation = useRestoreVersionMutation();

  const handleConfirmRestore = () => {
    if (confirmVersion === null) return;
    setErrorMessage(null);

    restoreMutation.mutate(
      { entityType, entityId, version: confirmVersion },
      {
        onSuccess: (res) => {
          setSuccessMessage(t('historyRestoredSuccess').replace('{version}', String(confirmVersion)));
          setConfirmVersion(null);
          refetch();
          if (onRestored) {
            onRestored(res.record);
          }
        },
        onError: (err: any) => {
          setErrorMessage(err?.message || 'Failed to restore version');
          setConfirmVersion(null);
        },
      }
    );
  };

  const versions = timeline?.versions || [];

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('historyModalTitle')}
            </Typography>
            {entityTitle && (
              <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
                — {entityTitle}
              </Typography>
            )}
            {versions.length > 0 && (
              <Chip label={`${versions.length} versions`} size="small" sx={{ ml: 1, fontWeight: 600 }} />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title={t('btnRefresh') || 'Refresh'}>
              <span>
                <IconButton
                  onClick={() => refetch()}
                  size="small"
                  disabled={isLoading || isFetching}
                  aria-label="refresh"
                >
                  <RefreshIcon
                    fontSize="small"
                    sx={{
                      animation: isFetching ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                </IconButton>
              </span>
            </Tooltip>
            <IconButton onClick={onClose} size="small" aria-label="close">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5, flex: 1, overflowY: 'auto' }}>
          {successMessage && (
            <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          {errorMessage && (
            <Alert severity="error" onClose={() => setErrorMessage(null)} sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          {isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 1.5 }}>
              <CircularProgress size={32} />
              <Typography variant="body2" color="text.secondary">
                {t('historyLoading')}
              </Typography>
            </Box>
          ) : isError ? (
            <Alert severity="error">
              {error?.message || 'Failed to load version history for this entity.'}
            </Alert>
          ) : versions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body1" color="text.secondary">
                {t('historyEmpty')}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ mt: 1 }}>
              {versions.map((ver, idx) => (
                <VersionItem
                  key={ver.id}
                  version={ver}
                  isLatest={idx === 0}
                  entityType={entityType}
                  entityId={entityId}
                  canRestore={canRestore}
                  onRestoreClick={(v) => setConfirmVersion(v)}
                  isRestoring={restoreMutation.isPending}
                />
              ))}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={onClose} variant="outlined" color="inherit">
            {t('btnClose')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog for Restore */}
      <Dialog
        open={confirmVersion !== null}
        onClose={() => setConfirmVersion(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2.5 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t('historyRestoreConfirmTitle')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t('historyRestoreConfirmMessage').replace('{version}', String(confirmVersion ?? ''))}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button
            onClick={() => setConfirmVersion(null)}
            color="inherit"
            disabled={restoreMutation.isPending}
          >
            {t('btnCancel')}
          </Button>
          <Button
            onClick={handleConfirmRestore}
            variant="contained"
            color="warning"
            disabled={restoreMutation.isPending}
            startIcon={restoreMutation.isPending ? <CircularProgress size={16} /> : <RestoreIcon />}
          >
            {restoreMutation.isPending ? 'Restoring...' : t('historyRestore')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
