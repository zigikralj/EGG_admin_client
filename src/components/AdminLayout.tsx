import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  Box,
  Select,
  MenuItem,
  FormControl,
  Menu,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tooltip,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Collapse,
  Switch,
  FormControlLabel,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import BuildIcon from '@mui/icons-material/Build';
import CategoryIcon from '@mui/icons-material/Category';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PersonIcon from '@mui/icons-material/Person';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import BarChartIcon from '@mui/icons-material/BarChart';
import type { ActiveTab, DashboardSubTab, ProjectStats } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LanguageSelector } from './LanguageSelector';
import { ColumnSelector, type ColumnDef } from './ColumnSelector';
import logoUrl from '../assets/logo.svg';
import type { TranslationKeys } from '../i18n/translations';

interface Props {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  dashboardSubTab?: DashboardSubTab;
  onDashboardSubTabChange?: (subTab: DashboardSubTab) => void;
  stats: ProjectStats;
  userPreferences?: Record<string, any>;
  onPreferenceChange?: (key: string, value: any) => void;
  children: React.ReactNode;
}

type EntityType = 'projects' | 'clients' | 'users' | 'services' | 'categories' | 'reminders';

const tabTranslationKeys: Record<ActiveTab, keyof TranslationKeys> = {
  dashboard: 'tabDashboard',
  projects: 'tabProjects',
  clients: 'tabClients',
  users: 'tabUsers',
  services: 'tabServices',
  categories: 'tabCategories',
  reminders: 'tabReminders',
};

const DRAWER_WIDTH = 250;

