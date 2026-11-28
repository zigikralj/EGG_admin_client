import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getRouterBasename } from './router';

describe('router utils', () => {
  describe('getRouterBasename', () => {
    let originalWindowLocation: Location;

    beforeEach(() => {
      originalWindowLocation = window.location;
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'localhost',
          pathname: '/',
        },
        writable: true,
      });
      // Mock Vite env
      vi.stubEnv('BASE_URL', '/');
      vi.stubEnv('VITE_HOSTNAMES', '');
    });

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        value: originalWindowLocation,
        writable: true,
        configurable: true,
      });
      vi.unstubAllEnvs();
    });

    it('returns / for localhost', () => {
      window.location.hostname = 'localhost';
      expect(getRouterBasename()).toBe('/');
      
      window.location.hostname = '127.0.0.1';
      expect(getRouterBasename()).toBe('/');
    });

    it('returns / for custom domains configured in VITE_HOSTNAMES', () => {
      vi.stubEnv('VITE_HOSTNAMES', 'app.example.com, *.example.org, custom.example.dev');
      window.location.pathname = '/project-tracker/dashboard';

      window.location.hostname = 'app.example.com';
      expect(getRouterBasename()).toBe('/');

      window.location.hostname = 'sub.example.org';
      expect(getRouterBasename()).toBe('/');

      window.location.hostname = 'custom.example.dev';
      expect(getRouterBasename()).toBe('/');

      window.location.hostname = 'unlisted.example.net';
      vi.stubEnv('BASE_URL', '/app-subpath/');
      window.location.pathname = '/app-subpath/dashboard';
      expect(getRouterBasename()).toBe('/app-subpath');
    });

    it('detects repo basename from github.io domains', () => {
      window.location.hostname = 'user.github.io';
      window.location.pathname = '/my-repo-name/dashboard';
      expect(getRouterBasename()).toBe('/my-repo-name');
    });

    it('ignores internal app routes on github.io', () => {
      window.location.hostname = 'user.github.io';
      window.location.pathname = '/project-tracker'; // this is an internal route
      
      // Fallback to BASE_URL which is '/'
      expect(getRouterBasename()).toBe('/');
    });

    it('falls back to import.meta.env.BASE_URL if set', () => {
      window.location.hostname = 'other-domain.com';
      window.location.pathname = '/some/path';
      vi.stubEnv('BASE_URL', '/vite-base/');
      
      expect(getRouterBasename()).toBe('/vite-base');
    });
  });
});
