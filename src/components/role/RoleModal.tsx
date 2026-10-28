import React, { useState, useEffect, useCallback } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { DashboardIcon, StorageIcon } from '../icons';
import type { Role } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { ViewEditModalBase, type ModalMode } from '../common/modal/ViewEditModalBase';
import { ViewEditField } from '../common/modal/ViewEditField';

export interface AppResource {
  id: string;
  label: string;
}

export interface AppDefinition {
  id: string;
  name: string;
  icon: React.ReactNode;
  resources: AppResource[];
}

const APPS: AppDefinition[] = [
  {
    id: 'project-tracker',
    name: 'Project Tracker',
    icon: <DashboardIcon fontSize="small" />,
    resources: [
      { id: 'tracker_projects', label: 'Projects (Dashboard)' },
      { id: 'tracker_updates', label: 'Project Updates' },
      { id: 'tracker_reminders', label: 'Reminders' },
      { id: 'tracker_invoices', label: 'Invoices' },
      { id: 'wasteDisposal', label: 'Waste Disposal' },
      { id: 'statistics', label: 'Statistics' },
    ],
  },
  {
    id: 'data-management',
    name: 'Data Management',
    icon: <StorageIcon fontSize="small" />,
    resources: [
      { id: 'projects', label: 'Projects' },
      { id: 'clients', label: 'Clients' },
      { id: 'permits', label: 'Permits' },
      { id: 'users', label: 'Users' },
      { id: 'services', label: 'Services' },
      { id: 'providedServices', label: 'Provided Services' },
      { id: 'categories', label: 'Categories' },
      { id: 'reminders', label: 'Reminders' },
      { id: 'invoices', label: 'Invoices' },
      { id: 'roles', label: 'Roles' },
      { id: 'companyInfo', label: 'Company Information' },
      { id: 'history', label: 'Version History' },
    ],
  },
];

