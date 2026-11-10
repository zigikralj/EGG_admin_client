import React from 'react';
import { Chip, type ChipProps } from '@mui/material';
import type { ContractStatus } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import type { TranslationKeys } from '../../i18n/translations';

export interface ContractStatusBadgeProps {
  status: ContractStatus | string;
  endDate?: string | null;
  size?: ChipProps['size'];
}

export const getContractEffectiveStatus = (
  status: string,
  endDate?: string | null,
  t?: (key: keyof TranslationKeys) => string
): { label: string; color: ChipProps['color'] } => {
  if (status === 'Draft') {
    return { label: t ? t('contractStatusDraft') : 'U pripremi', color: 'default' };
  }
  if (status === 'Terminated') {
    return { label: t ? t('contractStatusTerminated') : 'Raskinut', color: 'error' };
  }

  const today = new Date().toISOString().slice(0, 10);
  if (endDate) {
    if (endDate < today) {
      return { label: t ? t('contractStatusExpired') : 'Istekao', color: 'error' };
    }
    const in45Days = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (endDate <= in45Days) {
      return { label: t ? t('contractStatusExpiring') : 'Ističu Uskoro', color: 'warning' };
    }
  }

  return { label: t ? t('contractStatusActive') : 'Aktivan', color: 'success' };
};

export const ContractStatusBadge: React.FC<ContractStatusBadgeProps> = ({
  status,
  endDate,
  size = 'small',
}) => {
  const { t } = useLanguage();
  const info = getContractEffectiveStatus(status, endDate, t);

  return (
    <Chip
      size={size}
      color={info.color}
      label={info.label}
      sx={{ fontWeight: 600, fontSize: size === 'small' ? '0.74rem' : '0.82rem' }}
    />
  );
};
