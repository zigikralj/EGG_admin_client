import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
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
  Chip
} from '@mui/material';
import { DashboardIcon, StorageIcon } from '../icons';
import type { Role } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface RoleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, data: Partial<Role>) => void;
  role: Role | null;
  canAssignSystemAdmin?: boolean;
}

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
    ],
  },
];

const ACTIONS = ['view', 'create', 'edit', 'delete'];

export const RoleModal: React.FC<RoleModalProps> = ({
  open,
  onClose,
  onSave,
  role,
  canAssignSystemAdmin = true,
}) => {
  const { t } = useLanguage();
  const isEdit = !!role;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string>('project-tracker');
  const [appPermissions, setAppPermissions] = useState<string[]>(['project-tracker', 'data-management']);
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (open) {
      if (role) {
        setName(role.name);
        setDescription(role.description || '');
        setIsSystemAdmin(role.isSystemAdmin);
        const initialPerms: Record<string, string[]> = {};
        if (role.permissions) {
          Object.entries(role.permissions).forEach(([k, v]) => {
            if (Array.isArray(v)) initialPerms[k] = [...v];
          });
        }
        setPermissions(initialPerms);
        const roleApps = role.permissions?.apps;
        if (Array.isArray(roleApps)) {
          setAppPermissions(roleApps);
        } else {
          const hasDMResources = role.permissions && Object.keys(role.permissions).some(
            (key) => ['projects', 'clients', 'permits', 'services', 'providedServices', 'categories', 'reminders', 'invoices', 'users', 'roles', 'companyInfo'].includes(key) && (role.permissions[key] || []).length > 0
          );
          if (role.name === 'User' && !hasDMResources) {
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
    }
  }, [open, role]);

  const currentAppDef = APPS.find((a) => a.id === selectedApp) || APPS[0];
  const currentResources = currentAppDef.resources;
  const isCurrentAppAllowed = appPermissions.includes(selectedApp);

  const getResourceLabel = (res: AppResource) => {
    switch (res.id) {
      case 'tracker_projects': return `${t('tabProjects')} (Dashboard)`;
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

  const handleSave = () => {
    onSave(name, {
      name: isEdit ? undefined : name,
      description,
      isSystemAdmin: canAssignSystemAdmin ? isSystemAdmin : false,
      permissions: {
        ...permissions,
        apps: appPermissions,
      },
    });
  };

  const handlePermissionChange = (resourceId: string, action: string, checked: boolean) => {
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
        newPerms[resourceId] = currentResourcePerms.filter((a) => a !== action);
      }
      return newPerms;
    });
  };

  const handleSelectAllActionForCurrentApp = (action: string, checked: boolean) => {
    setPermissions((prev) => {
      const newPerms = { ...prev };
      currentResources.forEach((res) => {
        const current = newPerms[res.id] || [];
        if (checked) {
          if (!current.includes(action)) newPerms[res.id] = [...current, action];
        } else {
          newPerms[res.id] = current.filter((a) => a !== action);
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Role' : 'Create Role'}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="Role Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isEdit}
            fullWidth
            required
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
          
          {canAssignSystemAdmin && (
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <FormControlLabel
                control={<Switch checked={isSystemAdmin} onChange={(e) => setIsSystemAdmin(e.target.checked)} color="error" />}
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
                      <TableCell colSpan={5} sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={isCurrentAppAllowed}
                                onChange={(e) => handleAppAccessToggle(selectedApp, e.target.checked)}
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
                            disabled={!isCurrentAppAllowed}
                            checked={isActionAllSelectedForCurrentApp(action)}
                            indeterminate={isActionIndeterminateForCurrentApp(action)}
                            onChange={(e) => handleSelectAllActionForCurrentApp(action, e.target.checked)}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody sx={{ opacity: isCurrentAppAllowed ? 1 : 0.45, pointerEvents: isCurrentAppAllowed ? 'auto' : 'none' }}>
                    {currentResources.map((resource) => (
                      <TableRow key={resource.id} hover={isCurrentAppAllowed}>
                        <TableCell component="th" scope="row">
                          {getResourceLabel(resource)}
                        </TableCell>
                        {ACTIONS.map((action) => {
                          const isChecked = permissions[resource.id]?.includes(action) || false;
                          return (
                            <TableCell key={action} align="center">
                              <Checkbox 
                                size="small"
                                disabled={!isCurrentAppAllowed}
                                checked={isChecked}
                                onChange={(e) => handlePermissionChange(resource.id, action, e.target.checked)}
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!name}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
