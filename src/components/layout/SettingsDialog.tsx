import React, { useState } from 'react';
import {
  Typography,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  FormControl,
  Select,
  MenuItem,
  Button,
  Switch,
} from '@mui/material';
import { BaseModal } from '../common/modal/BaseModal';
import { useLanguage } from '../../context/LanguageContext';
import { useThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useMessaging } from '../../context/MessagingContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { TableOptionsSelector, type ColumnDef } from '../common/ColumnSelector';
import { LightModeIcon, DarkModeIcon, SettingsBrightnessIcon } from '../icons';

type EntityType = 'projects' | 'clients' | 'users' | 'services' | 'providedServices' | 'categories' | 'reminders' | 'invoices';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userPreferences?: Record<string, any>;
  onPreferenceChange?: (key: string, value: any) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
  userPreferences,
  onPreferenceChange,
}) => {
  const { t } = useLanguage();
  const { themeMode, setThemeMode } = useThemeContext();
  const { hasPermission } = useAuth();
  const {
    notificationPermission,
    notificationPrefs,
    setDesktopNotificationsEnabled,
    setDesktopNotificationsShowPreview,
  } = useMessaging();

  const isNotificationsActive =
    notificationPermission === 'granted' && notificationPrefs.enabled;

  const entityOptions = React.useMemo(() => [
    { value: 'projects' as EntityType, label: t('tabProjects') },
    { value: 'clients' as EntityType, label: t('tabClients') },
    { value: 'users' as EntityType, label: t('tabUsers') },
    { value: 'services' as EntityType, label: t('tabServices') },
    { value: 'providedServices' as EntityType, label: t('tabProvidedServices') || 'Provided Services' },
    { value: 'categories' as EntityType, label: t('tabCategories') },
    { value: 'reminders' as EntityType, label: t('tabReminders') },
    { value: 'invoices' as EntityType, label: t('tabInvoices') },
  ].filter((e) => hasPermission(e.value, 'view')), [t, hasPermission]);

  const [prefSelectedEntity, setPrefSelectedEntity] = useState<EntityType>('projects');

  React.useEffect(() => {
    if (entityOptions.length > 0 && !entityOptions.some((e) => e.value === prefSelectedEntity)) {
      setPrefSelectedEntity(entityOptions[0].value);
    }
  }, [entityOptions, prefSelectedEntity]);

  const getEntityColumns = (entity: EntityType): ColumnDef[] => {
    switch (entity) {
      case 'projects':
        return [
          { id: 'name', label: t('colProject') },
          { id: 'client', label: t('colClient') },
          { id: 'category', label: t('colService') },
          { id: 'responsible', label: t('colResponsible') },
          { id: 'start', label: t('start') },
          { id: 'deadline', label: t('deadline') },
          { id: 'progress', label: t('progress') },
          { id: 'status', label: t('colDeadlineStatus') },
        ];
      case 'clients':
        return [
          { id: 'name', label: t('colClientName') },
          { id: 'city', label: t('colCity') },
          { id: 'contactPerson', label: t('colContactPerson') },
          { id: 'email', label: t('colEmail') },
          { id: 'phone', label: t('colPhone') },
          { id: 'projectCount', label: t('colProjectCount') },
        ];
      case 'users':
        return [
          { id: 'name', label: t('colFullName') },
          { id: 'role', label: t('colRole') },
          { id: 'status', label: t('colApprovalStatus') },
          { id: 'gender', label: t('colGender') },
          { id: 'email', label: t('colEmail') },
          { id: 'phone', label: t('colPhone') },
        ];
      case 'services':
        return [
          { id: 'name', label: t('colServiceName') },
          { id: 'group', label: t('colCategory') },
          { id: 'frequency', label: t('colPeriodicSampling') },
          { id: 'description', label: t('colDescription') },
        ];
      case 'providedServices':
        return [
          { id: 'service', label: t('colService') },
          { id: 'client', label: t('colClient') },
          { id: 'project', label: t('tabProjects') },
          { id: 'status', label: t('lblInvoiceStatus') },
          { id: 'scheduledDate', label: t('colScheduledDate') },
          { id: 'completionDate', label: t('colCompletionDate') },
          { id: 'location', label: t('colLocation') },
        ];
      case 'categories':
        return [
          { id: 'name', label: t('colCategoryName') },
          { id: 'description', label: t('colDescription') },
        ];
      case 'reminders':
        return [
          { id: 'project', label: t('colProject') },
          { id: 'client', label: t('colClient') },
          { id: 'responsible', label: t('colResponsible') },
          { id: 'status', label: t('colStatus') },
          { id: 'notes', label: t('colNotes') },
        ];
      case 'invoices':
        return [
          { id: 'invoiceNumber', label: t('colInvoiceNumber') },
          { id: 'client', label: t('lblClient') },
          { id: 'project', label: t('tabProjects') },
          { id: 'dateCreated', label: t('colDateCreated') },
          { id: 'dueDate', label: t('colDueDate') },
          { id: 'paymentDate', label: t('colPaymentDate') },
          { id: 'totalAmount', label: t('colTotalAmount') },
          { id: 'status', label: t('lblInvoiceStatus') },
        ];
      default:
        return [];
    }
  };

  const getEntityVisibleColumns = (entity: EntityType): string[] => {
    const prefKey = `cols_${entity}`;
    if (userPreferences && userPreferences[prefKey] && Array.isArray(userPreferences[prefKey])) {
      return userPreferences[prefKey];
    }
    switch (entity) {
      case 'projects':
        return ['name', 'client', 'category', 'responsible', 'progress', 'status'];
      case 'clients':
        return ['name', 'city', 'contactPerson', 'email', 'phone', 'projectCount'];
      case 'users':
        return ['name', 'role', 'email', 'phone'];
      case 'services':
        return ['name', 'group', 'frequency', 'description'];
      case 'providedServices':
        return ['service', 'client', 'project', 'status', 'scheduledDate', 'completionDate', 'location'];
      case 'categories':
        return ['name', 'description'];
      case 'reminders':
        return ['project', 'client', 'responsible', 'status', 'notes'];
      case 'invoices':
        return ['invoiceNumber', 'client', 'project', 'dateCreated', 'dueDate', 'totalAmount', 'status'];
      default:
        return [];
    }
  };

  const getEntityRowsPerPageOptions = (entity: EntityType): number[] => {
    const prefKey = `rowsPerPageOptions_${entity}`;
    if (userPreferences && userPreferences[prefKey] && Array.isArray(userPreferences[prefKey])) {
      return userPreferences[prefKey];
    }
    return [15, 25, 50];
  };

  const getEntityRowsPerPage = (entity: EntityType): number => {
    const prefKey = `rowsPerPage_${entity}`;
    if (userPreferences && typeof userPreferences[prefKey] === 'number') {
      return userPreferences[prefKey];
    }
    return 15;
  };

  return (
    <BaseModal
      open={isOpen}
      onClose={onClose}
      title={t('userPreferencesTitle')}
      maxWidth="xs"
      fullWidth
      actions={
        <Button onClick={onClose} variant="contained" fullWidth sx={{ borderRadius: 2 }}>
          {t('btnSave')}
        </Button>
      }
      actionsSx={{ p: 2 }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 1 }}>
        {/* THEME SELECTOR */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            {t('lblTheme')}
          </Typography>
          <ToggleButtonGroup
            value={themeMode}
            exclusive
            onChange={(_, newMode) => {
              if (newMode) {
                setThemeMode(newMode);
                if (onPreferenceChange) {
                  onPreferenceChange('theme', newMode);
                }
              }
            }}
            fullWidth
            size="small"
          >
            <ToggleButton value="light" sx={{ gap: 1, py: 0.8 }}>
              <LightModeIcon fontSize="small" />
              {t('themeLight')}
            </ToggleButton>
            <ToggleButton value="dark" sx={{ gap: 1, py: 0.8 }}>
              <DarkModeIcon fontSize="small" />
              {t('themeDark')}
            </ToggleButton>
            <ToggleButton value="system" sx={{ gap: 1, py: 0.8 }}>
              <SettingsBrightnessIcon fontSize="small" />
              {t('themeSystem')}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Divider />

        {/* LANGUAGE SELECTOR */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            {t('lblLanguage')}
          </Typography>
          <LanguageSelector />
        </Box>

        <Divider />

        {/* DYNAMIC ENTITY TABLE OPTIONS SELECTOR */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            {t('lblTableColumns')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 140, flexGrow: 1 }}>
              <Select
                value={prefSelectedEntity}
                onChange={(e) => setPrefSelectedEntity(e.target.value as EntityType)}
                sx={{ borderRadius: 2 }}
              >
                {entityOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TableOptionsSelector
              columns={getEntityColumns(prefSelectedEntity)}
              visibleColumns={getEntityVisibleColumns(prefSelectedEntity)}
              onChange={(cols) => {
                if (onPreferenceChange) {
                  onPreferenceChange(`cols_${prefSelectedEntity}`, cols);
                }
              }}
              rowsPerPageOptions={getEntityRowsPerPageOptions(prefSelectedEntity)}
              onRowsPerPageOptionsChange={(opts) => {
                if (onPreferenceChange) {
                  onPreferenceChange(`rowsPerPageOptions_${prefSelectedEntity}`, opts);
                }
              }}
              rowsPerPage={getEntityRowsPerPage(prefSelectedEntity)}
              onRowsPerPageChange={(rpp) => {
                if (onPreferenceChange) {
                  onPreferenceChange(`rowsPerPage_${prefSelectedEntity}`, rpp);
                }
              }}
            />
          </Box>
        </Box>

        <Divider />

        {/* BROWSER NOTIFICATIONS */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            {t('messagingDesktopNotifications')}
          </Typography>
          {notificationPermission === 'unsupported' ? (
            <Typography variant="caption" color="text.secondary">
              {t('messagingNotificationsUnsupported')}
            </Typography>
          ) : notificationPermission === 'denied' ? (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main', fontSize: '0.85rem' }}>
                {t('messagingNotificationsBlocked')}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {t('messagingNotificationsBlockedHint')}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.5,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {t('messagingEnableNotifications')}
                </Typography>
                <Switch
                  size="small"
                  checked={isNotificationsActive}
                  onChange={(e) => void setDesktopNotificationsEnabled(e.target.checked)}
                />
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 1.5,
                  opacity: isNotificationsActive ? 1 : 0.6,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {t('messagingShowMessagePreview')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
                    {t('messagingShowMessagePreviewHint')}
                  </Typography>
                </Box>
                <Switch
                  size="small"
                  disabled={!isNotificationsActive}
                  checked={notificationPrefs.showPreview}
                  onChange={(e) => setDesktopNotificationsShowPreview(e.target.checked)}
                />
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </BaseModal>
  );
};
