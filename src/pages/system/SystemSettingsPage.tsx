import React, { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  useTheme,
  alpha,
  Alert,
} from '@mui/material';
import { SettingsIcon, RecyclingIcon, AccessTimeIcon } from '../../components/icons';
import { ServiceAutocomplete } from '../../components/common/autocomplete';
import { ActivityLogsDialogs } from '../../components/activityLogs';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import type { Service } from '../../types';
import {
  useWasteDisposalServiceId,
  useSystemSettingsMutations,
  useServiceDetailsQuery,
  useActivityLogStatusQuery,
  useActivityLogToggleMutation,
  useActivityLogUpdateSettingsMutation,
} from '../../queries';

export const SystemSettingsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { hasPermission } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const canViewSystemSettings = hasPermission('systemSettings', 'view');
  const canEditSystemSettings = hasPermission('systemSettings', 'edit');
  const canConfigureActivityLogs = hasPermission('activityLogs', 'configure');

  const showWasteSection = canViewSystemSettings || canEditSystemSettings;
  const showActivitySection = canViewSystemSettings || canConfigureActivityLogs;

  // --- Waste Disposal Service Setting ---
  const { wasteDisposalServiceId, wasteDisposalService } = useWasteDisposalServiceId();
  const { updateSettingMutation } = useSystemSettingsMutations();

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<Service | null>(null);
  const currentServiceId = selectedServiceId !== null ? selectedServiceId : wasteDisposalServiceId;

  const isConfiguredServiceJoined = Boolean(
    wasteDisposalService &&
      (currentServiceId === wasteDisposalServiceId ||
        currentServiceId === wasteDisposalService.id ||
        currentServiceId === wasteDisposalService.code)
  );

  const shouldFetchService = Boolean(
    showWasteSection && currentServiceId && !isConfiguredServiceJoined && !selectedOption
  );

  const { data: fetchedService } = useServiceDetailsQuery(currentServiceId, shouldFetchService);

  const resolvedFetchedService = useMemo(() => {
    if (!fetchedService) return null;
    return Array.isArray(fetchedService)
      ? (fetchedService[0] as Service)
      : (fetchedService as Service);
  }, [fetchedService]);

  const selectedService = useMemo(() => {
    if (
      selectedOption &&
      (selectedOption.id === currentServiceId || selectedOption.code === currentServiceId)
    ) {
      return selectedOption;
    }
    if (isConfiguredServiceJoined && wasteDisposalService) {
      return wasteDisposalService;
    }
    return resolvedFetchedService || selectedOption || null;
  }, [
    selectedOption,
    currentServiceId,
    isConfiguredServiceJoined,
    wasteDisposalService,
    resolvedFetchedService,
  ]);

  const handleServiceChange = (serviceId: string | null, option?: Service | null) => {
    if (!canEditSystemSettings) return;
    const nextId = serviceId || '';
    setSelectedServiceId(nextId);
    setSelectedOption(option || null);
    updateSettingMutation.mutate(
      { key: 'waste_disposal_service_id', value: nextId },
      {
        onError: () => {
          setSelectedServiceId(null);
          setSelectedOption(null);
        },
      }
    );
  };

  // --- Activity Logging Settings ---
  const { data: statusData, isLoading: isStatusLoading } = useActivityLogStatusQuery();
  const toggleMutation = useActivityLogToggleMutation();
  const updateSettingsMutation = useActivityLogUpdateSettingsMutation();

  const isLoggingEnabled = statusData?.enabled ?? true;
  const retentionDays = statusData?.retentionDays ?? 30;
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const [customRetentionOpen, setCustomRetentionOpen] = useState(false);
  const [customDaysInput, setCustomDaysInput] = useState<string>('30');

  const handleToggleClick = (nextChecked: boolean) => {
    if (!canConfigureActivityLogs) return;
    if (!nextChecked) {
      setConfirmDeactivateOpen(true);
    } else {
      toggleMutation.mutate(true);
    }
  };

  const handleDeactivateConfirm = () => {
    setConfirmDeactivateOpen(false);
    toggleMutation.mutate(false);
  };

  const handleRetentionSelect = (value: number | 'custom') => {
    if (!canConfigureActivityLogs) return;
    if (value === 'custom') {
      setCustomDaysInput(String(retentionDays));
      setCustomRetentionOpen(true);
    } else {
      updateSettingsMutation.mutate({ retentionDays: value });
    }
  };

  const handleCustomRetentionSubmit = () => {
    const parsed = parseInt(customDaysInput, 10);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 3650) {
      updateSettingsMutation.mutate({ retentionDays: parsed });
      setCustomRetentionOpen(false);
    }
  };

  if (!showWasteSection && !showActivitySection) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error">{t('activityLogsAdminOnly')}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 960, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <SettingsIcon sx={{ color: 'primary.main', fontSize: 30 }} />
          {t('tabSystemSettings')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t('systemSettingsSubtitle')}
        </Typography>
      </Box>

      <Stack spacing={3}>
        {/* Waste Disposal Service Configuration */}
        {showWasteSection && (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
                <RecyclingIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {t('subTabWasteDisposal')}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                {t('wasteServiceSettingsDesc')}
              </Typography>
              <Box sx={{ maxWidth: 420 }}>
                <ServiceAutocomplete
                  size="small"
                  label={t('lblSelectedWasteService')}
                  value={currentServiceId}
                  initialOption={selectedService}
                  onChange={handleServiceChange}
                  valueMode="id"
                  disabled={!canEditSystemSettings || updateSettingMutation.isPending}
                />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Activity Logging Configuration */}
        {showActivitySection && (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
                <AccessTimeIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {t('tabActivityLogs')}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                {t('activityLoggingSettingsDesc')}
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2.5 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: isLoggingEnabled
                      ? isDark
                        ? alpha('#16a34a', 0.4)
                        : alpha('#16a34a', 0.3)
                      : 'divider',
                    bgcolor: isLoggingEnabled
                      ? isDark
                        ? alpha('#16a34a', 0.12)
                        : alpha('#16a34a', 0.06)
                      : isDark
                      ? alpha('#fff', 0.03)
                      : alpha('#000', 0.02),
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isLoggingEnabled}
                        onChange={(e) => handleToggleClick(e.target.checked)}
                        color="success"
                        size="small"
                        disabled={!canConfigureActivityLogs || toggleMutation.isPending || isStatusLoading}
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: isLoggingEnabled ? 'success.main' : 'text.secondary',
                        }}
                      >
                        {isLoggingEnabled ? t('activityLogsStatusActive') : t('activityLogsStatusPaused')}
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                </Box>

                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel id="system-retention-select-label">{t('activityLogsRetention')}</InputLabel>
                  <Select
                    labelId="system-retention-select-label"
                    label={t('activityLogsRetention')}
                    value={[30, 60, 90, 180, 365].includes(retentionDays) ? retentionDays : 'custom'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        handleRetentionSelect('custom');
                      } else {
                        handleRetentionSelect(Number(val));
                      }
                    }}
                    disabled={!canConfigureActivityLogs || updateSettingsMutation.isPending || isStatusLoading}
                  >
                    <MenuItem value={30}>{t('retention30Days')}</MenuItem>
                    <MenuItem value={60}>{t('retention60Days')}</MenuItem>
                    <MenuItem value={90}>{t('retention90Days')}</MenuItem>
                    <MenuItem value={180}>{t('retention180Days')}</MenuItem>
                    <MenuItem value={365}>{t('retention365Days')}</MenuItem>
                    <MenuItem value="custom">
                      {![30, 60, 90, 180, 365].includes(retentionDays)
                        ? `${retentionDays} ${t('activityLogsRetentionDays')} (${t('retentionCustom')})`
                        : t('retentionCustom')}
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>
        )}
      </Stack>

      <ActivityLogsDialogs
        confirmDeactivateOpen={confirmDeactivateOpen}
        onCloseDeactivateDialog={() => setConfirmDeactivateOpen(false)}
        onConfirmDeactivate={handleDeactivateConfirm}
        customRetentionOpen={customRetentionOpen}
        onCloseCustomRetentionDialog={() => setCustomRetentionOpen(false)}
        onSubmitCustomRetention={handleCustomRetentionSubmit}
        customDaysInput={customDaysInput}
        onCustomDaysInputChange={setCustomDaysInput}
        isCustomRetentionPending={updateSettingsMutation.isPending}
        language={language}
        t={t}
      />
    </Box>
  );
};

export default SystemSettingsPage;
