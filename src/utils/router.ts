/**
 * Resolves the router basename dynamically based on the current execution environment.
 *
 * Scenarios:
 * 1. GitHub Pages project subpath deployment (https://user.github.io/my-repo/...):
 *    Returns '/my-repo' (preserving exact case from URL).
 * 2. Custom domains configured via VITE_HOSTNAMES (comma-separated, supports *.domain):
 *    Returns '/' (served from domain root).
 * 3. Local development (http://localhost:3000/ or 127.0.0.1):
 *    Returns '/'.
 * 4. Fallback to Vite's import.meta.env.BASE_URL when applicable.
 */
function matchesCustomHostname(hostname: string, rawHostnames?: string): boolean {
  if (!rawHostnames) {
    return false;
  }

  const normalizedHost = hostname.toLowerCase();
  const entries = rawHostnames
    .split(',')
    .map((entry) => entry.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
    .filter(Boolean);

  return entries.some((entry) => {
    if (entry.startsWith('*.')) {
      return normalizedHost.endsWith(entry.slice(1));
    }
    if (entry.startsWith('.')) {
      return normalizedHost.endsWith(entry);
    }
    return normalizedHost === entry;
  });
}

export function getRouterBasename(): string {
  if (typeof window === 'undefined') {
    return '/';
  }

  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  // 1. Custom domain or local development is always hosted at domain root
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    matchesCustomHostname(hostname, import.meta.env.VITE_HOSTNAMES)
  ) {
    return '/';
  }

  // 2. GitHub Pages domain (*.github.io) without custom domain:
  // Any path segment that isn't an internal app route is treated as the repo basename
  if (hostname.endsWith('.github.io')) {
    const firstSegment = pathname.split('/').filter(Boolean)[0];
    if (firstSegment && !['project-tracker', 'data-management'].includes(firstSegment)) {
      return `/${firstSegment}`;
    }
  }

  // 3. Fallback to Vite base if set and not root or relative dot
  const viteBase = import.meta.env.BASE_URL;
  if (viteBase && viteBase !== './' && viteBase !== '/') {
    return viteBase.replace(/\/$/, '');
  }

  return '/';
}
