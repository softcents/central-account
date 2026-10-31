const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api';
};

export const API_URL = '/api';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  statusCode?: number;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<{ ok: boolean; status: number; data: T }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-CSRF-Protection': '1',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const base = typeof window !== 'undefined' ? '/api' : getApiUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const finalPath = cleanEndpoint.startsWith('/api/') ? cleanEndpoint.replace(/^\/api/, '') : cleanEndpoint;

  const res = await fetch(`${base}${finalPath}`, {
    ...options,
    headers,
    credentials: 'include', // sends and receives httpOnly cookies
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return {
    ok: res.ok,
    status: res.status,
    data,
  };
}
