import React from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import { useLanguage } from '../context/LanguageContext';
import { useVersionCheck } from '../hooks/useVersionCheck';

export const VersionUpdatePrompt: React.FC = () => {
  const { t } = useLanguage();
  const { hasUpdate, latestVersion, currentVersion, reloadApp, dismissUpdate } = useVersionCheck();

  if (!hasUpdate) {
    return null;
  }

  return (
    <Snackbar
      open={hasUpdate}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{
        bottom: { xs: 16, sm: 24 },
        zIndex: (theme) => theme.zIndex.snackbar + 100,
        maxWidth: 540,
        width: 'calc(100% - 32px)',
      }}
    >
      <Alert
        icon={<SystemUpdateAltIcon sx={{ color: 'primary.main', fontSize: 28, mt: 0.2 }} />}
        severity="info"
        sx={{
          width: '100%',
          bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff'),
          color: 'text.primary',
          border: '1px solid',
          borderColor: 'primary.main',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 12px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(59, 130, 246, 0.2)'
              : '0 12px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(37, 99, 235, 0.1)',
          borderRadius: 3,
          p: 1.5,
          '& .MuiAlert-message': {
            width: '100%',
            overflow: 'hidden',
          },
        }}
        action={
          <IconButton
            size="small"
            aria-label={t('btnDismiss')}
            color="inherit"
            onClick={dismissUpdate}
            sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
          <AlertTitle sx={{ mb: 0, fontWeight: 700, fontSize: '0.95rem' }}>
            {t('appUpdateAvailable')}
          </AlertTitle>
          {latestVersion && latestVersion !== currentVersion && (
            <Chip
              label={`v${latestVersion}`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.72rem', fontWeight: 600 }}
            />
          )}
        </Box>

        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5, fontSize: '0.85rem' }}>
          {t('appUpdateDescription')}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="text"
            color="inherit"
            onClick={dismissUpdate}
            sx={{ textTransform: 'none', fontWeight: 500, fontSize: '0.8125rem' }}
          >
            {t('btnDismiss')}
          </Button>
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={reloadApp}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8125rem',
              boxShadow: 'none',
              px: 2,
            }}
          >
            {t('btnRefreshNow')}
          </Button>
        </Box>
      </Alert>
    </Snackbar>
  );
};
