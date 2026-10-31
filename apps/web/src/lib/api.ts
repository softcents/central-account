const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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

  const res = await fetch(`${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, {
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

export { API_URL };
