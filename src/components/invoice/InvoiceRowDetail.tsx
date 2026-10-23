import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Chip,
  Grid,
} from '@mui/material';
import type { Invoice, InvoiceStatus, InvoiceType } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { LinkIcon } from '../icons';

export interface InvoiceRowDetailProps {
  invoice: Invoice;
  hasLinks: boolean;
  onSearchInvoice?: (invoiceNumber: string) => void;
  getStatusLabel: (status: InvoiceStatus) => string;
  getStatusChipColor: (status: InvoiceStatus) => 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  getInvoiceTypeChip: (type?: InvoiceType | string | null) => React.ReactNode;
  formatAmount: (amount?: number | null, curr?: string | null) => string;
}

export const InvoiceRowDetail: React.FC<InvoiceRowDetailProps> = ({
  invoice: inv,
  hasLinks,
  onSearchInvoice,
  getStatusLabel,
  getStatusChipColor,
  getInvoiceTypeChip,
  formatAmount,
}) => {
  const { t } = useLanguage();
  const itemsCount = inv.items?.length || 0;

  return (
    <Box sx={{ margin: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
      {/* LINKED INVOICES BREAKDOWN CARD */}
      {hasLinks && (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.paper', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LinkIcon color="primary" sx={{ fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t('lblLinkedInvoices')}
            </Typography>
          </Box>

          <Grid container spacing={1.5}>
            {/* Parent Invoice info */}
            {inv.parentInvoice && (
              <Grid size={{ xs: 12, md: inv.childInvoices && inv.childInvoices.filter((c) => c.id !== inv.parentInvoice?.id).length > 0 ? 6 : 12 }}>
                <Paper variant="outlined" sx={{ p: 1.25, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t('lblParentInvoice')}:
                    </Typography>
                    {getInvoiceTypeChip(inv.parentInvoice.invoiceType)}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: 'primary.main', cursor: onSearchInvoice ? 'pointer' : 'default' }}
                      onClick={() => inv.parentInvoice?.invoiceNumber && onSearchInvoice?.(inv.parentInvoice.invoiceNumber)}
                    >
                      {inv.parentInvoice.invoiceNumber}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={getStatusLabel(inv.parentInvoice.status)}
                        size="small"
                        color={getStatusChipColor(inv.parentInvoice.status)}
                        sx={{ height: 18, fontSize: '0.65rem' }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatAmount(inv.parentInvoice.totalAmount, inv.parentInvoice.currency)}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            )}

            {/* Child Invoices info */}
            {inv.childInvoices && inv.childInvoices.filter((c) => !inv.parentInvoice || c.id !== inv.parentInvoice.id).length > 0 && (
              <Grid size={{ xs: 12, md: inv.parentInvoice ? 6 : 12 }}>
                <Paper variant="outlined" sx={{ p: 1.25, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                    {t('lblLinkedInvoices')} ({inv.childInvoices.filter((c) => !inv.parentInvoice || c.id !== inv.parentInvoice.id).length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {inv.childInvoices
                      .filter((c) => !inv.parentInvoice || c.id !== inv.parentInvoice.id)
                      .map((child) => (
                        <Box key={child.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700, color: 'primary.main', cursor: onSearchInvoice ? 'pointer' : 'default' }}
                              onClick={() => child.invoiceNumber && onSearchInvoice?.(child.invoiceNumber)}
                            >
                              {child.invoiceNumber}
                            </Typography>
                            {getInvoiceTypeChip(child.invoiceType)}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={getStatusLabel(child.status)}
                              size="small"
                              color={getStatusChipColor(child.status)}
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {formatAmount(child.totalAmount, child.currency)}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                  </Box>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* ITEMS TABLE */}
      {itemsCount > 0 ? (
        <>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            {t('invoiceItemsSection')}
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>{t('lblItemDescription')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {t('lblItemQuantity')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {t('lblItemUnitPrice')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap', minWidth: 120 }}>
                  {t('lblItemTotal')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inv.items?.map((item, idx) => (
                <TableRow key={item.id || idx}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {formatAmount(item.unitPrice, item.currency || inv.currency)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {formatAmount(item.quantity * item.unitPrice, item.currency || inv.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      ) : (
        <Typography variant="caption" color="text.secondary">
          {t('noItemsInInvoice')}
        </Typography>
      )}

      {inv.notes && (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {t('lblNotes')}:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {inv.notes}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
