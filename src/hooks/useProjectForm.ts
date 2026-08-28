import { useState, useEffect, useMemo } from 'react';
import type { Project, Client, User, Service, Reminder, Invoice, InvoiceStatus, InvoiceCurrency, InvoiceType } from '../types';
import { enhanceInvoicesWithLinks } from '../utils/invoiceUtils';

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
  const [responsible, setResponsible] = useState('');
  const [type, setType] = useState(services.length > 0 ? services[0].code : 'waste-management');
  const [start, setStart] = useState(todayStr);
  const [deadline, setDeadline] = useState('');
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [notes, setNotes] = useState('');

  // Reminder State
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [addReminderMode, setAddReminderMode] = useState<'new' | 'existing'>('new');
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderDate, setNewReminderDate] = useState('');
  const [newReminderResponsible, setNewReminderResponsible] = useState('');
  const [newReminderNotes, setNewReminderNotes] = useState('');
  const [selectedExistingReminderId, setSelectedExistingReminderId] = useState('');
  
  const [editingProjectReminder, setEditingProjectReminder] = useState<Reminder | null>(null);
  const [editReminderTitle, setEditReminderTitle] = useState('');
  const [editReminderDate, setEditReminderDate] = useState('');
  const [editReminderStatus, setEditReminderStatus] = useState('Pending');
  const [editReminderResponsible, setEditReminderResponsible] = useState('');
  const [editReminderNotes, setEditReminderNotes] = useState('');

  // Invoice State
  const [isAddingInvoice, setIsAddingInvoice] = useState(false);
  const [addInvoiceMode, setAddInvoiceMode] = useState<'new' | 'existing'>('new');
  const [newInvoiceNumber, setNewInvoiceNumber] = useState('');
  const [newInvoiceType, setNewInvoiceType] = useState<InvoiceType>('Standard');
  const [newParentInvoiceId, setNewParentInvoiceId] = useState('');
  const [newInvoiceDateCreated, setNewInvoiceDateCreated] = useState(todayStr);
  const [newInvoiceDueDate, setNewInvoiceDueDate] = useState('');
  const [newInvoiceCurrency, setNewInvoiceCurrency] = useState<InvoiceCurrency>('RSD');
  const [newInvoiceStatus, setNewInvoiceStatus] = useState<InvoiceStatus>('Draft');
  const [newInvoiceNotes, setNewInvoiceNotes] = useState('');
  const [newInvoiceItems, setNewInvoiceItems] = useState<{ description: string; quantity: number; unitPrice: number; currency: InvoiceCurrency }[]>([
    { description: '', quantity: 1, unitPrice: 0, currency: 'RSD' },
  ]);
  const [selectedExistingInvoiceId, setSelectedExistingInvoiceId] = useState('');

  const [editingProjectInvoice, setEditingProjectInvoice] = useState<Invoice | null>(null);
  const [editInvoiceNumber, setEditInvoiceNumber] = useState('');
  const [editInvoiceType, setEditInvoiceType] = useState<InvoiceType>('Standard');
  const [editParentInvoiceId, setEditParentInvoiceId] = useState('');
  const [editInvoiceDateCreated, setEditInvoiceDateCreated] = useState('');
  const [editInvoiceDueDate, setEditInvoiceDueDate] = useState('');
  const [editInvoicePaymentDate, setEditInvoicePaymentDate] = useState('');
  const [editInvoiceStatus, setEditInvoiceStatus] = useState<InvoiceStatus>('Draft');
  const [editInvoiceCurrency, setEditInvoiceCurrency] = useState<InvoiceCurrency>('RSD');
  const [editInvoiceNotes, setEditInvoiceNotes] = useState('');
  const [editInvoiceItems, setEditInvoiceItems] = useState<{ description: string; quantity: number; unitPrice: number; currency: InvoiceCurrency }[]>([]);

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
      setIsAddingInvoice(false);
      setEditingProjectInvoice(null);
    }
  }, [projectToEdit, clients, users, services, currentUser, isUser, todayStr]);

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
    if (!projectToEdit || !linkedInvoices) return [];
    return linkedInvoices.filter((inv) => {
      if (inv.projectId && inv.projectId === projectToEdit.id) return true;
      if (!inv.projectId && inv.projectName && inv.projectName.trim().toLowerCase() === projectToEdit.name.trim().toLowerCase()) return true;
      return false;
    });
  }, [linkedInvoices, projectToEdit]);

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
    },
    invoiceState: {
      isAddingInvoice, setIsAddingInvoice,
      addInvoiceMode, setAddInvoiceMode,
      newInvoiceNumber, setNewInvoiceNumber,
      newInvoiceType, setNewInvoiceType,
      newParentInvoiceId, setNewParentInvoiceId,
      newInvoiceDateCreated, setNewInvoiceDateCreated,
      newInvoiceDueDate, setNewInvoiceDueDate,
      newInvoiceCurrency, setNewInvoiceCurrency,
      newInvoiceStatus, setNewInvoiceStatus,
      newInvoiceNotes, setNewInvoiceNotes,
      newInvoiceItems, setNewInvoiceItems,
      selectedExistingInvoiceId, setSelectedExistingInvoiceId,
      editingProjectInvoice, setEditingProjectInvoice,
      editInvoiceNumber, setEditInvoiceNumber,
      editInvoiceType, setEditInvoiceType,
      editParentInvoiceId, setEditParentInvoiceId,
      editInvoiceDateCreated, setEditInvoiceDateCreated,
      editInvoiceDueDate, setEditInvoiceDueDate,
      editInvoicePaymentDate, setEditInvoicePaymentDate,
      editInvoiceStatus, setEditInvoiceStatus,
      editInvoiceCurrency, setEditInvoiceCurrency,
      editInvoiceNotes, setEditInvoiceNotes,
      editInvoiceItems, setEditInvoiceItems,
      projectInvoices,
      availableExistingInvoices,
    },
    handleClientSelectChange,
    todayStr,
  };
}
