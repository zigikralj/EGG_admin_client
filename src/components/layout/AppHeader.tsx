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
  FormControlLabel,
  Switch,
  Badge,
  Avatar,
  Menu,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';








import logoUrl from '../../assets/logo.svg';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useRoleLabels } from '../../hooks/useRoleLabels';
import type { ActiveTab } from '../../types';
import type { TranslationKeys } from '../../i18n/translations';
import { DRAWER_WIDTH } from './Sidebar';
import { MenuIcon, BusinessIcon, PersonIcon, PersonAddIcon, AccountCircleIcon, SettingsIcon, LogoutIcon } from '../icons';

interface AppHeaderProps {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onPreferenceChange?: (key: string, value: any) => void;
  onNavigateToPendingUsers?: () => void;
  handleOpenProfile: () => void;
  handleOpenPreferences: () => void;
  handleLogoutClick: () => void;
  setIsCompanyInfoOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const tabTranslationKeys: Record<ActiveTab, keyof TranslationKeys> = {
  dashboard: 'tabDashboard',
  projects: 'tabProjects',
  clients: 'tabClients',
  users: 'tabUsers',
  services: 'tabServices',
  providedServices: 'tabProvidedServices',
  categories: 'tabCategories',
  reminders: 'tabReminders',
  invoices: 'tabInvoices',
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  mobileOpen,
  setMobileOpen,
  activeTab,
  onTabChange,
  onPreferenceChange,
  onNavigateToPendingUsers,
  handleOpenProfile,
  handleOpenPreferences,
  handleLogoutClick,
  setIsCompanyInfoOpen,
}) => {
  const { t } = useLanguage();
  const { getRoleBadgeLabel } = useRoleLabels();
  const {
    currentUser,
    users,
    setCurrentUser,
    role,
    isAdmin,
    canToggleEntityWorkMode,
    workOnEntities,
    setWorkOnEntities,
    pendingUsersCount,
  } = useAuth();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
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
      <Toolbar sx={{ justifyContent: 'space-between', gap: { xs: 1, sm: 2 }, px: { xs: 1.5, sm: 3 } }}>
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

        {/* BRAND LOGO & COMPANY INFO */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1.25 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              minWidth: { xs: 'auto', md: DRAWER_WIDTH - 24 - 44 },
              py: 0.5,
            }}
            onClick={() => {
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
        </Box>

        {/* PAGE TITLE */}
        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }}>
          {activeTab !== 'dashboard' && (
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>
              {t(tabTranslationKeys[activeTab])}
            </Typography>
          )}
        </Box>

        {/* RIGHT SIDE CONTROLS */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          {/* USER SWITCHER (DESKTOP ONLY - ADMIN ONLY) */}
          {isAdmin && users.length > 0 && (
            <FormControl size="small" sx={{ minWidth: { xs: 100, sm: 160 }, display: { xs: 'none', md: 'flex' } }}>
              <Select
                value={users.some(u => u.id === currentUser?.id) ? currentUser!.id : ''}
                onChange={(e) => {
                  const target = users.find((u) => u.id === e.target.value);
                  if (target) setCurrentUser(target);
                }}
                startAdornment={<PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'rgba(255, 255, 255, 0.7)' }} />}
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
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id} sx={{ fontSize: '0.8125rem' }}>
                    {u.name} ({getRoleBadgeLabel(u.role)})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* ENTITY WORK MODE SWITCH FOR MANAGER / ADMIN (DESKTOP ONLY) */}
          {canToggleEntityWorkMode && (
            <Tooltip title={workOnEntities ? t('lblEntityWorkModeOn') : t('lblEntityWorkModeOff')}>
              <FormControlLabel
                control={
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
                }
                label={
                  <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    {t('switchWorkOnEntities')}
                  </Typography>
                }
                sx={{
                  mr: 0,
                  ml: 0,
                  bgcolor: workOnEntities ? 'rgba(25, 118, 210, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid',
                  borderColor: workOnEntities ? 'primary.main' : 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 2,
                  px: 1.2,
                  py: 0.2,
                  transition: 'all 0.2s ease',
                  display: { xs: 'none', md: 'inline-flex' },
                }}
              />
            </Tooltip>
          )}

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

              <Badge
                badgeContent={pendingUsersCount}
                color="warning"
                overlap="circular"
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                invisible={!canToggleEntityWorkMode || pendingUsersCount <= 0}
                sx={{
                  '& .MuiBadge-badge': {
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    boxShadow: '0 0 0 2px #121a16',
                  },
                }}
              >
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
              </Badge>
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

            {canToggleEntityWorkMode && pendingUsersCount > 0 && (
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  if (!workOnEntities) {
                    setWorkOnEntities(true);
                    if (onPreferenceChange) {
                      onPreferenceChange('work_on_entities', true);
                    }
                  }
                  if (onNavigateToPendingUsers) {
                    onNavigateToPendingUsers();
                  } else {
                    onTabChange('users');
                  }
                }}
                sx={{
                  borderRadius: 1.5,
                  py: 1.2,
                  px: 2,
                  my: 0.5,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(237, 108, 2, 0.15)' : 'warning.50',
                  border: '1px solid',
                  borderColor: 'warning.main',
                  '&:hover': {
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(237, 108, 2, 0.25)' : 'warning.100',
                  },
                }}
              >
                <ListItemIcon>
                  <Badge badgeContent={pendingUsersCount} color="warning">
                    <PersonAddIcon fontSize="small" color="warning" />
                  </Badge>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'warning.main' }}>
                      {t('menuPendingUsers', { count: pendingUsersCount })}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {t('menuPendingUsersSub')}
                    </Typography>
                  }
                />
              </MenuItem>
            )}

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

            <MenuItem onClick={() => { handleMenuClose(); handleLogoutClick(); }} sx={{ borderRadius: 1.5, py: 1.2, px: 2, color: 'error.main' }}>
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
        </Box>
      </Toolbar>
    </AppBar>
  );
};