export const AdminLayout: React.FC<Props> = ({
  activeTab,
  onTabChange,
  dashboardSubTab = 'default',
  onDashboardSubTabChange,
  stats,
  userPreferences,
  onPreferenceChange,
  children,
}) => {
  const { t } = useLanguage();
  const { themeMode, setThemeMode } = useThemeContext();
  const { currentUser, users, pendingUsersCount, setCurrentUser, logout, role, isUser, canManageUsers, canToggleEntityWorkMode, workOnEntities, setWorkOnEntities } = useAuth();

  React.useEffect(() => {
    if (userPreferences && typeof userPreferences.work_on_entities === 'boolean') {
      if (userPreferences.work_on_entities !== workOnEntities) {
        setWorkOnEntities(userPreferences.work_on_entities);
      }
    }
  }, [userPreferences?.work_on_entities, workOnEntities, setWorkOnEntities]);

  const [isDashboardExpanded, setIsDashboardExpanded] = React.useState(true);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = React.useState(false);

  // Profile editing state
  const [editProfileName, setEditProfileName] = React.useState('');
  const [editProfileEmail, setEditProfileEmail] = React.useState('');
  const [editProfilePhone, setEditProfilePhone] = React.useState('');
  const [editAvatarUrl, setEditAvatarUrl] = React.useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);

  // Preferences entity columns state
  const [prefSelectedEntity, setPrefSelectedEntity] = React.useState<EntityType>('projects');

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const isMenuOpen = Boolean(anchorEl);

  React.useEffect(() => {
    if (isUser && activeTab !== 'dashboard') {
      onTabChange('dashboard');
    }
  }, [isUser, activeTab, onTabChange]);

  const getRoleBadgeLabel = (r: string) => {
    switch (r) {
      case 'Administrator': return t('roleAdministrator');
      case 'Manager': return t('roleManager');
      case 'User': return t('roleUser');
      default: return r;
    }
  };

  const getRoleColor = (r: string): 'secondary' | 'primary' | 'success' | 'default' => {
    switch (r) {
      case 'Administrator': return 'secondary';
      case 'Manager': return 'primary';
      case 'User': return 'success';
      default: return 'default';
    }
  };

  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  const editInitials = editProfileName
    ? editProfileName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : initials;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenProfile = () => {
    handleMenuClose();
    if (currentUser) {
      setEditProfileName(currentUser.name || '');
      setEditProfileEmail(currentUser.email || '');
      setEditProfilePhone(currentUser.phone || '');
      setEditAvatarUrl(currentUser.avatarUrl || null);
    }
    setIsProfileOpen(true);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setEditAvatarUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    if (!editProfileName.trim()) {
      alert(t('alertUserNameRequired'));
      return;
    }
    setIsSavingProfile(true);
    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id,
        },
        body: JSON.stringify({
          name: editProfileName,
          email: editProfileEmail,
          phone: editProfilePhone,
          avatarUrl: editAvatarUrl !== null ? editAvatarUrl : currentUser.avatarUrl,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setCurrentUser(updated);
        setIsProfileOpen(false);
      } else {
        const err = await res.json();
        alert(err.error || t('errorSavingProject'));
      }
    } catch (e) {
      console.error('Error saving profile:', e);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleOpenPreferences = () => {
    handleMenuClose();
    setIsPreferencesOpen(true);
  };

  const handleLogoutClick = () => {
    handleMenuClose();
    logout();
  };

  const getEntityColumns = (entity: EntityType): ColumnDef[] => {
    switch (entity) {
      case 'projects':
        return [
          { id: 'name', label: t('colProject') },
          { id: 'client', label: t('colClient') },
          { id: 'category', label: t('colCategory') },
          { id: 'responsible', label: t('colResponsible') },
          { id: 'progress', label: t('progress') },
          { id: 'nextSample', label: t('colNextSample') },
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
          { id: 'email', label: t('colEmail') },
          { id: 'phone', label: t('colPhone') },
        ];
      case 'services':
        return [
          { id: 'code', label: t('colCode') },
          { id: 'name', label: t('colServiceName') },
          { id: 'group', label: t('colCategory') },
          { id: 'frequency', label: t('colPeriodicSampling') },
        ];
      case 'categories':
        return [
          { id: 'code', label: t('lblCategoryCode') },
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
      case 'categories':
        return ['name', 'description'];
      case 'reminders':
        return ['project', 'client', 'responsible', 'status', 'notes'];
    }
  };

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: t('tabDashboard'), icon: <DashboardIcon />, count: 0, show: true },
    { id: 'projects' as ActiveTab, label: t('tabProjects'), icon: <FolderIcon />, count: stats.active, show: !isUser },
    { id: 'clients' as ActiveTab, label: t('tabClients'), icon: <BusinessIcon />, count: stats.clientsCount, show: !isUser },
    {
      id: 'users' as ActiveTab,
      label: t('tabUsers'),
      icon: <PeopleIcon />,
      count: canManageUsers && pendingUsersCount > 0 ? pendingUsersCount : stats.usersCount,
      color: canManageUsers && pendingUsersCount > 0 ? ('warning' as const) : undefined,
      show: !isUser,
    },
    { id: 'services' as ActiveTab, label: t('tabServices'), icon: <BuildIcon />, count: 0, show: !isUser },
    { id: 'categories' as ActiveTab, label: t('tabCategories'), icon: <CategoryIcon />, count: stats.categoriesCount || 0, show: !isUser },
    { id: 'reminders' as ActiveTab, label: t('tabReminders'), icon: <NotificationsActiveIcon />, count: stats.monitor, show: !isUser, color: 'error' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* TOP APP BAR */}
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
        <Toolbar sx={{ justifyContent: 'space-between', gap: 2 }}>
          {/* BRAND LOGO */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              minWidth: DRAWER_WIDTH - 24,
              py: 0.5,
            }}
            onClick={() => onTabChange('dashboard')}
          >
            <Box
              component="img"
              src={logoUrl}
              alt="Ekos Green Group"
              sx={{
                height: 38,
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

          {/* PAGE TITLE */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}>
            {activeTab !== 'dashboard' && (
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>
                {t(tabTranslationKeys[activeTab])}
              </Typography>
            )}
          </Box>

          {/* RIGHT SIDE CONTROLS */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* USER SWITCHER (RETURNED TO HEADER) */}
            <FormControl size="small">
              <Select
                value={currentUser?.id || ''}
                onChange={(e) => {
                  const target = users.find((u) => u.id === e.target.value);
                  if (target) setCurrentUser(target);
                }}
                startAdornment={<PersonIcon fontSize="small" sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />}
                sx={{
                  borderRadius: 2,
                  fontSize: '0.875rem',
                  color: '#ffffff',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
                  '.MuiSvgIcon-root': { color: '#ffffff' },
                }}
              >
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id} sx={{ fontSize: '0.875rem' }}>
                    {u.name} ({getRoleBadgeLabel(u.role)})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* ENTITY WORK MODE SWITCH FOR MANAGER / ADMIN */}
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
                    <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
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
                  <Chip
                    label={currentUser ? getRoleBadgeLabel(role) : t('menuLogout')}
                    color={currentUser ? getRoleColor(role) : 'default'}
                    size="small"
                    sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 700 }}
                  />
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

              <MenuItem onClick={handleOpenProfile} sx={{ borderRadius: 1.5, py: 1.2, px: 2 }}>
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

              <MenuItem onClick={handleOpenPreferences} sx={{ borderRadius: 1.5, py: 1.2, px: 2 }}>
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

              <MenuItem onClick={handleLogoutClick} sx={{ borderRadius: 1.5, py: 1.2, px: 2, color: 'error.main' }}>
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

      {/* EDITABLE PROFILE MODAL WITH AVATAR UPLOAD */}
      <Dialog
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
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
            {t('userProfileTitle')}
          </Typography>
          <IconButton size="small" onClick={() => setIsProfileOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {/* AVATAR EDIT / UPLOAD SECTION */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1.5, mb: 1 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={editAvatarUrl ? editAvatarUrl : (editAvatarUrl === '' ? undefined : currentUser?.avatarUrl || undefined)}
                sx={{
                  bgcolor: 'primary.main',
                  width: 84,
                  height: 84,
                  fontSize: '2rem',
                  fontWeight: 700,
                  border: '3px solid',
                  borderColor: 'background.paper',
                  boxShadow: 3,
                }}
              >
                {editInitials}
              </Avatar>
              <Tooltip title="Upload photo">
                <IconButton
                  color="primary"
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    bgcolor: 'background.paper',
                    boxShadow: 3,
                    p: 0.75,
                    border: '2px solid',
                    borderColor: 'background.paper',
                    '&:hover': { bgcolor: 'primary.50' },
                  }}
                >
                  <PhotoCameraIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarFileChange}
              />
            </Box>
            {(editAvatarUrl || currentUser?.avatarUrl) && editAvatarUrl !== '' && (
              <Button
                size="small"
                color="error"
                onClick={handleRemoveAvatar}
                sx={{ mt: 1, textTransform: 'none', fontSize: '0.75rem', fontWeight: 600 }}
              >
                Remove photo
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
            <TextField
              label={t('lblFullName')}
              placeholder={t('phFullName')}
              value={editProfileName}
              onChange={(e) => setEditProfileName(e.target.value)}
              fullWidth
              size="small"
              required
              slotProps={{
                input: {
                  startAdornment: <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                },
              }}
            />
            <TextField
              label={t('colEmail')}
              placeholder={t('phEmail')}
              value={editProfileEmail}
              onChange={(e) => setEditProfileEmail(e.target.value)}
              fullWidth
              size="small"
              slotProps={{
                input: {
                  startAdornment: <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                },
              }}
            />
            <TextField
              label={t('colPhone')}
              placeholder={t('phPhone')}
              value={editProfilePhone}
              onChange={(e) => setEditProfilePhone(e.target.value)}
              fullWidth
              size="small"
              slotProps={{
                input: {
                  startAdornment: <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                },
              }}
            />
            <TextField
              label={t('colRole')}
              value={getRoleBadgeLabel(role)}
              disabled
              fullWidth
              size="small"
              slotProps={{
                input: {
                  startAdornment: <BadgeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setIsProfileOpen(false)}
            variant="outlined"
            fullWidth
            sx={{ borderRadius: 2 }}
          >
            {t('btnCancel')}
          </Button>
          <Button
            onClick={handleSaveProfile}
            variant="contained"
            disabled={isSavingProfile}
            fullWidth
            sx={{ borderRadius: 2 }}
          >
            {t('btnSave')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* PREFERENCES MODAL */}
      <Dialog
        open={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
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
          <IconButton size="small" onClick={() => setIsPreferencesOpen(false)}>
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

            {/* DYNAMIC ENTITY TABLE COLUMNS SELECTOR */}
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
                    <MenuItem value="categories">{t('tabCategories')}</MenuItem>
                    <MenuItem value="reminders">{t('tabReminders')}</MenuItem>
                  </Select>
                </FormControl>

                <ColumnSelector
                  columns={getEntityColumns(prefSelectedEntity)}
                  visibleColumns={getEntityVisibleColumns(prefSelectedEntity)}
                  onChange={(cols) => {
                    if (onPreferenceChange) {
                      onPreferenceChange(`cols_${prefSelectedEntity}`, cols);
                    }
                  }}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsPreferencesOpen(false)} variant="contained" fullWidth sx={{ borderRadius: 2 }}>
            {t('btnSave')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SIDEBAR DRAWER */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', p: 1.5 }}>
          <List component="nav" disablePadding sx={{ gap: 0.5, display: 'flex', flexDirection: 'column' }}>
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const isSelected = activeTab === item.id;
                if (item.id === 'dashboard') {
                  const dashboardSubItems: { id: DashboardSubTab; label: string; icon: React.ReactNode }[] = [
                    { id: 'default', label: t('subTabDefault'), icon: <ViewQuiltIcon fontSize="small" /> },
                    { id: 'statistic', label: t('subTabStatistic'), icon: <BarChartIcon fontSize="small" /> },
                    { id: 'reminders', label: t('subTabReminders'), icon: <NotificationsActiveIcon fontSize="small" /> },
                    { id: 'projects', label: t('subTabProjects'), icon: <FolderIcon fontSize="small" /> },
                  ];

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
                    onClick={() => onTabChange(item.id)}
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
      </Drawer>

      {/* MAIN CONTENT AREA */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          width: `calc(100vw - ${DRAWER_WIDTH}px)`,
          height: 'calc(100vh - 64px)',
          mt: '64px',
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'auto', p: 1.5 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};
