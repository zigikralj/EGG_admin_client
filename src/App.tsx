import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LoadingProvider } from './context/LoadingContext';
import { ProjectModalProvider } from './context/ProjectModalContext';
import { CustomThemeProvider } from './context/ThemeContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { LoadingMask } from './components/common/LoadingMask';
import { VersionUpdatePrompt } from './components/common/dialogs/VersionUpdatePrompt';
import { LoginPage } from './pages/auth/LoginPage';
import { usePreferencesQuery, usePreferencesMutations } from './queries';
import { useActivityTracker } from './hooks/useActivityTracker';
import { AppRoutes } from './routes';
import './index.css';

function MainApp() {
  useActivityTracker();
  const { currentUser } = useAuth();
  const { data: userPreferences = {} } = usePreferencesQuery();
  const { updatePreferenceMutation } = usePreferencesMutations();
  const updatePreference = (key: string, value: any) => updatePreferenceMutation.mutate({ key, value });

  if (!currentUser) {
    return (
      <CustomThemeProvider
        initialMode={userPreferences.theme || 'light'}
        onThemeChange={(mode) => updatePreference('theme', mode)}
      >
        <LoginPage />
        <LoadingMask />
        <VersionUpdatePrompt />
      </CustomThemeProvider>
    );
  }

  return (
    <CustomThemeProvider
      initialMode={userPreferences.theme || 'light'}
      onThemeChange={(mode) => updatePreference('theme', mode)}
    >
      <ProjectModalProvider>
        <AdminLayout
          userPreferences={userPreferences}
          onPreferenceChange={updatePreference}
        >
          <AppRoutes />
          <VersionUpdatePrompt />
        </AdminLayout>
      </ProjectModalProvider>
      <LoadingMask />
    </CustomThemeProvider>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NotificationProvider>
          <LoadingProvider>
            <MainApp />
          </LoadingProvider>
        </NotificationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
