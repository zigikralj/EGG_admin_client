import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Typography,
  Grid,
  Chip,
  Box,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ViewEditModalBase, type ModalMode } from '../common/modal/ViewEditModalBase';
import { ViewEditField } from '../common/modal/ViewEditField';
import type { User, Role } from '../../types';

export interface UserModalProps {
  open: boolean;
  onClose: () => void;
  editingUser: User | null;
  mode?: ModalMode;
  initialMode?: ModalMode;
  onModeChange?: (mode: ModalMode) => void;
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
  mode: controlledMode,
  initialMode,
  onModeChange: onModeChangeProp,
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

  const [internalMode, setInternalMode] = useState<ModalMode>(() => {
    if (controlledMode) return controlledMode;
    if (initialMode) return initialMode;
    return editingUser ? 'view' : 'create';
  });

  const currentMode = controlledMode || internalMode;
  const isView = currentMode === 'view';

  const handleModeChange = (newMode: ModalMode) => {
    setInternalMode(newMode);
    onModeChangeProp?.(newMode);
  };

  useEffect(() => {
    if (open) {
      if (controlledMode) {
        setInternalMode(controlledMode);
      } else if (initialMode) {
        setInternalMode(initialMode);
      } else {
        setInternalMode(editingUser ? 'view' : 'create');
      }
    }
  }, [open, editingUser?.id, initialMode, controlledMode]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('User');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [status, setStatus] = useState('APPROVED');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const populateFromUser = useCallback((u: User | null) => {
    if (u) {
      setName(u.name || '');
      setEmail(u.email || '');
      setRole(u.role || 'User');
      setPhone(u.phone || '');
      setGender(u.gender || '');
      setStatus(u.status || (u.isApproved ? 'APPROVED' : 'PENDING'));
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
  }, []);

  useEffect(() => {
    if (open) {
      populateFromUser(editingUser);
    }
  }, [open, editingUser, populateFromUser]);

  const handleCancel = () => {
    if (currentMode === 'edit' && editingUser) {
      populateFromUser(editingUser);
      handleModeChange('view');
    } else {
      onClose();
    }
  };

  const getRoleLabel = useCallback(
    (roleName: string) => {
      const key = `role${roleName.replace(/\s+/g, '')}`;
      const translated = t(key as any);
      return translated !== key ? translated : roleName;
    },
    [t]
  );

  const getRoleColor = useCallback((roleName: string): 'error' | 'warning' | 'info' | 'default' => {
    switch (roleName) {
      case 'Administrator':
        return 'error';
      case 'Manager':
        return 'warning';
      case 'Staff':
        return 'info';
      default:
        return 'default';
    }
  }, []);

  const getGenderLabel = useCallback(
    (g?: string | null) => {
      if (!g) return t('genderNotSpecified');
      switch (g) {
        case 'Male':
          return t('genderMale');
        case 'Female':
          return t('genderFemale');
        case 'Other':
          return t('genderOther');
        default:
          return g;
      }
    },
    [t]
  );

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isView) return;
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

  const modalTitle = currentMode === 'create'
    ? t('modalNewUser')
    : currentMode === 'edit'
    ? t('modalEditUser')
    : (editingUser?.name || t('btnDetails'));

  return (
    <ViewEditModalBase
      open={open}
      onClose={onClose}
      mode={currentMode}
      onModeChange={handleModeChange}
      title={modalTitle}
      subtitle={editingUser?.email}
      statusChip={editingUser ? (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Chip
            label={getRoleLabel(role)}
            size="small"
            color={getRoleColor(role)}
          />
          <Chip
            label={status === 'APPROVED' ? t('statusApproved') : status === 'BLOCKED' ? t('statusBlocked') : t('statusPending')}
            size="small"
            color={status === 'APPROVED' ? 'success' : status === 'BLOCKED' ? 'error' : 'warning'}
            variant="outlined"
          />
        </Box>
      ) : undefined}
      canEdit={canEdit}
      canDelete={Boolean(editingUser && canDelete && onDeleteUser)}
      onDelete={() => {
        if (editingUser) {
          onDeleteUser?.(editingUser.id);
          onClose();
        }
      }}
      isSaving={isSaving}
      onSave={handleSubmit}
      onCancel={handleCancel}
      maxWidth="sm"
    >
      <Grid container spacing={2}>
        {/* Full Name */}
        <Grid size={{ xs: 12 }}>
          <ViewEditField
            mode={currentMode}
            label={t('colFullName')}
            value={name}
            viewRender={() => (
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {name || '—'}
              </Typography>
            )}
          >
            <TextField
              fullWidth
              size="small"
              label={t('colFullName')}
              placeholder={t('phFullName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </ViewEditField>
        </Grid>

        {/* Role */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <ViewEditField
            mode={currentMode}
            label={t('lblRole')}
            value={getRoleLabel(role)}
            viewRender={() => (
              <Chip
                label={getRoleLabel(role)}
                size="small"
                color={getRoleColor(role)}
              />
            )}
          >
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
          </ViewEditField>
        </Grid>

        {/* Gender */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <ViewEditField
            mode={currentMode}
            label={t('lblGender')}
            value={getGenderLabel(gender)}
            viewRender={() => (
              <Typography variant="body2">
                {getGenderLabel(gender)}
              </Typography>
            )}
          >
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
          </ViewEditField>
        </Grid>

        {/* Status (when editing/viewing existing user) */}
        {editingUser && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <ViewEditField
              mode={currentMode}
              label={t('colApprovalStatus')}
              value={status === 'APPROVED' ? t('statusApproved') : status === 'BLOCKED' ? t('statusBlocked') : t('statusPending')}
              viewRender={() => (
                <Chip
                  label={status === 'APPROVED' ? t('statusApproved') : status === 'BLOCKED' ? t('statusBlocked') : t('statusPending')}
                  size="small"
                  color={status === 'APPROVED' ? 'success' : status === 'BLOCKED' ? 'error' : 'warning'}
                  variant="outlined"
                />
              )}
            >
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
            </ViewEditField>
          </Grid>
        )}

        {/* Phone */}
        <Grid size={{ xs: 12, sm: editingUser ? 6 : 6 }}>
          <ViewEditField
            mode={currentMode}
            label={t('colPhone')}
            value={phone}
            viewRender={() => (
              <Typography variant="body2">
                {phone || '—'}
              </Typography>
            )}
          >
            <TextField
              fullWidth
              size="small"
              label={t('colPhone')}
              placeholder="+381 36 311 100"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </ViewEditField>
        </Grid>

        {/* Email */}
        <Grid size={{ xs: 12 }}>
          <ViewEditField
            mode={currentMode}
            label={t('colEmail')}
            value={email}
            viewRender={() => (
              <Typography variant="body2">
                {email || '—'}
              </Typography>
            )}
          >
            <TextField
              fullWidth
              size="small"
              type="email"
              label={t('colEmail')}
              placeholder="aleksandar@ekosgreen.rs"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </ViewEditField>
        </Grid>

        {/* Password (Only in create / edit mode) */}
        {!isView && (
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
        )}
      </Grid>
    </ViewEditModalBase>
  );
};

export default UserModal;
