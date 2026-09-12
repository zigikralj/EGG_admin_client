import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Tooltip,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Badge,
  Avatar,
  Menu,
  Divider,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';








import logoUrl from '../../assets/logo.svg';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useRoleLabels } from '../../hooks/useRoleLabels';
import type { ActiveTab, AppSection, DashboardSubTab } from '../../types';
import { DRAWER_WIDTH } from './Sidebar';
import { NotificationsMenu } from './NotificationsMenu';
import {
  MenuIcon,
  BusinessIcon,
  AccountCircleIcon,
  SettingsIcon,
  LogoutIcon,
  NotificationsIcon,
  AppsIcon,
  StorageIcon,
  DashboardIcon,
} from '../icons';

interface AppHeaderProps {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentApp: AppSection;
  onAppChange: (app: AppSection) => void;
  dashboardSubTab?: DashboardSubTab;
  onPreferenceChange?: (key: string, value: any) => void;
  onNavigateToPendingUsers?: () => void;
  handleOpenProfile: () => void;
  handleOpenPreferences: () => void;
  handleLogoutClick: () => void;
  setIsCompanyInfoOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenProject?: (projectId: string) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  mobileOpen,
  setMobileOpen,
  activeTab,
  onTabChange,
  currentApp,
  onAppChange,
  onNavigateToPendingUsers,
  handleOpenProfile,
  handleOpenPreferences,
  handleLogoutClick,
  setIsCompanyInfoOpen,
  onOpenProject,
}) => {
  const { t } = useLanguage();
  const { getRoleBadgeLabel } = useRoleLabels();
  const { unreadCount } = useNotifications();
  const {
    currentUser,
    role,
    isRealAdmin,
    roleView,
    setRoleView,
    isUser,
    isAccountant,
    pendingUsersCount,
    logout,
  } = useAuth();

  const canSeePendingUsers = (isRealAdmin || role === 'Manager') && pendingUsersCount > 0;
  const totalNotificationsCount = unreadCount + (canSeePendingUsers ? pendingUsersCount : 0);

  const [appsAnchorEl, setAppsAnchorEl] = React.useState<null | HTMLElement>(null);
  const isAppsMenuOpen = Boolean(appsAnchorEl);

  const handleAppsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAppsAnchorEl(event.currentTarget);
  };
  const handleAppsMenuClose = () => {
    setAppsAnchorEl(null);
  };

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const [notifAnchorEl, setNotifAnchorEl] = React.useState<null | HTMLElement>(null);
  const isNotifMenuOpen = Boolean(notifAnchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotifOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
  };
  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
    : 'U';

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: '#121a16',
        color: '#ffffff',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          gap: { xs: 1, md: 0 },
          px: { xs: 1.5, sm: 3 },
        }}
      >
        {/* HAMBURGER MENU BUTTON FOR MOBILE */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={() => setMobileOpen(!mobileOpen)}
          sx={{ mr: 0.5, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* LEFT: APPS SWITCHER, COMPANY INFO, BRAND LOGO */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.75, sm: 1.25 },
            width: { xs: 'auto', md: DRAWER_WIDTH - 24 },
            minWidth: { xs: 'auto', md: DRAWER_WIDTH - 24 },
            flexShrink: 0,
          }}
        >
          {/* APPS SWITCHER BUTTON */}
          <Tooltip title={t('appsTitle')} arrow>
            <IconButton
              onClick={handleAppsMenuOpen}
              size="small"
              sx={{
                color: isAppsMenuOpen ? '#ffffff' : 'rgba(255, 255, 255, 0.9)',
                bgcolor: isAppsMenuOpen ? 'rgba(46, 125, 50, 0.35)' : 'rgba(255, 255, 255, 0.1)',
                border: '1px solid',
                borderColor: isAppsMenuOpen ? 'primary.main' : 'rgba(255, 255, 255, 0.2)',
                p: { xs: 0.6, sm: 0.75 },
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: '#ffffff',
                  bgcolor: 'rgba(255, 255, 255, 0.22)',
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                  transform: 'translateY(-1px)',
                },
              }}
              aria-label={t('appsTitle')}
            >
              <AppsIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
            </IconButton>
          </Tooltip>

          {/* COMPANY INFO BUTTON */}
          <Tooltip title={t('companyInfoTitle')} arrow>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                setIsCompanyInfoOpen(true);
              }}
              size="small"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                p: { xs: 0.6, sm: 0.75 },
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: '#ffffff',
                  bgcolor: 'rgba(255, 255, 255, 0.22)',
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                  transform: 'translateY(-1px)',
                },
              }}
              aria-label={t('companyInfoTitle')}
            >
              <BusinessIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
            </IconButton>
          </Tooltip>

          {/* BRAND LOGO */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexGrow: 1,
              cursor: 'pointer',
              py: 0.5,
            }}
            onClick={() => {
              onAppChange('project-tracker');
              onTabChange('dashboard');
              setMobileOpen(false);
            }}
          >
            <Box
              component="img"
              src={logoUrl}
              alt="Ekos Green Group"
              sx={{
                height: { xs: 32, sm: 38 },
                maxHeight: 42,
                width: 'auto',
                objectFit: 'contain',
                transition: 'opacity 0.2s ease',
                '&:hover': {
                  opacity: 0.85,
                },
              }}
            />
          </Box>
        </Box>

        {/* MIDDLE: APP NAME */}
        <Box
          sx={{
            flexGrow: 1,
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            justifyContent: 'flex-start',
            pl: { sm: 2, md: 3 },
            pr: { sm: 2, md: 3 },
            minWidth: 0,
          }}
        >
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontWeight: 700,
              fontSize: { sm: '1.05rem', md: '1.2rem' },
              color: '#ffffff',
              letterSpacing: '0.02em',
              textAlign: 'left',
            }}
          >
            {currentApp === 'project-tracker' ? t('appProjectTracker') : t('appDataManagement')}
          </Typography>
        </Box>

        {/* RIGHT SIDE CONTROLS */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          {/* ROLE VIEW SWITCHER (DESKTOP ONLY - REAL ADMIN ONLY) */}
          {isRealAdmin && (
            <FormControl size="small" sx={{ minWidth: { xs: 110, sm: 155 }, display: { xs: 'none', md: 'flex' } }}>
              <Select
                value={roleView}
                onChange={(e) => setRoleView(e.target.value as any)}
                sx={{
                  borderRadius: 2,
                  fontSize: '0.8125rem',
                  color: '#ffffff',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
                  '.MuiSvgIcon-root': { color: '#ffffff' },
                }}
              >
                <MenuItem value="Administrator" sx={{ fontSize: '0.8125rem' }}>
                  {t('roleAdministrator')}
                </MenuItem>
                <MenuItem value="Manager" sx={{ fontSize: '0.8125rem' }}>
                  {t('roleManager')}
                </MenuItem>
                <MenuItem value="User" sx={{ fontSize: '0.8125rem' }}>
                  {t('roleUser')}
                </MenuItem>
                <MenuItem value="Accountant" sx={{ fontSize: '0.8125rem' }}>
                  {t('roleAccountant')}
                </MenuItem>
              </Select>
            </FormControl>
          )}


          {/* NOTIFICATIONS BELL BUTTON */}
          <Tooltip title={t('notificationsTitle')} arrow>
            <IconButton
              onClick={handleNotifOpen}
              size="small"
              sx={{
                color: isNotifMenuOpen ? 'primary.main' : 'rgba(255, 255, 255, 0.9)',
                bgcolor: isNotifMenuOpen ? 'rgba(25, 118, 210, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                border: '1px solid',
                borderColor: isNotifMenuOpen ? 'primary.main' : 'rgba(255, 255, 255, 0.18)',
                p: { xs: 0.75, sm: 0.85 },
                borderRadius: 2.5,
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: '#ffffff',
                  bgcolor: 'rgba(255, 255, 255, 0.18)',
                  borderColor: 'rgba(255, 255, 255, 0.35)',
                  transform: 'translateY(-1px)',
                },
              }}
              aria-label={t('notificationsTitle')}
            >
              <Badge
                badgeContent={totalNotificationsCount}
                color={unreadCount > 0 ? 'error' : 'warning'}
                sx={{
                  '& .MuiBadge-badge': {
                    fontWeight: 700,
                    fontSize: '0.6875rem',
                    minWidth: 16,
                    height: 16,
                    px: 0.4,
                  },
                }}
              >
                <NotificationsIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* USER INFO CONTAINER & AVATAR MENU TRIGGER */}
          <Tooltip title={`${t('menuProfile')} / ${t('menuPreferences')}`}>
            <Box
              onClick={handleMenuOpen}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                cursor: 'pointer',
                p: 0.75,
                px: 1.25,
                borderRadius: 3,
                transition: 'all 0.2s ease-in-out',
                border: '1px solid',
                borderColor: isMenuOpen ? 'primary.main' : 'transparent',
                bgcolor: isMenuOpen ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
              aria-controls={isMenuOpen ? 'user-account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={isMenuOpen ? 'true' : undefined}
            >
              <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                <Typography variant="subtitle2" sx={{ lineHeight: 1.2, fontWeight: 600, color: '#ffffff' }}>
                  {currentUser?.name || t('roleUser')}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ 
                    display: 'inline-block',
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.6875rem'
                  }}
                >
                  {currentUser ? getRoleBadgeLabel(role) : t('menuLogout')}
                </Typography>
              </Box>

              <Avatar
                src={currentUser?.avatarUrl || undefined}
                sx={{
                  bgcolor: currentUser ? 'primary.main' : 'grey.400',
                  width: 38,
                  height: 38,
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  boxShadow: isMenuOpen ? '0 0 0 2px rgba(25, 118, 210, 0.4)' : 'none',
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                {initials}
              </Avatar>
            </Box>
          </Tooltip>

          {/* USER DROPDOWN MENU */}
          <Menu
            id="user-account-menu"
            anchorEl={anchorEl}
            open={isMenuOpen}
            onClose={handleMenuClose}
            slotProps={{
              paper: {
                elevation: 4,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 4px 20px rgba(0,0,0,0.12))',
                  mt: 1.5,
                  minWidth: 240,
                  borderRadius: 3,
                  p: 0.5,
                  '&::before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 22,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {currentUser && (
              <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  src={currentUser.avatarUrl || undefined}
                  sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontWeight: 700 }}
                >
                  {initials}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {currentUser.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', mt: 0.25 }}>
                    {currentUser.email || getRoleBadgeLabel(role)}
                  </Typography>
                </Box>
              </Box>
            )}
            {currentUser && <Divider sx={{ my: 0.5 }} />}

            <MenuItem onClick={() => { handleMenuClose(); handleOpenProfile(); }} sx={{ borderRadius: 1.5, py: 1.2, px: 2 }}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" color="action" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {t('menuProfile')}
                  </Typography>
                }
              />
            </MenuItem>

            <MenuItem onClick={() => { handleMenuClose(); handleOpenPreferences(); }} sx={{ borderRadius: 1.5, py: 1.2, px: 2 }}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" color="action" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {t('menuPreferences')}
                  </Typography>
                }
              />
            </MenuItem>

            <Divider sx={{ my: 0.5 }} />

            <MenuItem
              onClick={() => {
                handleMenuClose();
                if (handleLogoutClick) handleLogoutClick();
                logout();
              }}
              sx={{ borderRadius: 1.5, py: 1.2, px: 2, color: 'error.main' }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>
                    {t('menuLogout')}
                  </Typography>
                }
              />
            </MenuItem>
          </Menu>

          {/* APPS DROPDOWN MENU */}
          <Menu
            id="apps-menu"
            anchorEl={appsAnchorEl}
            open={isAppsMenuOpen}
            onClose={handleAppsMenuClose}
            slotProps={{
              paper: {
                elevation: 6,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 8px 24px rgba(0,0,0,0.25))',
                  mt: 1.5,
                  minWidth: 290,
                  borderRadius: 3,
                  p: 1,
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#1a231f' : '#ffffff'),
                },
              },
            }}
            transformOrigin={{ horizontal: 'left', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
          >

            {/* APP: PROJECT TRACKER */}
            <MenuItem
              onClick={() => {
                handleAppsMenuClose();
                onAppChange('project-tracker');
                onTabChange('dashboard');
                setMobileOpen(false);
              }}
              selected={currentApp === 'project-tracker'}
              sx={{
                borderRadius: 2,
                py: 1.2,
                px: 1.5,
                my: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                bgcolor: currentApp === 'project-tracker' ? 'action.selected' : 'transparent',
              }}
            >
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: currentApp === 'project-tracker' ? 'primary.main' : 'action.hover',
                  color: currentApp === 'project-tracker' ? '#ffffff' : 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DashboardIcon fontSize="small" />
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: currentApp === 'project-tracker' ? 700 : 600 }}>
                    {t('appProjectTracker')}
                  </Typography>
                  {currentApp === 'project-tracker' && (
                    <Chip
                      label={t('appCurrentActive')}
                      size="small"
                      color="primary"
                      sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                    />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.725rem' }}>
                  {t('appProjectTrackerDesc')}
                </Typography>
              </Box>
            </MenuItem>

            {/* APP: DATA MANAGEMENT (ADMIN AND MANAGER ONLY) */}
            {!isUser && !isAccountant && (role === 'Administrator' || role === 'Manager') && (
              <MenuItem
                onClick={() => {
                  handleAppsMenuClose();
                  onAppChange('data-management');
                  if (activeTab === 'dashboard') {
                    onTabChange('projects');
                  }
                  setMobileOpen(false);
                }}
                selected={currentApp === 'data-management'}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  px: 1.5,
                  my: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  bgcolor: currentApp === 'data-management' ? 'action.selected' : 'transparent',
                }}
              >
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: currentApp === 'data-management' ? 'primary.main' : 'action.hover',
                    color: currentApp === 'data-management' ? '#ffffff' : 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <StorageIcon fontSize="small" />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: currentApp === 'data-management' ? 700 : 600 }}>
                      {t('appDataManagement')}
                    </Typography>
                    {currentApp === 'data-management' && (
                      <Chip
                        label={t('appCurrentActive')}
                        size="small"
                        color="primary"
                        sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.725rem' }}>
                    {t('appDataManagementDesc')}
                  </Typography>
                </Box>
              </MenuItem>
            )}
          </Menu>

          {/* NOTIFICATIONS DROPDOWN MENU */}
          <NotificationsMenu
            anchorEl={notifAnchorEl}
            isOpen={isNotifMenuOpen}
            onClose={handleNotifClose}
            onOpenProject={onOpenProject}
            onNavigateToPendingUsers={onNavigateToPendingUsers}
            onAppChange={onAppChange}
            onTabChange={onTabChange}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
};
