import React from 'react';
import { Box, Typography, Button, TextField, IconButton, Divider } from '@mui/material';
import { AddIcon, DeleteIcon } from '../icons';
import { useLanguage } from '../../context/LanguageContext';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  currency?: string;
}

interface InvoiceItemsListProps {
  items: InvoiceItem[];
  currency: string;
  onAdd: () => void;
  onChange: (idx: number, field: string, value: any) => void;
  onRemove: (idx: number) => void;
  totalAmount: number;
}

export const InvoiceItemsList: React.FC<InvoiceItemsListProps> = ({
  items,
  currency,
  onAdd,
  onChange,
  onRemove,
  totalAmount,
}) => {
  const { t } = useLanguage();

  const formatInvoiceAmount = (amount?: number | null, curr?: string | null) => {
    const val = amount || 0;
    const c = curr || 'RSD';
    return `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`;
  };

  return (
    <>
      <Divider sx={{ my: 1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          {t('invoiceItemsSection')}
        </Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={onAdd} sx={{ fontSize: '0.75rem' }}>
          {t('btnAddInvoiceItem')}
        </Button>
      </Box>

      {items.map((item, idx) => (
        <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
          <TextField
            size="small"
            placeholder={t('lblItemDescription')}
            value={item.description}
            onChange={(e) => onChange(idx, 'description', e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <TextField
            size="small"
            type="number"
            placeholder={t('lblItemQuantity')}
            slotProps={{ htmlInput: { min: 0.01, step: 'any' } }}
            value={item.quantity}
            onChange={(e) => onChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
            sx={{ width: 80 }}
          />
          <TextField
            size="small"
            type="number"
            placeholder={t('lblItemUnitPrice')}
            slotProps={{ htmlInput: { min: 0, step: 'any' } }}
            value={item.unitPrice}
            onChange={(e) => onChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
            sx={{ width: 100 }}
          />
          <Typography
            variant="caption"
            sx={{ minWidth: 120, fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}
          >
            {formatInvoiceAmount((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), item.currency || currency)}
          </Typography>
          {items.length > 1 && (
            <IconButton size="small" color="error" onClick={() => onRemove(idx)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ))}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          {t('colTotalAmount')}:
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>
          {formatInvoiceAmount(totalAmount, currency)}
        </Typography>
      </Box>
    </>
  );
};
