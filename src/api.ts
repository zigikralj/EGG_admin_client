const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

export function apiFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  if (typeof input === 'string') {
    return fetch(getApiUrl(input), init);
  }
  if (input instanceof URL) {
    return fetch(getApiUrl(input.pathname + input.search), init);
  }
  return fetch(input, init);
}
