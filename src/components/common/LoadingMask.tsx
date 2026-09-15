import React from 'react';
import {
  Backdrop,
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  Chip,
  Fade,
  useTheme,
} from '@mui/material';
import { useLoading } from '../../context/LoadingContext';
import { useLanguage } from '../../context/LanguageContext';
import { StorageIcon, HourglassEmptyIcon } from '../icons';

export const LoadingMask: React.FC = () => {
  const theme = useTheme();
  const { isLoading, loadingMessage, isServerWakingUp, elapsedSeconds } = useLoading();
  const { t } = useLanguage();

  return (
    <Backdrop
      open={isLoading}
      transitionDuration={{ enter: 250, exit: 250 }}
      sx={{
        zIndex: theme.zIndex.modal + 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.52)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        pointerEvents: isLoading ? 'auto' : 'none',
      }}
      aria-busy="true"
      role="alert"
    >
      <Fade in={isLoading} timeout={{ enter: 250, exit: 250 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: 480,
            width: '100%',
          }}
        >
          {/* Circular Progress Animation */}
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
            <CircularProgress
              variant="determinate"
              value={100}
              size={64}
              thickness={4}
              sx={{
                color: 'rgba(255, 255, 255, 0.15)',
              }}
            />
            <CircularProgress
              variant="indeterminate"
              disableShrink
              size={64}
              thickness={4}
              sx={{
                color: theme.palette.primary.light || theme.palette.primary.main,
                animationDuration: '1000ms',
                position: 'absolute',
                left: 0,
              }}
            />
          </Box>

          {/* White Letters - Primary Status Message */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: '#ffffff',
              mb: 0.5,
              letterSpacing: '-0.01em',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
            }}
          >
            {loadingMessage}
          </Typography>

          {/* White Letters - Subtext */}
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              textShadow: '0 1px 6px rgba(0, 0, 0, 0.5)',
              mb: isServerWakingUp ? 2 : 0,
            }}
          >
            {t('loadingPleaseWait') || 'Please wait...'}
          </Typography>

          {/* Server Free-Tier Cold Start Notice (Render / Neon wake-up) */}
          {isServerWakingUp && (
            <Fade in={isServerWakingUp} timeout={400}>
              <Box
                sx={{
                  width: '100%',
                  maxWidth: 420,
                  mt: 2,
                  p: 2,
                  borderRadius: 3,
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(255, 183, 77, 0.4)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StorageIcon
                    sx={{
                      color: '#ffb74d',
                      fontSize: 22,
                      animation: 'pulse 2s infinite ease-in-out',
                      '@keyframes pulse': {
                        '0%': { opacity: 0.6, transform: 'scale(0.96)' },
                        '50%': { opacity: 1, transform: 'scale(1.04)' },
                        '100%': { opacity: 0.6, transform: 'scale(0.96)' },
                      },
                    }}
                  />
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: '#ffb74d',
                    }}
                  >
                    {t('loadingServerWakingUp')}
                  </Typography>
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.88)',
                    lineHeight: 1.45,
                    px: 1,
                    textAlign: 'center',
                  }}
                >
                  {t('loadingServerWakingUpDetail')}
                </Typography>

                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pt: 0.5,
                  }}
                >
                  <Chip
                    icon={<HourglassEmptyIcon sx={{ fontSize: '14px !important', color: '#ffb74d !important' }} />}
                    label={t('loadingElapsedTime', { seconds: elapsedSeconds })}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      borderColor: 'rgba(255, 183, 77, 0.5)',
                      color: '#ffb74d',
                      backgroundColor: 'rgba(255, 183, 77, 0.1)',
                    }}
                  />
                </Box>

                <LinearProgress
                  sx={{
                    width: '100%',
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#ffb74d',
                    },
                  }}
                />
              </Box>
            </Fade>
          )}
        </Box>
      </Fade>
    </Backdrop>
  );
};
