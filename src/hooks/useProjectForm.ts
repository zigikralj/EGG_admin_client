import { useState, useEffect, useMemo } from 'react';
import type { Project, Client, User, Service, Reminder, Invoice, } from '../types';
import { enhanceInvoicesWithLinks } from '../utils/invoiceUtils';
import { useInvoiceFormState } from './useInvoiceFormState';

export function useProjectForm({
  projectToEdit,
  clients,
  users,
  services,
  reminders = [],
  invoices = [],
  currentUser,
  isUser,
}: {
  projectToEdit?: Project | null;
  clients: Client[];
  users: User[];
  services: Service[];
  reminders?: Reminder[];
  invoices?: Invoice[];
  currentUser?: User | null;
  isUser?: boolean;
}) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [responsible, setResponsible] = useState(currentUser?.name || '');
  const [type, setType] = useState('');
  const [start, setStart] = useState(todayStr);
  const [deadline, setDeadline] = useState('');
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [notes, setNotes] = useState('');

  // Staged reminders & invoices for new project creation
  const [stagedReminders, setStagedReminders] = useState<Reminder[]>([]);
  const [stagedInvoices, setStagedInvoices] = useState<Invoice[]>([]);

  // Reminder State
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [addReminderMode, setAddReminderMode] = useState<'new' | 'existing'>('new');
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderDate, setNewReminderDate] = useState('');
  const [newReminderResponsible, setNewReminderResponsible] = useState(currentUser?.name || '');
  const [newReminderNotes, setNewReminderNotes] = useState('');
  const [selectedExistingReminderId, setSelectedExistingReminderId] = useState('');
  
  const [editingProjectReminder, setEditingProjectReminder] = useState<Reminder | null>(null);
  const [editReminderTitle, setEditReminderTitle] = useState('');
  const [editReminderDate, setEditReminderDate] = useState('');
  const [editReminderStatus, setEditReminderStatus] = useState('Pending');
  const [editReminderResponsible, setEditReminderResponsible] = useState('');
  const [editReminderNotes, setEditReminderNotes] = useState('');

  // Invoice State
  const invoiceFormState = useInvoiceFormState();
  const { setIsAddingInvoice, setEditingInvoice } = invoiceFormState;

  useEffect(() => {
    setStagedReminders([]);
    setStagedInvoices([]);
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
      setEditingInvoice(null);
    } else {
      setName('');
      setClientId('');
      setClientName('');
      setResponsible(currentUser?.name || '');
      setType('');
      setStart(todayStr);
      setDeadline('');
      setProgress(0);
      setDone(false);
      setNotes('');
      setIsAddingReminder(false);
      setEditingProjectReminder(null);
      setIsAddingInvoice(false);
      setEditingInvoice(null);
    }
  }, [projectToEdit, clients, users, services, currentUser, isUser, todayStr]);

  const handleClientSelectChange = (id: string) => {
    setClientId(id);
    const found = clients.find((c) => c.id === id);
    setClientName(found ? found.name : '');
  };

  const addStagedReminder = (reminder: Reminder) => {
    setStagedReminders((prev) => [...prev, reminder]);
  };

  const removeStagedReminder = (id: string) => {
    setStagedReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const updateStagedReminder = (id: string, updates: Partial<Reminder>) => {
    setStagedReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const toggleStagedReminderStatus = (id: string, status: string) => {
    setStagedReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  };

  const addStagedInvoice = (invoice: Invoice) => {
    setStagedInvoices((prev) => [...prev, invoice]);
  };

  const removeStagedInvoice = (id: string) => {
    setStagedInvoices((prev) => prev.filter((i) => i.id !== id));
  };

  const updateStagedInvoice = (id: string, updates: Partial<Invoice>) => {
    setStagedInvoices((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
  };

  const projectReminders = useMemo(() => {
    if (!projectToEdit) return stagedReminders;
    if (!reminders) return [];
    return reminders.filter((r) => {
      if (r.projectId && r.projectId === projectToEdit.id) return true;
      if (!r.projectId && r.projectName && r.projectName.trim().toLowerCase() === projectToEdit.name.trim().toLowerCase()) return true;
      return false;
    });
  }, [reminders, projectToEdit, stagedReminders]);

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

        if (aClientMatch && !bClientMatch) return -1;
        if (!aClientMatch && bClientMatch) return 1;

        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;

        const aTitle = a.title || a.projectName || '';
        const bTitle = b.title || b.projectName || '';
        return aTitle.localeCompare(bTitle);
      });
  }, [reminders, projectReminders, clientId, clientName, projectToEdit]);

  const linkedInvoices = useMemo(() => {
    return enhanceInvoicesWithLinks(invoices || []);
  }, [invoices]);

  const projectInvoices = useMemo(() => {
    if (!projectToEdit) return stagedInvoices;
    if (!linkedInvoices) return [];
    return linkedInvoices.filter((inv) => {
      if (inv.projectId && inv.projectId === projectToEdit.id) return true;
      if (!inv.projectId && inv.projectName && inv.projectName.trim().toLowerCase() === projectToEdit.name.trim().toLowerCase()) return true;
      return false;
    });
  }, [linkedInvoices, projectToEdit, stagedInvoices]);

  const availableExistingInvoices = useMemo(() => {
    if (!linkedInvoices) return [];
    const projectInvoiceIds = new Set(projectInvoices.map((i: Invoice) => i.id));
    const targetClientId = clientId || projectToEdit?.clientId;
    const targetClientName = (clientName || projectToEdit?.clientName || '').trim().toLowerCase();

    const isMatchClient = (i: Invoice) => {
      if (targetClientId && i.clientId && i.clientId === targetClientId) return true;
      if (targetClientName && i.clientName && i.clientName.trim().toLowerCase() === targetClientName) return true;
      return false;
    };

    return linkedInvoices
      .filter((i) => !projectInvoiceIds.has(i.id))
      .sort((a, b) => {
        const aClientMatch = isMatchClient(a);
        const bClientMatch = isMatchClient(b);

        if (aClientMatch && !bClientMatch) return -1;
        if (!aClientMatch && bClientMatch) return 1;

        if (a.dateCreated && b.dateCreated) {
          return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
        }
        if (a.dateCreated && !b.dateCreated) return -1;
        if (!a.dateCreated && b.dateCreated) return 1;

        return (a.invoiceNumber || '').localeCompare(b.invoiceNumber || '');
      });
  }, [linkedInvoices, projectInvoices, clientId, clientName, projectToEdit]);

  return {
    formState: {
      name, setName,
      clientId, setClientId,
      clientName, setClientName,
      responsible, setResponsible,
      type, setType,
      start, setStart,
      deadline, setDeadline,
      progress, setProgress,
      done, setDone,
      notes, setNotes,
    },
    reminderState: {
      isAddingReminder, setIsAddingReminder,
      addReminderMode, setAddReminderMode,
      newReminderTitle, setNewReminderTitle,
      newReminderDate, setNewReminderDate,
      newReminderResponsible, setNewReminderResponsible,
      newReminderNotes, setNewReminderNotes,
      selectedExistingReminderId, setSelectedExistingReminderId,
      editingProjectReminder, setEditingProjectReminder,
      editReminderTitle, setEditReminderTitle,
      editReminderDate, setEditReminderDate,
      editReminderStatus, setEditReminderStatus,
      editReminderResponsible, setEditReminderResponsible,
      editReminderNotes, setEditReminderNotes,
      projectReminders,
      availableExistingReminders,
      stagedReminders,
      setStagedReminders,
      addStagedReminder,
      removeStagedReminder,
      updateStagedReminder,
      toggleStagedReminderStatus,
    },
    invoiceState: {
      ...invoiceFormState,
      editingProjectInvoice: invoiceFormState.editingInvoice,
      setEditingProjectInvoice: invoiceFormState.setEditingInvoice,
      projectInvoices,
      availableExistingInvoices,
      stagedInvoices,
      setStagedInvoices,
      addStagedInvoice,
      removeStagedInvoice,
      updateStagedInvoice,
    },
    handleClientSelectChange,
    todayStr,
  };
}
