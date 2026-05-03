/**
 * Client API minimaliste : injecte le Bearer token et gère le refresh auto sur 401.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

let accessToken: string | null = null;
let refreshing: Promise<string | null> | null = null;

export function setAccessToken(t: string | null) {
  accessToken = t;
  if (typeof window !== 'undefined') {
    if (t) localStorage.setItem('tif_access_token', t);
    else   localStorage.removeItem('tif_access_token');
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== 'undefined') {
    accessToken = localStorage.getItem('tif_access_token');
  }
  return accessToken;
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = await res.json();
      setAccessToken(data.accessToken);
      return data.accessToken as string;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface ApiOpts extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean; // par défaut true
}

export async function api<T = unknown>(path: string, opts: ApiOpts = {}): Promise<T> {
  const { body, auth = true, headers: hdrs, ...rest } = opts;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(hdrs as Record<string, string>),
  };
  const token = auth ? getAccessToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  // Si 401 et qu'on a un token expiré, on tente un refresh + retry une fois
  if (res.status === 401 && auth && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retry = await fetch(`${API_URL}${path}`, {
        ...rest,
        headers: { ...headers, Authorization: `Bearer ${newToken}` },
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      });
      return handleResponse<T>(retry);
    }
  }
  return handleResponse<T>(res);
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, data?.error || res.statusText, data?.details);
  }
  return data as T;
}

export const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
