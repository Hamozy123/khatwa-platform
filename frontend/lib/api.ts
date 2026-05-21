const TOKEN_KEY = 'khatwa_token';
const USER_KEY = 'khatwa_user';

export function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const port = process.env.NEXT_PUBLIC_API_PORT || '3001';
    return `http://${window.location.hostname}:${port}/api`;
  }
  return 'http://localhost:3001/api';
}

export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export type UserProfile = {
  id: number;
  username: string;
  role: string;
  governorate?: string;
  directorate?: string;
  administration?: string;
  schoolName?: string;
};

export function setUser(user: UserProfile) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

async function parseErrorMessage(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const j = JSON.parse(text) as { message?: string | string[] };
    if (Array.isArray(j.message)) {
      return j.message.join(', ');
    }
    if (typeof j.message === 'string') {
      return j.message;
    }
  } catch {
    /* ignore */
  }
  return text || res.statusText;
}

export async function apiFetch<T>(path: string, options: RequestInit & { timeout?: number } = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const url = `${getApiBase()}${path.startsWith('/') ? path : `/${path}`}`;
  const timeout = options.timeout ?? 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const res = await fetch(url, {
    ...options,
    signal: options.signal || controller.signal,
    headers,
  });
  clearTimeout(timeoutId);

  const isLogin = path.replace(/^\//, '').startsWith('auth/login');

  if (res.status === 401 && !isLogin) {
    clearToken();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg || res.statusText || 'Request failed');
  }

  if (res.status === 204) {
    return undefined as T;
  }

  let text: string;
  try {
    text = await res.text();
  } catch {
    return undefined as T;
  }
  if (!text) return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    const contentType = res.headers.get('content-type') || '';
    throw new Error(
      `Invalid JSON response (${res.status} ${res.statusText}, ${contentType}): ${text.slice(0, 200)}`,
    );
  }
}
