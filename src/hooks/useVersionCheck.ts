import { useState, useEffect, useCallback, useRef } from 'react';

interface VersionInfo {
  version: string;
  buildTime?: string;
}

export function useVersionCheck(intervalMs = 3 * 60 * 1000) {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string>(typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0');
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);
  const isCheckingRef = useRef(false);

  const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';
  const currentBuildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : '';

  const checkForUpdate = useCallback(async () => {
    // Avoid concurrent requests
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;

    try {
      // In dev mode (hot module replacement), avoid annoying false alarms if vite is constantly updating
      const isDev = import.meta.env.DEV;

      // Add a timestamp query param to completely bust any intermediate or browser cache
      const response = await fetch(`${import.meta.env.BASE_URL}version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      if (!response.ok) return;

      const data: VersionInfo = await response.json();

      if (data && data.version) {
        // Compare version or buildTime
        const isVersionDifferent = data.version !== currentVersion;
        const isBuildDifferent = !isDev && Boolean(data.buildTime && currentBuildTime && data.buildTime !== currentBuildTime);

        if (isVersionDifferent || isBuildDifferent) {
          const updateIdentifier = `${data.version}_${data.buildTime || ''}`;
          if (dismissedVersion !== updateIdentifier) {
            setLatestVersion(data.version);
            setHasUpdate(true);
          }
        }
      }
    } catch {
      // Silently ignore network or offline errors
    } finally {
      isCheckingRef.current = false;
    }
  }, [currentVersion, currentBuildTime, dismissedVersion]);

  useEffect(() => {
    // Initial check after a short delay so it doesn't block initial page load
    const initialTimer = setTimeout(() => {
      checkForUpdate();
    }, 2000);

    // Periodic check interval
    const interval = setInterval(() => {
      if (!document.hidden) {
        checkForUpdate();
      }
    }, intervalMs);

    // Check when user switches back to the application tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForUpdate, intervalMs]);

  const reloadApp = useCallback(() => {
    // Force reload bypassing cache
    window.location.reload();
  }, []);

  const dismissUpdate = useCallback(() => {
    setHasUpdate(false);
    setDismissedVersion(`${latestVersion}_${Date.now()}`);
  }, [latestVersion]);

  return {
    hasUpdate,
    currentVersion,
    latestVersion,
    reloadApp,
    dismissUpdate,
  };
}
