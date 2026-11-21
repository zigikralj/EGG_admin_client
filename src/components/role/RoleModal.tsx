import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TextField,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Chip,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import { DashboardIcon, StorageIcon, SettingsIcon } from '../icons';
import type { Role, PermissionAction, CatalogApp, CatalogResource } from '../../types';
import type { TranslationKeys } from '../../i18n/translations';
import { useLanguage } from '../../context/LanguageContext';
import { usePermissionCatalogQuery } from '../../queries';
import { ViewEditModalBase, type ModalMode } from '../common/modal/ViewEditModalBase';
import { ViewEditField } from '../common/modal/ViewEditField';

const ACTION_ORDER: PermissionAction[] = [
  'view',
  'create',
  'edit',
  'delete',
  'restore',
  'configure',
  'moderate',
];

export interface RoleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, data: Partial<Role>) => void;
  role: Role | null;
  mode?: ModalMode;
  initialMode?: ModalMode;
  onModeChange?: (mode: ModalMode) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  onDeleteRole?: (name: string) => void;
  canAssignSystemAdmin?: boolean;
}

export const RoleModal: React.FC<RoleModalProps> = ({
  open,
  onClose,
  onSave,
  role,
  mode: controlledMode,
  initialMode,
  onModeChange: onModeChangeProp,
  canEdit = true,
  canDelete = false,
  onDeleteRole,
  canAssignSystemAdmin = true,
}) => {
  const { t } = useLanguage();
  const { data: catalog, isLoading: isCatalogLoading } = usePermissionCatalogQuery({ enabled: open });
  const catalogApps = useMemo<CatalogApp[]>(() => catalog?.apps ?? [], [catalog]);

  const [internalMode, setInternalMode] = useState<ModalMode>(() => {
    if (controlledMode) return controlledMode;
    if (initialMode) return initialMode;
    return role ? 'view' : 'create';
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
        setInternalMode(role ? 'view' : 'create');
      }
    }
  }, [open, role?.name, initialMode, controlledMode]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<number>(10);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string>('project-tracker');
  const [appPermissions, setAppPermissions] = useState<string[]>(['project-tracker']);
  const [permissions, setPermissions] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  const populateFromRole = useCallback((r: Role | null) => {
    if (r) {
      setName(r.name || '');
      setDescription(r.description || '');
      const sysAdmin = Boolean(r.isSystemAdmin);
      setIsSystemAdmin(sysAdmin);
      setLevel(typeof r.level === 'number' ? r.level : 10);
      const initialPerms: Record<string, any> = {};
      if (r.permissions) {
        Object.entries(r.permissions).forEach(([k, v]) => {
          if (Array.isArray(v)) {
            initialPerms[k] = [...v];
          } else {
            initialPerms[k] = v;
          }
        });
      }
      setPermissions(initialPerms);
      const roleApps = r.permissions?.apps;
      if (Array.isArray(roleApps)) {
        setAppPermissions(roleApps);
      } else {
        setAppPermissions([]);
      }
    } else {
      setName('');
      setDescription('');
      setLevel(0);
      setIsSystemAdmin(false);
      setPermissions({});
      setAppPermissions(['project-tracker']);
    }
    setSelectedAppId('project-tracker');
  }, []);

  useEffect(() => {
    if (open) {
      populateFromRole(role);
    }
  }, [open, role, populateFromRole]);

  useEffect(() => {
    if (catalogApps.length > 0 && !catalogApps.some((a) => a.id === selectedAppId)) {
      setSelectedAppId(catalogApps[0].id);
    }
  }, [catalogApps, selectedAppId]);

  const currentAppDef = useMemo(
    () => catalogApps.find((a) => a.id === selectedAppId) || catalogApps[0],
    [catalogApps, selectedAppId]
  );
  const currentResources = useMemo<CatalogResource[]>(
    () => currentAppDef?.resources ?? [],
    [currentAppDef]
  );
  const isCurrentAppAllowed = currentAppDef ? appPermissions.includes(currentAppDef.id) : false;

  const visibleActions = useMemo<PermissionAction[]>(() => {
    const supported = new Set<PermissionAction>();
    currentResources.forEach((res) => {
      res.actions.forEach((act) => supported.add(act));
    });
    return ACTION_ORDER.filter((act) => supported.has(act));
  }, [currentResources]);

  const showOnlyOwnColumn = useMemo(
    () => currentResources.some((res) => Boolean(res.supportsOnlyOwn)),
    [currentResources]
  );

  const getAppIcon = (appId: string) => {
    switch (appId) {
      case 'data-management':
        return <StorageIcon fontSize="small" />;
      case 'system':
        return <SettingsIcon fontSize="small" />;
      case 'project-tracker':
      default:
        return <DashboardIcon fontSize="small" />;
    }
  };

  const getAppGrantedCount = (app: CatalogApp): number => {
    return app.resources.reduce((sum, res) => {
      const arr = permissions[res.id];
      return sum + (Array.isArray(arr) ? arr.length : 0);
    }, 0);
  };

  const handleAppAccessToggle = (appId: string, allowed: boolean) => {
    if (isView) return;
    setAppPermissions((prev) => {
      if (allowed) {
        return prev.includes(appId) ? prev : [...prev, appId];
      }
      return prev.filter((id) => id !== appId);
    });

    if (!allowed) {
      const appDef = catalogApps.find((a) => a.id === appId);
      if (appDef) {
        setPermissions((prev) => {
          const next = { ...prev };
          appDef.resources.forEach((r) => {
            next[r.id] = [];
            if (r.supportsOnlyOwn) {
              delete next[`${r.id}_onlyOwn`];
            }
          });
          return next;
        });
      }
    }
  };

  const handlePermissionChange = (resourceId: string, action: PermissionAction, checked: boolean) => {
    if (isView) return;
    if (checked) {
      const parentApp = catalogApps.find((app) => app.resources.some((r) => r.id === resourceId));
      if (parentApp) {
        setAppPermissions((prev) => (prev.includes(parentApp.id) ? prev : [...prev, parentApp.id]));
      }
    }
    setPermissions((prev) => {
      const currentResourcePerms: string[] = Array.isArray(prev[resourceId]) ? prev[resourceId] : [];
      const newPerms = { ...prev };

      if (checked) {
        newPerms[resourceId] = currentResourcePerms.includes(action)
          ? currentResourcePerms
          : [...currentResourcePerms, action];
      } else {
        newPerms[resourceId] = currentResourcePerms.filter((a) => a !== action);
      }
      return newPerms;
    });
  };

  const handleOnlyOwnChange = (resourceId: string, checked: boolean) => {
    if (isView) return;
    setPermissions((prev) => ({
      ...prev,
      [`${resourceId}_onlyOwn`]: checked,
    }));
  };

  const getEligibleResourcesForAction = (action: PermissionAction) =>
    currentResources.filter((res) => res.actions.includes(action));

  const handleSelectAllActionForCurrentApp = (action: PermissionAction, checked: boolean) => {
    if (isView) return;
    const eligible = getEligibleResourcesForAction(action);
    if (eligible.length === 0) return;

    if (checked && currentAppDef) {
      setAppPermissions((prev) =>
        prev.includes(currentAppDef.id) ? prev : [...prev, currentAppDef.id]
      );
    }

    setPermissions((prev) => {
      const newPerms = { ...prev };
      eligible.forEach((res) => {
        const current: string[] = Array.isArray(newPerms[res.id]) ? newPerms[res.id] : [];
        if (checked) {
          if (!current.includes(action)) newPerms[res.id] = [...current, action];
        } else {
          newPerms[res.id] = current.filter((a) => a !== action);
        }
      });
      return newPerms;
    });
  };

  const isActionAllSelectedForCurrentApp = (action: PermissionAction) => {
    const eligible = getEligibleResourcesForAction(action);
    return (
      eligible.length > 0 &&
      eligible.every((res) => Array.isArray(permissions[res.id]) && permissions[res.id].includes(action))
    );
  };

  const isActionIndeterminateForCurrentApp = (action: PermissionAction) => {
    const eligible = getEligibleResourcesForAction(action);
    const someSelected = eligible.some(
      (res) => Array.isArray(permissions[res.id]) && permissions[res.id].includes(action)
    );
    return someSelected && !isActionAllSelectedForCurrentApp(action);
  };

  const handleCancel = () => {
    if (currentMode === 'edit' && role) {
      populateFromRole(role);
      handleModeChange('view');
    } else {
      onClose();
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isView) return;
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const effectiveSysAdmin = canAssignSystemAdmin ? isSystemAdmin : false;
      const effectiveLevel = Math.max(1, Math.min(100, Math.round(Number(level) || 10)));

      await onSave(name.trim(), {
        name: role ? undefined : name.trim(),
        description: description.trim() || undefined,
        level: effectiveLevel,
        isSystemAdmin: effectiveSysAdmin,
        permissions: {
          ...permissions,
          apps: appPermissions,
        },
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const modalTitle =
    currentMode === 'create'
      ? t('btnCreateRole') !== 'btnCreateRole'
        ? t('btnCreateRole')
        : 'Create Role'
      : currentMode === 'edit'
      ? t('modalEditRole') !== 'modalEditRole'
        ? t('modalEditRole')
        : 'Edit Role'
      : role?.name ||
        (t('modalRoleDetails') !== 'modalRoleDetails' ? t('modalRoleDetails') : 'Role Details');

  return (
    <ViewEditModalBase
      open={open}
      onClose={onClose}
      mode={currentMode}
      onModeChange={handleModeChange}
      title={modalTitle}
      canEdit={canEdit}
      canDelete={Boolean(role && canDelete && onDeleteRole && !role.isSystemAdmin)}
      onDelete={() => {
        if (role) {
          onDeleteRole?.(role.name);
          onClose();
        }
      }}
      isSaving={isSaving}
      onSave={handleSave}
      onCancel={handleCancel}
      saveLabel={t('btnSave') !== 'btnSave' ? t('btnSave') : 'Save'}
      cancelLabel={t('btnCancel') !== 'btnCancel' ? t('btnCancel') : 'Cancel'}
      editLabel={t('btnEdit') !== 'btnEdit' ? t('btnEdit') : 'Edit'}
      maxWidth="lg"
      fullHeight
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Header Metadata */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 140px' }, gap: 2 }}>
          <ViewEditField
            mode={currentMode}
            label={t('colRoleName') !== 'colRoleName' ? t('colRoleName') : 'Role Name'}
            value={name}
            viewRender={() => (
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {name || '—'}
              </Typography>
            )}
          >
            <TextField
              label={t('colRoleName') !== 'colRoleName' ? t('colRoleName') : 'Role Name'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={Boolean(role)}
              fullWidth
              required
              size="small"
            />
          </ViewEditField>

          <ViewEditField
            mode={currentMode}
            label={t('lblRoleLevel') !== 'lblRoleLevel' ? t('lblRoleLevel') : 'Role Level'}
            value={String(level)}
            viewRender={() => (
              <Chip
                label={level}
                size="small"
                color={isSystemAdmin ? 'error' : 'default'}
              />
            )}
          >
            <TextField
              label={t('lblRoleLevel') !== 'lblRoleLevel' ? t('lblRoleLevel') : 'Role Level'}
              type="number"
              value={level}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (!Number.isNaN(val)) {
                  setLevel(Math.max(1, Math.min(100, val)));
                }
              }}
              slotProps={{ htmlInput: { min: 1, max: 100 } }}
              fullWidth
              size="small"
            />
          </ViewEditField>
        </Box>

        <ViewEditField
          mode={currentMode}
          label={t('lblDescription') !== 'lblDescription' ? t('lblDescription') : 'Description'}
          value={description}
          viewRender={() => (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {description || '—'}
            </Typography>
          )}
        >
          <TextField
            label={t('lblDescription') !== 'lblDescription' ? t('lblDescription') : 'Description'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
            size="small"
            helperText={
              t('roleLevelHelperText') !== 'roleLevelHelperText'
                ? t('roleLevelHelperText')
                : 'Hierarchy level (1–100).'
            }
          />
        </ViewEditField>

        {canAssignSystemAdmin && (
          <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isSystemAdmin}
                  onChange={(e) => !isView && setIsSystemAdmin(e.target.checked)}
                  disabled={isView}
                  color="error"
                />
              }
              label={<Typography sx={{ fontWeight: 'bold' }} color="error">{t('lblSystemAdministrator')}</Typography>}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('systemAdminWarningDesc')}
            </Typography>
          </Box>
        )}

        {!isSystemAdmin && (
          <Box>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              {t('lblPermissions') !== 'lblPermissions' ? t('lblPermissions') : 'Permissions'}
            </Typography>

            {isCatalogLoading && catalogApps.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'flex-start' }}>
                {/* Left Column: Apps List */}
                <Paper
                  variant="outlined"
                  sx={{ width: { xs: '100%', md: 230 }, flexShrink: 0, overflow: 'hidden' }}
                >
                  <List disablePadding>
                    {catalogApps.map((app) => {
                      const isSelected = currentAppDef?.id === app.id;
                      const isAllowed = appPermissions.includes(app.id);
                      const grantedCount = getAppGrantedCount(app);
                      return (
                        <ListItemButton
                          key={app.id}
                          selected={isSelected}
                          onClick={() => setSelectedAppId(app.id)}
                          sx={{
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            '&:last-child': { borderBottom: 'none' },
                            py: 1,
                            px: 1.5,
                            gap: 1,
                          }}
                        >
                          <Checkbox
                            size="small"
                            checked={isAllowed}
                            disabled={isView}
                            aria-label={t('lblAllowAccessToApp', { app: t(app.id as keyof TranslationKeys) })}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleAppAccessToggle(app.id, e.target.checked)}
                            sx={{ p: 0.5 }}
                          />
                          <ListItemIcon sx={{ minWidth: 28, color: isSelected ? 'primary.main' : 'text.secondary' }}>
                            {getAppIcon(app.id)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 500 }} noWrap>
                                {t(app.id as keyof TranslationKeys)}
                              </Typography>
                            }
                          />
                          <Chip
                            label={grantedCount}
                            size="small"
                            color={grantedCount > 0 && isAllowed ? 'primary' : 'default'}
                            variant={grantedCount > 0 && isAllowed ? 'filled' : 'outlined'}
                            sx={{ height: 20, minWidth: 26, fontSize: '0.7rem' }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Paper>

                {/* Right Column: Resources x Per-Resource Actions */}
                {currentAppDef && (
                  <TableContainer component={Paper} variant="outlined" sx={{ flex: 1, minWidth: 0 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover', borderBottom: '2px solid', borderColor: 'divider' }}>
                          <TableCell colSpan={visibleActions.length + (showOnlyOwnColumn ? 2 : 1)} sx={{ py: 1.25 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getAppIcon(currentAppDef.id)}
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                  {t(currentAppDef.id as keyof TranslationKeys)}
                                </Typography>
                              </Box>
                              <Chip
                                label={isCurrentAppAllowed ? t('badgeAppAccessEnabled') : t('badgeAppAccessDisabled')}
                                color={isCurrentAppAllowed ? 'success' : 'default'}
                                size="small"
                                variant={isCurrentAppAllowed ? 'filled' : 'outlined'}
                              />
                            </Box>
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell sx={{ minWidth: 160 }}>
                            <strong>{t('colResourceOrPage')}</strong>
                          </TableCell>
                          {visibleActions.map((action) => (
                            <TableCell key={action} align="center" sx={{ width: 78, px: 0.5 }}>
                              <strong>{t(action as keyof TranslationKeys)}</strong>
                              <br />
                              <Checkbox
                                size="small"
                                disabled={isView || !isCurrentAppAllowed}
                                checked={isActionAllSelectedForCurrentApp(action)}
                                indeterminate={isActionIndeterminateForCurrentApp(action)}
                                onChange={(e) => handleSelectAllActionForCurrentApp(action, e.target.checked)}
                              />
                            </TableCell>
                          ))}
                          {showOnlyOwnColumn && (
                            <TableCell align="center" sx={{ width: 84, px: 0.5 }}>
                              <strong style={{ color: '#ed6c02' }}>{t('permOnlyOwn')}</strong>
                            </TableCell>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody
                        sx={{
                          opacity: isCurrentAppAllowed ? 1 : 0.45,
                          pointerEvents: isView ? 'none' : isCurrentAppAllowed ? 'auto' : 'none',
                        }}
                      >
                        {currentResources.map((resource) => {
                          const onlyOwnKey = `${resource.id}_onlyOwn`;
                          const isOnlyOwnChecked = permissions[onlyOwnKey] === true;
                          const resourceActions = Array.isArray(permissions[resource.id])
                            ? permissions[resource.id]
                            : [];
                          const hasAnyAction = resourceActions.length > 0;

                          return (
                            <TableRow key={resource.id} hover={isCurrentAppAllowed && !isView}>
                              <TableCell component="th" scope="row">
                                {t(resource.id as keyof TranslationKeys)}
                              </TableCell>
                              {visibleActions.map((action) => {
                                const isSupported = resource.actions.includes(action);
                                if (!isSupported) {
                                  return (
                                    <TableCell key={action} align="center" sx={{ color: 'text.disabled', px: 0.5 }}>
                                      —
                                    </TableCell>
                                  );
                                }
                                const isChecked = resourceActions.includes(action);
                                return (
                                  <TableCell key={action} align="center" sx={{ px: 0.5 }}>
                                    <Checkbox
                                      size="small"
                                      disabled={isView || !isCurrentAppAllowed}
                                      checked={isChecked}
                                      onChange={(e) => handlePermissionChange(resource.id, action, e.target.checked)}
                                    />
                                  </TableCell>
                                );
                              })}
                              {showOnlyOwnColumn && (
                                <TableCell align="center" sx={{ color: 'text.disabled', px: 0.5 }}>
                                  {resource.supportsOnlyOwn ? (
                                    <Checkbox
                                      size="small"
                                      disabled={isView || !isCurrentAppAllowed || !hasAnyAction}
                                      checked={isOnlyOwnChecked}
                                      onChange={(e) => handleOnlyOwnChange(resource.id, e.target.checked)}
                                      color="warning"
                                    />
                                  ) : (
                                    '—'
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </Box>
        )}

        {isSystemAdmin && (
          <Alert severity="warning">
            {t('systemAdminImplicitAlert')}
          </Alert>
        )}
      </Box>
    </ViewEditModalBase>
  );
};

export default RoleModal;
