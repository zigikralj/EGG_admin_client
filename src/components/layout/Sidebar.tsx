import React from 'react';
import {
  Drawer,
  Toolbar,
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Link,
  Chip,
  Tooltip,
} from '@mui/material';









import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import type { ActiveTab, AppSection, DashboardSubTab, ProvidedServicesSubTab } from '../../types';
import {
  ExpandMoreIcon,
  ExpandLessIcon,
  BarChartIcon,
  NotificationsActiveIcon,
  ReceiptLongIcon,
  FolderIcon,
  DeleteSweepIcon,
} from '../icons';

export const DRAWER_WIDTH = 250;

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
  count: number;
  show: boolean;
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'default';
}

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  currentApp: AppSection;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  dashboardSubTab?: DashboardSubTab;
  onDashboardSubTabChange?: (subTab: DashboardSubTab) => void;
  providedServicesSubTab?: ProvidedServicesSubTab;
  onProvidedServicesSubTabChange?: (subTab: ProvidedServicesSubTab) => void;
  isProvidedServicesExpanded?: boolean;
  setIsProvidedServicesExpanded?: React.Dispatch<React.SetStateAction<boolean>>;
  isStatisticExpanded?: boolean;
  setIsStatisticExpanded?: React.Dispatch<React.SetStateAction<boolean>>;
  navItems: NavItem[];
  onPreferenceChange?: (key: string, value: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  onMobileClose,
  currentApp,
  activeTab,
  onTabChange,
  dashboardSubTab,
  onDashboardSubTabChange,
  providedServicesSubTab: _providedServicesSubTab = 'summary',
  onProvidedServicesSubTabChange: _onProvidedServicesSubTabChange,
  isProvidedServicesExpanded: _isProvidedServicesExpanded = true,
  setIsProvidedServicesExpanded: _setIsProvidedServicesExpanded,
  isStatisticExpanded = true,
  setIsStatisticExpanded,
  navItems,
}) => {
  const { t } = useLanguage();
  const [localStatisticExpanded, setLocalStatisticExpanded] = React.useState(true);
  const statisticExpanded = setIsStatisticExpanded ? isStatisticExpanded : localStatisticExpanded;
  const toggleStatisticExpanded = () => {
    if (setIsStatisticExpanded) {
      setIsStatisticExpanded((prev) => !prev);
    } else {
      setLocalStatisticExpanded((prev) => !prev);
    }
  };
  const expandStatistic = () => {
    if (setIsStatisticExpanded) {
      setIsStatisticExpanded(true);
    } else {
      setLocalStatisticExpanded(true);
    }
  };
  const {
    role,
    isRealAdmin,
    roleView,
    setRoleView,
    isAccountant,
  } = useAuth();

  const SidebarContent = (
    <>
      <Toolbar />
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
        <Box sx={{ overflowY: 'auto', flexGrow: 1, p: 1.5 }}>
          {/* ROLE VIEW SWITCHER (MOBILE ONLY - REAL ADMIN ONLY) */}
          {isRealAdmin && (
            <Box sx={{ mb: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
                  {t('lblRoleView')}
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={roleView}
                    onChange={(e) => setRoleView(e.target.value as any)}
                    sx={{ borderRadius: 2, fontSize: '0.875rem' }}
                  >
                    <MenuItem value="Administrator" sx={{ fontSize: '0.875rem' }}>
                      {t('roleAdministrator')}
                    </MenuItem>
                    <MenuItem value="Manager" sx={{ fontSize: '0.875rem' }}>
                      {t('roleManager')}
                    </MenuItem>
                    <MenuItem value="User" sx={{ fontSize: '0.875rem' }}>
                      {t('roleUser')}
                    </MenuItem>
                    <MenuItem value="Accountant" sx={{ fontSize: '0.875rem' }}>
                      {t('roleAccountant')}
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          )}

          {/* APP-SPECIFIC NAVIGATION ITEMS */}
          {currentApp === 'project-tracker' ? (
            <List component="nav" disablePadding sx={{ gap: 0.5, display: 'flex', flexDirection: 'column' }}>
              {(() => {
                const canViewWasteDisposal = role === 'Administrator' || role === 'Manager' || isAccountant;
                const dashboardItems: { id: DashboardSubTab; label: string; icon: React.ReactNode; show?: boolean }[] = [
                  { id: 'projects', label: t('subTabProjects'), icon: <FolderIcon fontSize="small" />, show: true },
                  { id: 'reminders', label: t('subTabReminders'), icon: <NotificationsActiveIcon fontSize="small" />, show: true },
                ];

                if (canViewWasteDisposal) {
                  dashboardItems.push(
                    { id: 'invoices', label: t('tabInvoices'), icon: <ReceiptLongIcon fontSize="small" />, show: true },
                    { id: 'waste-disposal', label: t('subTabWasteDisposal'), icon: <DeleteSweepIcon fontSize="small" />, show: true }
                  );
                }

                const statisticSubItems: { id: DashboardSubTab; label: string; icon: React.ReactNode }[] = [
                  { id: 'statistic', label: t('subTabProjects'), icon: <FolderIcon fontSize="small" /> },
                ];

                if (canViewWasteDisposal) {
                  statisticSubItems.push({
                    id: 'statistic-waste-management',
                    label: t('subTabWasteManagement'),
                    icon: <DeleteSweepIcon fontSize="small" />,
                  });
                }

                const isStatisticActive =
                  activeTab === 'dashboard' &&
                  (dashboardSubTab === 'statistic' ||
                    dashboardSubTab === 'statistic-waste-management' ||
                    dashboardSubTab === 'waste-management');

                return (
                  <>
                    {dashboardItems.map((sub) => {
                      const isSelected =
                        activeTab === 'dashboard' &&
                        (!dashboardSubTab ? sub.id === 'projects' : dashboardSubTab === sub.id);
                      return (
                        <ListItemButton
                          key={sub.id}
                          selected={isSelected}
                          onClick={() => {
                            if (activeTab !== 'dashboard') {
                              onTabChange('dashboard');
                            }
                            if (onDashboardSubTabChange) {
                              onDashboardSubTabChange(sub.id);
                            }
                            onMobileClose();
                          }}
                          sx={{
                            borderRadius: 2,
                            py: 1.2,
                            px: 2,
                            '&.Mui-selected': {
                              bgcolor: 'primary.50',
                              color: 'primary.main',
                              fontWeight: 700,
                              '& .MuiListItemIcon-root': {
                                color: 'primary.main',
                              },
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40, color: isSelected ? 'primary.main' : 'text.secondary' }}>
                            {sub.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 500 }}>
                                {sub.label}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      );
                    })}

                    {/* STATISTIC MENU ITEM WITH SUBMENU */}
                    {canViewWasteDisposal ? (
                      <React.Fragment key="statistic-menu-group">
                        <ListItemButton
                          selected={isStatisticActive}
                          onClick={() => {
                            if (!isStatisticActive) {
                              if (activeTab !== 'dashboard') {
                                onTabChange('dashboard');
                              }
                              if (onDashboardSubTabChange) {
                                onDashboardSubTabChange('statistic');
                              }
                              expandStatistic();
                            } else {
                              toggleStatisticExpanded();
                            }
                          }}
                          sx={{
                            borderRadius: 2,
                            py: 1.2,
                            px: 2,
                            '&.Mui-selected': {
                              bgcolor: 'primary.50',
                              color: 'primary.main',
                              fontWeight: 700,
                              '& .MuiListItemIcon-root': {
                                color: 'primary.main',
                              },
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40, color: isStatisticActive ? 'primary.main' : 'text.secondary' }}>
                            <BarChartIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: isStatisticActive ? 700 : 500 }}>
                                {t('subTabStatistic')}
                              </Typography>
                            }
                          />
                          {statisticExpanded ? (
                            <ExpandLessIcon fontSize="small" sx={{ color: isStatisticActive ? 'primary.main' : 'text.secondary' }} />
                          ) : (
                            <ExpandMoreIcon fontSize="small" sx={{ color: isStatisticActive ? 'primary.main' : 'text.secondary' }} />
                          )}
                        </ListItemButton>

                        <Collapse in={statisticExpanded || isStatisticActive} timeout="auto">
                          <List component="div" disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, my: 0.25 }}>
                            {statisticSubItems.map((sub) => {
                              const isSubSelected =
                                activeTab === 'dashboard' &&
                                (sub.id === 'statistic'
                                  ? dashboardSubTab === 'statistic'
                                  : (dashboardSubTab === 'statistic-waste-management' || dashboardSubTab === 'waste-management'));
                              return (
                                <ListItemButton
                                  key={sub.id}
                                  selected={isSubSelected}
                                  onClick={() => {
                                    if (activeTab !== 'dashboard') {
                                      onTabChange('dashboard');
                                    }
                                    if (onDashboardSubTabChange) {
                                      onDashboardSubTabChange(sub.id);
                                    }
                                    onMobileClose();
                                  }}
                                  sx={{
                                    pl: 4,
                                    py: 0.8,
                                    pr: 2,
                                    borderRadius: 2,
                                    '&.Mui-selected': {
                                      bgcolor: 'primary.50',
                                      color: 'primary.main',
                                      fontWeight: 700,
                                      '& .MuiListItemIcon-root': {
                                        color: 'primary.main',
                                      },
                                    },
                                  }}
                                >
                                  <ListItemIcon sx={{ minWidth: 32, color: isSubSelected ? 'primary.main' : 'text.secondary' }}>
                                    {sub.icon}
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={
                                      <Typography
                                        variant="body2"
                                        sx={{ fontWeight: isSubSelected ? 700 : 500, fontSize: '0.8125rem' }}
                                      >
                                        {sub.label}
                                      </Typography>
                                    }
                                  />
                                </ListItemButton>
                              );
                            })}
                          </List>
                        </Collapse>
                      </React.Fragment>
                    ) : (
                      <ListItemButton
                        key="statistic"
                        selected={isStatisticActive}
                        onClick={() => {
                          if (activeTab !== 'dashboard') {
                            onTabChange('dashboard');
                          }
                          if (onDashboardSubTabChange) {
                            onDashboardSubTabChange('statistic');
                          }
                          onMobileClose();
                        }}
                        sx={{
                          borderRadius: 2,
                          py: 1.2,
                          px: 2,
                          '&.Mui-selected': {
                            bgcolor: 'primary.50',
                            color: 'primary.main',
                            fontWeight: 700,
                            '& .MuiListItemIcon-root': {
                              color: 'primary.main',
                            },
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40, color: isStatisticActive ? 'primary.main' : 'text.secondary' }}>
                          <BarChartIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: isStatisticActive ? 700 : 500 }}>
                              {t('subTabStatistic')}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    )}
                  </>
                );
              })()}
            </List>
          ) : (
            <List component="nav" disablePadding sx={{ gap: 0.5, display: 'flex', flexDirection: 'column' }}>
              {navItems
                .filter((item) => item.show && item.id !== 'dashboard')
                .map((item) => {
                  const isSelected = activeTab === item.id;
                  return (
                    <ListItemButton
                      key={item.id}
                      selected={isSelected}
                      onClick={() => {
                        onTabChange(item.id);
                        onMobileClose();
                      }}
                      sx={{
                        borderRadius: 2,
                        py: 1.2,
                        px: 2,
                        '&.Mui-selected': {
                          bgcolor: 'primary.50',
                          color: 'primary.main',
                          fontWeight: 700,
                          '& .MuiListItemIcon-root': {
                            color: 'primary.main',
                          },
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: isSelected ? 'primary.main' : 'text.secondary' }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 500 }}>
                            {item.label}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  );
                })}
            </List>
          )}
        </Box>

        <Box
          sx={{
            p: 1.5,
            px: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            mt: 'auto',
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)'),
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                fontSize: '0.75rem',
                letterSpacing: '0.2px',
              }}
            >
              Made by Zigi Code.
            </Typography>
            {typeof __APP_VERSION__ !== 'undefined' && (
              <Tooltip
                title={`${t('appVersion')} ${__APP_VERSION__}${typeof __COMMIT_HASH__ !== 'undefined' && __COMMIT_HASH__ ? ` (${__COMMIT_HASH__})` : ''}${typeof __BUILD_TIME__ !== 'undefined' && __BUILD_TIME__ ? ` • ${new Date(__BUILD_TIME__).toLocaleDateString()}` : ''}`}
                arrow
                placement="top"
              >
                <Chip
                  label={`v${__APP_VERSION__}`}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: 'text.secondary',
                    borderColor: 'divider',
                    cursor: 'default',
                    '& .MuiChip-label': {
                      px: 0.75,
                    },
                  }}
                />
              </Tooltip>
            )}
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              display: 'block',
              fontSize: '0.7rem',
              lineHeight: 1.5,
              wordBreak: 'break-all',
            }}
          >
            E-mail:{' '}
            <Link
              href="mailto:nemanja.stanojevic.kv@gmail.com"
              underline="hover"
              color="inherit"
              sx={{ fontWeight: 500 }}
            >
              nemanja.stanojevic.kv@gmail.com
            </Link>
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              display: 'block',
              fontSize: '0.7rem',
              lineHeight: 1.5,
            }}
          >
            Phone:{' '}
            <Link
              href="tel:+381641327858"
              underline="hover"
              color="inherit"
              sx={{ fontWeight: 500 }}
            >
              +381 64 132 78 58
            </Link>
          </Typography>
        </Box>
      </Box>
    </>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      aria-label="mailbox folders"
    >
      {/* SIDEBAR DRAWER - MOBILE */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          [`& .MuiDrawer-paper`]: {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
          },
        }}
      >
        {SidebarContent}
      </Drawer>

      {/* SIDEBAR DRAWER - DESKTOP */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          [`& .MuiDrawer-paper`]: {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
          },
        }}
        open
      >
        {SidebarContent}
      </Drawer>
    </Box>
  );
};
