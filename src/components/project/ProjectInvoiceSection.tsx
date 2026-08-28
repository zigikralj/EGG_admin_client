import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  TextField,
  Autocomplete,
  Chip,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';







import type { Invoice, InvoiceStatus, InvoiceCurrency, InvoiceType, Project } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { parseInvoiceNotes, serializeInvoiceNotes } from '../../utils/invoiceUtils';
import { ReceiptLongIcon, AddIcon, CloseIcon, CheckCircleIcon, EditIcon, LinkOffIcon, DeleteIcon, LinkIcon } from '../icons';

interface ProjectInvoiceSectionProps {
  projectToEdit?: Project | null;
  projectName: string;
  clientId: string;
  clientName: string;
  invoices: Invoice[];
  onSaveInvoice?: (invoice: Partial<Invoice>) => void;
  onDeleteInvoice?: (id: string) => void;
  onStatusChangeInvoice?: (id: string, status: string, paymentDate?: string) => void;
  setErrorDialogState: (state: { open: boolean; message: string }) => void;
  invoiceState: any; // return of useProjectForm().invoiceState
  disabled?: boolean;
}

export const ProjectInvoiceSection: React.FC<ProjectInvoiceSectionProps> = ({
  projectToEdit,
  projectName,
  clientId,
  clientName,
  invoices,
  onSaveInvoice,
  onDeleteInvoice,
  onStatusChangeInvoice,
  setErrorDialogState,
  invoiceState,
  disabled = false,
}) => {
  const { t } = useLanguage();
  const todayStr = new Date().toISOString().slice(0, 10);

  const {
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
    editInvoiceStatus, setEditInvoiceStatus,
    editInvoiceCurrency, setEditInvoiceCurrency,
    editInvoiceNotes, setEditInvoiceNotes,
    setEditInvoiceItems,
    projectInvoices,
    availableExistingInvoices,
  } = invoiceState;

  const getInvoiceStatusChip = (st?: string) => {
    if (!st) return null;
    switch (st) {
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

  const getInvoiceTypeChip = (type?: string | null) => {
    if (!type || type === 'Standard') return null;
    switch (type) {
      case 'Advance':
        return (
          <Chip
            label={t('badgeAdvance')}
            size="small"
            color="secondary"
            variant="outlined"
            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, px: 0.25 }}
          />
        );
      case 'Final':
        return (
          <Chip
            label={t('badgeFinal')}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, px: 0.25 }}
          />
        );
      case 'Partial':
        return (
          <Chip
            label={t('badgePartial')}
            size="small"
            color="info"
            variant="outlined"
            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, px: 0.25 }}
          />
        );
      default:
        return null;
    }
  };

  const getLinkedInvoiceLabel = (linkedInv?: Invoice | null) => {
    const type = linkedInv?.invoiceType || 'Standard';
    switch (type) {
      case 'Advance':
        return t('badgeAdvance');
      case 'Final':
        return t('badgeFinal');
      case 'Partial':
        return t('badgePartial');
      default:
        return t('typeStandard');
    }
  };

  const getLinkedInvoiceChipColor = (type?: string | null): 'secondary' | 'primary' | 'info' | 'default' => {
    switch (type) {
      case 'Advance':
        return 'secondary';
      case 'Final':
        return 'primary';
      case 'Partial':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatInvoiceAmount = (amount?: number | null, curr?: string | null) => {
    const val = amount || 0;
    const c = curr || 'RSD';
    return `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`;
  };

  const handleAddNewInvoiceItem = () => {
    setNewInvoiceItems([...newInvoiceItems, { description: '', quantity: 1, unitPrice: 0, currency: newInvoiceCurrency }]);
  };

  const handleNewInvoiceItemChange = (idx: number, field: string, value: any) => {
    const updated = [...newInvoiceItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setNewInvoiceItems(updated);
  };

  const handleRemoveNewInvoiceItem = (idx: number) => {
    setNewInvoiceItems(newInvoiceItems.filter((_: any, i: number) => i !== idx));
  };

  const newInvoiceModalTotal = newInvoiceItems.reduce((acc: number, it: any) => acc + (it.quantity * it.unitPrice || 0), 0);

  const handleCreateProjectInvoice = () => {
    if (!newInvoiceNumber.trim()) {
      setErrorDialogState({ open: true, message: t('alertInvoiceNumberRequired') });
      return;
    }
    if (onSaveInvoice && projectToEdit) {
      const combinedNotes = serializeInvoiceNotes(newInvoiceNotes, newInvoiceType, newParentInvoiceId);
      onSaveInvoice({
        invoiceNumber: newInvoiceNumber.trim(),
        invoiceType: newInvoiceType,
        parentInvoiceId: newParentInvoiceId || null,
        projectId: projectToEdit.id,
        projectName: projectName.trim() || projectToEdit.name,
        clientId: clientId || projectToEdit.clientId || null,
        clientName: clientName.trim() || projectToEdit.clientName,
        dateCreated: newInvoiceDateCreated || null,
        dueDate: newInvoiceDueDate || null,
        status: newInvoiceStatus,
        currency: newInvoiceCurrency,
        notes: combinedNotes,
        items: newInvoiceItems.filter((it: any) => it.description.trim() !== '' || it.unitPrice > 0),
        totalAmount: newInvoiceModalTotal,
      });
      setIsAddingInvoice(false);
    }
  };

  const handleLinkExistingInvoice = () => {
    if (!selectedExistingInvoiceId) return;
    const existing = invoices.find((inv) => inv.id === selectedExistingInvoiceId);
    if (existing && onSaveInvoice && projectToEdit) {
      onSaveInvoice({
        id: existing.id,
        projectId: projectToEdit.id,
        projectName: projectName.trim() || projectToEdit.name,
        clientId: clientId || projectToEdit.clientId || existing.clientId || null,
        clientName: clientName.trim() || projectToEdit.clientName || existing.clientName,
      });
      setIsAddingInvoice(false);
      setSelectedExistingInvoiceId('');
    }
  };

  const handleStartEditInvoice = (inv: Invoice) => {
    const { cleanNotes, invoiceType: pType, parentInvoiceId: pParentId } = parseInvoiceNotes(inv.notes);
    setEditingProjectInvoice(inv);
    setEditInvoiceNumber(inv.invoiceNumber || '');
    setEditInvoiceType(inv.invoiceType || pType || 'Standard');
    setEditParentInvoiceId(inv.parentInvoiceId || pParentId || '');
    setEditInvoiceDateCreated(inv.dateCreated || '');
    setEditInvoiceDueDate(inv.dueDate || '');
    setEditInvoiceStatus(inv.status || 'Draft');
    setEditInvoiceCurrency(inv.currency || 'RSD');
    setEditInvoiceNotes(cleanNotes || '');
    setEditInvoiceItems(inv.items && inv.items.length > 0 ? [...inv.items] : []);
  };

  const handleSaveEditedInvoice = () => {
    if (!editInvoiceNumber.trim()) {
      setErrorDialogState({ open: true, message: t('alertInvoiceNumberRequired') });
      return;
    }
    if (onSaveInvoice && editingProjectInvoice && projectToEdit) {
      const combinedNotes = serializeInvoiceNotes(editInvoiceNotes, editInvoiceType, editParentInvoiceId);
      onSaveInvoice({
        id: editingProjectInvoice.id,
        invoiceNumber: editInvoiceNumber.trim(),
        invoiceType: editInvoiceType,
        parentInvoiceId: editParentInvoiceId || null,
        projectId: projectToEdit.id,
        projectName: projectName.trim() || projectToEdit.name,
        clientId: clientId || projectToEdit.clientId || null,
        clientName: clientName.trim() || projectToEdit.clientName,
        dateCreated: editInvoiceDateCreated || null,
        dueDate: editInvoiceDueDate || null,
        status: editInvoiceStatus,
        currency: editInvoiceCurrency,
        notes: combinedNotes,
      });
      setEditingProjectInvoice(null);
    }
  };

  const handleUnlinkInvoice = (invoiceId: string) => {
    if (onSaveInvoice) {
      onSaveInvoice({
        id: invoiceId,
        projectId: null,
        projectName: null,
      });
    }
  };

  return (
    <>
      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default", borderRadius: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1, gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <ReceiptLongIcon color="primary" sx={{ fontSize: 16 }} />
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" }}>
              {t("invoiceBoxTitle")}
            </Typography>
          </Box>
          {projectToEdit && !disabled && (
            <Button
              size="small"
              variant={isAddingInvoice ? "outlined" : "contained"}
              color={isAddingInvoice ? "inherit" : "primary"}
              startIcon={isAddingInvoice ? <CloseIcon sx={{ fontSize: 14 }} /> : <AddIcon sx={{ fontSize: 14 }} />}
              onClick={() => {
                setIsAddingInvoice(!isAddingInvoice);
                setAddInvoiceMode("new");
                setNewInvoiceNumber("");
                setNewInvoiceType("Standard");
                setNewParentInvoiceId("");
                setNewInvoiceDateCreated(todayStr);
                setNewInvoiceDueDate("");
                setNewInvoiceCurrency("RSD");
                setNewInvoiceStatus("Draft");
                setNewInvoiceNotes("");
                setNewInvoiceItems([{ description: "", quantity: 1, unitPrice: 0, currency: "RSD" }]);
                setSelectedExistingInvoiceId("");
              }}
              sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.75rem", py: 0.25, px: 1, minHeight: 28, borderRadius: 1 }}
            >
              {isAddingInvoice ? t("btnCancel") : t("btnAddInvoice")}
            </Button>
          )}
        </Box>

        {/* ADD / LINK INVOICE PANEL */}
        {isAddingInvoice && !disabled && (
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
                <Grid size={{ xs: 12, sm: 5 }}>
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
                <Grid size={{ xs: 6, sm: 3.5 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{t("lblInvoiceType")}</InputLabel>
                    <Select
                      value={newInvoiceType}
                      label={t("lblInvoiceType")}
                      onChange={(e) => setNewInvoiceType(e.target.value as InvoiceType)}
                    >
                      <MenuItem value="Standard">{t("typeStandard")}</MenuItem>
                      <MenuItem value="Advance">{t("typeAdvance")}</MenuItem>
                      <MenuItem value="Final">{t("typeFinal")}</MenuItem>
                      <MenuItem value="Partial">{t("typePartial")}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 6, sm: 3.5 }}>
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

                {/* Parent / Linked Invoice selection */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Autocomplete
                    size="small"
                    options={invoices.filter((inv) => inv.id !== selectedExistingInvoiceId)}
                    groupBy={(inv) => {
                      const isSameProj = inv.projectId === projectToEdit?.id;
                      return isSameProj ? (projectName || projectToEdit?.name || t("tabProjects")) : t("other");
                    }}
                    getOptionLabel={(inv) =>
                      `${inv.invoiceNumber}${inv.invoiceType && inv.invoiceType !== 'Standard' ? ` [${inv.invoiceType}]` : ''} (${inv.status})`
                    }
                    value={invoices.find((inv) => inv.id === newParentInvoiceId) || null}
                    onChange={(_, val) => setNewParentInvoiceId(val ? val.id : '')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t("lblParentInvoice")}
                        placeholder={t("phSelectParentInvoice")}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{t("lblCurrency")}</InputLabel>
                    <Select
                      value={newInvoiceCurrency}
                      label={t("lblCurrency")}
                      onChange={(e) => {
                        const c = e.target.value as InvoiceCurrency;
                        setNewInvoiceCurrency(c);
                        setNewInvoiceItems((prev: any) => prev.map((it: any) => ({ ...it, currency: c })));
                      }}
                    >
                      <MenuItem value="RSD">RSD (Dinar)</MenuItem>
                      <MenuItem value="€">€ (Euro)</MenuItem>
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
                    required
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

                  {newInvoiceItems.map((item: any, idx: number) => (
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
                      <Typography variant="caption" sx={{ minWidth: 120, fontWeight: 700, textAlign: "right", whiteSpace: "nowrap" }}>
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
                  groupBy={(inv: Invoice) => {
                    const targetClientId = clientId || projectToEdit?.clientId;
                    const targetClientName = (clientName || projectToEdit?.clientName || "").trim().toLowerCase();
                    const isMatch =
                      Boolean(targetClientId && inv.clientId === targetClientId) ||
                      Boolean(targetClientName && inv.clientName && inv.clientName.trim().toLowerCase() === targetClientName);
                    return isMatch ? `${t("colClient")}: ${clientName || projectToEdit?.clientName || ""}` : t("other");
                  }}
                  getOptionLabel={(inv: Invoice) =>
                    `${inv.invoiceNumber}${inv.invoiceType && inv.invoiceType !== 'Standard' ? ` [${inv.invoiceType}]` : ''}${inv.totalAmount ? ` (${formatInvoiceAmount(inv.totalAmount, inv.currency)})` : ""}${inv.clientName ? ` - ${inv.clientName}` : ""}`
                  }
                  value={availableExistingInvoices.find((inv: Invoice) => inv.id === selectedExistingInvoiceId) || null}
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
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                              <Typography variant="body2" sx={{ fontWeight: isMatch ? 700 : 500 }}>
                                {inv.invoiceNumber}
                              </Typography>
                              {getInvoiceTypeChip(inv.invoiceType)}
                            </Box>
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
              {projectInvoices.map((inv: Invoice) => {
                const isPaid = inv.status === "Paid";
                return (
                  <Box
                    key={inv.id}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                      py: 0.75,
                      px: 1,
                      bgcolor: "background.paper",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0, flex: 1, flexWrap: "wrap" }}>
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
                        {getInvoiceTypeChip(inv.invoiceType)}
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
                      {!disabled && (
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
                      )}
                    </Box>

                    {/* Linked Invoices indicators */}
                    {(() => {
                      const uniqueLinks: Invoice[] = [];
                      if (inv.parentInvoice) {
                        uniqueLinks.push(inv.parentInvoice);
                      }
                      if (inv.childInvoices && inv.childInvoices.length > 0) {
                        inv.childInvoices.forEach((child) => {
                          if (!uniqueLinks.some((existing) => existing.id === child.id)) {
                            uniqueLinks.push(child);
                          }
                        });
                      }

                      if (uniqueLinks.length === 0) return null;

                      return (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap", pt: 0.25, pl: 0.5 }}>
                          <LinkIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                          {uniqueLinks.map((linked) => {
                            const labelType = getLinkedInvoiceLabel(linked);
                            const chipColor = getLinkedInvoiceChipColor(linked.invoiceType);
                            return (
                              <Chip
                                key={linked.id}
                                size="small"
                                variant="outlined"
                                color={chipColor}
                                label={`${labelType}: ${linked.invoiceNumber || ""}`}
                                sx={{ height: 18, fontSize: "0.65rem", fontWeight: 600 }}
                              />
                            );
                          })}
                        </Box>
                      );
                    })()}
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

      {/* EDIT INVOICE DIALOG */}
      {editingProjectInvoice && !disabled && (
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
              <Grid size={{ xs: 12, sm: 5 }}>
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
              <Grid size={{ xs: 6, sm: 3.5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t("lblInvoiceType")}</InputLabel>
                  <Select
                    value={editInvoiceType}
                    label={t("lblInvoiceType")}
                    onChange={(e) => setEditInvoiceType(e.target.value as InvoiceType)}
                  >
                    <MenuItem value="Standard">{t("typeStandard")}</MenuItem>
                    <MenuItem value="Advance">{t("typeAdvance")}</MenuItem>
                    <MenuItem value="Final">{t("typeFinal")}</MenuItem>
                    <MenuItem value="Partial">{t("typePartial")}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, sm: 3.5 }}>
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

              {/* Edit Parent / Linked Invoice */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  size="small"
                  options={invoices.filter((inv) => inv.id !== editingProjectInvoice?.id)}
                  groupBy={(inv) => {
                    const isSameProj = inv.projectId === projectToEdit?.id;
                    return isSameProj ? (projectName || projectToEdit?.name || t("tabProjects")) : t("other");
                  }}
                  getOptionLabel={(inv) =>
                    `${inv.invoiceNumber}${inv.invoiceType && inv.invoiceType !== 'Standard' ? ` [${inv.invoiceType}]` : ''} (${inv.status})`
                  }
                  value={invoices.find((inv) => inv.id === editParentInvoiceId) || null}
                  onChange={(_, val) => setEditParentInvoiceId(val ? val.id : '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t("lblParentInvoice")}
                      placeholder={t("phSelectParentInvoice")}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t("lblCurrency")}</InputLabel>
                  <Select
                    value={editInvoiceCurrency}
                    label={t("lblCurrency")}
                    onChange={(e) => {
                      const c = e.target.value as InvoiceCurrency;
                      setEditInvoiceCurrency(c);
                      setEditInvoiceItems((prev: any) => prev.map((it: any) => ({ ...it, currency: c })));
                    }}
                  >
                    <MenuItem value="RSD">RSD (Dinar)</MenuItem>
                    <MenuItem value="€">€ (Euro)</MenuItem>
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
                  required
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
    </>
  );
};
