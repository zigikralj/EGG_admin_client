import React from 'react';
import { Grid, TextField, FormControl, InputLabel, Select, MenuItem, Autocomplete } from '@mui/material';
import type { InvoiceStatus, InvoiceCurrency, InvoiceType } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

export interface InvoiceFormFieldsProps {
  invoiceNumber: string;
  onInvoiceNumberChange: (val: string) => void;
  invoiceType: InvoiceType;
  onInvoiceTypeChange: (val: InvoiceType) => void;
  invoiceStatus: InvoiceStatus;
  onInvoiceStatusChange: (val: InvoiceStatus) => void;
  
  parentInvoiceOptions: any[];
  parentInvoiceGroupBy: (inv: any) => string;
  parentInvoiceGetOptionLabel: (inv: any) => string;
  parentInvoiceId: string;
  onParentInvoiceIdChange: (id: string) => void;
  
  currency: InvoiceCurrency;
  onCurrencyChange: (val: InvoiceCurrency) => void;
  
  dateCreated: string;
  onDateCreatedChange: (val: string) => void;
  dueDate: string;
  onDueDateChange: (val: string) => void;
}

export const InvoiceFormFields: React.FC<InvoiceFormFieldsProps> = ({
  invoiceNumber, onInvoiceNumberChange,
  invoiceType, onInvoiceTypeChange,
  invoiceStatus, onInvoiceStatusChange,
  parentInvoiceOptions, parentInvoiceGroupBy, parentInvoiceGetOptionLabel, parentInvoiceId, onParentInvoiceIdChange,
  currency, onCurrencyChange,
  dateCreated, onDateCreatedChange,
  dueDate, onDueDateChange
}) => {
  const { t } = useLanguage();

  return (
    <>
      <Grid size={{ xs: 12, sm: 5 }}>
        <TextField
          fullWidth
          size="small"
          label={t("lblInvoiceNumber")}
          placeholder={t("phInvoiceNumber")}
          value={invoiceNumber}
          onChange={(e) => onInvoiceNumberChange(e.target.value)}
          required
          autoFocus
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3.5 }}>
        <FormControl fullWidth size="small">
          <InputLabel>{t("lblInvoiceType")}</InputLabel>
          <Select
            value={invoiceType}
            label={t("lblInvoiceType")}
            onChange={(e) => onInvoiceTypeChange(e.target.value as InvoiceType)}
          >
            <MenuItem value="Standard">{t("typeStandard")}</MenuItem>
            <MenuItem value="Advance">{t("typeAdvance")}</MenuItem>
            <MenuItem value="Final">{t("typeFinal")}</MenuItem>
            <MenuItem value="Partial">{t("typePartial")}</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 6, sm: 3.5 }}>
        <FormControl fullWidth size="small">
          <InputLabel>{t("lblInvoiceStatus")}</InputLabel>
          <Select
            value={invoiceStatus}
            label={t("lblInvoiceStatus")}
            onChange={(e) => onInvoiceStatusChange(e.target.value as InvoiceStatus)}
          >
            <MenuItem value="Draft">{t("statusDraft")}</MenuItem>
            <MenuItem value="Sent">{t("statusSent")}</MenuItem>
            <MenuItem value="Paid">{t("statusPaid")}</MenuItem>
            <MenuItem value="Overdue">{t("statusOverdue")}</MenuItem>
            <MenuItem value="Cancelled">{t("statusCancelled")}</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <Autocomplete
          size="small"
          options={parentInvoiceOptions}
          groupBy={parentInvoiceGroupBy}
          getOptionLabel={parentInvoiceGetOptionLabel}
          value={parentInvoiceOptions.find((inv) => inv.id === parentInvoiceId) || null}
          onChange={(_, val) => onParentInvoiceIdChange(val ? val.id : '')}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t("lblParentInvoice")}
              placeholder={t("phSelectParentInvoice")}
            />
          )}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControl fullWidth size="small">
          <InputLabel>{t("lblCurrency")}</InputLabel>
          <Select
            value={currency}
            label={t("lblCurrency")}
            onChange={(e) => onCurrencyChange(e.target.value as InvoiceCurrency)}
          >
            <MenuItem value="RSD">RSD (Dinar)</MenuItem>
            <MenuItem value="€">€ (Euro)</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          size="small"
          type="date"
          label={t("lblDateCreated")}
          slotProps={{ inputLabel: { shrink: true } }}
          value={dateCreated}
          onChange={(e) => onDateCreatedChange(e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          size="small"
          type="date"
          required
          label={t("lblDueDate")}
          slotProps={{ inputLabel: { shrink: true } }}
          value={dueDate}
          onChange={(e) => onDueDateChange(e.target.value)}
        />
      </Grid>
    </>
  );
};
