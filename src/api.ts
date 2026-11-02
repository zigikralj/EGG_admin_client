import { STORAGE_KEYS, APP_EVENTS } from './constants';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

export async function apiFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const customInit: RequestInit = { ...init };
  const headers = new Headers(customInit.headers || {});

  // Automatically attach auth token if available and not already set
  if (!headers.has('Authorization')) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Fallback X-Session-Id
  if (!headers.has('X-Session-Id')) {
    try {
      const sid =
        (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACTIVITY_SESSION_ID) : null) ||
        (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(STORAGE_KEYS.ACTIVITY_SESSION_ID) : null);
      if (sid) {
        headers.set('X-Session-Id', sid);
      }
    } catch (e) {
      // Ignore storage errors
    }
  }

  customInit.headers = headers;

  let url: string | URL | Request;
  if (typeof input === 'string') {
    url = getApiUrl(input);
  } else if (input instanceof URL) {
    url = getApiUrl(input.pathname + input.search);
  } else {
    url = input;
  }

  const response = await fetch(url, customInit);

  // Trigger logout if token expired / unauthorized
  const urlString = typeof input === 'string' ? input : (input instanceof URL ? input.pathname : input.url);
  if (response.status === 401 && !urlString.includes('/auth/login') && !urlString.includes('/auth/register')) {
    window.dispatchEvent(new CustomEvent(APP_EVENTS.AUTH_EXPIRED, { detail: { url: urlString } }));
  }

  return response;
}
