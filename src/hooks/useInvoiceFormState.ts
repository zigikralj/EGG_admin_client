import { useState } from 'react';
import type { Invoice, InvoiceStatus, InvoiceCurrency, InvoiceType } from '../types';
import { parseInvoiceNotes } from '../utils/invoiceUtils';

export function useInvoiceFormState() {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Add / Link State
  const [isAddingInvoice, setIsAddingInvoice] = useState(false);
  const [addInvoiceMode, setAddInvoiceMode] = useState<'new' | 'existing'>('new');

  // New Invoice State
  const [newInvoiceNumber, setNewInvoiceNumber] = useState('');
  const [newInvoiceType, setNewInvoiceType] = useState<InvoiceType>('standard');
  const [newParentInvoiceId, setNewParentInvoiceId] = useState('');
  const [newInvoiceDateCreated, setNewInvoiceDateCreated] = useState(todayStr);
  const [newInvoiceDueDate, setNewInvoiceDueDate] = useState('');
  const [newInvoiceCurrency, setNewInvoiceCurrency] = useState<InvoiceCurrency>('RSD');
  const [newInvoiceStatus, setNewInvoiceStatus] = useState<InvoiceStatus>('draft');
  const [newInvoiceNotes, setNewInvoiceNotes] = useState('');
  const [newInvoiceItems, setNewInvoiceItems] = useState<{ description: string; quantity: number; unitPrice: number; currency: InvoiceCurrency }[]>([
    { description: '', quantity: 1, unitPrice: 0, currency: 'RSD' },
  ]);
  const [selectedExistingInvoiceId, setSelectedExistingInvoiceId] = useState('');

  // Edit Linked Invoice State
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editInvoiceNumber, setEditInvoiceNumber] = useState('');
  const [editInvoiceType, setEditInvoiceType] = useState<InvoiceType>('standard');
  const [editParentInvoiceId, setEditParentInvoiceId] = useState('');
  const [editInvoiceDateCreated, setEditInvoiceDateCreated] = useState('');
  const [editInvoiceDueDate, setEditInvoiceDueDate] = useState('');
  const [editInvoicePaymentDate, setEditInvoicePaymentDate] = useState('');
  const [editInvoiceStatus, setEditInvoiceStatus] = useState<InvoiceStatus>('draft');
  const [editInvoiceCurrency, setEditInvoiceCurrency] = useState<InvoiceCurrency>('RSD');
  const [editInvoiceNotes, setEditInvoiceNotes] = useState('');
  const [editInvoiceItems, setEditInvoiceItems] = useState<{ description: string; quantity: number; unitPrice: number; currency: InvoiceCurrency }[]>([]);

  const resetNewInvoiceForm = () => {
    setNewInvoiceNumber('');
    setNewInvoiceType('standard');
    setNewParentInvoiceId('');
    setNewInvoiceDateCreated(todayStr);
    setNewInvoiceDueDate('');
    setNewInvoiceCurrency('RSD');
    setNewInvoiceStatus('draft');
    setNewInvoiceNotes('');
    setNewInvoiceItems([{ description: '', quantity: 1, unitPrice: 0, currency: 'RSD' }]);
    setSelectedExistingInvoiceId('');
  };

  const startEditInvoice = (inv: Invoice) => {
    const { cleanNotes, invoiceType: pType, parentInvoiceId: pParentId } = parseInvoiceNotes(inv.notes);
    setEditingInvoice(inv);
    setEditInvoiceNumber(inv.invoiceNumber || '');
    setEditInvoiceType(((inv.invoiceType?.toLowerCase() as InvoiceType) || (pType as InvoiceType) || 'standard'));
    setEditParentInvoiceId(inv.parentInvoiceId || pParentId || '');
    setEditInvoiceDateCreated(inv.dateCreated || '');
    setEditInvoiceDueDate(inv.dueDate || '');
    setEditInvoiceStatus(((inv.status?.toLowerCase() as InvoiceStatus) || 'draft'));
    setEditInvoiceCurrency((inv.currency as InvoiceCurrency) || 'RSD');
    setEditInvoiceNotes(cleanNotes || '');
    setEditInvoiceItems(inv.items && inv.items.length > 0 ? [...inv.items] : []);
  };

  const resetEditInvoiceForm = () => {
    setEditingInvoice(null);
    setEditInvoiceNumber('');
    setEditInvoiceType('standard');
    setEditParentInvoiceId('');
    setEditInvoiceDateCreated('');
    setEditInvoiceDueDate('');
    setEditInvoiceStatus('draft');
    setEditInvoiceCurrency('RSD');
    setEditInvoiceNotes('');
    setEditInvoiceItems([]);
  };

  return {
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
    editingInvoice, setEditingInvoice,
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
    resetNewInvoiceForm,
    startEditInvoice,
    resetEditInvoiceForm,
  };
}
