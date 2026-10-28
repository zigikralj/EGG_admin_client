import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  LinearProgress,
  type DialogProps,
  type SxProps,
  type Theme,
} from '@mui/material';
import { CloseIcon } from '../../icons';
import { useLanguage } from '../../../context/LanguageContext';

export interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAdornment?: React.ReactNode;
  headerActions?: React.ReactNode;
  maxWidth?: DialogProps['maxWidth'];
  fullWidth?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
  actions?: React.ReactNode;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  hideCloseButton?: boolean;
  disableBackdropClick?: boolean;
  contentDividers?: boolean;
  contentSx?: SxProps<Theme>;
  actionsSx?: SxProps<Theme>;
  paperSx?: SxProps<Theme>;
  slotProps?: DialogProps['slotProps'];
  dialogProps?: Omit<DialogProps, 'open' | 'onClose' | 'maxWidth' | 'fullWidth'>;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  headerAdornment,
  headerActions,
  maxWidth = 'md',
  fullWidth = true,
  isLoading = false,
  children,
  actions,
  onSubmit,
  hideCloseButton = false,
  disableBackdropClick = false,
  contentDividers = true,
  contentSx,
  actionsSx,
  paperSx,
  slotProps,
  dialogProps,
}) => {
  const { t } = useLanguage();

  const handleClose: DialogProps['onClose'] = (_event, reason) => {
    if (disableBackdropClick && reason === 'backdropClick') {
      return;
    }
    onClose();
  };

  const defaultPaperSx: SxProps<Theme> = {
    height: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
    maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
    display: 'flex',
    flexDirection: 'column',
    ...paperSx,
  };

  const mergedPaperSlot = {
    ...(onSubmit ? { component: 'form', onSubmit } : {}),
    sx: defaultPaperSx,
    ...slotProps?.paper,
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      slotProps={{
        ...slotProps,
        paper: mergedPaperSlot as any,
      }}
      {...dialogProps}
    >
      <DialogTitle
        component="div"
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1.5,
          pb: 1,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', minWidth: 0 }}>
          {typeof title === 'string' ? (
            <Typography variant="h6" component="h2" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
              {title}
            </Typography>
          ) : (
            title
          )}
          {headerAdornment}
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', width: '100%' }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', ml: 'auto' }}>
          {headerActions}
          {!hideCloseButton && (
            <IconButton
              size="small"
              onClick={onClose}
              aria-label={t('btnClose')}
              sx={{ color: 'text.secondary', ml: 0.5 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </DialogTitle>

      {isLoading && (
        <LinearProgress
          sx={{
            height: 2.5,
            bgcolor: (theme) => `rgba(${theme.palette.primary.main}, 0.08)`,
            '& .MuiLinearProgress-bar': {
              bgcolor: 'primary.main',
            },
          }}
        />
      )}

      <DialogContent
        dividers={contentDividers}
        sx={{
          pt: 2,
          flex: 1,
          overflowY: 'auto',
          ...contentSx,
        }}
      >
        {children}
      </DialogContent>

      {actions && (
        <DialogActions
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            ...actionsSx,
          }}
        >
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default BaseModal;
