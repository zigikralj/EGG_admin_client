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
} from '@mui/material';







import type { Invoice, Project } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { parseInvoiceNotes, serializeInvoiceNotes } from '../../utils/invoiceUtils';
import { InvoiceStatusChip, InvoiceTypeChip, LinkedInvoiceChip } from '../shared/InvoiceChips';
import { InvoiceFormFields } from '../shared/InvoiceFormFields';
import { InvoiceItemsList } from '../shared/InvoiceItemsList';
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
                <InvoiceFormFields
                  invoiceNumber={newInvoiceNumber}
                  onInvoiceNumberChange={setNewInvoiceNumber}
                  invoiceType={newInvoiceType}
                  onInvoiceTypeChange={setNewInvoiceType}
                  invoiceStatus={newInvoiceStatus}
                  onInvoiceStatusChange={setNewInvoiceStatus}
                  parentInvoiceOptions={invoices.filter((inv) => inv.id !== selectedExistingInvoiceId)}
                  parentInvoiceGroupBy={(inv) => {
                    const isSameProj = inv.projectId === projectToEdit?.id;
                    return isSameProj ? (projectName || projectToEdit?.name || t("tabProjects")) : t("other");
                  }}
                  parentInvoiceGetOptionLabel={(inv) =>
                    `${inv.invoiceNumber}${inv.invoiceType && inv.invoiceType !== 'Standard' ? ` [${inv.invoiceType}]` : ''} (${inv.status})`
                  }
                  parentInvoiceId={newParentInvoiceId}
                  onParentInvoiceIdChange={setNewParentInvoiceId}
                  currency={newInvoiceCurrency}
                  onCurrencyChange={(c) => {
                    setNewInvoiceCurrency(c);
                    setNewInvoiceItems((prev: any) => prev.map((it: any) => ({ ...it, currency: c })));
                  }}
                  dateCreated={newInvoiceDateCreated}
                  onDateCreatedChange={setNewInvoiceDateCreated}
                  dueDate={newInvoiceDueDate}
                  onDueDateChange={setNewInvoiceDueDate}
                />
                <Grid size={{ xs: 12 }}>
                  <InvoiceItemsList
                    items={newInvoiceItems}
                    currency={newInvoiceCurrency}
                    onAdd={handleAddNewInvoiceItem}
                    onChange={handleNewInvoiceItemChange}
                    onRemove={handleRemoveNewInvoiceItem}
                    totalAmount={newInvoiceModalTotal}
                  />
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
                              <InvoiceTypeChip type={inv.invoiceType} />
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <InvoiceStatusChip status={inv.status} />
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
                        <InvoiceTypeChip type={inv.invoiceType} />
                        <Box sx={{ flexShrink: 0 }}><InvoiceStatusChip status={inv.status} /></Box>
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
                            return <LinkedInvoiceChip key={linked.id} linked={linked} />;
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
              <InvoiceFormFields
                invoiceNumber={editInvoiceNumber}
                onInvoiceNumberChange={setEditInvoiceNumber}
                invoiceType={editInvoiceType}
                onInvoiceTypeChange={setEditInvoiceType}
                invoiceStatus={editInvoiceStatus}
                onInvoiceStatusChange={setEditInvoiceStatus}
                parentInvoiceOptions={invoices.filter((inv) => inv.id !== editingProjectInvoice?.id)}
                parentInvoiceGroupBy={(inv) => {
                  const isSameProj = inv.projectId === projectToEdit?.id;
                  return isSameProj ? (projectName || projectToEdit?.name || t("tabProjects")) : t("other");
                }}
                parentInvoiceGetOptionLabel={(inv) =>
                  `${inv.invoiceNumber}${inv.invoiceType && inv.invoiceType !== 'Standard' ? ` [${inv.invoiceType}]` : ''} (${inv.status})`
                }
                parentInvoiceId={editParentInvoiceId}
                onParentInvoiceIdChange={setEditParentInvoiceId}
                currency={editInvoiceCurrency}
                onCurrencyChange={(c) => {
                  setEditInvoiceCurrency(c);
                  setEditInvoiceItems((prev: any) => prev.map((it: any) => ({ ...it, currency: c })));
                }}
                dateCreated={editInvoiceDateCreated}
                onDateCreatedChange={setEditInvoiceDateCreated}
                dueDate={editInvoiceDueDate}
                onDueDateChange={setEditInvoiceDueDate}
              />
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
