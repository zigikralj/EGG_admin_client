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

export type ModalDimension = string | number | Record<string, string | number>;

const MUI_BREAKPOINTS = new Set<unknown>(['xs', 'sm', 'md', 'lg', 'xl', false]);

const isMuiBreakpoint = (val: unknown): val is DialogProps['maxWidth'] =>
  val === undefined || MUI_BREAKPOINTS.has(val);

export interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAdornment?: React.ReactNode;
  headerActions?: React.ReactNode;
  /**
   * Standard MUI breakpoint ('xs' | 'sm' | 'md' | 'lg' | 'xl' | false)
   * or a custom CSS max-width value (e.g. 560, '720px', '85vw', { xs: '95vw', md: 640 }).
   * Defaults to 'md'.
   */
  maxWidth?: DialogProps['maxWidth'] | ModalDimension;
  /**
   * Optional explicit width for the dialog Paper (e.g. 500, '80%', { xs: '100%', sm: 520 }).
   */
  width?: ModalDimension;
  /**
   * Maximum height of the dialog Paper.
   * Defaults to { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' }.
   */
  maxHeight?: ModalDimension;
  /**
   * Optional explicit height for the dialog Paper.
   * When omitted, defaults to `maxHeight` if `fullHeight` is true, or `'auto'` (fit content) if `fullHeight` is false.
   */
  height?: ModalDimension;
  /**
   * If true, expands the dialog height to fill `maxHeight`.
   * If false (default), the dialog shrinks/grows to fit its content up to `maxHeight`.
   */
  fullHeight?: boolean;
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
  width,
  maxHeight,
  height,
  fullHeight = false,
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

  const resolvedMaxHeight: ModalDimension = maxHeight ?? {
    xs: 'calc(100% - 32px)',
    sm: 'calc(100% - 64px)',
  };
  const resolvedHeight: ModalDimension = height ?? (fullHeight ? resolvedMaxHeight : 'auto');

  const hasCustomMaxWidth = !isMuiBreakpoint(maxWidth);
  const dialogMaxWidth: DialogProps['maxWidth'] = hasCustomMaxWidth ? false : maxWidth;

  const defaultPaperSx: SxProps<Theme> = {
    height: resolvedHeight,
    maxHeight: resolvedMaxHeight,
    ...(hasCustomMaxWidth ? { maxWidth: maxWidth as any } : {}),
    ...(width !== undefined ? { width: width as any } : {}),
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
      maxWidth={dialogMaxWidth}
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
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          pb: 1,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', minWidth: 0, flex: 1 }}>
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, ml: 'auto' }}>
          {headerActions}
          {!hideCloseButton && (
            <IconButton
              size="small"
              onClick={onClose}
              aria-label={t('btnClose')}
              sx={{ color: 'text.secondary' }}
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
