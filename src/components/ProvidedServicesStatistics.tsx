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
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import type { ProvidedService, Service, Client, Category, Invoice, Project } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  HandymanIcon,
  CheckCircleOutlinedIcon,
  HourglassEmptyIcon,
  BarChartIcon,
  ReceiptLongIcon,
  BusinessIcon,
  ShowChartIcon,
} from './icons';

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
  providedServices: ProvidedService[];
  services: Service[];
  clients: Client[];
  categories?: Category[];
  projects?: Project[];
  invoices?: Invoice[];
}

export const ProvidedServicesStatistics: React.FC<Props> = ({
  providedServices,
  services,
  clients,
  invoices = [],
}) => {
  const { t, language } = useLanguage();

  const isWasteService = (srv?: Service) => {
    if (!srv) return false;
    const group = (srv.group || '').toLowerCase();
    const code = (srv.code || '').toLowerCase();
    const name = (srv.name || '').toLowerCase();
    return (
      group === 'grp-waste' ||
      group.includes('waste') ||
      group.includes('otpad') ||
      code.includes('waste') ||
      code.includes('otpad') ||
      name.includes('waste') ||
      name.includes('otpad')
    );
  };

  const totalCount = providedServices.length;

  const completedCount = useMemo(
    () => providedServices.filter((item) => item.status === 'Completed').length,
    [providedServices]
  );

  const inProgressCount = useMemo(
    () => providedServices.filter((item) => item.status === 'In Progress').length,
    [providedServices]
  );

  const plannedCount = useMemo(
    () => providedServices.filter((item) => item.status === 'Planned').length,
    [providedServices]
  );

  const completionRate = totalCount > 0 ? ((completedCount / totalCount) * 100).toFixed(1) : '0';

  // Money statistics from connected paid invoices
  const { paidRSD, paidEUR, paidInvoicesCount } = useMemo(() => {
    let rsd = 0;
    let eur = 0;
    const processedInvoiceIds = new Set<string>();

    providedServices.forEach((item) => {
      const invId = item.invoiceId || item.invoice?.id;
      if (!invId) return;

      const inv = item.invoice || invoices.find((i) => i.id === invId);
      if (!inv || inv.status !== 'Paid') return;

      if (processedInvoiceIds.has(inv.id)) return;
      processedInvoiceIds.add(inv.id);

      const total =
        inv.totalAmount !== undefined && inv.totalAmount !== null
          ? Number(inv.totalAmount)
          : (inv.items || []).reduce(
              (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
              0
            );

      const curr = inv.currency || 'RSD';
      if (curr === 'EUR' || curr === '€') {
        eur += total;
      } else {
        rsd += total;
      }
    });

    return { paidRSD: rsd, paidEUR: eur, paidInvoicesCount: processedInvoiceIds.size };
  }, [providedServices, invoices]);

  const extractWasteKg = (item: ProvidedService): number => {
    if (!item.customData || typeof item.customData !== 'object') return 0;
    for (const [k, v] of Object.entries(item.customData)) {
      if (v === null || v === undefined || v === '') continue;
      const lower = k.toLowerCase();
      if (
        lower.includes('kolicina') ||
        lower.includes('quantity') ||
        lower.includes('kg') ||
        lower.includes('tona') ||
        lower.includes('tezina') ||
        lower.includes('weight') ||
        lower.includes('amount') ||
        lower.includes('kol')
      ) {
        const num = parseFloat(String(v).replace(',', '.').replace(/[^0-9.-]/g, ''));
        if (!isNaN(num) && num > 0) {
          if (lower.includes('tona') || lower.includes('_t') || String(v).toLowerCase().includes(' t')) {
            return num * 1000;
          }
          return num;
        }
      }
    }
    for (const [_, v] of Object.entries(item.customData)) {
      if (v === null || v === undefined || v === '') continue;
      const num = parseFloat(String(v).replace(',', '.').replace(/[^0-9.-]/g, ''));
      if (!isNaN(num) && num > 0) {
        return num;
      }
    }
    return 0;
  };

  // 3. Top Clients by Provided Services
  const topClientsChartData = useMemo(() => {
    const map = new Map<
      string,
      {
        label: string;
        count: number;
        paidRevenueRSD: number;
        totalWasteKg: number;
        paidInvoiceIds: Set<string>;
      }
    >();

    providedServices.forEach((item) => {
      const cli = item.client || clients.find((c) => c.id === item.clientId);
      const clientName = cli?.name || t('colClient');
      const existing = map.get(clientName) || {
        label: clientName,
        count: 0,
        paidRevenueRSD: 0,
        totalWasteKg: 0,
        paidInvoiceIds: new Set<string>(),
      };
      existing.count += 1;

      const srv = item.service || services.find((s) => s.id === item.serviceId);
      if (isWasteService(srv)) {
        const kg = extractWasteKg(item);
        existing.totalWasteKg += kg;
      }

      const invId = item.invoiceId || item.invoice?.id;
      if (invId) {
        const inv = item.invoice || invoices.find((i) => i.id === invId);
        if (inv && inv.status === 'Paid' && !existing.paidInvoiceIds.has(inv.id)) {
          existing.paidInvoiceIds.add(inv.id);
          const total =
            inv.totalAmount !== undefined && inv.totalAmount !== null
              ? Number(inv.totalAmount)
              : (inv.items || []).reduce(
                  (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
                  0
                );
          const curr = inv.currency || 'RSD';
          if (curr === 'RSD') {
            existing.paidRevenueRSD += total;
          }
        }
      }

      map.set(clientName, existing);
    });

    const sorted = Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 9);

    return sorted;
  }, [providedServices, clients, services, invoices, t]);

  // 4. Available Years & Dynamic Waste Analysis (only years with data)
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();

    providedServices.forEach((item) => {
      const srv = item.service || services.find((s) => s.id === item.serviceId);
      if (!isWasteService(srv)) return;

      const dateStr = item.completionDate || item.scheduledDate || item.createdAt;
      if (!dateStr) return;
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          yearsSet.add(d.getFullYear());
        }
      } catch (e) {}
    });

    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [providedServices, services]);

  const [selectedWasteYear, setSelectedWasteYear] = useState<number | null>(null);

  const currentWasteYear = useMemo(() => {
    if (availableYears.length === 0) return null;
    if (selectedWasteYear !== null && availableYears.includes(selectedWasteYear)) {
      return selectedWasteYear;
    }
    return availableYears[0];
  }, [availableYears, selectedWasteYear]);

  // Only months with data for the selected year
  const selectedYearMonths = useMemo(() => {
    if (!currentWasteYear) return [];

    const monthsSet = new Set<number>();

    providedServices.forEach((item) => {
      const srv = item.service || services.find((s) => s.id === item.serviceId);
      if (!isWasteService(srv)) return;

      const dateStr = item.completionDate || item.scheduledDate || item.createdAt;
      if (!dateStr) return;
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime()) || d.getFullYear() !== currentWasteYear) return;
        monthsSet.add(d.getMonth());
      } catch (e) {}
    });

    const sortedMonthIndices = Array.from(monthsSet).sort((a, b) => a - b);

    const locale =
      language === 'sr-Latn'
        ? 'sr-Latn-RS'
        : language === 'sr-Cyrl'
        ? 'sr-Cyrl-RS'
        : 'en-US';

    return sortedMonthIndices.map((m) => {
      const d = new Date(currentWasteYear, m, 1);
      const key = `${currentWasteYear}-${String(m + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleDateString(locale, { month: 'long' });
      const label = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      return { key, monthIndex: m, label };
    });
  }, [language, currentWasteYear, providedServices, services]);

  const [selectedWasteMonthIndex, setSelectedWasteMonthIndex] = useState<number | null>(null);

  const selectedMonthObj = useMemo(() => {
    if (selectedYearMonths.length === 0) return null;
    if (selectedWasteMonthIndex !== null) {
      const found = selectedYearMonths.find((m) => m.monthIndex === selectedWasteMonthIndex);
      if (found) return found;
    }
    return selectedYearMonths[selectedYearMonths.length - 1];
  }, [selectedYearMonths, selectedWasteMonthIndex]);

  const selectedMonthKey = selectedMonthObj ? selectedMonthObj.key : '';

  // Yearly Waste Stats
  const wasteStatsForSelectedYear = useMemo(() => {
    if (!currentWasteYear) {
      return {
        totalKg: 0,
        totalTons: 0,
        totalEntries: 0,
        activeClientsCount: 0,
      };
    }

    let totalKg = 0;
    let totalEntries = 0;
    const clientSet = new Set<string>();

    providedServices.forEach((item) => {
      const srv = item.service || services.find((s) => s.id === item.serviceId);
      if (!isWasteService(srv)) return;

      const dateStr = item.completionDate || item.scheduledDate || item.createdAt;
      if (!dateStr) return;
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return;
        if (d.getFullYear() !== currentWasteYear) return;

        const kg = extractWasteKg(item);
        totalKg += kg;
        totalEntries += 1;
        const cli = item.client || clients.find((c) => c.id === item.clientId);
        const clientName = cli?.name || item.clientId;
        if (clientName) clientSet.add(clientName);
      } catch (e) {}
    });

    return {
      totalKg,
      totalTons: totalKg / 1000,
      totalEntries,
      activeClientsCount: clientSet.size,
    };
  }, [providedServices, services, clients, currentWasteYear]);

  // Monthly Waste Stats
  const wasteStatsForSelectedMonth = useMemo(() => {
    if (!selectedMonthKey) {
      return {
        totalKg: 0,
        totalTons: 0,
        totalEntries: 0,
        activeClientsCount: 0,
        clients: [],
      };
    }

    let totalKg = 0;
    let totalEntries = 0;
    const clientMap = new Map<
      string,
      {
        clientId: string;
        clientName: string;
        totalKg: number;
        entriesCount: number;
      }
    >();

    providedServices.forEach((item) => {
      const srv = item.service || services.find((s) => s.id === item.serviceId);
      if (!isWasteService(srv)) return;

      const dateStr = item.completionDate || item.scheduledDate || item.createdAt;
      if (!dateStr) return;
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return;
        const itemMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (itemMonthKey !== selectedMonthKey) return;

        const kg = extractWasteKg(item);
        const cli = item.client || clients.find((c) => c.id === item.clientId);
        const clientName = cli?.name || t('colClient');
        const clientId = item.clientId || clientName;

        totalKg += kg;
        totalEntries += 1;

        const existing = clientMap.get(clientId) || {
          clientId,
          clientName,
          totalKg: 0,
          entriesCount: 0,
        };

        existing.totalKg += kg;
        existing.entriesCount += 1;
        clientMap.set(clientId, existing);
      } catch (e) {}
    });

    const clientsList = Array.from(clientMap.values()).sort((a, b) => b.totalKg - a.totalKg);

    return {
      totalKg,
      totalTons: totalKg / 1000,
      totalEntries,
      activeClientsCount: clientsList.length,
      clients: clientsList,
    };
  }, [providedServices, services, clients, selectedMonthKey, t]);

  // 6. Year-over-Year Waste Comparison (Jan to Dec)
  const fullYearMonthLabels = useMemo(() => {
    const locale =
      language === 'sr-Latn'
        ? 'sr-Latn-RS'
        : language === 'sr-Cyrl'
        ? 'sr-Cyrl-RS'
        : 'en-US';

    return Array.from({ length: 12 }, (_, m) => {
      const d = new Date(2024, m, 1);
      const name = d.toLocaleDateString(locale, { month: 'short' });
      return name.charAt(0).toUpperCase() + name.slice(1);
    });
  }, [language]);

  const [wasteChartStatusFilter, setWasteChartStatusFilter] = useState<'all' | 'completed' | 'canceled'>('all');
  const [topClientsWasteUnit, setTopClientsWasteUnit] = useState<'kg' | 't'>('kg');

  const wasteComparisonSeries = useMemo(() => {
    // Sort years ascending for chronological ordering in legend
    const sortedYears = [...availableYears].sort((a, b) => a - b);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const yearDataMap: Record<number, (number | null)[]> = {};
    sortedYears.forEach((yr) => {
      if (yr === currentYear) {
        // For the current year, stop data at current month
        yearDataMap[yr] = Array.from({ length: 12 }, (_, m) => (m <= currentMonth ? 0 : null));
      } else if (yr > currentYear) {
        yearDataMap[yr] = new Array(12).fill(null);
      } else {
        yearDataMap[yr] = new Array(12).fill(0);
      }
    });

    providedServices.forEach((item) => {
      const srv = item.service || services.find((s) => s.id === item.serviceId);
      if (!isWasteService(srv)) return;

      const st = item.status || 'Planned';
      if (wasteChartStatusFilter === 'completed') {
        if (st !== 'Completed' && st !== 'Završeno' && st !== 'Завршено') return;
      } else if (wasteChartStatusFilter === 'canceled') {
        if (st !== 'Cancelled' && st !== 'Canceled' && st !== 'Otkazano' && st !== 'Отказано') return;
      } else {
        // 'all': planned, in progress, and completed (excludes canceled)
        if (st === 'Cancelled' || st === 'Canceled' || st === 'Otkazano' || st === 'Отказано') return;
      }

      const dateStr = item.completionDate || item.scheduledDate || item.createdAt;
      if (!dateStr) return;
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return;
        const yr = d.getFullYear();
        if (yearDataMap[yr]) {
          const m = d.getMonth();
          if (m >= 0 && m < 12) {
            const currentVal = yearDataMap[yr][m];
            const kg = extractWasteKg(item);
            yearDataMap[yr][m] = (currentVal ?? 0) + kg;
          }
        }
      } catch (e) {}
    });

    return sortedYears.map((yr, idx) => ({
      data: yearDataMap[yr],
      label: String(yr),
      color: YEAR_PALETTE[idx % YEAR_PALETTE.length],
      curve: 'linear' as const,
      showMark: false,
      valueFormatter: (v: number | null) =>
        v !== null && v !== undefined
          ? `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`
          : '',
    }));
  }, [availableYears, providedServices, services, wasteChartStatusFilter]);

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
            {t('providedServicesStatistics')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('totalProvidedServices')}: {totalCount}
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
                {totalCount}
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
                {completionRate}%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                <LinearProgress
                  variant="determinate"
                  value={Number(completionRate)}
                  sx={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    bgcolor: 'action.selected',
                    '& .MuiLinearProgress-bar': { bgcolor: '#10b981' },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                  {completedCount}/{totalCount}
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
                  {inProgressCount}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                  / {plannedCount} {t('statusPlanned').toLowerCase()}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                {t('statusInProgress')}: {inProgressCount} | {t('statusPlanned')}: {plannedCount}
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
                {paidRSD.toLocaleString(undefined, { maximumFractionDigits: 0 })} RSD
              </Typography>
              {paidEUR > 0 && (
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', fontSize: '0.6875rem' }}>
                  + {paidEUR.toLocaleString(undefined, { maximumFractionDigits: 2 })} EUR
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.6875rem', mt: 0.25 }}>
                {paidInvoicesCount} {t('statusPaid').toLowerCase()}
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
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8125rem' }}>
                {t('annualWasteAnalysis')}
              </Typography>

              {/* Year Autocomplete */}
              <Autocomplete
                size="small"
                disableClearable={availableYears.length > 0 && currentWasteYear !== null}
                options={availableYears}
                getOptionLabel={(yr) => (yr !== null && yr !== undefined ? String(yr) : '')}
                value={currentWasteYear}
                onChange={(_, newVal) => {
                  if (newVal !== null && newVal !== undefined) {
                    setSelectedWasteYear(Number(newVal));
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
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                    {t('totalWasteYear')}
                  </Typography>
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
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                    {t('wasteClientsCount')}
                  </Typography>
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
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                    {t('wasteEntriesCount')}
                  </Typography>
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
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8125rem' }}>
                {t('monthlyWasteAnalysis')}
              </Typography>

              {/* Month Autocomplete */}
              <Autocomplete
                size="small"
                disableClearable={selectedYearMonths.length > 0 && selectedMonthObj !== null}
                options={selectedYearMonths}
                getOptionLabel={(opt) => opt?.label || ''}
                isOptionEqualToValue={(option, value) => option?.key === value?.key}
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
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                    {t('totalWasteMonth')}
                  </Typography>
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
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                    {t('wasteClientsCount')}
                  </Typography>
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
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                    {t('wasteEntriesCount')}
                  </Typography>
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
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              {t('wasteQuantityByClient')}
            </Typography>

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

        {/* 5. TOP CLIENTS BY PROVIDED SERVICES */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined" sx={{ borderRadius: 2.5, width: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon fontSize="small" sx={{ color: 'primary.main' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {t('topClientsByServices')}
                  </Typography>
                </Box>
                <ToggleButtonGroup
                  size="small"
                  value={topClientsWasteUnit}
                  exclusive
                  onChange={(_, newVal) => {
                    if (newVal) setTopClientsWasteUnit(newVal);
                  }}
                  aria-label="top clients waste unit"
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
                  <ToggleButton value="kg">
                    KG
                  </ToggleButton>
                  <ToggleButton value="t">
                    T
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {topClientsChartData.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="body2">{t('emptyProvidedServices')}</Typography>
                </Box>
              ) : (
                <Grid container spacing={1.5}>
                  {topClientsChartData.map((item, idx) => (
                    <Grid key={`top-client-${idx}`} size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: 'action.hover',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5,
                          height: '100%',
                          justifyContent: 'center',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap title={item.label}>
                            {idx + 1}. {item.label}
                          </Typography>
                          <Chip
                            size="small"
                            label={`${item.count} ${t('tabServices').toLowerCase()}`}
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, mt: 0.5 }}>
                          {item.totalWasteKg > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                {t('totalWasteQuantity')}:
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main' }}>
                                {topClientsWasteUnit === 't'
                                  ? `${(item.totalWasteKg / 1000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} t`
                                  : `${item.totalWasteKg.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`}
                              </Typography>
                            </Box>
                          )}
                          {item.paidRevenueRSD > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                {t('totalValue')}:
                              </Typography>
                              <Typography variant="caption" color="text.primary" sx={{ fontWeight: 700 }}>
                                {item.paidRevenueRSD.toLocaleString(undefined, { maximumFractionDigits: 0 })} RSD
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProvidedServicesStatistics;
