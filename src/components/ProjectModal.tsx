import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  Button,
  Grid,
  Typography,
  Box,
  Paper,
  Autocomplete,
  IconButton,
  Tooltip,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Slider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import NotesIcon from '@mui/icons-material/Notes';
import type { Project, Client, User, Service, Reminder, SaveResult, Invoice, InvoiceStatus, InvoiceCurrency } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ErrorDialog } from './ErrorDialog';
import { RichTextEditor } from './RichTextEditor';

const getProgressColor = (val: number) => {
  const clamped = Math.max(0, Math.min(100, Number(val) || 0));
  // Interpolate hue from 0 (red) to 125 (green)
  const hue = Math.round((clamped / 100) * 125);
  return `hsl(${hue}, 80%, 42%)`;
};

interface ProjectProgressSliderProps {
  value: number;
  label: string;
  onChangeCommitted: (val: number) => void;
}

const ProjectProgressSlider: React.FC<ProjectProgressSliderProps> = React.memo(({
  value,
  label,
  onChangeCommitted,
}) => {
  const [localVal, setLocalVal] = useState(value);
  const [colorVal, setColorVal] = useState(value);

  useEffect(() => {
    setLocalVal(value);
    setColorVal(value);
  }, [value]);

  const progressColor = getProgressColor(colorVal);

  return (
    <Box sx={{ px: 1, pt: 0.5 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          color: 'text.secondary',
          display: 'block',
          mb: 0.5,
        }}
      >
        {label} ({localVal}%)
      </Typography>
      <Slider
        value={localVal}
        min={0}
        max={100}
        step={1}
        valueLabelDisplay="auto"
        valueLabelFormat={(val) => `${val}%`}
        onChange={(_, val) => {
          const num = Array.isArray(val) ? val[0] : val;
          setLocalVal(num);
        }}
        onChangeCommitted={(_, val) => {
          const num = Array.isArray(val) ? val[0] : val;
          setLocalVal(num);
          setColorVal(num);
          onChangeCommitted(num);
        }}
        sx={{
          width: '100%',
          color: progressColor,
          py: 0.75,
          '& .MuiSlider-rail': {
            opacity: 0.25,
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
            height: 5,
            borderRadius: 2.5,
          },
          '& .MuiSlider-track': {
            backgroundColor: progressColor,
            borderColor: progressColor,
            height: 5,
            borderRadius: 2.5,
            transition: 'none',
          },
          '& .MuiSlider-thumb': {
            width: 16,
            height: 16,
            backgroundColor: progressColor,
            boxShadow: `0 0 0 3px ${progressColor}26`,
            transition: 'none',
            '&:hover, &.Mui-focusVisible': {
              boxShadow: `0 0 0 6px ${progressColor}33`,
            },
            '&.Mui-active': {
              boxShadow: `0 0 0 8px ${progressColor}44`,
            },
          },
          '& .MuiSlider-valueLabel': {
            backgroundColor: progressColor,
            fontWeight: 700,
            borderRadius: 1,
            fontSize: '0.75rem',
          },
        }}
      />
    </Box>
  );
});

interface Props {
  isOpen: boolean;
  projectToEdit: Project | null;
  clients: Client[];
  users: User[];
  services: Service[];
  reminders?: Reminder[];
  invoices?: Invoice[];
  onClose: () => void;
  onSave: (data: Partial<Project>) => Promise<SaveResult | void> | void;
  onDelete?: (id: string) => void;
  onToggleDone?: (id: string) => void;
  onSaveReminder?: (reminder: Partial<Reminder>) => Promise<SaveResult | void> | void;
  onDeleteReminder?: (id: string) => void;
  onStatusChangeReminder?: (id: string, status: string) => void;
  onSaveInvoice?: (invoice: Partial<Invoice>) => Promise<SaveResult | void> | void;
  onDeleteInvoice?: (id: string) => void;
  onStatusChangeInvoice?: (id: string, status: string, paymentDate?: string) => Promise<void> | void;
}

