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
    });

    afterEach(() => {
      window.location = originalWindowLocation;
      vi.unstubAllEnvs();
    });

    it('returns / for localhost', () => {
      window.location.hostname = 'localhost';
      expect(getRouterBasename()).toBe('/');
      
      window.location.hostname = '127.0.0.1';
      expect(getRouterBasename()).toBe('/');
    });

    it('returns / for custom ekosgroup domains', () => {
      window.location.hostname = 'project-tracker.ekosgroup.rs';
      expect(getRouterBasename()).toBe('/');
      
      window.location.hostname = 'test.ekosgroup.rs';
      expect(getRouterBasename()).toBe('/');
    });

    it('detects repo name EGG_admin_client from path', () => {
      window.location.hostname = 'some-domain.com';
      window.location.pathname = '/EGG_admin_client/dashboard';
      expect(getRouterBasename()).toBe('/EGG_admin_client');
      
      // case preserving
      window.location.pathname = '/egg_admin_client/dashboard';
      expect(getRouterBasename()).toBe('/egg_admin_client');
    });

    it('detects repo basename from github.io domains', () => {
      window.location.hostname = 'zigikralj.github.io';
      window.location.pathname = '/my-repo-name/dashboard';
      expect(getRouterBasename()).toBe('/my-repo-name');
    });

    it('ignores internal app routes on github.io', () => {
      window.location.hostname = 'zigikralj.github.io';
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
