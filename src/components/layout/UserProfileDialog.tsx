import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Box,
  Avatar,
  Tooltip,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Divider,
  Collapse,
  Alert,
  InputAdornment,
} from '@mui/material';














import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useRoleLabels } from '../../hooks/useRoleLabels';
import { apiFetch } from '../../api';
import { CloseIcon, PhotoCameraIcon, PersonIcon, EmailIcon, PhoneIcon, WcIcon, BadgeIcon, VpnKeyIcon, ExpandMoreIcon, ExpandLessIcon, LockIcon, Visibility, VisibilityOff } from '../icons';

interface UserProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileDialog: React.FC<UserProfileDialogProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { currentUser, role, setCurrentUser } = useAuth();
  const { getRoleBadgeLabel } = useRoleLabels();

  // Local State
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileEmail, setEditProfileEmail] = useState('');
  const [editProfilePhone, setEditProfilePhone] = useState('');
  const [editProfileGender, setEditProfileGender] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      setEditProfileName(currentUser.name);
      setEditProfileEmail(currentUser.email || '');
      setEditProfilePhone(currentUser.phone || '');
      setEditProfileGender(currentUser.gender || '');
      setEditAvatarUrl(currentUser.avatarUrl || null);

      setChangePasswordOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setPasswordError('');
      setPasswordSuccess('');
    }
  }, [isOpen, currentUser]);

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
    if (changePasswordOpen || newPassword || currentPassword) {
      if (!currentPassword) {
        setPasswordError(t('currentPasswordIncorrectError'));
        return;
      }
      if (newPassword.length < 4) {
        setPasswordError(t('passwordTooShortError'));
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError(t('passwordMismatchError'));
        return;
      }
    }

    setIsSavingProfile(true);
    try {
      const res = await apiFetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id,
        },
        body: JSON.stringify({
          name: editProfileName,
          email: editProfileEmail,
          phone: editProfilePhone,
          gender: editProfileGender,
          avatarUrl: editAvatarUrl !== null ? editAvatarUrl : currentUser.avatarUrl,
          ...(newPassword ? { password: newPassword, currentPassword } : {}),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setCurrentUser(updated);
        alert(newPassword ? t('passwordUpdatedSuccess') : 'Profile updated successfully!');
        onClose();
      } else {
        const err = await res.json();
        if (err.error && (err.error.includes('password') || err.error.includes('Password') || err.error.includes('incorrect') || err.error.includes('tačna'))) {
          setPasswordError(err.error);
        } else {
          alert(err.error || t('errorSavingProject'));
        }
      }
    } catch (e) {
      console.error('Error saving profile:', e);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const editInitials = editProfileName
    ? editProfileName.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
    : 'U';

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
          {t('userProfileTitle')}
        </Typography>
        <IconButton size="small" onClick={onClose}>
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
          <FormControl fullWidth size="small">
            <Select
              value={editProfileGender}
              onChange={(e) => setEditProfileGender(e.target.value as string)}
              displayEmpty
              startAdornment={<WcIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
            >
              <MenuItem value="">
                <em>{t('genderNotSpecified')} ({t('lblGender')})</em>
              </MenuItem>
              <MenuItem value="Male">{t('genderMale')}</MenuItem>
              <MenuItem value="Female">{t('genderFemale')}</MenuItem>
              <MenuItem value="Other">{t('genderOther')}</MenuItem>
            </Select>
          </FormControl>
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
          <Divider sx={{ my: 0.5 }} />
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setChangePasswordOpen(!changePasswordOpen);
              setPasswordError('');
              setPasswordSuccess('');
            }}
            startIcon={<VpnKeyIcon fontSize="small" />}
            endIcon={changePasswordOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            sx={{ justifyContent: 'space-between', textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
          >
            {t('lblChangePassword')}
          </Button>
          <Collapse in={changePasswordOpen}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1, pb: 0.5 }}>
              {passwordError && (
                <Alert severity="error" sx={{ py: 0.5, borderRadius: 2, fontSize: '0.8125rem' }}>
                  {passwordError}
                </Alert>
              )}
              {passwordSuccess && (
                <Alert severity="success" sx={{ py: 0.5, borderRadius: 2, fontSize: '0.8125rem' }}>
                  {passwordSuccess}
                </Alert>
              )}
              <TextField
                label={t('lblCurrentPassword')}
                placeholder={t('phCurrentPassword')}
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(''); }}
                fullWidth
                size="small"
                slotProps={{
                  input: {
                    startAdornment: <LockIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end">
                          {showCurrentPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label={t('lblNewPassword')}
                placeholder={t('phNewPassword')}
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                fullWidth
                size="small"
                slotProps={{
                  input: {
                    startAdornment: <VpnKeyIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                          {showNewPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label={t('lblConfirmNewPassword')}
                placeholder={t('phConfirmNewPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                fullWidth
                size="small"
                slotProps={{
                  input: {
                    startAdornment: <VpnKeyIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                          {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
          </Collapse>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
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
  );
};
