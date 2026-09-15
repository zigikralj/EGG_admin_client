/**
 * Resolves the router basename dynamically based on the current execution environment.
 *
 * Scenarios:
 * 1. Current GitHub Pages deployment (https://zigikralj.github.io/Egg_admin_client/...):
 *    Returns '/Egg_admin_client' (preserving exact case from URL).
 * 2. Future custom domain (https://project-tracker.ekosgroup.rs/... or any *.ekosgroup.rs):
 *    Returns '/' (served from domain root).
 * 3. Local development (http://localhost:3000/ or 127.0.0.1):
 *    Returns '/'.
 * 4. Fallback to Vite's import.meta.env.BASE_URL when applicable.
 */
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
    hostname === 'project-tracker.ekosgroup.rs' ||
    hostname.endsWith('.ekosgroup.rs')
  ) {
    return '/';
  }

  // 2. Path-based detection for repository subfolder (e.g. /Egg_admin_client/...)
  // Case-insensitive match that preserves the casing in the URL
  const repoMatch = pathname.match(/^\/(egg_admin_client)(?:\/|$)/i);
  if (repoMatch) {
    return `/${repoMatch[1]}`;
  }

  // 3. GitHub Pages domain (*.github.io) without custom domain:
  // Any path segment that isn't an internal app route is treated as the repo basename
  if (hostname.endsWith('.github.io')) {
    const firstSegment = pathname.split('/').filter(Boolean)[0];
    if (firstSegment && !['project-tracker', 'data-management'].includes(firstSegment)) {
      return `/${firstSegment}`;
    }
  }

  // 4. Fallback to Vite base if set and not root or relative dot
  const viteBase = import.meta.env.BASE_URL;
  if (viteBase && viteBase !== './' && viteBase !== '/') {
    return viteBase.replace(/\/$/, '');
  }

  return '/';
}
