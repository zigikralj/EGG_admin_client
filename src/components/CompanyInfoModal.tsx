import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Paper,
  Grid,
  Tooltip,
  Snackbar,
  Alert,
  Divider,
  TextField,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BusinessIcon from '@mui/icons-material/Business';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmailIcon from '@mui/icons-material/Email';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BadgeIcon from '@mui/icons-material/Badge';
import WorkIcon from '@mui/icons-material/Work';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { apiFetch } from '../api';
import { useLanguage } from '../context/LanguageContext';
import { DEFAULT_COMPANY_INFO } from '../constants/companyInfo';
import type { CompanyInfo } from '../types';

interface CompanyInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export const CompanyInfoModal: React.FC<CompanyInfoModalProps> = ({ open, onClose }) => {
  const { t } = useLanguage();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(DEFAULT_COMPANY_INFO);
  const [formData, setFormData] = useState<CompanyInfo>(DEFAULT_COMPANY_INFO);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Fetch company info from backend DB when dialog opens
  useEffect(() => {
    if (open) {
      setIsEditing(false);
      fetchCompanyInfo();
    }
  }, [open]);

  const fetchCompanyInfo = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/company-info');
      if (res.ok) {
        const data = await res.json();
        if (data && data.name) {
          const info: CompanyInfo = {
            id: data.id || 'default',
            name: data.name || DEFAULT_COMPANY_INFO.name,
            legalName: data.legalName || DEFAULT_COMPANY_INFO.legalName,
            registrationNumber: data.registrationNumber || DEFAULT_COMPANY_INFO.registrationNumber,
            municipality: data.municipality || DEFAULT_COMPANY_INFO.municipality,
            city: data.city || DEFAULT_COMPANY_INFO.city,
            streetAddress: data.streetAddress || DEFAULT_COMPANY_INFO.streetAddress,
            postalCode: data.postalCode || DEFAULT_COMPANY_INFO.postalCode,
            postOffice: data.postOffice || DEFAULT_COMPANY_INFO.postOffice,
            email: data.email || DEFAULT_COMPANY_INFO.email,
            taxId: data.taxId || DEFAULT_COMPANY_INFO.taxId,
            activityCode: data.activityCode || DEFAULT_COMPANY_INFO.activityCode,
            bankAccounts: Array.isArray(data.bankAccounts) ? data.bankAccounts : DEFAULT_COMPANY_INFO.bankAccounts,
          };
          setCompanyInfo(info);
          setFormData(info);
        }
      }
    } catch (err) {
      console.error('Failed to load company info from server', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, key: string, customMsg?: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setSnackbarSeverity('success');
    setSnackbarMessage(customMsg || t('copiedToClipboard'));
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  const handleCopyAll = () => {
    const lines = [
      `${t('companyName')}: ${companyInfo.name}`,
      `${t('companyLegalName')}: ${companyInfo.legalName}`,
      `${t('companyRegistrationNumber')}: ${companyInfo.registrationNumber}`,
      `${t('companyTaxId')}: ${companyInfo.taxId}`,
      `${t('companyMunicipality')}: ${companyInfo.municipality}`,
      `${t('companyCity')}: ${companyInfo.city}`,
      `${t('companyStreetAddress')}: ${companyInfo.streetAddress}`,
      `${t('companyPostalCode')}: ${companyInfo.postalCode}`,
      `${t('companyPostOffice')}: ${companyInfo.postOffice}`,
      `${t('companyEmail')}: ${companyInfo.email}`,
      `${t('companyActivityCode')}: ${companyInfo.activityCode}`,
      ``,
      `${t('companyBankAccounts')}:`,
      ...companyInfo.bankAccounts.map((acc, i) => `  ${i + 1}. ${acc}`),
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setSnackbarSeverity('success');
    setSnackbarMessage(t('allDetailsCopied'));
  };

  const handleStartEdit = () => {
    setFormData({ ...companyInfo, bankAccounts: [...companyInfo.bankAccounts] });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFormData({ ...companyInfo, bankAccounts: [...companyInfo.bankAccounts] });
    setIsEditing(false);
  };

  const handleFieldChange = (field: keyof CompanyInfo, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBankAccountChange = (index: number, value: string) => {
    setFormData((prev) => {
      const accounts = [...prev.bankAccounts];
      accounts[index] = value;
      return { ...prev, bankAccounts: accounts };
    });
  };

  const handleAddBankAccount = () => {
    setFormData((prev) => ({
      ...prev,
      bankAccounts: [...prev.bankAccounts, ''],
    }));
  };

  const handleRemoveBankAccount = (index: number) => {
    setFormData((prev) => {
      const accounts = prev.bankAccounts.filter((_, i) => i !== index);
      return { ...prev, bankAccounts: accounts.length > 0 ? accounts : [''] };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        bankAccounts: formData.bankAccounts.map((a) => a.trim()).filter(Boolean),
      };

      const res = await apiFetch('/api/company-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to update company info');
      }

      const updated = await res.json();
      setCompanyInfo(updated);
      setFormData(updated);
      setIsEditing(false);
      setSnackbarSeverity('success');
      setSnackbarMessage(t('msgCompanyInfoSaved'));
    } catch (err: any) {
      console.error(err);
      setSnackbarSeverity('error');
      setSnackbarMessage(t('msgCompanyInfoSaveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const cardBg = isDark ? alpha(theme.palette.background.paper, 0.6) : alpha('#f8fafc', 0.95);
  const cardBorder = isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)';

  return (
    <>
      <Dialog
        open={open}
        onClose={isSaving ? undefined : onClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              backgroundImage: 'none',
              boxShadow: isDark
                ? '0 24px 48px -12px rgba(0, 0, 0, 0.7)'
                : '0 24px 48px -12px rgba(15, 23, 42, 0.18)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.06)',
              overflow: 'hidden',
            },
          },
        }}
      >
        {/* MODAL HEADER */}
        <DialogTitle
          sx={{
            py: 1.5,
            px: { xs: 2, sm: 2.5 },
            bgcolor: 'background.paper',
            color: 'text.primary',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                p: 0.6,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BusinessIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.05rem' }}>
              {t('companyInfoTitle')}
            </Typography>
          </Box>

          <IconButton
            onClick={onClose}
            disabled={isSaving}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                color: 'text.primary',
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        {/* MODAL CONTENT */}
        <DialogContent sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress size={36} />
            </Box>
          ) : (
            <>
              {/* SECTION 1: BASIC & LEGAL IDENTIFICATION */}
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                    mb: 1.25,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                  }}
                >
                  <BadgeIcon fontSize="small" sx={{ fontSize: 16, color: 'primary.main' }} />
                  {t('companyBasicInfoSection')}
                </Typography>

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        size="small"
                        label={t('companyName')}
                        value={formData.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                      />
                    ) : (
                      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: cardBg, border: cardBorder, height: '100%' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          {t('companyName')}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.25 }}>
                          {companyInfo.name}
                        </Typography>
                      </Paper>
                    )}
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        size="small"
                        label={t('companyLegalName')}
                        value={formData.legalName}
                        onChange={(e) => handleFieldChange('legalName', e.target.value)}
                      />
                    ) : (
                      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: cardBg, border: cardBorder, height: '100%' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          {t('companyLegalName')}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.25 }}>
                          {companyInfo.legalName}
                        </Typography>
                      </Paper>
                    )}
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        size="small"
                        label={t('companyRegistrationNumber')}
                        value={formData.registrationNumber}
                        onChange={(e) => handleFieldChange('registrationNumber', e.target.value)}
                      />
                    ) : (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: cardBg,
                          border: cardBorder,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            {t('companyRegistrationNumber')}
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 700, color: 'text.primary', mt: 0.25, letterSpacing: '0.05em' }}
                          >
                            {companyInfo.registrationNumber}
                          </Typography>
                        </Box>
                        <Tooltip title={copiedKey === 'mb' ? t('copiedToClipboard') : t('copyAccountTooltip')}>
                          <IconButton
                            size="small"
                            onClick={() => handleCopy(companyInfo.registrationNumber, 'mb')}
                            color={copiedKey === 'mb' ? 'success' : 'default'}
                          >
                            {copiedKey === 'mb' ? <CheckCircleIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </Paper>
                    )}
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        size="small"
                        label={t('companyTaxId')}
                        value={formData.taxId}
                        onChange={(e) => handleFieldChange('taxId', e.target.value)}
                      />
                    ) : (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: cardBg,
                          border: cardBorder,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            {t('companyTaxId')}
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 700, color: 'text.primary', mt: 0.25, letterSpacing: '0.05em' }}
                          >
                            {companyInfo.taxId}
                          </Typography>
                        </Box>
                        <Tooltip title={copiedKey === 'pib' ? t('copiedToClipboard') : t('copyAccountTooltip')}>
                          <IconButton
                            size="small"
                            onClick={() => handleCopy(companyInfo.taxId, 'pib')}
                            color={copiedKey === 'pib' ? 'success' : 'default'}
                          >
                            {copiedKey === 'pib' ? <CheckCircleIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </Paper>
                    )}
                  </Grid>
                </Grid>
              </Box>

              {/* SECTION 2: REGISTERED ADDRESS & LOCATION */}
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                    mb: 1.25,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                  }}
                >
                  <LocationOnIcon fontSize="small" sx={{ fontSize: 16, color: 'error.main' }} />
                  {t('companyAddressSection')}
                </Typography>

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        size="small"
                        label={t('companyStreetAddress')}
                        value={formData.streetAddress}
                        onChange={(e) => handleFieldChange('streetAddress', e.target.value)}
                      />
                    ) : (
                      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: cardBg, border: cardBorder }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          {t('companyStreetAddress')}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.25 }}>
                          {companyInfo.streetAddress}
                        </Typography>
                      </Paper>
                    )}
                  </Grid>

                  <Grid size={{ xs: 6, sm: 3 }}>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        size="small"
                        label={t('companyPostalCode')}
                        value={formData.postalCode}
                        onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                      />
                    ) : (
                      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: cardBg, border: cardBorder }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          {t('companyPostalCode')}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.25 }}>
                          {companyInfo.postalCode}
                        </Typography>
                      </Paper>
                    )}
                  </Grid>

                  <Grid size={{ xs: 6, sm: 3 }}>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        size="small"
                        label={t('companyPostOffice')}
                        value={formData.postOffice}
                        onChange={(e) => handleFieldChange('postOffice', e.target.value)}
                      />
                    ) : (
                      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: cardBg, border: cardBorder }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          {t('companyPostOffice')}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.25 }}>
                          {companyInfo.postOffice}
                        </Typography>
                      </Paper>
                    )}
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        size="small"
                        label={t('companyMunicipality')}
                        value={formData.municipality}
                        onChange={(e) => handleFieldChange('municipality', e.target.value)}
                      />
                    ) : (
                      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: cardBg, border: cardBorder }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          {t('companyMunicipality')}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.25 }}>
                          {companyInfo.municipality}
                        </Typography>
                      </Paper>
                    )}
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        size="small"
                        label={t('companyCity')}
                        value={formData.city}
                        onChange={(e) => handleFieldChange('city', e.target.value)}
                      />
                    ) : (
                      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: cardBg, border: cardBorder }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          {t('companyCity')}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.25 }}>
                          {companyInfo.city}
                        </Typography>
                      </Paper>
                    )}
                  </Grid>
                </Grid>
              </Box>

              {/* SECTION 3: CONTACT & ACTIVITY */}
              <Box>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        size="small"
                        label={t('companyEmail')}
                        value={formData.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                      />
                    ) : (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: cardBg,
                          border: cardBorder,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}
                          >
                            <EmailIcon sx={{ fontSize: 14, color: 'info.main' }} />
                            {t('companyEmail')}
                          </Typography>
                          <Typography
                            component="a"
                            href={`mailto:${companyInfo.email}`}
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: 'primary.main',
                              mt: 0.25,
                              display: 'block',
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            {companyInfo.email}
                          </Typography>
                        </Box>
                        <Tooltip title={copiedKey === 'email' ? t('copiedToClipboard') : t('copyAccountTooltip')}>
                          <IconButton
                            size="small"
                            onClick={() => handleCopy(companyInfo.email, 'email')}
                            color={copiedKey === 'email' ? 'success' : 'default'}
                          >
                            {copiedKey === 'email' ? <CheckCircleIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </Paper>
                    )}
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        size="small"
                        label={t('companyActivityCode')}
                        value={formData.activityCode}
                        onChange={(e) => handleFieldChange('activityCode', e.target.value)}
                      />
                    ) : (
                      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: cardBg, border: cardBorder }}>
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.secondary', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                          <WorkIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                          {t('companyActivityCode')}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.25 }}>
                          {companyInfo.activityCode}
                        </Typography>
                      </Paper>
                    )}
                  </Grid>
                </Grid>
              </Box>

              {/* SECTION 4: BANK ACCOUNTS */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: '0.05em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                    }}
                  >
                    <AccountBalanceIcon fontSize="small" sx={{ fontSize: 16, color: 'success.main' }} />
                    {t('companyBankAccounts')} ({isEditing ? formData.bankAccounts.length : companyInfo.bankAccounts.length})
                  </Typography>

                  {isEditing && (
                    <Button
                      size="small"
                      startIcon={<AddIcon fontSize="small" />}
                      onClick={handleAddBankAccount}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      {t('btnAddBankAccount')}
                    </Button>
                  )}
                </Box>

                <Grid container spacing={1.5}>
                  {(isEditing ? formData.bankAccounts : companyInfo.bankAccounts).map((account, index) => {
                    const accKey = `acc-${index}`;
                    const isCopied = copiedKey === accKey;

                    return (
                      <Grid size={{ xs: 12, sm: 6 }} key={index}>
                        {isEditing ? (
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1,
                              borderRadius: 2,
                              bgcolor: cardBg,
                              border: cardBorder,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: 'text.secondary',
                                flexShrink: 0,
                              }}
                            >
                              {index + 1}
                            </Box>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="xxx-xxxxxxxxxxxxx-xx"
                              value={account}
                              onChange={(e) => handleBankAccountChange(index, e.target.value)}
                              sx={{
                                '& input': {
                                  fontFamily: 'monospace',
                                  fontWeight: 600,
                                },
                              }}
                            />
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveBankAccount(index)}
                              disabled={formData.bankAccounts.length <= 1}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Paper>
                        ) : (
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1.25,
                              px: 1.5,
                              borderRadius: 2,
                              bgcolor: cardBg,
                              border: cardBorder,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                borderColor: isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(2, 132, 199, 0.4)',
                                bgcolor: isDark ? alpha(theme.palette.background.paper, 0.8) : '#ffffff',
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, overflow: 'hidden' }}>
                              <Box
                                sx={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: '50%',
                                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  color: 'text.secondary',
                                  flexShrink: 0,
                                }}
                              >
                                {index + 1}
                              </Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: 'monospace',
                                  fontWeight: 700,
                                  color: 'text.primary',
                                  letterSpacing: '0.04em',
                                  fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {account}
                              </Typography>
                            </Box>

                            <Tooltip title={isCopied ? t('copiedToClipboard') : t('copyAccountTooltip')}>
                              <IconButton
                                size="small"
                                onClick={() => handleCopy(account, accKey)}
                                color={isCopied ? 'success' : 'default'}
                                sx={{ ml: 1, flexShrink: 0 }}
                              >
                                {isCopied ? <CheckCircleIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          </Paper>
                        )}
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            </>
          )}
        </DialogContent>

        <Divider />

        {/* MODAL ACTIONS */}
        <DialogActions sx={{ p: 2, px: 3, justifyContent: 'space-between' }}>
          {isEditing ? (
            <>
              <Button
                variant="outlined"
                size="small"
                onClick={handleCancelEdit}
                disabled={isSaving}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {t('btnCancelEdit')}
              </Button>

              <Button
                variant="contained"
                size="small"
                startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
                onClick={handleSave}
                disabled={isSaving}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                }}
              >
                {t('btnSaveCompanyInfo')}
              </Button>
            </>
          ) : (
            <>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon fontSize="small" />}
                  onClick={handleStartEdit}
                  disabled={isLoading}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  {t('btnEditCompanyInfo')}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ContentCopyIcon fontSize="small" />}
                  onClick={handleCopyAll}
                  disabled={isLoading}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  {t('btnCopyAllDetails')}
                </Button>
              </Box>

              <Button
                variant="contained"
                size="small"
                onClick={onClose}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                }}
              >
                {t('btnCancel') || 'Close'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* SNACKBAR FEEDBACK */}
      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={2500}
        onClose={() => setSnackbarMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarMessage(null)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2, fontWeight: 600 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};
