const CSRF_KEY = 'csrf_token';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL;
  if (url) return url.replace(/\/$/, '');
  return ''; // same origin when using Vite proxy
};

export function getApiUrl(path: string): string {
  const base = getBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}/api${p}`;
}

function getCsrfHeader(): Record<string, string> {
  const csrf = localStorage.getItem(CSRF_KEY);
  if (!csrf) return {};
  return { 'X-CSRF-Token': csrf };
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {}
): Promise<T> {
  const { params, ...init } = options;
  let url = getApiUrl(path);
  if (params && Object.keys(params).length) {
    const search = new URLSearchParams(params).toString();
    url += (url.includes('?') ? '&' : '?') + search;
  }
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...getCsrfHeader(),
    ...(init.headers || {}),
  };
  const res = await fetch(url, { ...init, headers, credentials: 'include' });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.detail;
    const msg =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail) && detail[0]?.msg
          ? detail[0].msg
          : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}
