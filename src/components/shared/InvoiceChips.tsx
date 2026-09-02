import { Chip } from '@mui/material';
import { useLanguage } from '../../context/LanguageContext';

export const InvoiceStatusChip = ({ status }: { status?: string }) => {
  const { t } = useLanguage();
  if (!status) return null;
  switch (status) {
    case 'Paid':
      return <Chip label={t('statusPaid')} color="success" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, px: 0.25 }} />;
    case 'Sent':
      return <Chip label={t('statusSent')} color="info" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, px: 0.25 }} />;
    case 'Overdue':
      return <Chip label={t('statusOverdue')} color="error" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, px: 0.25 }} />;
    case 'Cancelled':
      return <Chip label={t('statusCancelled')} color="default" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, px: 0.25 }} />;
    case 'Draft':
    default:
      return <Chip label={t('statusDraft')} color="warning" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, px: 0.25 }} />;
  }
};

export const InvoiceTypeChip = ({ type }: { type?: string | null }) => {
  const { t } = useLanguage();
  if (!type || type === 'Standard') return null;
  switch (type) {
    case 'Advance':
      return (
        <Chip
          label={t('badgeAdvance')}
          size="small"
          color="secondary"
          variant="outlined"
          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, px: 0.25 }}
        />
      );
    case 'Final':
      return (
        <Chip
          label={t('badgeFinal')}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, px: 0.25 }}
        />
      );
    case 'Partial':
      return (
        <Chip
          label={t('badgePartial')}
          size="small"
          color="info"
          variant="outlined"
          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, px: 0.25 }}
        />
      );
    default:
      return null;
  }
};

export const LinkedInvoiceChip = ({ linked }: { linked: any }) => {
  const { t } = useLanguage();
  const type = linked?.invoiceType || 'Standard';
  let labelType = t('typeStandard');
  let chipColor: 'default' | 'secondary' | 'primary' | 'info' = 'default';
  
  switch (type) {
    case 'Advance':
      labelType = t('badgeAdvance');
      chipColor = 'secondary';
      break;
    case 'Final':
      labelType = t('badgeFinal');
      chipColor = 'primary';
      break;
    case 'Partial':
      labelType = t('badgePartial');
      chipColor = 'info';
      break;
  }
  
  return (
    <Chip
      size="small"
      variant="outlined"
      color={chipColor}
      label={`${labelType}: ${linked.invoiceNumber || ""}`}
      sx={{ height: 18, fontSize: "0.65rem", fontWeight: 600 }}
    />
  );
};