export const ProjectModal: React.FC<Props> = ({
  isOpen,
  projectToEdit,
  clients,
  users,
  services,
  reminders = [],
  invoices = [],
  onClose,
  onSave,
  onDelete,
  onSaveReminder,
  onDeleteReminder,
  onStatusChangeReminder,
  onSaveInvoice,
  onDeleteInvoice,
  onStatusChangeInvoice,
}) => {
  const { t, getServiceLabel, getResponsibleLabel } = useLanguage();
  const { currentUser, canEditProject, isUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [errorDialogState, setErrorDialogState] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  const todayStr = new Date().toISOString().slice(0, 10);

  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [responsible, setResponsible] = useState('');
  const [type, setType] = useState(services.length > 0 ? services[0].code : 'waste-management');
  const [start, setStart] = useState(todayStr);
  const [deadline, setDeadline] = useState('');
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [notes, setNotes] = useState('');

  // Project Reminders management state
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [addReminderMode, setAddReminderMode] = useState<'new' | 'existing'>('new');
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderDate, setNewReminderDate] = useState('');
  const [newReminderResponsible, setNewReminderResponsible] = useState('');
  const [newReminderNotes, setNewReminderNotes] = useState('');
  const [selectedExistingReminderId, setSelectedExistingReminderId] = useState('');

  // Editing existing reminder in list
  const [editingProjectReminder, setEditingProjectReminder] = useState<Reminder | null>(null);

  // Project Invoices management state
  const [isAddingInvoice, setIsAddingInvoice] = useState(false);
  const [addInvoiceMode, setAddInvoiceMode] = useState<'new' | 'existing'>('new');
  const [newInvoiceNumber, setNewInvoiceNumber] = useState('');
  const [newInvoiceDateCreated, setNewInvoiceDateCreated] = useState(todayStr);
  const [newInvoiceDueDate, setNewInvoiceDueDate] = useState('');
  const [newInvoiceCurrency, setNewInvoiceCurrency] = useState<InvoiceCurrency>('€');
  const [newInvoiceStatus, setNewInvoiceStatus] = useState<InvoiceStatus>('Draft');
  const [newInvoiceNotes, setNewInvoiceNotes] = useState('');
  const [newInvoiceItems, setNewInvoiceItems] = useState<{ description: string; quantity: number; unitPrice: number; currency: InvoiceCurrency }[]>([
    { description: '', quantity: 1, unitPrice: 0, currency: '€' },
  ]);
  const [selectedExistingInvoiceId, setSelectedExistingInvoiceId] = useState('');

  // Editing existing invoice in project list
  const [editingProjectInvoice, setEditingProjectInvoice] = useState<Invoice | null>(null);
  const [editInvoiceNumber, setEditInvoiceNumber] = useState('');
  const [editInvoiceDateCreated, setEditInvoiceDateCreated] = useState('');
  const [editInvoiceDueDate, setEditInvoiceDueDate] = useState('');
  const [editInvoicePaymentDate, setEditInvoicePaymentDate] = useState('');
  const [editInvoiceStatus, setEditInvoiceStatus] = useState<InvoiceStatus>('Draft');
  const [editInvoiceCurrency, setEditInvoiceCurrency] = useState<InvoiceCurrency>('€');
  const [editInvoiceNotes, setEditInvoiceNotes] = useState('');
  const [editInvoiceItems, setEditInvoiceItems] = useState<{ description: string; quantity: number; unitPrice: number; currency: InvoiceCurrency }[]>([]);

  const [editReminderTitle, setEditReminderTitle] = useState('');
  const [editReminderDate, setEditReminderDate] = useState('');
  const [editReminderStatus, setEditReminderStatus] = useState('Pending');
  const [editReminderResponsible, setEditReminderResponsible] = useState('');
  const [editReminderNotes, setEditReminderNotes] = useState('');

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setClientId(projectToEdit.clientId || '');
      setClientName(projectToEdit.clientName);
      setResponsible(projectToEdit.responsible || currentUser?.name || '');
      setType(projectToEdit.type);
      setStart(projectToEdit.start || '');
      setDeadline(projectToEdit.deadline || '');
      setProgress(projectToEdit.progress);
      setDone(projectToEdit.done || false);
      setNotes(projectToEdit.notes || '');
      setIsAddingReminder(false);
      setEditingProjectReminder(null);
      setIsAddingInvoice(false);
      setEditingProjectInvoice(null);
      setIsAddingInvoice(false);
      setEditingProjectInvoice(null);
    } else {
      const firstEligible = users.find((u) => {
        const isBlocked = u.status === 'BLOCKED' || u.status?.toLowerCase() === 'blocked' || (u.isApproved === false && u.status !== 'PENDING');
        return u.role !== 'Administrator' && !isBlocked;
      });
      setName('');
      setClientId(clients.length > 0 ? clients[0].id : '');
      setClientName(clients.length > 0 ? clients[0].name : '');
      setResponsible(isUser ? (currentUser?.name || '') : (firstEligible ? firstEligible.name : ''));
      setType(services.length > 0 ? services[0].code : 'waste-management');
      setStart(todayStr);
      setDeadline('');
      setProgress(0);
      setDone(false);
      setNotes('');
      setIsAddingReminder(false);
      setEditingProjectReminder(null);
    }
  }, [projectToEdit, isOpen, clients, users, services, currentUser, isUser, todayStr]);

  const handleClientSelectChange = (id: string) => {
    setClientId(id);
    const found = clients.find((c) => c.id === id);
    if (found) setClientName(found.name);
  };

  const projectReminders = useMemo(() => {
    if (!projectToEdit || !reminders) return [];
    return reminders.filter((r) => {
      if (r.projectId && r.projectId === projectToEdit.id) return true;
      if (!r.projectId && r.projectName && r.projectName.trim().toLowerCase() === projectToEdit.name.trim().toLowerCase()) return true;
      return false;
    });
  }, [reminders, projectToEdit]);

  const availableExistingReminders = useMemo(() => {
    if (!reminders) return [];
    const projectReminderIds = new Set(projectReminders.map((r) => r.id));
    const targetClientId = clientId || projectToEdit?.clientId;
    const targetClientName = (clientName || projectToEdit?.clientName || '').trim().toLowerCase();

    const isMatchClient = (r: Reminder) => {
      if (targetClientId && r.clientId && r.clientId === targetClientId) return true;
      if (targetClientName && r.clientName && r.clientName.trim().toLowerCase() === targetClientName) return true;
      return false;
    };

    return reminders
      .filter((r) => !projectReminderIds.has(r.id))
      .sort((a, b) => {
        const aClientMatch = isMatchClient(a);
        const bClientMatch = isMatchClient(b);

        // 1. Client matches come first
        if (aClientMatch && !bClientMatch) return -1;
        if (!aClientMatch && bClientMatch) return 1;

        // 2. Then sort by due date if available
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;

        // 3. Finally sort alphabetically by title/name
        const aTitle = a.title || a.projectName || '';
        const bTitle = b.title || b.projectName || '';
        return aTitle.localeCompare(bTitle);
      });
  }, [reminders, projectReminders, clientId, clientName, projectToEdit]);

  const handleCreateProjectReminder = () => {
    if (!newReminderTitle.trim()) {
      setErrorDialogState({
        open: true,
        message: t('alertReminderTitleRequired'),
      });
      return;
    }
    if (onSaveReminder && projectToEdit) {
      onSaveReminder({
        title: newReminderTitle.trim(),
        projectId: projectToEdit.id,
        projectName: name.trim() || projectToEdit.name,
        clientId: clientId || projectToEdit.clientId || null,
        clientName: clientName.trim() || projectToEdit.clientName,
        responsible: newReminderResponsible || responsible || null,
        dueDate: newReminderDate || null,
        notes: newReminderNotes || null,
        status: 'Pending',
      });
      setIsAddingReminder(false);
      setNewReminderTitle('');
      setNewReminderDate('');
      setNewReminderNotes('');
    }
  };

  const handleLinkExistingReminder = () => {
    if (!selectedExistingReminderId) return;
    const existing = reminders.find((r) => r.id === selectedExistingReminderId);
    if (existing && onSaveReminder && projectToEdit) {
      onSaveReminder({
        id: existing.id,
        projectId: projectToEdit.id,
        projectName: name.trim() || projectToEdit.name,
        clientId: clientId || projectToEdit.clientId || existing.clientId || null,
        clientName: clientName.trim() || projectToEdit.clientName || existing.clientName,
      });
      setIsAddingReminder(false);
      setSelectedExistingReminderId('');
    }
  };

  const handleStartEditReminder = (rem: Reminder) => {
    setEditingProjectReminder(rem);
    setEditReminderTitle(rem.title || rem.projectName || '');
    setEditReminderDate(rem.dueDate || '');
    setEditReminderStatus(rem.status || 'Pending');
    setEditReminderResponsible(rem.responsible || '');
    setEditReminderNotes(rem.notes || '');
  };


  const projectInvoices = useMemo(() => {
    if (!projectToEdit || !invoices) return [];
    return invoices.filter((inv) => {
      if (inv.projectId && inv.projectId === projectToEdit.id) return true;
      if (!inv.projectId && inv.projectName && inv.projectName.trim().toLowerCase() === projectToEdit.name.trim().toLowerCase()) return true;
      return false;
    });
  }, [invoices, projectToEdit]);

  const availableExistingInvoices = useMemo(() => {
    if (!invoices) return [];
    const projectInvoiceIds = new Set(projectInvoices.map((inv) => inv.id));
    const targetClientId = clientId || projectToEdit?.clientId;
    const targetClientName = (clientName || projectToEdit?.clientName || '').trim().toLowerCase();

    const isMatchClient = (inv: Invoice) => {
      if (targetClientId && inv.clientId && inv.clientId === targetClientId) return true;
      if (targetClientName && inv.clientName && inv.clientName.trim().toLowerCase() === targetClientName) return true;
      return false;
    };

    return invoices
      .filter((inv) => !projectInvoiceIds.has(inv.id))
      .sort((a, b) => {
        const aClientMatch = isMatchClient(a);
        const bClientMatch = isMatchClient(b);
        if (aClientMatch && !bClientMatch) return -1;
        if (!aClientMatch && bClientMatch) return 1;
        return (a.invoiceNumber || '').localeCompare(b.invoiceNumber || '');
      });
  }, [invoices, projectInvoices, clientId, clientName, projectToEdit]);

  const formatInvoiceAmount = (amount?: number | null, curr?: string | null) => {
    const val = amount || 0;
    const c = curr || '€';
    return `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`;
  };

  const handleAddNewInvoiceItem = () => {
    setNewInvoiceItems((prev) => [...prev, { description: '', quantity: 1, unitPrice: 0, currency: newInvoiceCurrency }]);
  };

  const handleRemoveNewInvoiceItem = (index: number) => {
    setNewInvoiceItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNewInvoiceItemChange = (index: number, field: string, value: any) => {
    setNewInvoiceItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const newInvoiceModalTotal = useMemo(() => {
    return newInvoiceItems.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  }, [newInvoiceItems]);

  const handleCreateProjectInvoice = async () => {
    if (!newInvoiceNumber.trim()) {
      setErrorDialogState({
        open: true,
        message: t('alertInvoiceNumberRequired'),
      });
      return;
    }
    if (onSaveInvoice && projectToEdit) {
      const validItems = newInvoiceItems
        .filter((it) => it.description.trim())
        .map((it) => ({
          description: it.description.trim(),
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          currency: it.currency || newInvoiceCurrency,
        }));

      await onSaveInvoice({
        invoiceNumber: newInvoiceNumber.trim(),
        projectId: projectToEdit.id,
        projectName: name.trim() || projectToEdit.name,
        clientId: clientId || projectToEdit.clientId || null,
        clientName: clientName.trim() || projectToEdit.clientName,
        dateCreated: newInvoiceDateCreated || todayStr,
        dueDate: newInvoiceDueDate || null,
        status: newInvoiceStatus,
        currency: newInvoiceCurrency,
        notes: newInvoiceNotes || null,
        items: validItems,
      });

      setIsAddingInvoice(false);
      setNewInvoiceNumber('');
      setNewInvoiceDateCreated(todayStr);
      setNewInvoiceDueDate('');
      setNewInvoiceNotes('');
      setNewInvoiceItems([{ description: '', quantity: 1, unitPrice: 0, currency: '€' }]);
    }
  };

  const handleLinkExistingInvoice = async () => {
    if (!selectedExistingInvoiceId) return;
    const existing = invoices?.find((inv) => inv.id === selectedExistingInvoiceId);
    if (existing && onSaveInvoice && projectToEdit) {
      await onSaveInvoice({
        id: existing.id,
        projectId: projectToEdit.id,
        projectName: name.trim() || projectToEdit.name,
        clientId: clientId || projectToEdit.clientId || existing.clientId || null,
        clientName: clientName.trim() || projectToEdit.clientName || existing.clientName,
      });
      setIsAddingInvoice(false);
      setSelectedExistingInvoiceId('');
    }
  };

  const handleUnlinkInvoice = async (invoiceId: string) => {
    if (onSaveInvoice) {
      await onSaveInvoice({
        id: invoiceId,
        projectId: null,
        projectName: null,
      });
    }
  };

  const handleStartEditInvoice = (inv: Invoice) => {
    setEditingProjectInvoice(inv);
    setEditInvoiceNumber(inv.invoiceNumber || '');
    setEditInvoiceDateCreated(inv.dateCreated || '');
    setEditInvoiceDueDate(inv.dueDate || '');
    setEditInvoicePaymentDate(inv.paymentDate || '');
    setEditInvoiceStatus((inv.status as InvoiceStatus) || 'Draft');
    setEditInvoiceCurrency((inv.currency as InvoiceCurrency) || '€');
    setEditInvoiceNotes(inv.notes || '');
    setEditInvoiceItems(
      inv.items && inv.items.length > 0
        ? inv.items.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            currency: (it.currency as InvoiceCurrency) || (inv.currency as InvoiceCurrency) || '€',
          }))
        : [{ description: '', quantity: 1, unitPrice: 0, currency: (inv.currency as InvoiceCurrency) || '€' }]
    );
  };

  const handleSaveEditedInvoice = async () => {
    if (!editInvoiceNumber.trim()) {
      setErrorDialogState({
        open: true,
        message: t('alertInvoiceNumberRequired'),
      });
      return;
    }
    if (onSaveInvoice && editingProjectInvoice && projectToEdit) {
      const validItems = editInvoiceItems
        .filter((it) => it.description.trim())
        .map((it) => ({
          description: it.description.trim(),
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          currency: it.currency || editInvoiceCurrency,
        }));

      await onSaveInvoice({
        id: editingProjectInvoice.id,
        invoiceNumber: editInvoiceNumber.trim(),
        dateCreated: editInvoiceDateCreated || null,
        dueDate: editInvoiceDueDate || null,
        paymentDate: editInvoicePaymentDate || null,
        status: editInvoiceStatus,
        currency: editInvoiceCurrency,
        notes: editInvoiceNotes || null,
        items: validItems,
      });
      setEditingProjectInvoice(null);
    }
  };

  const getInvoiceStatusChip = (status?: string) => {
    switch (status) {
      case 'Paid':
        return <Chip label={t('statusPaid')} color="success" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, px: 0.25 }} />;
      case 'Sent':
        return <Chip label={t('statusSent')} color="info" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, px: 0.25 }} />;
      case 'Overdue':
        return <Chip label={t('statusOverdue')} color="error" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, px: 0.25 }} />;
      case 'Cancelled':
        return <Chip label={t('statusCancelled')} color="default" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, px: 0.25 }} />;
      case 'Draft':
      default:
        return <Chip label={t('statusDraft')} color="warning" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, px: 0.25 }} />;
    }
  };

  const handleSaveEditedReminder = () => {
    if (!editReminderTitle.trim()) {
      setErrorDialogState({
        open: true,
        message: t('alertReminderTitleRequired'),
      });
      return;
    }
    if (onSaveReminder && editingProjectReminder && projectToEdit) {
      onSaveReminder({
        id: editingProjectReminder.id,
        title: editReminderTitle.trim(),
        projectId: projectToEdit.id,
        projectName: name.trim() || projectToEdit.name,
        clientId: clientId || projectToEdit.clientId || null,
        clientName: clientName.trim() || projectToEdit.clientName,
        responsible: editReminderResponsible || null,
        dueDate: editReminderDate || null,
        status: editReminderStatus || 'Pending',
        notes: editReminderNotes || null,
      });
      setEditingProjectReminder(null);
    }
  };

  const getStatusChip = (st?: string) => {
    if (!st) return null;
    switch (st.toLowerCase()) {
      case 'completed':
      case 'završeno':
      case 'завршено':
        return <Chip label={t('statusCompleted')} color="success" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, px: 0.25 }} />;
      case 'in progress':
      case 'u toku':
      case 'у току':
        return <Chip label={t('statusInProgress')} color="info" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, px: 0.25 }} />;
      case 'overdue':
      case 'prekoračeno':
      case 'прекорачено':
      case 'kasni':
      case 'касни':
        return <Chip label={t('statusOverdue')} color="error" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, px: 0.25 }} />;
      case 'pending':
      case 'na čekanju':
      case 'на чекању':
      default:
        return <Chip label={t('statusPending')} color="warning" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, px: 0.25 }} />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || (!clientName.trim() && !clientId)) {
      setErrorDialogState({
        open: true,
        message: t('alertProjectValidation'),
      });
      return;
    }

    const finalResponsible = isUser ? (currentUser?.name || responsible) : responsible;
    const finalProgress = done ? 100 : Math.max(0, Math.min(100, Number(progress) || 0));

    setIsSaving(true);
    try {
      const res = await onSave({
        ...(projectToEdit ? { id: projectToEdit.id } : {}),
        name: name.trim(),
        clientId: clientId || null,
        clientName: clientName.trim(),
        responsible: finalResponsible.trim() || null,
        type,
        start: start || null,
        deadline: deadline || null,
        progress: finalProgress,
        done,
        notes: notes.trim() || null,
      });

      if (res && typeof res === 'object' && 'success' in res) {
        if (res.success) {
          onClose();
        } else {
          setErrorDialogState({
            open: true,
            message: res.error || t('errorSavingProject'),
          });
        }
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorDialogState({
        open: true,
        message: err?.message || t('errorSavingProject'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const isEditable = projectToEdit ? canEditProject(projectToEdit) : true;

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            component: 'form',
            onSubmit: handleSubmit,
            sx: {
              maxHeight: 'calc(100% - 64px)',
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {projectToEdit ? t('modalEditProject') : t('modalNewProject')}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {isEditable && (
              <Button
                color={done ? 'success' : 'inherit'}
                variant={done ? 'contained' : 'outlined'}
                size="small"
                onClick={() => {
                  const newDone = !done;
                  setDone(newDone);
                  if (newDone) setProgress(100);
                }}
                startIcon={
                  <Checkbox
                    checked={done}
                    size="small"
                    sx={{
                      p: 0,
                      color: done ? 'inherit' : 'action.active',
                      '&.Mui-checked': { color: 'inherit' },
                    }}
                    tabIndex={-1}
                  />
                }
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 1.5,
                  px: 1.5,
                  bgcolor: done ? 'success.main' : 'transparent',
                  color: done ? 'success.contrastText' : 'text.primary',
                  borderColor: done ? 'success.main' : 'divider',
                  '&:hover': {
                    bgcolor: done ? 'success.dark' : 'action.hover',
                    borderColor: done ? 'success.dark' : 'text.secondary',
                  },
                }}
              >
                {t('btnMarkDone')}
              </Button>
            )}

            {projectToEdit && isEditable && onDelete && (
              <Button
                color="error"
                variant="outlined"
                size="small"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  onDelete(projectToEdit.id);
                  onClose();
                }}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
              >
                {t('btnDelete')}
              </Button>
            )}

            <IconButton
              size="small"
              onClick={onClose}
              sx={{ color: 'text.secondary', ml: 0.5 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

          <DialogContent dividers sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              {/* PROJECT NAME */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('lblProjectName')}
                  placeholder={t('phProjectName')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  variant="outlined"
                  size="small"
                />
              </Grid>

              {/* CLIENT */}
              <Grid size={{ xs: 12, sm: 6 }}>
                {clients.length > 0 ? (
                  <Autocomplete
                    size="small"
                    options={clients}
                    getOptionLabel={(option) => `${option.name}${option.city ? ` (${option.city})` : ''}`}
                    value={clients.find((c) => c.id === clientId) || null}
                    onChange={(_, newValue) => {
                      if (newValue) {
                        handleClientSelectChange(newValue.id);
                      }
                    }}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('lblClient')}
                        required
                      />
                    )}
                  />
                ) : (
                  <TextField
                    fullWidth
                    label={t('lblClient')}
                    placeholder={t('phClient')}
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    size="small"
                  />
                )}
              </Grid>

              {/* RESPONSIBLE */}
              <Grid size={{ xs: 12, sm: 6 }}>
                {(() => {
                  const respLabel = getResponsibleLabel(responsible || (isUser ? currentUser?.name : ''), users);
                  const selectableUsers = users.filter((u) => {
                    const isSelected = Boolean(responsible) && u.name.trim().toLowerCase() === responsible.trim().toLowerCase();
                    if (isSelected) return true;
                    const isBlocked = u.status === 'BLOCKED' || u.status?.toLowerCase() === 'blocked' || (u.isApproved === false && u.status !== 'PENDING');
                    if (isBlocked) return false;
                    if (u.role === 'Administrator') return false;
                    return true;
                  });
                  return isUser ? (
                    <TextField
                      fullWidth
                      label={respLabel}
                      value={currentUser?.name || ''}
                      disabled
                      size="small"
                    />
                  ) : users.length > 0 ? (
                    <Autocomplete
                      key={respLabel}
                      size="small"
                      options={selectableUsers}
                      getOptionLabel={(u) => {
                        const isMe = currentUser?.name && u.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
                        return `${isMe ? `${t('lblMe')} (${u.name})` : u.name} (${u.role})`;
                      }}
                      value={selectableUsers.find((u) => u.name === responsible) || null}
                      onChange={(_, newValue) => {
                        setResponsible(newValue ? newValue.name : '');
                      }}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={respLabel}
                        />
                      )}
                    />
                  ) : (
                    <TextField
                      fullWidth
                      label={respLabel}
                      placeholder={t('phResponsiblePerson')}
                      value={responsible}
                      onChange={(e) => setResponsible(e.target.value)}
                      size="small"
                    />
                  );
                })()}
              </Grid>

              {/* SERVICE TYPE */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Autocomplete
                  size="small"
                  options={services}
                  getOptionLabel={(option) => option.name || getServiceLabel(option.code, services)}
                  value={services.find((s) => s.code === type) || null}
                  onChange={(_, newValue) => {
                    if (newValue) {
                      setType(newValue.code);
                    }
                  }}
                  isOptionEqualToValue={(option, value) => option.code === value.code}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('lblService')}
                    />
                  )}
                />
              </Grid>

              {/* DATES */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('lblStartDate')}
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('lblDeadlineDate')}
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  size="small"
                />
              </Grid>

              {/* PROGRESS (100% WIDTH SLIDER) */}
              <Grid size={{ xs: 12 }}>
                <ProjectProgressSlider
                  value={progress}
                  label={t('progress')}
                  onChangeCommitted={(val) => {
                    setProgress(val);
                    if (val >= 100) setDone(true);
                    else if (val < 100 && done) setDone(false);
                  }}
                />
              </Grid>

              {/* REMINDERS SECTION */}
              <Grid size={{ xs: 12 }}>
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default", borderRadius: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1, gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <NotificationsActiveIcon color="warning" sx={{ fontSize: 16 }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" }}>
                        {t("reminderBoxTitle")}
                      </Typography>
                    </Box>
                    {projectToEdit && (
                      <Button
                        size="small"
                        variant={isAddingReminder ? "outlined" : "contained"}
                        color={isAddingReminder ? "inherit" : "primary"}
                        startIcon={isAddingReminder ? <CloseIcon sx={{ fontSize: 14 }} /> : <AddIcon sx={{ fontSize: 14 }} />}
                        onClick={() => {
                          setIsAddingReminder(!isAddingReminder);
                          setAddReminderMode("new");
                          setNewReminderTitle("");
                          setNewReminderDate("");
                          setNewReminderResponsible(responsible || currentUser?.name || "");
                          setNewReminderNotes("");
                          setSelectedExistingReminderId("");
                        }}
                        sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.75rem", py: 0.25, px: 1, minHeight: 28, borderRadius: 1 }}
                      >
                        {isAddingReminder ? t("btnCancel") : t("btnAddReminder")}
                      </Button>
                    )}
                  </Box>

                  {/* ADD REMINDER PANEL */}
                  {isAddingReminder && (
                    <Box sx={{ mb: 1.5, p: 1.5, bgcolor: "background.paper", borderRadius: 1.5, border: "1px solid", borderColor: "divider" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
                        <ToggleButtonGroup
                          size="small"
                          value={addReminderMode}
                          exclusive
                          onChange={(_, val) => {
                            if (val) setAddReminderMode(val);
                          }}
                          color="primary"
                        >
                          <ToggleButton value="new" sx={{ textTransform: "none", fontWeight: 600, px: 1.5, py: 0.25, fontSize: "0.75rem" }}>
                            {t("btnCreateNewReminder")}
                          </ToggleButton>
                          <ToggleButton value="existing" sx={{ textTransform: "none", fontWeight: 600, px: 1.5, py: 0.25, fontSize: "0.75rem" }}>
                            {t("btnLinkExistingReminder")}
                          </ToggleButton>
                        </ToggleButtonGroup>
                      </Box>

                      {addReminderMode === "new" ? (
                        <Grid container spacing={1.5}>
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label={t("lblReminderTitle")}
                              placeholder={t("phReminderTitle")}
                              value={newReminderTitle}
                              onChange={(e) => setNewReminderTitle(e.target.value)}
                              required
                              autoFocus
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              size="small"
                              type="date"
                              label={t("lblDueDate")}
                              slotProps={{ inputLabel: { shrink: true } }}
                              value={newReminderDate}
                              onChange={(e) => setNewReminderDate(e.target.value)}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            {(() => {
                              const respLabel = getResponsibleLabel(newReminderResponsible, users);
                              const selectableUsers = users.filter((u) => {
                                const isSelected = Boolean(newReminderResponsible) && u.name.trim().toLowerCase() === newReminderResponsible.trim().toLowerCase();
                                if (isSelected) return true;
                                const isBlocked = u.status === "BLOCKED" || u.status?.toLowerCase() === "blocked" || (u.isApproved === false && u.status !== "PENDING");
                                if (isBlocked) return false;
                                if (u.role === "Administrator") return false;
                                return true;
                              });
                              return (
                                <Autocomplete
                                  freeSolo
                                  size="small"
                                  options={selectableUsers}
                                  getOptionLabel={(u) => (typeof u === "string" ? u : u.name)}
                                  value={newReminderResponsible}
                                  onChange={(_, val) => {
                                    if (typeof val === "string") setNewReminderResponsible(val);
                                    else if (val) setNewReminderResponsible(val.name);
                                    else setNewReminderResponsible("");
                                  }}
                                  onInputChange={(_, val, reason) => {
                                    if (reason === "input") setNewReminderResponsible(val);
                                  }}
                                  renderInput={(params) => <TextField {...params} label={respLabel} />}
                                />
                              );
                            })()}
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label={t("lblNotes")}
                              value={newReminderNotes}
                              onChange={(e) => setNewReminderNotes(e.target.value)}
                              multiline
                              rows={2}
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }} sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 0.5 }}>
                            <Button size="small" variant="outlined" color="inherit" onClick={() => setIsAddingReminder(false)}>
                              {t("btnCancel")}
                            </Button>
                            <Button size="small" variant="contained" color="primary" onClick={handleCreateProjectReminder}>
                              {t("btnAddReminder")}
                            </Button>
                          </Grid>
                        </Grid>
                      ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                          <Autocomplete
                            size="small"
                            options={availableExistingReminders}
                            groupBy={(r) => {
                              const targetClientId = clientId || projectToEdit?.clientId;
                              const targetClientName = (clientName || projectToEdit?.clientName || "").trim().toLowerCase();
                              const isMatch =
                                Boolean(targetClientId && r.clientId === targetClientId) ||
                                Boolean(targetClientName && r.clientName && r.clientName.trim().toLowerCase() === targetClientName);
                              return isMatch ? `${t("colClient")}: ${clientName || projectToEdit?.clientName || ""}` : t("other");
                            }}
                            getOptionLabel={(r) =>
                              `${r.title || r.projectName || t("tabReminders")}${r.dueDate ? ` (${r.dueDate})` : ""}${r.clientName ? ` - ${r.clientName}` : ""}`
                            }
                            value={availableExistingReminders.find((r) => r.id === selectedExistingReminderId) || null}
                            onChange={(_, val) => setSelectedExistingReminderId(val ? val.id : "")}
                            renderOption={(props, r) => {
                              const { key, ...otherProps } = props as any;
                              const targetClientId = clientId || projectToEdit?.clientId;
                              const targetClientName = (clientName || projectToEdit?.clientName || "").trim().toLowerCase();
                              const isMatch =
                                Boolean(targetClientId && r.clientId === targetClientId) ||
                                Boolean(targetClientName && r.clientName && r.clientName.trim().toLowerCase() === targetClientName);

                              return (
                                <li key={key || r.id} {...otherProps}>
                                  <Box sx={{ display: "flex", flexDirection: "column", width: "100%", py: 0.5 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: isMatch ? 700 : 500 }}>
                                        {r.title || r.projectName || "—"}
                                      </Typography>
                                      {isMatch && (
                                        <Chip
                                          label={t("colClient")}
                                          size="small"
                                          color="primary"
                                          variant="outlined"
                                          sx={{ height: 18, fontSize: "0.65rem", fontWeight: 600 }}
                                        />
                                      )}
                                    </Box>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary", fontSize: "0.75rem", mt: 0.25 }}>
                                      {r.clientName && <span>{r.clientName}</span>}
                                      {r.dueDate && <span>• {r.dueDate}</span>}
                                      {r.status && <span>• {r.status}</span>}
                                    </Box>
                                  </Box>
                                </li>
                              );
                            }}
                            renderInput={(params) => (
                              <TextField {...params} placeholder={t("phSelectExistingReminder")} label={t("tabReminders")} />
                            )}
                          />
                          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                            <Button size="small" variant="outlined" color="inherit" onClick={() => setIsAddingReminder(false)}>
                              {t("btnCancel")}
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              disabled={!selectedExistingReminderId}
                              onClick={handleLinkExistingReminder}
                            >
                              {t("btnLink")}
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* LIST OF PROJECT REMINDERS */}
                  {projectToEdit ? (
                    projectReminders.length === 0 && !isAddingReminder ? (
                      <Typography variant="caption" color="text.secondary" sx={{ py: 0.5, display: "block", textAlign: "center" }}>
                        {t("noProjectReminders")}
                      </Typography>
                    ) : (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                        {projectReminders.map((rem) => {
                          const isCompleted =
                            rem.status?.toLowerCase() === "completed" || rem.status === "Završeno" || rem.status === "Завршено";
                          return (
                            <Box
                              key={rem.id}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 1,
                                py: 0.5,
                                px: 1,
                                bgcolor: "background.paper",
                                borderRadius: 1,
                                border: "1px solid",
                                borderColor: "divider",
                                opacity: isCompleted ? 0.75 : 1,
                                transition: "all 0.15s ease",
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flex: 1, overflow: "hidden" }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 600,
                                    fontSize: "0.8125rem",
                                    textDecoration: isCompleted ? "line-through" : "none",
                                    color: isCompleted ? "text.secondary" : "text.primary",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    flexShrink: 1,
                                  }}
                                >
                                  {rem.title || rem.projectName || "—"}
                                </Typography>
                                <Box sx={{ flexShrink: 0 }}>{getStatusChip(rem.status)}</Box>
                                {rem.dueDate && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: "flex", alignItems: "center", gap: 0.25, flexShrink: 0, fontSize: "0.725rem" }}
                                  >
                                    <CalendarTodayIcon sx={{ fontSize: "0.75rem" }} />
                                    {rem.dueDate}
                                  </Typography>
                                )}
                                {rem.responsible && (
                                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontSize: "0.725rem" }}>
                                    • {rem.responsible}
                                  </Typography>
                                )}
                              </Box>

                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, flexShrink: 0 }}>
                                <Tooltip title={isCompleted ? t("statusPending") : t("statusCompleted")}>
                                  <IconButton
                                    size="small"
                                    color={isCompleted ? "default" : "success"}
                                    onClick={() => {
                                      if (onStatusChangeReminder) {
                                        onStatusChangeReminder(rem.id, isCompleted ? "Pending" : "Completed");
                                      } else if (onSaveReminder) {
                                        onSaveReminder({ id: rem.id, status: isCompleted ? "Pending" : "Completed" });
                                      }
                                    }}
                                    sx={{ p: 0.25 }}
                                  >
                                    <CheckIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={t("btnEdit")}>
                                  <IconButton size="small" color="primary" onClick={() => handleStartEditReminder(rem)} sx={{ p: 0.25 }}>
                                    <EditIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                                {onDeleteReminder && (
                                  <Tooltip title={t("btnDelete")}>
                                    <IconButton size="small" color="error" onClick={() => onDeleteReminder(rem.id)} sx={{ p: 0.25 }}>
                                      <DeleteIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    )
                  ) : (
                    <Typography variant="caption" color="text.secondary" sx={{ py: 0.5, display: "block", textAlign: "center" }}>
                      {t("newProjectRemindersHint")}
                    </Typography>
                  )}
                </Paper>
              </Grid>

              {/* INVOICES SECTION */}
              <Grid size={{ xs: 12 }}>
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default", borderRadius: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1, gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <ReceiptLongIcon color="primary" sx={{ fontSize: 16 }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" }}>
                        {t("invoiceBoxTitle")}
                      </Typography>
                    </Box>
                    {projectToEdit && (
                      <Button
                        size="small"
                        variant={isAddingInvoice ? "outlined" : "contained"}
                        color={isAddingInvoice ? "inherit" : "primary"}
                        startIcon={isAddingInvoice ? <CloseIcon sx={{ fontSize: 14 }} /> : <AddIcon sx={{ fontSize: 14 }} />}
                        onClick={() => {
                          setIsAddingInvoice(!isAddingInvoice);
                          setAddInvoiceMode("new");
                          setNewInvoiceNumber("");
                          setNewInvoiceDateCreated(todayStr);
                          setNewInvoiceDueDate("");
                          setNewInvoiceCurrency("€");
                          setNewInvoiceStatus("Draft");
                          setNewInvoiceNotes("");
                          setNewInvoiceItems([{ description: "", quantity: 1, unitPrice: 0, currency: "€" }]);
                          setSelectedExistingInvoiceId("");
                        }}
                        sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.75rem", py: 0.25, px: 1, minHeight: 28, borderRadius: 1 }}
                      >
                        {isAddingInvoice ? t("btnCancel") : t("btnAddInvoice")}
                      </Button>
                    )}
                  </Box>

                  {/* ADD / LINK INVOICE PANEL */}
                  {isAddingInvoice && (
                    <Box sx={{ mb: 1.5, p: 1.5, bgcolor: "background.paper", borderRadius: 1.5, border: "1px solid", borderColor: "divider" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
                        <ToggleButtonGroup
                          size="small"
                          value={addInvoiceMode}
                          exclusive
                          onChange={(_, val) => {
                            if (val) setAddInvoiceMode(val);
                          }}
                          color="primary"
                        >
                          <ToggleButton value="new" sx={{ textTransform: "none", fontWeight: 600, px: 1.5, py: 0.25, fontSize: "0.75rem" }}>
                            {t("btnCreateNewInvoice")}
                          </ToggleButton>
                          <ToggleButton value="existing" sx={{ textTransform: "none", fontWeight: 600, px: 1.5, py: 0.25, fontSize: "0.75rem" }}>
                            {t("btnLinkExistingInvoice")}
                          </ToggleButton>
                        </ToggleButtonGroup>
                      </Box>

                      {addInvoiceMode === "new" ? (
                        <Grid container spacing={1.5}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label={t("lblInvoiceNumber")}
                              placeholder={t("phInvoiceNumber")}
                              value={newInvoiceNumber}
                              onChange={(e) => setNewInvoiceNumber(e.target.value)}
                              required
                              autoFocus
                            />
                          </Grid>
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <FormControl fullWidth size="small">
                              <InputLabel>{t("lblInvoiceStatus")}</InputLabel>
                              <Select
                                value={newInvoiceStatus}
                                label={t("lblInvoiceStatus")}
                                onChange={(e) => setNewInvoiceStatus(e.target.value as InvoiceStatus)}
                              >
                                <MenuItem value="Draft">{t("statusDraft")}</MenuItem>
                                <MenuItem value="Sent">{t("statusSent")}</MenuItem>
                                <MenuItem value="Paid">{t("statusPaid")}</MenuItem>
                                <MenuItem value="Overdue">{t("statusOverdue")}</MenuItem>
                                <MenuItem value="Cancelled">{t("statusCancelled")}</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <FormControl fullWidth size="small">
                              <InputLabel>{t("lblCurrency")}</InputLabel>
                              <Select
                                value={newInvoiceCurrency}
                                label={t("lblCurrency")}
                                onChange={(e) => {
                                  const c = e.target.value as InvoiceCurrency;
                                  setNewInvoiceCurrency(c);
                                  setNewInvoiceItems((prev) => prev.map((it) => ({ ...it, currency: c })));
                                }}
                              >
                                <MenuItem value="€">€ (Euro)</MenuItem>
                                <MenuItem value="RSD">RSD (Dinar)</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              size="small"
                              type="date"
                              label={t("lblDateCreated")}
                              slotProps={{ inputLabel: { shrink: true } }}
                              value={newInvoiceDateCreated}
                              onChange={(e) => setNewInvoiceDateCreated(e.target.value)}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              size="small"
                              type="date"
                              label={t("lblDueDate")}
                              slotProps={{ inputLabel: { shrink: true } }}
                              value={newInvoiceDueDate}
                              onChange={(e) => setNewInvoiceDueDate(e.target.value)}
                            />
                          </Grid>

                          {/* Item lines in creation */}
                          <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                {t("invoiceItemsSection")}
                              </Typography>
                              <Button size="small" startIcon={<AddIcon />} onClick={handleAddNewInvoiceItem} sx={{ fontSize: "0.75rem" }}>
                                {t("btnAddInvoiceItem")}
                              </Button>
                            </Box>

                            {newInvoiceItems.map((item, idx) => (
                              <Box key={idx} sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1 }}>
                                <TextField
                                  size="small"
                                  placeholder={t("lblItemDescription")}
                                  value={item.description}
                                  onChange={(e) => handleNewInvoiceItemChange(idx, "description", e.target.value)}
                                  sx={{ flexGrow: 1 }}
                                />
                                <TextField
                                  size="small"
                                  type="number"
                                  placeholder={t("lblItemQuantity")}
                                  slotProps={{ htmlInput: { min: 0.01, step: "any" } }}
                                  value={item.quantity}
                                  onChange={(e) => handleNewInvoiceItemChange(idx, "quantity", parseFloat(e.target.value) || 0)}
                                  sx={{ width: 80 }}
                                />
                                <TextField
                                  size="small"
                                  type="number"
                                  placeholder={t("lblItemUnitPrice")}
                                  slotProps={{ htmlInput: { min: 0, step: "any" } }}
                                  value={item.unitPrice}
                                  onChange={(e) => handleNewInvoiceItemChange(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                                  sx={{ width: 100 }}
                                />
                                <Typography variant="caption" sx={{ minWidth: 70, fontWeight: 700, textAlign: "right" }}>
                                  {formatInvoiceAmount(item.quantity * item.unitPrice, item.currency || newInvoiceCurrency)}
                                </Typography>
                                {newInvoiceItems.length > 1 && (
                                  <IconButton size="small" color="error" onClick={() => handleRemoveNewInvoiceItem(idx)}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Box>
                            ))}
                            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 0.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                {t("colTotalAmount")}:
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: "primary.main" }}>
                                {formatInvoiceAmount(newInvoiceModalTotal, newInvoiceCurrency)}
                              </Typography>
                            </Box>
                          </Grid>

                          <Grid size={{ xs: 12 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label={t("lblNotes")}
                              value={newInvoiceNotes}
                              onChange={(e) => setNewInvoiceNotes(e.target.value)}
                              multiline
                              rows={2}
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }} sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 0.5 }}>
                            <Button size="small" variant="outlined" color="inherit" onClick={() => setIsAddingInvoice(false)}>
                              {t("btnCancel")}
                            </Button>
                            <Button size="small" variant="contained" color="primary" onClick={handleCreateProjectInvoice}>
                              {t("btnAddInvoice")}
                            </Button>
                          </Grid>
                        </Grid>
                      ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                          <Autocomplete
                            size="small"
                            options={availableExistingInvoices}
                            groupBy={(inv) => {
                              const targetClientId = clientId || projectToEdit?.clientId;
                              const targetClientName = (clientName || projectToEdit?.clientName || "").trim().toLowerCase();
                              const isMatch =
                                Boolean(targetClientId && inv.clientId === targetClientId) ||
                                Boolean(targetClientName && inv.clientName && inv.clientName.trim().toLowerCase() === targetClientName);
                              return isMatch ? `${t("colClient")}: ${clientName || projectToEdit?.clientName || ""}` : t("other");
                            }}
                            getOptionLabel={(inv) =>
                              `${inv.invoiceNumber}${inv.totalAmount ? ` (${formatInvoiceAmount(inv.totalAmount, inv.currency)})` : ""}${inv.clientName ? ` - ${inv.clientName}` : ""}`
                            }
                            value={availableExistingInvoices.find((inv) => inv.id === selectedExistingInvoiceId) || null}
                            onChange={(_, val) => setSelectedExistingInvoiceId(val ? val.id : "")}
                            renderOption={(props, inv) => {
                              const { key, ...otherProps } = props as any;
                              const targetClientId = clientId || projectToEdit?.clientId;
                              const targetClientName = (clientName || projectToEdit?.clientName || "").trim().toLowerCase();
                              const isMatch =
                                Boolean(targetClientId && inv.clientId === targetClientId) ||
                                Boolean(targetClientName && inv.clientName && inv.clientName.trim().toLowerCase() === targetClientName);

                              return (
                                <li key={key || inv.id} {...otherProps}>
                                  <Box sx={{ display: "flex", flexDirection: "column", width: "100%", py: 0.5 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: isMatch ? 700 : 500 }}>
                                        {inv.invoiceNumber}
                                      </Typography>
                                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                        {getInvoiceStatusChip(inv.status)}
                                        {isMatch && (
                                          <Chip
                                            label={t("colClient")}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                            sx={{ height: 18, fontSize: "0.65rem", fontWeight: 600 }}
                                          />
                                        )}
                                      </Box>
                                    </Box>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary", fontSize: "0.75rem", mt: 0.25 }}>
                                      {inv.clientName && <span>{inv.clientName}</span>}
                                      <span>• {formatInvoiceAmount(inv.totalAmount, inv.currency)}</span>
                                      {inv.dueDate && <span>• {inv.dueDate}</span>}
                                    </Box>
                                  </Box>
                                </li>
                              );
                            }}
                            renderInput={(params) => (
                              <TextField {...params} placeholder={t("phSelectExistingInvoice")} label={t("tabInvoices")} />
                            )}
                          />
                          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                            <Button size="small" variant="outlined" color="inherit" onClick={() => setIsAddingInvoice(false)}>
                              {t("btnCancel")}
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              disabled={!selectedExistingInvoiceId}
                              onClick={handleLinkExistingInvoice}
                            >
                              {t("btnLink")}
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* LIST OF PROJECT INVOICES */}
                  {projectToEdit ? (
                    projectInvoices.length === 0 && !isAddingInvoice ? (
                      <Typography variant="caption" color="text.secondary" sx={{ py: 0.5, display: "block", textAlign: "center" }}>
                        {t("noProjectInvoices")}
                      </Typography>
                    ) : (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                        {projectInvoices.map((inv) => {
                          const isPaid = inv.status === "Paid";
                          return (
                            <Box
                              key={inv.id}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 1,
                                py: 0.5,
                                px: 1,
                                bgcolor: "background.paper",
                                borderRadius: 1,
                                border: "1px solid",
                                borderColor: "divider",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flex: 1, overflow: "hidden" }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: "0.8125rem",
                                    color: "primary.main",
                                    flexShrink: 0,
                                  }}
                                >
                                  {inv.invoiceNumber}
                                </Typography>
                                <Box sx={{ flexShrink: 0 }}>{getInvoiceStatusChip(inv.status)}</Box>
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.8125rem", flexShrink: 0 }}>
                                  {formatInvoiceAmount(inv.totalAmount, inv.currency)}
                                </Typography>
                                {inv.dueDate && (
                                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontSize: "0.725rem" }}>
                                    • {inv.dueDate}
                                  </Typography>
                                )}
                                {inv.items && inv.items.length > 0 && (
                                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontSize: "0.725rem" }}>
                                    ({inv.items.length} {t("colItemsCount").toLowerCase()})
                                  </Typography>
                                )}
                              </Box>

                              {/* ACTIONS */}
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, flexShrink: 0 }}>
                                {!isPaid && onStatusChangeInvoice && (
                                  <Tooltip title={t("markAsPaid")}>
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={() => onStatusChangeInvoice(inv.id, "Paid", new Date().toISOString().slice(0, 10))}
                                      sx={{ p: 0.25 }}
                                    >
                                      <CheckCircleIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title={t("btnEdit")}>
                                  <IconButton size="small" color="primary" onClick={() => handleStartEditInvoice(inv)} sx={{ p: 0.25 }}>
                                    <EditIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={t("btnUnlinkInvoice")}>
                                  <IconButton size="small" color="warning" onClick={() => handleUnlinkInvoice(inv.id)} sx={{ p: 0.25 }}>
                                    <LinkOffIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                                {onDeleteInvoice && (
                                  <Tooltip title={t("btnDelete")}>
                                    <IconButton size="small" color="error" onClick={() => onDeleteInvoice(inv.id)} sx={{ p: 0.25 }}>
                                      <DeleteIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    )
                  ) : (
                    <Typography variant="caption" color="text.secondary" sx={{ py: 0.5, display: "block", textAlign: "center" }}>
                      {t("newProjectInvoicesHint")}
                    </Typography>
                  )}
                </Paper>
              </Grid>

              {/* PROJECT NOTES RICH TEXT EDITOR */}
              <Grid size={{ xs: 12 }}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <NotesIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {t('lblProjectNotes')}
                    </Typography>
                  </Box>
                  <RichTextEditor
                    value={notes}
                    onChange={setNotes}
                    placeholder={t('phProjectNotes')}
                    minHeight={150}
                  />
                </Paper>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={onClose} variant="outlined" color="inherit" disabled={isSaving}>
              {t('btnCancel')}
            </Button>
            <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />} disabled={isSaving}>
              {isSaving ? '...' : t('btnSave')}
            </Button>
          </DialogActions>
      </Dialog>

      {/* EDIT INVOICE DIALOG */}
      {editingProjectInvoice && (
        <Dialog
          open={Boolean(editingProjectInvoice)}
          onClose={() => setEditingProjectInvoice(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
            {t("modalEditInvoice")}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("lblInvoiceNumber")}
                  value={editInvoiceNumber}
                  onChange={(e) => setEditInvoiceNumber(e.target.value)}
                  required
                  autoFocus
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t("lblInvoiceStatus")}</InputLabel>
                  <Select
                    value={editInvoiceStatus}
                    label={t("lblInvoiceStatus")}
                    onChange={(e) => setEditInvoiceStatus(e.target.value as InvoiceStatus)}
                  >
                    <MenuItem value="Draft">{t("statusDraft")}</MenuItem>
                    <MenuItem value="Sent">{t("statusSent")}</MenuItem>
                    <MenuItem value="Paid">{t("statusPaid")}</MenuItem>
                    <MenuItem value="Overdue">{t("statusOverdue")}</MenuItem>
                    <MenuItem value="Cancelled">{t("statusCancelled")}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t("lblCurrency")}</InputLabel>
                  <Select
                    value={editInvoiceCurrency}
                    label={t("lblCurrency")}
                    onChange={(e) => {
                      const c = e.target.value as InvoiceCurrency;
                      setEditInvoiceCurrency(c);
                      setEditInvoiceItems((prev) => prev.map((it) => ({ ...it, currency: c })));
                    }}
                  >
                    <MenuItem value="€">€ (Euro)</MenuItem>
                    <MenuItem value="RSD">RSD (Dinar)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={t("lblDateCreated")}
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={editInvoiceDateCreated}
                  onChange={(e) => setEditInvoiceDateCreated(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={t("lblDueDate")}
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={editInvoiceDueDate}
                  onChange={(e) => setEditInvoiceDueDate(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("lblNotes")}
                  value={editInvoiceNotes}
                  onChange={(e) => setEditInvoiceNotes(e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingProjectInvoice(null)} color="inherit">
              {t("btnCancel")}
            </Button>
            <Button variant="contained" color="primary" onClick={handleSaveEditedInvoice}>
              {t("btnSave")}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* EDIT REMINDER DIALOG */}
      {editingProjectReminder && (
        <Dialog
          open={Boolean(editingProjectReminder)}
          onClose={() => setEditingProjectReminder(null)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
            {t('modalEditReminder')}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('lblReminderTitle')}
                  value={editReminderTitle}
                  onChange={(e) => setEditReminderTitle(e.target.value)}
                  required
                  autoFocus
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={t('lblDueDate')}
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={editReminderDate}
                  onChange={(e) => setEditReminderDate(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('lblStatus')}</InputLabel>
                  <Select
                    value={editReminderStatus}
                    label={t('lblStatus')}
                    onChange={(e) => setEditReminderStatus(e.target.value)}
                  >
                    <MenuItem value="Pending">{t('statusPending')}</MenuItem>
                    <MenuItem value="In Progress">{t('statusInProgress')}</MenuItem>
                    <MenuItem value="Completed">{t('statusCompleted')}</MenuItem>
                    <MenuItem value="Overdue">{t('statusOverdue')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                {(() => {
                  const respLabel = getResponsibleLabel(editReminderResponsible, users);
                  const selectableUsers = users.filter((u) => {
                    const isSelected =
                      Boolean(editReminderResponsible) &&
                      u.name.trim().toLowerCase() === editReminderResponsible.trim().toLowerCase();
                    if (isSelected) return true;
                    const isBlocked =
                      u.status === 'BLOCKED' ||
                      u.status?.toLowerCase() === 'blocked' ||
                      (u.isApproved === false && u.status !== 'PENDING');
                    if (isBlocked) return false;
                    if (u.role === 'Administrator') return false;
                    return true;
                  });
                  return (
                    <Autocomplete
                      freeSolo
                      size="small"
                      options={selectableUsers}
                      getOptionLabel={(u) => (typeof u === 'string' ? u : u.name)}
                      value={editReminderResponsible}
                      onChange={(_, val) => {
                        if (typeof val === 'string') setEditReminderResponsible(val);
                        else if (val) setEditReminderResponsible(val.name);
                        else setEditReminderResponsible('');
                      }}
                      onInputChange={(_, val, reason) => {
                        if (reason === 'input') setEditReminderResponsible(val);
                      }}
                      renderInput={(params) => <TextField {...params} label={respLabel} />}
                    />
                  );
                })()}
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('lblNotes')}
                  value={editReminderNotes}
                  onChange={(e) => setEditReminderNotes(e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingProjectReminder(null)} color="inherit">
              {t('btnCancel')}
            </Button>
            <Button variant="contained" color="primary" onClick={handleSaveEditedReminder}>
              {t('btnSave')}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <ErrorDialog
        open={errorDialogState.open}
        message={errorDialogState.message}
        onClose={() => setErrorDialogState((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
};
