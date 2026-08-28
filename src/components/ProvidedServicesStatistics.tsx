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
} from './icons';

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
    return (
      group === 'grp-waste' ||
      group.includes('waste') ||
      group.includes('otpad') ||
      code.includes('waste') ||
      code.includes('otpad')
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

  // 3. Top Clients by Provided Services
  const topClientsChartData = useMemo(() => {
    const map = new Map<
      string,
      { label: string; count: number; paidRevenueRSD: number; paidInvoiceIds: Set<string> }
    >();

    providedServices.forEach((item) => {
      const cli = item.client || clients.find((c) => c.id === item.clientId);
      const clientName = cli?.name || t('colClient');
      const existing = map.get(clientName) || {
        label: clientName,
        count: 0,
        paidRevenueRSD: 0,
        paidInvoiceIds: new Set<string>(),
      };
      existing.count += 1;

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
  }, [providedServices, clients, invoices, t]);

  // 4. Last 12 Months Timeline
  const last12Months = useMemo(() => {
    const months: { key: string; label: string }[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const locale =
        language === 'sr-Latn'
          ? 'sr-Latn-RS'
          : language === 'sr-Cyrl'
          ? 'sr-Cyrl-RS'
          : 'en-US';

      const monthName = d.toLocaleDateString(locale, { month: 'short' });
      const yearShort = String(d.getFullYear()).slice(-2);
      const label = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} '${yearShort}`;

      months.push({ key, label });
    }
    return months;
  }, [language]);

  const timelineData = useMemo(() => {
    const monthlyMap: Record<string, { total: number; completed: number }> = {};
    last12Months.forEach((m) => {
      monthlyMap[m.key] = { total: 0, completed: 0 };
    });

    providedServices.forEach((item) => {
      const dateStr = item.completionDate || item.scheduledDate || item.createdAt;
      if (!dateStr) return;
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap[key]) {
          monthlyMap[key].total += 1;
          if (item.status === 'Completed') {
            monthlyMap[key].completed += 1;
          }
        }
      } catch (e) {}
    });

    const totalSeries: number[] = [];
    const completedSeries: number[] = [];

    last12Months.forEach((m) => {
      const data = monthlyMap[m.key] || { total: 0, completed: 0 };
      totalSeries.push(data.total);
      completedSeries.push(data.completed);
    });

    return {
      labels: last12Months.map((m) => m.label),
      totalSeries,
      completedSeries,
    };
  }, [providedServices, last12Months]);

  // 5. Available Years & Dynamic Waste Analysis
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    const curYear = new Date().getFullYear();
    yearsSet.add(curYear);
    yearsSet.add(curYear - 1);
    yearsSet.add(curYear - 2);

    providedServices.forEach((item) => {
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
  }, [providedServices]);

  const [selectedWasteYear, setSelectedWasteYear] = useState<number>(new Date().getFullYear());

  const selectedYearMonths = useMemo(() => {
    const list: { key: string; monthIndex: number; label: string }[] = [];
    const locale =
      language === 'sr-Latn'
        ? 'sr-Latn-RS'
        : language === 'sr-Cyrl'
        ? 'sr-Cyrl-RS'
        : 'en-US';

    for (let m = 0; m < 12; m++) {
      const d = new Date(selectedWasteYear, m, 1);
      const key = `${selectedWasteYear}-${String(m + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleDateString(locale, { month: 'long' });
      const label = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      list.push({ key, monthIndex: m, label });
    }
    return list;
  }, [language, selectedWasteYear]);

  const [selectedWasteMonthIndex, setSelectedWasteMonthIndex] = useState<number>(new Date().getMonth());

  const selectedMonthKey = `${selectedWasteYear}-${String(selectedWasteMonthIndex + 1).padStart(2, '0')}`;
  const selectedMonthObj = selectedYearMonths[selectedWasteMonthIndex] || selectedYearMonths[0];

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

  // Yearly Waste Stats
  const wasteStatsForSelectedYear = useMemo(() => {
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
        if (d.getFullYear() !== selectedWasteYear) return;

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
  }, [providedServices, services, clients, selectedWasteYear]);

  // Monthly Waste Stats
  const wasteStatsForSelectedMonth = useMemo(() => {
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
                disableClearable
                options={availableYears}
                getOptionLabel={(yr) => String(yr)}
                value={selectedWasteYear}
                onChange={(_, newVal) => {
                  if (newVal) {
                    setSelectedWasteYear(Number(newVal));
                  }
                }}
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
                      {selectedWasteYear}
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
                    {selectedWasteYear}
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
                    {selectedWasteYear}
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
                disableClearable
                options={selectedYearMonths}
                getOptionLabel={(opt) => opt.label}
                isOptionEqualToValue={(option, value) => option.key === value.key}
                value={selectedMonthObj}
                onChange={(_, newVal) => {
                  if (newVal) {
                    setSelectedWasteMonthIndex(newVal.monthIndex);
                  }
                }}
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
                      {selectedMonthObj?.label}
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
                    {selectedMonthObj?.label}
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

      {/* CHARTS: MONTHLY TREND & TOP CLIENTS */}
      <Grid container spacing={2.5}>
        {/* 3. MONTHLY SERVICES TIMELINE (100% FULL WIDTH) */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined" sx={{ borderRadius: 2.5, width: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BarChartIcon fontSize="small" sx={{ color: 'primary.main' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {t('monthlyServicesTrend')}
                </Typography>
              </Box>

              <Box sx={{ width: '100%', height: 320 }}>
                <LineChart
                  xAxis={[{ scaleType: 'point', data: timelineData.labels }]}
                  series={[
                    {
                      data: timelineData.totalSeries,
                      label: t('totalProvidedServices'),
                      color: '#2563eb',
                      curve: 'linear',
                      showMark: true,
                    },
                    {
                      data: timelineData.completedSeries,
                      label: t('statusCompleted'),
                      color: '#10b981',
                      curve: 'linear',
                      showMark: true,
                    },
                  ]}
                  height={320}
                  margin={{ top: 20, bottom: 30, left: 40, right: 30 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 4. TOP CLIENTS BY PROVIDED SERVICES */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined" sx={{ borderRadius: 2.5, width: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BusinessIcon fontSize="small" sx={{ color: 'primary.main' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {t('topClientsByServices')}
                </Typography>
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
                        {item.paidRevenueRSD > 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {t('totalValue')}: {item.paidRevenueRSD.toLocaleString(undefined, { maximumFractionDigits: 0 })} RSD
                          </Typography>
                        )}
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
