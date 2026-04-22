export type DataMode = 'auto' | 'api' | 'fallback';

export interface ApiListResponse<T> {
  items: T[];
  total: number;
}

const DEFAULT_LOCAL_API_URL = 'http://localhost:8000/api';
const DATA_MODE_STORAGE_KEY = 'app_data_mode';
const VALID_DATA_MODES = new Set<DataMode>(['auto', 'api', 'fallback']);

function readEnvValue(key: string): string | undefined {
  if (typeof import.meta === 'undefined' || !import.meta.env) {
    return undefined;
  }

  const value = import.meta.env[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function getApiBaseUrl(): string {
  const envValue = readEnvValue('VITE_API_URL');
  if (envValue) {
    return envValue;
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return '/api';
    }
  }

  return DEFAULT_LOCAL_API_URL;
}

export function getDataMode(): DataMode {
  if (typeof window !== 'undefined') {
    const persistedMode = window.localStorage.getItem(DATA_MODE_STORAGE_KEY);
    if (persistedMode && VALID_DATA_MODES.has(persistedMode as DataMode)) {
      return persistedMode as DataMode;
    }
  }

  const envMode = readEnvValue('VITE_DATA_MODE');
  if (envMode && VALID_DATA_MODES.has(envMode as DataMode)) {
    return envMode as DataMode;
  }

  return 'auto';
}

export function buildQueryString(
  params: Record<string, string | number | boolean | null | undefined>,
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function resolveUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(resolveUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API ${response.status}: ${detail || response.statusText}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

export async function callWithFallback<T>(
  apiCall: () => Promise<T>,
  fallbackCall: () => Promise<T> | T,
): Promise<T> {
  const mode = getDataMode();

  if (mode === 'fallback') {
    return await fallbackCall();
  }

  try {
    return await apiCall();
  } catch (error) {
    if (mode === 'api') {
      throw error;
    }

    console.warn('API unavailable, falling back to local db.', error);
    return await fallbackCall();
  }
}
