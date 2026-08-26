import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TablePagination,
  IconButton,
  Tooltip,
  TextField,
  Box,
  Chip,
  Paper,
  InputAdornment,
  Autocomplete,
  Button,
} from '@mui/material';







import type { Invoice, Client, Project } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { TableFilterSelector } from './TableFilterSelector';
import { CheckCircleIcon, CalendarTodayIcon, SearchIcon, ArrowUpwardIcon, ArrowDownwardIcon, ArrowForwardIcon, ReceiptLongIcon } from './icons';

interface Props {
  invoices?: Invoice[];
  clients?: Client[];
  projects?: Project[];
  isFullHeight?: boolean;
  hideNotch?: boolean;
  onStatusChangeInvoice?: (id: string, status: string, paymentDate?: string) => Promise<void> | void;
  onViewProject?: (project: Project) => void;
  onNavigateToInvoices?: () => void;
}

function fmtDate(d: string | null): string {
  if (!d) return '—';
  const clean = d.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [y, m, day] = parts;
    return `${day}.${m}.${y}.`;
  }
  return d;
}

const formatInvoiceAmount = (amount?: number | null, curr?: string | null) => {
  const val = amount || 0;
  const c = curr || 'RSD';
  return `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`;
};

export const ApproachingInvoicesPanel: React.FC<Props> = ({
  invoices = [],
  projects = [],
  isFullHeight = false,
  hideNotch = false,
  onStatusChangeInvoice,
  onViewProject,
  onNavigateToInvoices,
}) => {
  const { t } = useLanguage();

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'dueDate' | 'totalAmount' | 'invoiceNumber' | 'client' | 'status'>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, filterStatus, filterClient, sortOption, sortDirection]);

  const handleClearAllFilters = () => {
    setFilterStatus('all');
    setFilterClient('all');
    setSearchQuery('');
    setSortOption('dueDate');
    setSortDirection('asc');
  };

  const getStatusChipColor = (status?: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'Draft': return 'default';
      case 'Sent': return 'info';
      case 'Paid': return 'success';
      case 'Overdue': return 'error';
      case 'Cancelled': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (st?: string) => {
    switch (st) {
      case 'Draft': return t('statusDraft');
      case 'Sent': return t('statusSent');
      case 'Paid': return t('statusPaid');
      case 'Overdue': return t('statusOverdue');
      case 'Cancelled': return t('statusCancelled');
      default: return st || '—';
    }
  };

  const isOverdueInvoice = (inv: Invoice): boolean => {
    if (inv.status === 'Paid' || inv.status === 'Cancelled') return false;
    if (inv.status === 'Overdue') return true;
    if (!inv.dueDate) return false;
    const due = new Date(inv.dueDate.split('T')[0]);
    const today = new Date(new Date().toDateString());
    return due < today;
  };

  const isApproachingInvoice = (inv: Invoice): boolean => {
    if (inv.status === 'Paid' || inv.status === 'Cancelled') return false;
    if (!inv.dueDate) return true;
    const due = new Date(inv.dueDate.split('T')[0]);
    const today = new Date(new Date().toDateString());
    const diffDays = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 15;
  };

  // Only show unpaid / actionable invoices in approaching invoices panel
  const unpaidInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.status !== 'Paid' && inv.status !== 'Cancelled');
  }, [invoices]);

  const uniqueClients = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((inv) => {
      if (inv.clientName && inv.clientName.trim()) set.add(inv.clientName.trim());
    });
    return Array.from(set).sort();
  }, [invoices]);

  const filteredAndSortedItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const filtered = unpaidInvoices.filter((inv) => {
      if (q) {
        const numMatch = (inv.invoiceNumber || '').toLowerCase().includes(q);
        const clientMatch = (inv.clientName || '').toLowerCase().includes(q);
        const projMatch = (inv.projectName || '').toLowerCase().includes(q);
        const notesMatch = (inv.notes || '').toLowerCase().includes(q);
        if (!numMatch && !clientMatch && !projMatch && !notesMatch) return false;
      }

      if (filterStatus !== 'all') {
        if (filterStatus === 'Overdue') {
          if (!isOverdueInvoice(inv)) return false;
        } else if (inv.status !== filterStatus) {
          return false;
        }
      }

      if (filterClient !== 'all') {
        if (inv.clientName !== filterClient) return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      switch (sortOption) {
        case 'dueDate':
          aVal = a.dueDate ? new Date(a.dueDate.split('T')[0]).getTime() : Infinity;
          bVal = b.dueDate ? new Date(b.dueDate.split('T')[0]).getTime() : Infinity;
          break;
        case 'totalAmount':
          aVal = a.totalAmount || 0;
          bVal = b.totalAmount || 0;
          break;
        case 'invoiceNumber':
          aVal = (a.invoiceNumber || '').toLowerCase();
          bVal = (b.invoiceNumber || '').toLowerCase();
          break;
        case 'client':
          aVal = (a.clientName || '').toLowerCase();
          bVal = (b.clientName || '').toLowerCase();
          break;
        case 'status':
          aVal = (a.status || '').toLowerCase();
          bVal = (b.status || '').toLowerCase();
          break;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return (a.invoiceNumber || '').localeCompare(b.invoiceNumber || '');
    });
  }, [unpaidInvoices, searchQuery, filterStatus, filterClient, sortOption, sortDirection]);

  const paginatedItems = useMemo(() => {
    return filteredAndSortedItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredAndSortedItems, page, rowsPerPage]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterStatus !== 'all') count++;
    if (filterClient !== 'all') count++;
    return count;
  }, [filterStatus, filterClient]);

  const sortOptions = [
    { value: 'dueDate', label: t('colDueDate') },
    { value: 'totalAmount', label: t('colTotalAmount') },
    { value: 'invoiceNumber', label: t('colInvoiceNumber') },
    { value: 'client', label: t('colClient') },
    { value: 'status', label: t('colStatus') },
  ];

  const statusOptions = [
    { value: 'all', label: t('filterAll') },
    { value: 'Draft', label: t('statusDraft') },
    { value: 'Sent', label: t('statusSent') },
    { value: 'Overdue', label: t('statusOverdue') },
  ];

  const handleMarkAsPaid = async (inv: Invoice) => {
    if (onStatusChangeInvoice) {
      await onStatusChangeInvoice(inv.id, 'Paid', new Date().toISOString().slice(0, 10));
    }
  };

  const handleItemClick = (inv: Invoice) => {
    if (inv.projectId && onViewProject) {
      const match = projects.find((p) => p.id === inv.projectId);
      if (match) {
        onViewProject(match);
        return;
      }
    }
    if (onNavigateToInvoices) {
      onNavigateToInvoices();
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        height: isFullHeight ? '100%' : 'auto',
        minHeight: isFullHeight ? 400 : 380,
        mt: hideNotch ? 0 : 1,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* NOTCH TITLE */}
      {!hideNotch && (
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            top: -10,
            left: 16,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            px: 0.75,
            py: 0.1,
            color: 'text.secondary',
            fontWeight: 700,
            fontSize: '0.8rem',
            letterSpacing: '0.4px',
            lineHeight: 1,
            zIndex: 1,
          }}
        >
          {t('approachingInvoicesTitle')}
        </Typography>
      )}

      <CardContent
        sx={{
          p: 2,
          pt: hideNotch ? 2 : 2.25,
          pb: '4px !important',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      >
        {/* TOOLBAR */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: 1.5,
            mb: 1.5,
            pb: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* SEARCH FIELD */}
          <TextField
            size="small"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: { xs: '100%', sm: 220 } }}
          />

          {/* RIGHT CONTROLS */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: { xs: 'space-between', sm: 'flex-end' }, flexWrap: 'wrap' }}>
            <TableFilterSelector
              activeCount={activeFilterCount}
              onClear={handleClearAllFilters}
              sortingContent={
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Autocomplete
                    size="small"
                    fullWidth
                    disablePortal
                    disableClearable
                    options={sortOptions}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, val) => option.value === val.value}
                    value={sortOptions.find((o) => o.value === sortOption) || sortOptions[0]}
                    onChange={(_, newValue) => {
                      if (newValue) setSortOption(newValue.value as any);
                    }}
                    renderInput={(params) => <TextField {...params} label={t('lblSortBy')} size="small" />}
                  />
                  <IconButton
                    size="small"
                    onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                    title={sortDirection === 'asc' ? t('sortAscending') : t('sortDescending')}
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 0.75 }}
                  >
                    {sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                  </IconButton>
                </Box>
              }
              filteringContent={
                <>
                  <Autocomplete
                    size="small"
                    fullWidth
                    disablePortal
                    options={statusOptions}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, val) => option.value === val.value}
                    value={statusOptions.find((o) => o.value === filterStatus) || null}
                    onChange={(_, newValue) => setFilterStatus(newValue ? newValue.value : 'all')}
                    renderInput={(params) => <TextField {...params} label={t('colStatus')} size="small" />}
                  />

                  <Autocomplete
                    size="small"
                    fullWidth
                    disablePortal
                    options={uniqueClients}
                    value={filterClient === 'all' ? null : filterClient}
                    onChange={(_, newValue) => setFilterClient(newValue || 'all')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('colClient')}
                      />
                    )}
                  />
                </>
              }
            />

            {onNavigateToInvoices && (
              <Button
                size="small"
                variant="outlined"
                color="primary"
                endIcon={<ArrowForwardIcon />}
                onClick={onNavigateToInvoices}
                sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
              >
                {t('btnShowAllInvoices')}
              </Button>
            )}
          </Box>
        </Box>

        {/* LIST OF INVOICES */}
        <Box
          sx={{
            maxHeight: isFullHeight ? 'none' : 320,
            overflowY: isFullHeight ? 'visible' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            width: '100%',
            flex: 1,
            pb: 1,
          }}
        >
          {filteredAndSortedItems.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {t('emptyApproachingInvoices')}
              </Typography>
            </Paper>
          ) : (
            paginatedItems.map((inv) => {
              const isLate = isOverdueInvoice(inv);
              const isApproaching = isApproachingInvoice(inv);

              return (
                <Box
                  key={inv.id}
                  onClick={() => handleItemClick(inv)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.25,
                    px: 1.5,
                    bgcolor: isLate ? 'error.lighter' : isApproaching ? 'warning.lighter' : 'background.paper',
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: isLate ? 'error.light' : isApproaching ? '#ff9800' : 'divider',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: isLate ? 'error.lighter' : isApproaching ? 'warning.lighter' : 'action.hover',
                    },
                  }}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <ReceiptLongIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: 'text.primary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {inv.invoiceNumber}
                        </Typography>
                      </Box>

                      {inv.clientName && (
                        <Chip
                          label={inv.clientName}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                        />
                      )}
                      {inv.projectName && (
                        <Chip
                          label={inv.projectName}
                          size="small"
                          variant="outlined"
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                      )}
                      <Chip
                        label={getStatusLabel(inv.status)}
                        size="small"
                        color={getStatusChipColor(inv.status)}
                        sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', color: 'text.secondary', fontSize: '0.75rem' }}>
                      {inv.dueDate && (
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            color: isLate ? 'error.main' : isApproaching ? '#ed6c02' : 'text.secondary',
                            fontWeight: isLate || isApproaching ? 700 : 400,
                          }}
                        >
                          <CalendarTodayIcon sx={{ fontSize: '0.8rem' }} />
                          {fmtDate(inv.dueDate)}
                        </Typography>
                      )}
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {formatInvoiceAmount(inv.totalAmount, inv.currency)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* ACTION: MARK AS PAID */}
                  {onStatusChangeInvoice && (
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tooltip title={t('markAsPaid')}>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleMarkAsPaid(inv)}
                          sx={{ p: 0.5 }}
                        >
                          <CheckCircleIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              );
            })
          )}
        </Box>

        {/* PAGINATION */}
        {filteredAndSortedItems.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredAndSortedItems.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{ borderTop: 1, borderColor: 'divider', mt: 0.5, flexShrink: 0 }}
          />
        )}
      </CardContent>
    </Card>
  );
};
