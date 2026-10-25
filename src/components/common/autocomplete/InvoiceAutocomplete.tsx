import { useMemo, type Key, type HTMLAttributes } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { CustomAutocomplete, type CustomAutocompleteProps } from './CustomAutocomplete';
import { useLanguage } from '../../../context/LanguageContext';
import { formatInvoiceAmount } from '../../../utils/invoiceUtils';
import { InvoiceStatusChip, InvoiceTypeChip } from '../../invoice/InvoiceChips';
import type { Invoice } from '../../../types';

export interface InvoiceAutocompleteProps<
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
> extends Omit<
    CustomAutocompleteProps<Invoice, Multiple, FreeSolo>,
    'entity'
  > {
  prioritizeProjectId?: string | null;
  prioritizeClientId?: string | null;
  prioritizeClientName?: string | null;
  excludeProjectId?: string | null;
  excludeIds?: string[];
}

export function InvoiceAutocomplete<
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
>({
  prioritizeProjectId,
  prioritizeClientId,
  prioritizeClientName,
  excludeProjectId,
  excludeIds,
  queryParams,
  label,
  placeholder,
  valueMode = 'id',
  getOptionLabel,
  groupBy,
  renderOption,
  ...restProps
}: InvoiceAutocompleteProps<Multiple, FreeSolo>) {
  const { t } = useLanguage();

  const mergedQueryParams = useMemo(() => {
    const q: Record<string, any> = { ...queryParams };
    if (prioritizeProjectId) q.prioritizeProjectId = prioritizeProjectId;
    if (prioritizeClientId) q.prioritizeClientId = prioritizeClientId;
    if (prioritizeClientName) q.prioritizeClientName = prioritizeClientName;
    if (excludeProjectId) q.excludeProjectId = excludeProjectId;
    if (excludeIds && excludeIds.length > 0) q.excludeIds = excludeIds.join(',');
    return q;
  }, [
    queryParams,
    prioritizeProjectId,
    prioritizeClientId,
    prioritizeClientName,
    excludeProjectId,
    excludeIds,
  ]);

  const defaultGetOptionLabel = (inv: Invoice | string) => {
    if (typeof inv === 'string') return inv;
    if ((inv as any)?.__isLoadMoreSentinel || inv?.id === '__LOAD_MORE__') return '';
    return `${inv.invoiceNumber}${inv.invoiceType && inv.invoiceType !== 'Standard' ? ` [${inv.invoiceType}]` : ''}${inv.totalAmount ? ` (${formatInvoiceAmount(inv.totalAmount, inv.currency)})` : ''}${inv.clientName ? ` - ${inv.clientName}` : ''}`;
  };

  const defaultGroupBy = (inv: Invoice) => {
    if ((inv as any)?.__isLoadMoreSentinel || inv?.id === '__LOAD_MORE__') return '';
    const targetClientId = prioritizeClientId;
    const targetClientName = (prioritizeClientName || '').trim().toLowerCase();
    const isMatch =
      Boolean(targetClientId && inv.clientId === targetClientId) ||
      Boolean(targetClientName && inv.clientName && inv.clientName.trim().toLowerCase() === targetClientName);
    return isMatch ? `${t('colClient')}: ${prioritizeClientName || ''}` : t('other');
  };

  const defaultRenderOption = (
    props: HTMLAttributes<HTMLLIElement> & { key?: Key },
    inv: Invoice
  ) => {
    const { key, ...otherProps } = props as any;
    const targetClientId = prioritizeClientId;
    const targetClientName = (prioritizeClientName || '').trim().toLowerCase();
    const isMatch =
      Boolean(targetClientId && inv.clientId === targetClientId) ||
      Boolean(targetClientName && inv.clientName && inv.clientName.trim().toLowerCase() === targetClientName);

    return (
      <Box component="li" key={key || inv.id} {...otherProps}>
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', py: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="body2" sx={{ fontWeight: isMatch ? 700 : 500 }}>
                {inv.invoiceNumber}
              </Typography>
              <InvoiceTypeChip type={inv.invoiceType} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <InvoiceStatusChip status={inv.status} />
              {isMatch && (
                <Chip
                  label={t('colClient')}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                />
              )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', fontSize: '0.75rem', mt: 0.25 }}>
            {inv.clientName && <span>{inv.clientName}</span>}
            <span>• {formatInvoiceAmount(inv.totalAmount, inv.currency)}</span>
            {inv.dueDate && <span>• {inv.dueDate}</span>}
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <CustomAutocomplete<Invoice, Multiple, FreeSolo>
      entity="invoices"
      valueMode={valueMode}
      label={label !== undefined ? label : t('tabInvoices')}
      placeholder={placeholder !== undefined ? placeholder : t('phSelectExistingInvoice')}
      queryParams={mergedQueryParams}
      getOptionLabel={getOptionLabel || defaultGetOptionLabel}
      groupBy={groupBy !== undefined ? groupBy : (prioritizeClientId || prioritizeClientName ? defaultGroupBy : undefined)}
      renderOption={renderOption || defaultRenderOption}
      {...restProps}
    />
  );
}
