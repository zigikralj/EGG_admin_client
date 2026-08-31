import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  FormControl,
  Select,
  MenuItem,
  Button,
} from '@mui/material';





import { useLanguage } from '../../context/LanguageContext';
import { useThemeContext } from '../../context/ThemeContext';
import { LanguageSelector } from '../LanguageSelector';
import { TableOptionsSelector, type ColumnDef } from '../ColumnSelector';
import { CloseIcon, LightModeIcon, DarkModeIcon, SettingsBrightnessIcon } from '../icons';

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
  const [prefSelectedEntity, setPrefSelectedEntity] = useState<EntityType>('projects');

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
        return ['name', 'client', 'category', 'responsible', 'progress', 'nextSample', 'status'];
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
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: { borderRadius: 3, p: 1 },
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t('userPreferencesTitle')}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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
                  <MenuItem value="projects">{t('tabProjects')}</MenuItem>
                  <MenuItem value="clients">{t('tabClients')}</MenuItem>
                  <MenuItem value="users">{t('tabUsers')}</MenuItem>
                  <MenuItem value="services">{t('tabServices')}</MenuItem>
                  <MenuItem value="providedServices">{t('tabProvidedServices') || 'Provided Services'}</MenuItem>
                  <MenuItem value="categories">{t('tabCategories')}</MenuItem>
                  <MenuItem value="reminders">{t('tabReminders')}</MenuItem>
                  <MenuItem value="invoices">{t('tabInvoices')}</MenuItem>
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
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" fullWidth sx={{ borderRadius: 2 }}>
          {t('btnSave')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
