import { Chip } from '@mui/material';
import { useLanguage } from '../../context/LanguageContext';
import { INVOICE_STATUSES, INVOICE_TYPES } from '../../constants';

export const InvoiceStatusChip = ({ status }: { status?: string }) => {
  const { t } = useLanguage();
  if (!status) return null;
  const s = status.toLowerCase();
  switch (s) {
    case INVOICE_STATUSES.PAID:
      return <Chip label={t('statusPaid')} color="success" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, px: 0.25 }} />;
    case INVOICE_STATUSES.SENT:
      return <Chip label={t('statusSent')} color="info" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, px: 0.25 }} />;
    case INVOICE_STATUSES.OVERDUE:
      return <Chip label={t('statusOverdue')} color="error" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, px: 0.25 }} />;
    case INVOICE_STATUSES.CANCELLED:
      return <Chip label={t('statusCancelled')} color="default" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, px: 0.25 }} />;
    case INVOICE_STATUSES.DRAFT:
    default:
      return <Chip label={t('statusDraft')} color="warning" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, px: 0.25 }} />;
  }
};

export const InvoiceTypeChip = ({ type, showStandard = false }: { type?: string | null; showStandard?: boolean }) => {
  const { t } = useLanguage();
  const lower = (type || '').toLowerCase();
  if (!type || lower === INVOICE_TYPES.STANDARD) {
    if (!showStandard) return null;
    return (
      <Chip
        label={t('typeStandard')}
        size="small"
        variant="outlined"
        sx={{ height: 20, fontSize: '0.7rem', fontWeight: 500, color: 'text.secondary', borderColor: 'divider' }}
      />
    );
  }
  switch (lower) {
    case INVOICE_TYPES.ADVANCE:
      return (
        <Chip
          label={t('badgeAdvance')}
          size="small"
          color="secondary"
          variant="outlined"
          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, px: 0.25 }}
        />
      );
    case INVOICE_TYPES.FINAL:
      return (
        <Chip
          label={t('badgeFinal')}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, px: 0.25 }}
        />
      );
    case INVOICE_TYPES.PARTIAL:
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
  const type = (linked?.invoiceType || INVOICE_TYPES.STANDARD).toLowerCase();
  let labelType = t('typeStandard');
  let chipColor: 'default' | 'secondary' | 'primary' | 'info' = 'default';
  
  switch (type) {
    case INVOICE_TYPES.ADVANCE:
      labelType = t('badgeAdvance');
      chipColor = 'secondary';
      break;
    case INVOICE_TYPES.FINAL:
      labelType = t('badgeFinal');
      chipColor = 'primary';
      break;
    case INVOICE_TYPES.PARTIAL:
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
