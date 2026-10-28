import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Typography,
  Grid,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { DeleteIcon } from '../icons';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import type { User, Role } from '../../types';

export interface UserModalProps {
  open: boolean;
  onClose: () => void;
  editingUser: User | null;
  rolesList: Role[];
  canDelete?: boolean;
  canEdit?: boolean;
  canCreate?: boolean;
  onDeleteUser?: (id: string) => void;
  onSaveUser: (userData: any) => Promise<{ success: boolean; error?: string }>;
  onError?: (message: string) => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  open,
  onClose,
  editingUser,
  rolesList,
  canDelete = false,
  canEdit = true,
  canCreate = true,
  onDeleteUser,
  onSaveUser,
  onError,
}) => {
  const { t } = useLanguage();
  const { hasPermission } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('User');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [status, setStatus] = useState('APPROVED');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingUser) {
        setName(editingUser.name);
        setEmail(editingUser.email || '');
        setRole(editingUser.role || 'User');
        setPhone(editingUser.phone || '');
        setGender(editingUser.gender || '');
        setStatus(editingUser.status || (editingUser.isApproved ? 'APPROVED' : 'PENDING'));
        setPassword('');
        setShowPassword(false);
      } else {
        setName('');
        setEmail('');
        setRole('User');
        setPhone('');
        setGender('');
        setStatus('APPROVED');
        setPassword('');
        setShowPassword(false);
      }
    }
  }, [open, editingUser]);

  const getRoleLabel = (roleName: string) => {
    const key = `role${roleName.replace(/\s+/g, '')}`;
    const translated = t(key as any);
    return translated !== key ? translated : roleName;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser ? !canEdit : !canCreate) return;
    if (!name.trim()) {
      onError?.(t('alertUserNameRequired'));
      return;
    }
    setIsSaving(true);
    try {
      const res = await onSaveUser({
        id: editingUser?.id,
        name: name.trim(),
        email: email.trim() || null,
        role: role.trim() || 'User',
        phone: phone.trim() || null,
        gender: gender || null,
        status,
        isApproved: status === 'APPROVED',
        ...(password.trim() ? { password: password.trim() } : {}),
      });

      if (res.success) {
        onClose();
      } else if (res.error) {
        onError?.(res.error || t('errorSavingUser'));
      }
    } catch (err: any) {
      onError?.(err?.message || t('errorSavingUser'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: handleSubmit,
          sx: {
            maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      <DialogTitle
        component="div"
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {editingUser ? t('modalEditUser') : t('modalNewUser')}
        </Typography>
        {editingUser && canDelete && onDeleteUser && (
          <Button
            color="error"
            size="small"
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={() => {
              onDeleteUser(editingUser.id);
              onClose();
            }}
          >
            {t('btnDelete')}
          </Button>
        )}
      </DialogTitle>
      <DialogContent dividers sx={{ flex: 1, overflowY: 'auto' }}>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              label={t('colFullName')}
              placeholder={t('phFullName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('lblRole')}</InputLabel>
              <Select
                value={role}
                label={t('lblRole')}
                onChange={(e) => setRole(e.target.value as string)}
              >
                {rolesList.map((r) => {
                  if (r.name === 'Administrator' && !hasPermission('roles', 'edit')) return null;
                  return (
                    <MenuItem key={r.name} value={r.name}>
                      {getRoleLabel(r.name)}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('lblGender')}</InputLabel>
              <Select
                value={gender}
                label={t('lblGender')}
                onChange={(e) => setGender(e.target.value as string)}
              >
                <MenuItem value=""><em>{t('genderNotSpecified')}</em></MenuItem>
                <MenuItem value="Male">{t('genderMale')}</MenuItem>
                <MenuItem value="Female">{t('genderFemale')}</MenuItem>
                <MenuItem value="Other">{t('genderOther')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {editingUser ? (
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('colApprovalStatus')}</InputLabel>
                <Select
                  value={status}
                  label={t('colApprovalStatus')}
                  onChange={(e) => setStatus(e.target.value as string)}
                >
                  <MenuItem value="APPROVED">{t('statusApproved')}</MenuItem>
                  <MenuItem value="BLOCKED">{t('statusBlocked')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          ) : (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label={t('colPhone')}
                placeholder="+381 36 311 100"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Grid>
          )}
          {editingUser && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label={t('colPhone')}
                placeholder="+381 36 311 100"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              type="email"
              label={t('colEmail')}
              placeholder="aleksandar@ekosgreen.rs"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              type={showPassword ? 'text' : 'password'}
              label={editingUser ? t('lblResetPassword') : t('lblPassword')}
              placeholder={editingUser ? t('phLeaveBlankToKeep') : t('phInitialPassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKeyIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, flexShrink: 0 }}>
        <Button onClick={onClose} variant="outlined" disabled={isSaving}>
          {t('btnCancel')}
        </Button>
        <Button type="submit" variant="contained" color="primary" disabled={isSaving}>
          {isSaving ? '...' : t('btnSave')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserModal;
