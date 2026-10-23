import React from 'react';
import { Chip } from '@mui/material';
import { useLanguage } from '../../context/LanguageContext';
import { CheckCircleIcon, WarningAmberIcon, ErrorIcon } from '../icons';

export interface PermitStatusResult {
  status: 'expired' | 'expiring' | 'active' | 'none';
  daysLeft?: number;
}

export const getPermitStatus = (
  endDateStr: string | null | undefined
): PermitStatusResult => {
  if (!endDateStr) return { status: 'none' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDateStr.split('T')[0]);
  end.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'expired', daysLeft: Math.abs(diffDays) };
  } else if (diffDays <= 30) {
    return { status: 'expiring', daysLeft: diffDays };
  } else {
    return { status: 'active', daysLeft: diffDays };
  }
};

export interface PermitStatusBadgeProps {
  endDate?: string | null;
}

export const PermitStatusBadge: React.FC<PermitStatusBadgeProps> = ({ endDate }) => {
  const { t } = useLanguage();
  const statusObj = getPermitStatus(endDate);

  if (statusObj.status === 'expired') {
    return (
      <Chip
        icon={<ErrorIcon fontSize="small" />}
        label={`${t('statusExpired')}${statusObj.daysLeft ? ` (${statusObj.daysLeft} ${t('daysExpired')})` : ''}`}
        size="small"
        color="error"
        sx={{ fontWeight: 600 }}
      />
    );
  }
  if (statusObj.status === 'expiring') {
    return (
      <Chip
        icon={<WarningAmberIcon fontSize="small" />}
        label={`${t('statusExpiring')}${statusObj.daysLeft !== undefined ? ` (${statusObj.daysLeft} ${t('daysRemaining')})` : ''}`}
        size="small"
        color="warning"
        sx={{ fontWeight: 600 }}
      />
    );
  }
  if (statusObj.status === 'active') {
    return (
      <Chip
        icon={<CheckCircleIcon fontSize="small" />}
        label={t('statusActivePermit')}
        size="small"
        color="success"
        sx={{ fontWeight: 600 }}
      />
    );
  }
  return (
    <Chip
      label="-"
      size="small"
      variant="outlined"
      sx={{ color: 'text.disabled' }}
    />
  );
};