const ACTIONS = ['view', 'create', 'edit', 'delete'];

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
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string>('project-tracker');
  const [appPermissions, setAppPermissions] = useState<string[]>(['project-tracker', 'data-management']);
  const [permissions, setPermissions] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  const populateFromRole = useCallback((r: Role | null) => {
    if (r) {
      setName(r.name || '');
      setDescription(r.description || '');
      setIsSystemAdmin(Boolean(r.isSystemAdmin));
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
        const hasDMResources = r.permissions && Object.keys(r.permissions).some(
          (key) => ['projects', 'clients', 'permits', 'services', 'providedServices', 'categories', 'reminders', 'invoices', 'users', 'roles', 'companyInfo'].includes(key) && (r.permissions[key] || []).length > 0
        );
        if (r.name === 'User' && !hasDMResources) {
          setAppPermissions(['project-tracker']);
        } else {
          setAppPermissions(['project-tracker', 'data-management']);
        }
      }
    } else {
      setName('');
      setDescription('');
      setIsSystemAdmin(false);
      setPermissions({});
      setAppPermissions(['project-tracker', 'data-management']);
    }
    setSelectedApp('project-tracker');
  }, []);

  useEffect(() => {
    if (open) {
      populateFromRole(role);
    }
  }, [open, role, populateFromRole]);

  const currentAppDef = APPS.find((a) => a.id === selectedApp) || APPS[0];
  const currentResources = currentAppDef.resources;
  const isCurrentAppAllowed = appPermissions.includes(selectedApp);

  const getResourceLabel = (res: AppResource) => {
    switch (res.id) {
      case 'tracker_projects': return `${t('tabProjects')} (Dashboard)`;
      case 'tracker_updates': return t('subTabUpdates');
      case 'tracker_reminders': return t('tabReminders');
      case 'tracker_invoices': return t('tabInvoices');
      case 'wasteDisposal': return t('subTabWasteDisposal');
      case 'statistics': return t('subTabStatistic');
      case 'projects': return t('tabProjects');
      case 'clients': return t('tabClients');
      case 'permits': return t('tabPermits');
      case 'users': return t('tabUsers');
      case 'services': return t('tabServices');
      case 'providedServices': return t('tabProvidedServices');
      case 'categories': return t('tabCategories');
      case 'reminders': return t('tabReminders');
      case 'invoices': return t('tabInvoices');
      case 'roles': return 'Roles';
      case 'companyInfo': return t('companyInfoTitle') || 'Company Information';
      default: return res.label;
    }
  };

  const handleAppAccessToggle = (appId: string, allowed: boolean) => {
    if (isView) return;
    setAppPermissions((prev) => {
      if (allowed) {
        return prev.includes(appId) ? prev : [...prev, appId];
      } else {
        return prev.filter((id) => id !== appId);
      }
    });

    if (!allowed) {
      const appDef = APPS.find((a) => a.id === appId);
      if (appDef) {
        setPermissions((prev) => {
          const next = { ...prev };
          appDef.resources.forEach((r) => {
            next[r.id] = [];
          });
          return next;
        });
      }
    }
  };

  const handlePermissionChange = (resourceId: string, action: string, checked: boolean) => {
    if (isView) return;
    if (checked) {
      const parentApp = APPS.find((app) => app.resources.some((r) => r.id === resourceId));
      if (parentApp) {
        setAppPermissions((prev) => (prev.includes(parentApp.id) ? prev : [...prev, parentApp.id]));
      }
    }
    setPermissions((prev) => {
      const currentResourcePerms = prev[resourceId] || [];
      const newPerms = { ...prev };
      
      if (checked) {
        newPerms[resourceId] = [...currentResourcePerms, action];
      } else {
        newPerms[resourceId] = currentResourcePerms.filter((a: string) => a !== action);
      }
      return newPerms;
    });
  };

  const handleOnlyOwnChange = (resourceId: string, checked: boolean) => {
    if (isView) return;
    setPermissions((prev) => {
      const onlyOwnKey = `${resourceId}_onlyOwn`;
      const newPerms = { ...prev };
      newPerms[onlyOwnKey] = checked;
      return newPerms;
    });
  };

  const handleSelectAllActionForCurrentApp = (action: string, checked: boolean) => {
    if (isView) return;
    setPermissions((prev) => {
      const newPerms = { ...prev };
      currentResources.forEach((res) => {
        const current = newPerms[res.id] || [];
        if (checked) {
          if (!current.includes(action)) newPerms[res.id] = [...current, action];
        } else {
          newPerms[res.id] = current.filter((a: string) => a !== action);
        }
      });
      return newPerms;
    });
  };

  const isActionAllSelectedForCurrentApp = (action: string) => {
    return currentResources.length > 0 && currentResources.every((res) => permissions[res.id]?.includes(action));
  };

  const isActionIndeterminateForCurrentApp = (action: string) => {
    const someSelected = currentResources.some((res) => permissions[res.id]?.includes(action));
    const allSelected = isActionAllSelectedForCurrentApp(action);
    return someSelected && !allSelected;
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
      await onSave(name.trim(), {
        name: role ? undefined : name.trim(),
        description: description.trim() || undefined,
        isSystemAdmin: canAssignSystemAdmin ? isSystemAdmin : false,
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

  const modalTitle = currentMode === 'create'
    ? 'Create Role'
    : currentMode === 'edit'
    ? 'Edit Role'
    : (role?.name || 'Role Details');

  return (
    <ViewEditModalBase
      open={open}
      onClose={onClose}
      mode={currentMode}
      onModeChange={handleModeChange}
      title={modalTitle}
      subtitle={role?.description}
      statusChip={role ? (
        <Chip
          label={role.isSystemAdmin ? 'System Admin' : 'Custom'}
          color={role.isSystemAdmin ? 'error' : 'primary'}
          size="small"
          variant={role.isSystemAdmin ? 'filled' : 'outlined'}
        />
      ) : undefined}
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
      maxWidth="md"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <ViewEditField
          mode={currentMode}
          label="Role Name"
          value={name}
          viewRender={() => (
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {name || '—'}
            </Typography>
          )}
        >
          <TextField
            label="Role Name"
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
          label="Description"
          value={description}
          viewRender={() => (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {description || '—'}
            </Typography>
          )}
        >
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
            size="small"
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
              label={<Typography sx={{ fontWeight: 'bold' }} color="error">System Administrator</Typography>}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              System administrators bypass all permission checks and have full access to everything. Grant with caution.
            </Typography>
          </Box>
        )}

        {!isSystemAdmin && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6">Permissions</Typography>
              <FormControl size="small" sx={{ minWidth: 240 }}>
                <InputLabel id="select-app-label">Application</InputLabel>
                <Select
                  labelId="select-app-label"
                  value={selectedApp}
                  label="Application"
                  onChange={(e) => setSelectedApp(e.target.value)}
                >
                  {APPS.map((app) => {
                    const hasAccess = appPermissions.includes(app.id);
                    return (
                      <MenuItem key={app.id} value={app.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {app.icon}
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {app.name}
                            </Typography>
                          </Box>
                          {!hasAccess && (
                            <Chip label="No Access" size="small" color="default" sx={{ height: 20, fontSize: '0.65rem' }} />
                          )}
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  {/* APP LEVEL PERMISSION HEADER ROW */}
                  <TableRow sx={{ bgcolor: 'action.hover', borderBottom: '2px solid', borderColor: 'divider' }}>
                    <TableCell colSpan={6} sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isCurrentAppAllowed}
                              onChange={(e) => handleAppAccessToggle(selectedApp, e.target.checked)}
                              disabled={isView}
                              color="primary"
                            />
                          }
                          label={
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              Allow access to {currentAppDef.name}
                            </Typography>
                          }
                        />
                        <Chip
                          label={isCurrentAppAllowed ? 'App Access Enabled' : 'App Access Disabled'}
                          color={isCurrentAppAllowed ? 'success' : 'default'}
                          size="small"
                          variant={isCurrentAppAllowed ? 'filled' : 'outlined'}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>

                  {/* ACTIONS HEADER */}
                  <TableRow>
                    <TableCell sx={{ minWidth: 180 }}><strong>Resource / Page</strong></TableCell>
                    {ACTIONS.map((action) => (
                      <TableCell key={action} align="center" sx={{ width: 90 }}>
                        <strong>{action.charAt(0).toUpperCase() + action.slice(1)}</strong>
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
                    <TableCell align="center" sx={{ width: 90 }}>
                      <strong style={{ color: '#ed6c02' }}>Only Own</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody sx={{ opacity: isCurrentAppAllowed ? 1 : 0.45, pointerEvents: isView ? 'none' : isCurrentAppAllowed ? 'auto' : 'none' }}>
                  {currentResources.map((resource) => {
                    const onlyOwnKey = `${resource.id}_onlyOwn`;
                    const isOnlyOwnChecked = permissions[onlyOwnKey] === true;
                    const hasAnyAction = ACTIONS.some(a => permissions[resource.id]?.includes(a));

                    return (
                    <TableRow key={resource.id} hover={isCurrentAppAllowed && !isView}>
                      <TableCell component="th" scope="row">
                        {getResourceLabel(resource)}
                      </TableCell>
                      {ACTIONS.map((action) => {
                        const isChecked = permissions[resource.id]?.includes(action) || false;
                        
                        return (
                          <TableCell key={action} align="center">
                            <Checkbox 
                              size="small"
                              disabled={isView || !isCurrentAppAllowed}
                              checked={isChecked}
                              onChange={(e) => handlePermissionChange(resource.id, action, e.target.checked)}
                            />
                          </TableCell>
                        );
                      })}
                      <TableCell align="center">
                        <Checkbox
                          size="small"
                          disabled={isView || !isCurrentAppAllowed || !hasAnyAction}
                          checked={isOnlyOwnChecked}
                          onChange={(e) => handleOnlyOwnChange(resource.id, e.target.checked)}
                          color="warning"
                        />
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {isSystemAdmin && (
          <Alert severity="warning">
            This role is a System Administrator and will have full access implicitly. The permissions table is hidden.
          </Alert>
        )}
      </Box>
    </ViewEditModalBase>
  );
};

export default RoleModal;
