import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Paper,
  Chip,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import logoUrl from '../../assets/logo.svg';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { LanguageSelector } from '../LanguageSelector';

export const LoginView: React.FC = () => {
  const { t } = useLanguage();
  const { login, register } = useAuth();

  const [tabIndex, setTabIndex] = useState<number>(0);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginErrorCode, setLoginErrorCode] = useState<string | null>(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginErrorCode(null);

    if (!loginIdentifier.trim() || !loginPassword) {
      setLoginError(t('errInvalidCredentials'));
      return;
    }

    setIsSubmittingLogin(true);
    try {
      const res = await login(loginIdentifier, loginPassword);
      if (!res.success) {
        setLoginErrorCode(res.errorCode || null);
        if (res.errorCode === 'PENDING_APPROVAL') {
          setLoginError(t('errPendingApproval'));
        } else if (res.errorCode === 'ACCOUNT_BLOCKED') {
          setLoginError(t('errAccountBlocked'));
        } else if (res.errorCode === 'ACCOUNT_REJECTED') {
          setLoginError(t('errAccountRejected'));
        } else {
          setLoginError(res.message || t('errInvalidCredentials'));
        }
      }
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!regName.trim()) {
      setRegError(t('colFullName') + ' is required.');
      return;
    }
    if (!regEmail.trim()) {
      setRegError(t('colEmail') + ' is required.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    setIsSubmittingReg(true);
    try {
      const res = await register({
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
      });

      if (res.success) {
        setRegSuccess(t('msgRegistrationSuccess'));
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        setRegPassword('');
        setRegConfirmPassword('');
      } else {
        setRegError(res.message);
      }
    } finally {
      setIsSubmittingReg(false);
    }
  };

  const fillQuickDemo = (email: string) => {
    setTabIndex(0);
    setLoginIdentifier(email);
    setLoginPassword('password123');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
            : 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 50%, #f8fafc 100%)',
        py: 4,
        px: 2,
        position: 'relative',
      }}
    >
      {/* Top Header Actions */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <LanguageSelector />
      </Box>

      {/* Main Container */}
      <Card
        elevation={8}
        sx={{
          maxWidth: 460,
          width: '100%',
          borderRadius: 3.5,
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Header Banner */}
        <Box
          sx={{
            py: 3.5,
            px: 3,
            textAlign: 'center',
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                : 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
            color: '#fff',
          }}
        >
          <Box
            component="img"
            src={logoUrl}
            alt="Ekos Logo"
            sx={{
              height: 52,
              mb: 1.5,
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.3))',
            }}
          />
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
            {t('brandCompany')}
          </Typography>
          <Typography variant="subtitle2" sx={{ opacity: 0.85, fontWeight: 500 }}>
            {t('headerProjectTracker')} – {t('brandLocation')}
          </Typography>
        </Box>

        {/* Tabs for Login vs Register */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Tabs
            value={tabIndex}
            onChange={(_, val) => {
              setTabIndex(val);
              setLoginError(null);
              setRegError(null);
              setRegSuccess(null);
            }}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label={t('tabLogin')} id="tab-login" sx={{ fontWeight: 600, py: 1.8 }} />
            <Tab label={t('tabRegister')} id="tab-register" sx={{ fontWeight: 600, py: 1.8 }} />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3.5 }}>
          {/* TAB 0: LOGIN */}
          {tabIndex === 0 && (
            <Box component="form" onSubmit={handleLoginSubmit} noValidate>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {t('loginTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('loginSubtitle')}
              </Typography>

              {loginError && (
                <Alert
                  severity={loginErrorCode === 'PENDING_APPROVAL' ? 'warning' : 'error'}
                  icon={loginErrorCode === 'PENDING_APPROVAL' ? <HourglassEmptyIcon /> : undefined}
                  sx={{ mb: 2.5, borderRadius: 2 }}
                >
                  {loginError}
                </Alert>
              )}

              <TextField
                fullWidth
                label={t('lblEmailOrUsername')}
                placeholder={t('phEmailOrUsername')}
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                margin="normal"
                required
                autoFocus
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                label={t('lblPassword')}
                placeholder={t('phPassword')}
                type={showLoginPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                margin="normal"
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowLoginPassword((prev) => !prev)}
                          edge="end"
                        >
                          {showLoginPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmittingLogin}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.3,
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: '1rem',
                  textTransform: 'none',
                  boxShadow: 2,
                }}
              >
                {isSubmittingLogin ? <CircularProgress size={24} color="inherit" /> : t('btnLogin')}
              </Button>

              {/* Demo Accounts Quick Login Assistance */}
              <Paper variant="outlined" sx={{ p: 2, mt: 3, borderRadius: 2, bgcolor: 'action.hover' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                  Demo Accounts (Password: <code>password123</code>):
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label="Admin (Aleksandar)"
                    size="small"
                    color="secondary"
                    clickable
                    onClick={() => fillQuickDemo('aleksandar@ekosgreen.rs')}
                  />
                  <Chip
                    label="Manager (Nenad)"
                    size="small"
                    color="primary"
                    clickable
                    onClick={() => fillQuickDemo('nenad@ekosgreen.rs')}
                  />
                  <Chip
                    label="User (Marija)"
                    size="small"
                    color="success"
                    clickable
                    onClick={() => fillQuickDemo('marija@ekosgreen.rs')}
                  />
                  <Chip
                    label="Blocked (Jovana)"
                    size="small"
                    color="error"
                    clickable
                    onClick={() => fillQuickDemo('jovana@ekosgreen.rs')}
                  />
                  <Chip
                    label="Pending (Marko)"
                    size="small"
                    color="warning"
                    clickable
                    onClick={() => fillQuickDemo('marko@ekosgreen.rs')}
                  />
                </Box>
              </Paper>
            </Box>
          )}

          {/* TAB 1: REGISTER */}
          {tabIndex === 1 && (
            <Box component="form" onSubmit={handleRegisterSubmit} noValidate>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {t('tabRegister')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                Fill out your details to submit a registration request.
              </Typography>

              {regSuccess && (
                <Alert
                  severity="success"
                  icon={<CheckCircleIcon fontSize="inherit" />}
                  sx={{ mb: 2.5, borderRadius: 2 }}
                >
                  {regSuccess}
                </Alert>
              )}

              {regError && (
                <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                  {regError}
                </Alert>
              )}

              <TextField
                fullWidth
                label={t('colFullName')}
                placeholder="e.g. Marko Nikolić"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                margin="dense"
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                label={t('colEmail')}
                placeholder="marko@example.com"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                margin="dense"
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                label={t('colPhone')}
                placeholder="+381 64 123 4567"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                margin="dense"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                label={t('lblPassword')}
                placeholder={t('phPassword')}
                type={showRegPassword ? 'text' : 'password'}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                margin="dense"
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowRegPassword((prev) => !prev)}
                          edge="end"
                        >
                          {showRegPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                label={t('lblConfirmPassword')}
                placeholder={t('phConfirmPassword')}
                type={showRegPassword ? 'text' : 'password'}
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                margin="dense"
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmittingReg}
                sx={{
                  mt: 3,
                  mb: 1,
                  py: 1.3,
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: '1rem',
                  textTransform: 'none',
                  boxShadow: 2,
                }}
              >
                {isSubmittingReg ? <CircularProgress size={24} color="inherit" /> : t('btnRegister')}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
