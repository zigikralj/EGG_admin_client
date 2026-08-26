import React from 'react';
import {
  Drawer,
  Toolbar,
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Switch,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Link,
} from '@mui/material';









import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useRoleLabels } from '../../hooks/useRoleLabels';
import type { ActiveTab, DashboardSubTab } from '../../types';
import { PersonIcon, ExpandMoreIcon, ExpandLessIcon, ViewQuiltIcon, BarChartIcon, NotificationsActiveIcon, ReceiptLongIcon, FolderIcon } from '../icons';

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
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  dashboardSubTab?: DashboardSubTab;
  onDashboardSubTabChange?: (subTab: DashboardSubTab) => void;
  isDashboardExpanded: boolean;
  setIsDashboardExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  navItems: NavItem[];
  onPreferenceChange?: (key: string, value: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  onMobileClose,
  activeTab,
  onTabChange,
  dashboardSubTab,
  onDashboardSubTabChange,
  isDashboardExpanded,
  setIsDashboardExpanded,
  navItems,
  onPreferenceChange,
}) => {
  const { t } = useLanguage();
  const { getRoleBadgeLabel } = useRoleLabels();
  const {
    currentUser,
    users,
    setCurrentUser,
    role,
    isAdmin,
    isAccountant,
    canToggleEntityWorkMode,
    workOnEntities,
    setWorkOnEntities,
  } = useAuth();

  const SidebarContent = (
    <>
      <Toolbar />
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
        <Box sx={{ overflowY: 'auto', flexGrow: 1, p: 1.5 }}>
          {/* USER SWITCHER & WORK MODE SWITCH */}
          {(isAdmin || canToggleEntityWorkMode) && (
            <Box sx={{ mb: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              {isAdmin && users.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
                    {t('tabUsers')}
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={users.some(u => u.id === currentUser?.id) ? currentUser!.id : ''}
                      onChange={(e) => {
                        const target = users.find((u) => u.id === e.target.value);
                        if (target) setCurrentUser(target);
                      }}
                      startAdornment={<PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
                      sx={{ borderRadius: 2, fontSize: '0.875rem' }}
                    >
                      {users.map((u) => (
                        <MenuItem key={u.id} value={u.id} sx={{ fontSize: '0.875rem' }}>
                          {u.name} ({getRoleBadgeLabel(u.role)})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}

              {canToggleEntityWorkMode && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'action.hover', p: 1, px: 1.5, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    {t('switchWorkOnEntities')}
                  </Typography>
                  <Switch
                    checked={workOnEntities}
                    onChange={(e) => {
                      const nextVal = e.target.checked;
                      setWorkOnEntities(nextVal);
                      if (onPreferenceChange) {
                        onPreferenceChange('work_on_entities', nextVal);
                      }
                    }}
                    color="primary"
                    size="small"
                  />
                </Box>
              )}
            </Box>
          )}

          <List component="nav" disablePadding sx={{ gap: 0.5, display: 'flex', flexDirection: 'column' }}>
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const isSelected = activeTab === item.id;
                if (item.id === 'dashboard') {
                  const dashboardSubItems: { id: DashboardSubTab; label: string; icon: React.ReactNode }[] = [
                    { id: 'default', label: t('subTabDefault'), icon: <ViewQuiltIcon fontSize="small" /> },
                    { id: 'statistic', label: t('subTabStatistic'), icon: <BarChartIcon fontSize="small" /> },
                  ];

                  if (canToggleEntityWorkMode || role === 'Administrator' || role === 'Manager') {
                    dashboardSubItems.push(
                      { id: 'reminders', label: t('subTabReminders'), icon: <NotificationsActiveIcon fontSize="small" /> },
                      { id: 'invoices', label: t('tabInvoices'), icon: <ReceiptLongIcon fontSize="small" /> }
                    );
                  } else if (isAccountant) {
                    dashboardSubItems.push(
                      { id: 'invoices', label: t('tabInvoices'), icon: <ReceiptLongIcon fontSize="small" /> }
                    );
                  } else {
                    dashboardSubItems.push(
                      { id: 'reminders', label: t('subTabReminders'), icon: <NotificationsActiveIcon fontSize="small" /> }
                    );
                  }

                  dashboardSubItems.push(
                    { id: 'projects', label: t('subTabProjects'), icon: <FolderIcon fontSize="small" /> }
                  );

                  return (
                    <React.Fragment key="dashboard-menu-group">
                      <ListItemButton
                        selected={isSelected}
                        onClick={() => {
                          if (activeTab !== 'dashboard') {
                            onTabChange('dashboard');
                            setIsDashboardExpanded(true);
                          } else {
                            setIsDashboardExpanded((prev) => !prev);
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
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 500 }}>
                              {item.label}
                            </Typography>
                          }
                        />
                        {isDashboardExpanded ? (
                          <ExpandLessIcon fontSize="small" sx={{ color: isSelected ? 'primary.main' : 'text.secondary' }} />
                        ) : (
                          <ExpandMoreIcon fontSize="small" sx={{ color: isSelected ? 'primary.main' : 'text.secondary' }} />
                        )}
                      </ListItemButton>

                      <Collapse in={isDashboardExpanded || activeTab === 'dashboard'} timeout="auto">
                        <List component="div" disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, my: 0.25 }}>
                          {dashboardSubItems.map((sub) => {
                            const isSubSelected = activeTab === 'dashboard' && dashboardSubTab === sub.id;
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
                  );
                }

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
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              display: 'block',
              mb: 0.5,
              fontSize: '0.75rem',
              letterSpacing: '0.2px',
            }}
          >
            Made by Zigi Code.
          </Typography>
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
