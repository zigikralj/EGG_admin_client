import React, { useState, useMemo } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Autocomplete,
  TextField,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { INTL_LOCALE_MAP } from '../../constants';
import { useLanguage } from '../../context/LanguageContext';
import { useWasteStatisticsQuery, useWasteDisposalClientsQuery } from '../../queries';
import { TableSearchInput } from '../common/TableSearchInput';
import {
  HandymanIcon,
  CheckCircleOutlinedIcon,
  HourglassEmptyIcon,
  BarChartIcon,
  ReceiptLongIcon,
  BusinessIcon,
  ShowChartIcon,
} from '../icons';

const YEAR_PALETTE = [
  '#0284c7', // Sky Blue
  '#10b981', // Emerald Green
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#6366f1', // Indigo
];

const formatCompactNumber = (val: number | null | undefined): string => {
  if (val === null || val === undefined) return '0';
  const abs = Math.abs(val);
  if (abs >= 1_000_000) {
    return `${(val / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
  }
  if (abs >= 1_000) {
    return `${(val / 1_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k`;
  }
  return val.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

interface Props {
  title?: string;
  wasteServiceId?: string;
  // Legacy optional props retained for interface compatibility
  providedServices?: any[];
  services?: any[];
  clients?: any[];
  categories?: any[];
  projects?: any[];
  invoices?: any[];
}

export const WasteDisposalStatistics: React.FC<Props> = ({ title }) => {
  const { t, language } = useLanguage();

  const [selectedWasteYear, setSelectedWasteYear] = useState<number | null>(null);
  const [selectedWasteMonthIndex, setSelectedWasteMonthIndex] = useState<number | null>(null);
  const [wasteChartStatusFilter, setWasteChartStatusFilter] = useState<'all' | 'completed' | 'canceled'>('all');
  const [topClientsWasteUnit, setTopClientsWasteUnit] = useState<'kg' | 't'>('kg');

  // Paginated clients breakdown state
  const [clientsPage, setClientsPage] = useState<number>(0);
  const [clientsRowsPerPage, setClientsRowsPerPage] = useState<number>(10);
  const [clientsSearch, setClientsSearch] = useState<string>('');
  const [clientsSortBy, setClientsSortBy] = useState<'totalValue' | 'totalWaste' | 'count' | 'clientName'>('totalValue');
  const [clientsSortOrder, setClientsSortOrder] = useState<'asc' | 'desc'>('desc');
  const [clientsYearFilter, setClientsYearFilter] = useState<'all' | number>('all');

  const { data: stats, isLoading, isFetching } = useWasteStatisticsQuery({
    year: selectedWasteYear ?? undefined,
    monthIndex: selectedWasteMonthIndex ?? undefined,
    status: wasteChartStatusFilter,
  });

  const { data: clientsData, isLoading: isClientsLoading, isFetching: isClientsFetching } = useWasteDisposalClientsQuery({
    page: clientsPage + 1,
    limit: clientsRowsPerPage,
    search: clientsSearch,
    year: clientsYearFilter === 'all' ? undefined : clientsYearFilter,
    status: wasteChartStatusFilter,
    sortBy: clientsSortBy,
    sortOrder: clientsSortOrder,
  });

  const handleClientsSort = (field: 'totalValue' | 'totalWaste' | 'count' | 'clientName') => {
    if (clientsSortBy === field) {
      setClientsSortOrder(clientsSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setClientsSortBy(field);
      setClientsSortOrder(field === 'clientName' ? 'asc' : 'desc');
    }
    setClientsPage(0);
  };

  const availableYears = stats?.availableYears || [];
  const currentWasteYear = stats?.currentWasteYear ?? null;
  const activeWasteYear = selectedWasteYear ?? currentWasteYear;

  // Localized month options for the selected year
  const selectedYearMonths = useMemo(() => {
    const locale = INTL_LOCALE_MAP[language];
    return (stats?.selectedYearMonths || []).map((m) => {
      const d = new Date(activeWasteYear || 2026, m.monthIndex, 1);
      const monthName = d.toLocaleDateString(locale, { month: 'long' });
      const label = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      return { ...m, label };
    });
  }, [stats?.selectedYearMonths, activeWasteYear, language]);

  const selectedMonthObj = useMemo(() => {
    if (selectedYearMonths.length === 0) return null;
    if (selectedWasteMonthIndex !== null) {
      const found = selectedYearMonths.find((m) => m.monthIndex === selectedWasteMonthIndex);
      if (found) return found;
    }
    return selectedYearMonths[selectedYearMonths.length - 1];
  }, [selectedYearMonths, selectedWasteMonthIndex]);

  const fullYearMonthLabels = useMemo(() => {
    const locale = INTL_LOCALE_MAP[language];
    return Array.from({ length: 12 }, (_, m) => {
      const d = new Date(2024, m, 1);
      const name = d.toLocaleDateString(locale, { month: 'short' });
      return name.charAt(0).toUpperCase() + name.slice(1);
    });
  }, [language]);

  const wasteComparisonSeries = useMemo(() => {
    if (!stats?.wasteComparisonSeries) return [];
    return stats.wasteComparisonSeries.map((item, idx) => ({
      data: item.data,
      label: item.label,
      color: YEAR_PALETTE[idx % YEAR_PALETTE.length],
      curve: 'linear' as const,
      showMark: false,
      valueFormatter: (v: number | null) =>
        v !== null && v !== undefined
          ? `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`
          : '',
    }));
  }, [stats?.wasteComparisonSeries]);

  if (isLoading && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const kpi = stats?.kpi || {
    totalCount: 0,
    completedCount: 0,
    inProgressCount: 0,
    plannedCount: 0,
    completionRate: '0',
    paidRevenueRSD: 0,
    paidRevenueEUR: 0,
    paidInvoicesCount: 0,
  };

  const wasteStatsForSelectedYear = stats?.wasteStatsForSelectedYear || {
    totalKg: 0,
    totalTons: 0,
    totalEntries: 0,
    activeClientsCount: 0,
  };

  const wasteStatsForSelectedMonth = stats?.wasteStatsForSelectedMonth || {
    totalKg: 0,
    totalTons: 0,
    totalEntries: 0,
    activeClientsCount: 0,
    clients: [],
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%', pb: 3 }}>
      {/* HEADER */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            bgcolor: 'primary.50',
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BarChartIcon fontSize="medium" />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {title || t('providedServicesStatistics')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('totalProvidedServices')}: {kpi.totalCount}
          </Typography>
        </Box>
      </Box>

      {/* KPI METRIC CARDS */}
      <Grid container spacing={1.5}>
        {/* TOTAL SERVICES */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              height: '100%',
              bgcolor: 'background.paper',
              borderLeft: '3.5px solid',
              borderLeftColor: 'primary.main',
              boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
            }}
          >
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                  {t('totalProvidedServices')}
                </Typography>
                <HandymanIcon sx={{ fontSize: 16, color: 'primary.main', opacity: 0.8 }} />
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', mt: 0.5, color: 'text.primary', lineHeight: 1.2 }}>
                {kpi.totalCount}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {t('tabProvidedServices')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* COMPLETION RATE */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              height: '100%',
              bgcolor: 'background.paper',
              borderLeft: '3.5px solid',
              borderLeftColor: '#10b981',
              boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
            }}
          >
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                  {t('completionRate')}
                </Typography>
                <CheckCircleOutlinedIcon sx={{ fontSize: 16, color: '#10b981' }} />
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', mt: 0.5, color: '#10b981', lineHeight: 1.2 }}>
                {kpi.completionRate}%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                <LinearProgress
                  variant="determinate"
                  value={Number(kpi.completionRate)}
                  sx={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    bgcolor: 'action.selected',
                    '& .MuiLinearProgress-bar': { bgcolor: '#10b981' },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                  {kpi.completedCount}/{kpi.totalCount}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ACTIVE & PLANNED */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              height: '100%',
              bgcolor: 'background.paper',
              borderLeft: '3.5px solid',
              borderLeftColor: '#3b82f6',
              boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
            }}
          >
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                  {t('inProgressServices') || 'In Progress'} / {t('plannedServices') || 'Planned'}
                </Typography>
                <HourglassEmptyIcon sx={{ fontSize: 16, color: '#3b82f6' }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mt: 0.5 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', color: '#3b82f6', lineHeight: 1.2 }}>
                  {kpi.inProgressCount}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                  / {kpi.plannedCount} {t('statusPlanned').toLowerCase()}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                {t('statusInProgress')}: {kpi.inProgressCount} | {t('statusPlanned')}: {kpi.plannedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* PAID INVOICES REVENUE */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              height: '100%',
              bgcolor: 'background.paper',
              borderLeft: '3.5px solid',
              borderLeftColor: '#8b5cf6',
              boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
            }}
          >
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                  {t('totalValue')}
                </Typography>
                <ReceiptLongIcon sx={{ fontSize: 16, color: '#8b5cf6' }} />
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', mt: 0.5, color: '#8b5cf6', lineHeight: 1.2 }} noWrap>
                {kpi.paidRevenueRSD.toLocaleString(undefined, { maximumFractionDigits: 0 })} RSD
              </Typography>
              {kpi.paidRevenueEUR > 0 && (
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', fontSize: '0.6875rem' }}>
                  + {kpi.paidRevenueEUR.toLocaleString(undefined, { maximumFractionDigits: 2 })} EUR
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.6875rem', mt: 0.25 }}>
                {kpi.paidInvoicesCount} {t('statusPaid').toLowerCase()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* WASTE QUANTITY ANALYSIS (YEARLY & MONTHLY SECTIONS) */}
      <Card
        variant="outlined"
        sx={{
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.95rem', mb: 2 }}>
            {t('wasteQuantityAnalysis')}
          </Typography>

          {/* 1. YEARLY SECTION */}
          <Box sx={{ mb: 2.5 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: 1.5,
                mb: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8125rem' }}>
                  {t('annualWasteAnalysis')}
                </Typography>
                {isFetching && !isLoading && (
                  <CircularProgress size={13} thickness={5} sx={{ color: 'primary.main' }} />
                )}
              </Box>

              {/* Year Autocomplete */}
              <Autocomplete
                size="small"
                loading={isFetching && !isLoading}
                disableClearable={availableYears.length > 0 && activeWasteYear !== null}
                options={availableYears}
                getOptionLabel={(yr) => (yr !== null && yr !== undefined ? String(yr) : '')}
                value={activeWasteYear}
                onChange={(_, newVal) => {
                  if (newVal !== null && newVal !== undefined) {
                    setSelectedWasteYear(Number(newVal));
                    setSelectedWasteMonthIndex(null); // Reset month to latest active in new year
                  }
                }}
                disabled={availableYears.length === 0}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('lblSelectYear')}
                    size="small"
                    sx={{ minWidth: { xs: '100%', sm: 180 } }}
                  />
                )}
              />
            </Box>

            {/* Yearly KPIs */}
            <Grid container spacing={1.5}>
              {/* Total Annual Waste */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box
                  sx={{
                    p: 1.25,
                    px: 1.5,
                    borderRadius: 1.5,
                    bgcolor: 'action.hover',
                    borderLeft: '3.5px solid',
                    borderLeftColor: '#0284c7',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.25,
                    height: '100%',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                      {t('totalWasteYear')}
                    </Typography>
                    {isFetching && !isLoading && (
                      <CircularProgress size={11} thickness={5} sx={{ color: '#0284c7' }} />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mt: 0.25 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#0284c7', lineHeight: 1.2 }}>
                      {wasteStatsForSelectedYear.totalKg.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>
                      kg
                    </Typography>
                  </Box>
                  {wasteStatsForSelectedYear.totalKg >= 1000 ? (
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.6875rem' }}>
                      ≈ {wasteStatsForSelectedYear.totalTons.toLocaleString(undefined, { maximumFractionDigits: 2 })} t
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                      {currentWasteYear ?? '-'}
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* Active Clients in Year */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box
                  sx={{
                    p: 1.25,
                    px: 1.5,
                    borderRadius: 1.5,
                    bgcolor: 'action.hover',
                    borderLeft: '3.5px solid',
                    borderLeftColor: 'primary.main',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.25,
                    height: '100%',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                      {t('wasteClientsCount')}
                    </Typography>
                    {isFetching && !isLoading && (
                      <CircularProgress size={11} thickness={5} sx={{ color: 'primary.main' }} />
                    )}
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: 'primary.main', mt: 0.25, lineHeight: 1.2 }}>
                    {wasteStatsForSelectedYear.activeClientsCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                    {currentWasteYear ?? '-'}
                  </Typography>
                </Box>
              </Grid>

              {/* Collections in Year */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box
                  sx={{
                    p: 1.25,
                    px: 1.5,
                    borderRadius: 1.5,
                    bgcolor: 'action.hover',
                    borderLeft: '3.5px solid',
                    borderLeftColor: '#f59e0b',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.25,
                    height: '100%',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                      {t('wasteEntriesCount')}
                    </Typography>
                    {isFetching && !isLoading && (
                      <CircularProgress size={11} thickness={5} sx={{ color: '#f59e0b' }} />
                    )}
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#f59e0b', mt: 0.25, lineHeight: 1.2 }}>
                    {wasteStatsForSelectedYear.totalEntries}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                    {currentWasteYear ?? '-'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* 2. MONTHLY SECTION */}
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: 1.5,
                mb: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8125rem' }}>
                  {t('monthlyWasteAnalysis')}
                </Typography>
                {isFetching && !isLoading && (
                  <CircularProgress size={13} thickness={5} sx={{ color: 'primary.main' }} />
                )}
              </Box>

              {/* Month Autocomplete */}
              <Autocomplete
                size="small"
                loading={isFetching && !isLoading}
                disableClearable={selectedYearMonths.length > 0 && selectedMonthObj !== null}
                options={selectedYearMonths}
                getOptionLabel={(opt) => opt?.label || ''}
                isOptionEqualToValue={(option, value) => option?.monthKey === value?.monthKey}
                value={selectedMonthObj}
                onChange={(_, newVal) => {
                  if (newVal) {
                    setSelectedWasteMonthIndex(newVal.monthIndex);
                  }
                }}
                disabled={selectedYearMonths.length === 0}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('lblSelectMonth')}
                    size="small"
                    sx={{ minWidth: { xs: '100%', sm: 220 } }}
                  />
                )}
              />
            </Box>

            {/* Monthly KPIs */}
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              {/* Total Monthly Waste */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box
                  sx={{
                    p: 1.25,
                    px: 1.5,
                    borderRadius: 1.5,
                    bgcolor: 'action.hover',
                    borderLeft: '3.5px solid',
                    borderLeftColor: 'success.main',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.25,
                    height: '100%',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                      {t('totalWasteMonth')}
                    </Typography>
                    {isFetching && !isLoading && (
                      <CircularProgress size={11} thickness={5} sx={{ color: 'success.main' }} />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mt: 0.25 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: 'success.main', lineHeight: 1.2 }}>
                      {wasteStatsForSelectedMonth.totalKg.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>
                      kg
                    </Typography>
                  </Box>
                  {wasteStatsForSelectedMonth.totalKg >= 1000 ? (
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.6875rem' }}>
                      ≈ {wasteStatsForSelectedMonth.totalTons.toLocaleString(undefined, { maximumFractionDigits: 2 })} t
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                      {selectedMonthObj?.label || '-'}
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* Active Clients in Month */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box
                  sx={{
                    p: 1.25,
                    px: 1.5,
                    borderRadius: 1.5,
                    bgcolor: 'action.hover',
                    borderLeft: '3.5px solid',
                    borderLeftColor: 'primary.main',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.25,
                    height: '100%',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                      {t('wasteClientsCount')}
                    </Typography>
                    {isFetching && !isLoading && (
                      <CircularProgress size={11} thickness={5} sx={{ color: 'primary.main' }} />
                    )}
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: 'primary.main', mt: 0.25, lineHeight: 1.2 }}>
                    {wasteStatsForSelectedMonth.activeClientsCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                    {wasteStatsForSelectedMonth.activeClientsCount === 1 ? t('colClient') : t('tabClients')}
                  </Typography>
                </Box>
              </Grid>

              {/* Collections in Month */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box
                  sx={{
                    p: 1.25,
                    px: 1.5,
                    borderRadius: 1.5,
                    bgcolor: 'action.hover',
                    borderLeft: '3.5px solid',
                    borderLeftColor: '#f59e0b',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.25,
                    height: '100%',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                      {t('wasteEntriesCount')}
                    </Typography>
                    {isFetching && !isLoading && (
                      <CircularProgress size={11} thickness={5} sx={{ color: '#f59e0b' }} />
                    )}
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#f59e0b', mt: 0.25, lineHeight: 1.2 }}>
                    {wasteStatsForSelectedMonth.totalEntries}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                    {selectedMonthObj?.label || '-'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Breakdown Per Client */}
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t('wasteQuantityByClient')}
              </Typography>
              {isFetching && !isLoading && (
                <CircularProgress size={13} thickness={5} sx={{ color: 'primary.main' }} />
              )}
            </Box>

            {wasteStatsForSelectedMonth.clients.length === 0 ? (
              <Box sx={{ py: 3.5, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('noWasteInMonth')}
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={1.5}>
                {wasteStatsForSelectedMonth.clients.map((cli, idx) => {
                  const percentage =
                    wasteStatsForSelectedMonth.totalKg > 0
                      ? (cli.totalKg / wasteStatsForSelectedMonth.totalKg) * 100
                      : 0;
                  return (
                    <Grid key={cli.clientId || idx} size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: 'action.hover',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.75,
                          height: '100%',
                          justifyContent: 'center',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap title={cli.clientName}>
                            {idx + 1}. {cli.clientName}
                          </Typography>
                          <Chip
                            size="small"
                            label={`${cli.entriesCount} ${t('tabServices').toLowerCase()}`}
                            variant="outlined"
                            sx={{ fontSize: '0.75rem', height: 22, flexShrink: 0 }}
                          />
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: 'success.dark' }}>
                            {cli.totalKg.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
                            <Typography component="span" variant="caption" sx={{ fontWeight: 700 }}>
                              kg
                            </Typography>
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                            {percentage.toFixed(1)}%
                          </Typography>
                        </Box>

                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: 'action.selected',
                            '& .MuiLinearProgress-bar': { bgcolor: 'success.main', borderRadius: 3 },
                          }}
                        />

                        {cli.totalKg >= 1000 && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            ≈ {(cli.totalKg / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} t
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* CHARTS: YEAR-OVER-YEAR WASTE & TOP CLIENTS */}
      <Grid container spacing={2.5}>
        {/* 3. YEAR-OVER-YEAR MONTHLY WASTE COMPARISON */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined" sx={{ borderRadius: 2.5, width: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShowChartIcon fontSize="small" sx={{ color: 'primary.main' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {t('wasteComparisonByYear')}
                  </Typography>
                  {isFetching && !isLoading && (
                    <CircularProgress size={13} thickness={5} sx={{ color: 'primary.main' }} />
                  )}
                </Box>
                <ToggleButtonGroup
                  size="small"
                  value={wasteChartStatusFilter}
                  exclusive
                  onChange={(_, newVal) => {
                    if (newVal) setWasteChartStatusFilter(newVal);
                  }}
                  aria-label="waste chart status filter"
                  sx={{
                    bgcolor: 'background.paper',
                    '& .MuiToggleButton-root': {
                      px: 1.5,
                      py: 0.25,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'none',
                    },
                  }}
                >
                  <ToggleButton value="all">
                    {t('filterAllStatus')}
                  </ToggleButton>
                  <ToggleButton value="completed" sx={{ color: 'success.main', '&.Mui-selected': { color: 'success.dark' } }}>
                    {t('statusCompleted')}
                  </ToggleButton>
                  <ToggleButton value="canceled" sx={{ color: 'error.main', '&.Mui-selected': { color: 'error.dark' } }}>
                    {t('statusCancelled')}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {wasteComparisonSeries.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="body2">{t('emptyProvidedServices')}</Typography>
                </Box>
              ) : (
                <Box sx={{ width: '100%', height: 340 }}>
                  <LineChart
                    xAxis={[{ scaleType: 'point', data: fullYearMonthLabels }]}
                    yAxis={[
                      {
                        valueFormatter: (val: number | null) => formatCompactNumber(val),
                      },
                    ]}
                    series={wasteComparisonSeries}
                    height={340}
                    margin={{ top: 20, bottom: 30, left: 50, right: 30 }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 5. ALL CLIENTS WITH DELIVERED SERVICES (PAGINATED, SORTABLE, FILTERABLE) */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined" sx={{ borderRadius: 2.5, width: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* HEADER WITH FILTERS AND SORTING */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon fontSize="small" sx={{ color: 'primary.main' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {t('topClientsByServices')}
                  </Typography>
                  <Chip
                    size="small"
                    label={`${clientsData?.total ?? 0}`}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                  />
                  {isClientsFetching && !isClientsLoading && (
                    <CircularProgress size={13} thickness={5} sx={{ color: 'primary.main' }} />
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                  {/* Search input */}
                  <TableSearchInput
                    value={clientsSearch}
                    onChange={(val) => {
                      setClientsSearch(val);
                      setClientsPage(0);
                    }}
                    placeholder={t('searchPlaceholder')}
                    expandedWidth={{ xs: '100%', sm: 200 }}
                  />

                  {/* Year filter */}
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel id="clients-year-filter-label">{t('lblSelectYear')}</InputLabel>
                    <Select
                      labelId="clients-year-filter-label"
                      value={clientsYearFilter}
                      label={t('lblSelectYear')}
                      onChange={(e) => {
                        setClientsYearFilter(e.target.value as any);
                        setClientsPage(0);
                      }}
                      sx={{ fontSize: '0.8125rem' }}
                    >
                      <MenuItem value="all">{t('filterAllTime') || 'Sve vreme'}</MenuItem>
                      {availableYears.map((yr) => (
                        <MenuItem key={`clients-yr-${yr}`} value={yr}>
                          {yr}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Waste unit toggle */}
                  <ToggleButtonGroup
                    size="small"
                    value={topClientsWasteUnit}
                    exclusive
                    onChange={(_, newVal) => {
                      if (newVal) setTopClientsWasteUnit(newVal);
                    }}
                    aria-label="waste unit"
                    sx={{
                      bgcolor: 'background.paper',
                      '& .MuiToggleButton-root': {
                        px: 1.5,
                        py: 0.25,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'none',
                      },
                    }}
                  >
                    <ToggleButton value="kg">KG</ToggleButton>
                    <ToggleButton value="t">T</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Box>

              {/* PAGINATED CLIENTS TABLE */}
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ width: 48, fontWeight: 700 }}>#</TableCell>
                      <TableCell sortDirection={clientsSortBy === 'clientName' ? clientsSortOrder : false}>
                        <TableSortLabel
                          active={clientsSortBy === 'clientName'}
                          direction={clientsSortBy === 'clientName' ? clientsSortOrder : 'asc'}
                          onClick={() => handleClientsSort('clientName')}
                        >
                          {t('colClient')}
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right" sortDirection={clientsSortBy === 'count' ? clientsSortOrder : false}>
                        <TableSortLabel
                          active={clientsSortBy === 'count'}
                          direction={clientsSortBy === 'count' ? clientsSortOrder : 'desc'}
                          onClick={() => handleClientsSort('count')}
                        >
                          {t('tabServices')}
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right" sortDirection={clientsSortBy === 'totalWaste' ? clientsSortOrder : false}>
                        <TableSortLabel
                          active={clientsSortBy === 'totalWaste'}
                          direction={clientsSortBy === 'totalWaste' ? clientsSortOrder : 'desc'}
                          onClick={() => handleClientsSort('totalWaste')}
                        >
                          {t('totalWasteQuantity')} ({topClientsWasteUnit.toUpperCase()})
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right" sortDirection={clientsSortBy === 'totalValue' ? clientsSortOrder : false}>
                        <TableSortLabel
                          active={clientsSortBy === 'totalValue'}
                          direction={clientsSortBy === 'totalValue' ? clientsSortOrder : 'desc'}
                          onClick={() => handleClientsSort('totalValue')}
                        >
                          {t('totalValue')} (RSD)
                        </TableSortLabel>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isClientsLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <CircularProgress size={28} />
                        </TableCell>
                      </TableRow>
                    ) : !clientsData || clientsData.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          <Typography variant="body2">{t('emptyProvidedServices')}</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      clientsData.items.map((row, idx) => {
                        const indexNum = clientsPage * clientsRowsPerPage + idx + 1;
                        const displayWaste =
                          topClientsWasteUnit === 't'
                            ? `${(row.totalWasteKg / 1000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} t`
                            : `${row.totalWasteKg.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`;
                        const displayValue =
                          row.paidRevenueRSD > 0
                            ? `${row.paidRevenueRSD.toLocaleString(undefined, { maximumFractionDigits: 0 })} RSD`
                            : row.totalInvoicedRSD > 0
                            ? `${row.totalInvoicedRSD.toLocaleString(undefined, { maximumFractionDigits: 0 })} RSD`
                            : '—';

                        return (
                          <TableRow key={row.clientId || idx} hover>
                            <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{indexNum}</TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {row.clientName}
                              </Typography>
                              {row.city && (
                                <Typography variant="caption" color="text.secondary">
                                  {row.city}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                size="small"
                                label={`${row.count}`}
                                color="primary"
                                variant="outlined"
                                sx={{ fontWeight: 700 }}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                              {displayWaste}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {displayValue}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                <TablePagination
                  component="div"
                  count={clientsData?.total ?? 0}
                  page={clientsPage}
                  onPageChange={(_, newPage) => setClientsPage(newPage)}
                  rowsPerPage={clientsRowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setClientsRowsPerPage(parseInt(e.target.value, 10));
                    setClientsPage(0);
                  }}
                  rowsPerPageOptions={[10, 25, 50]}
                  labelRowsPerPage={t('lblRowsPerPage')}
                />
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WasteDisposalStatistics;
