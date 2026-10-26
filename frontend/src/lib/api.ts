// Backend (Bot) ga so'rov yuborish. /api/* — next.config.mjs orqali backendga proksi qilinadi.
import { getInitData } from '@/hooks/useTelegram';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const ADMIN_TOKEN_KEY = 'mira-admin-token';

export const adminToken = {
  get: () => (typeof window === 'undefined' ? null : localStorage.getItem(ADMIN_TOKEN_KEY)),
  set: (t: string) => localStorage.setItem(ADMIN_TOKEN_KEY, t),
  clear: () => localStorage.removeItem(ADMIN_TOKEN_KEY),
};

type Opts = Omit<RequestInit, 'body'> & { body?: unknown; admin?: boolean };

export async function api<T = unknown>(path: string, opts: Opts = {}): Promise<T> {
  const headers: Record<string, string> = { ...(opts.headers as Record<string, string>) };
  const initData = getInitData();
  if (initData) headers['X-Telegram-Init-Data'] = initData;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.admin) {
    const t = adminToken.get();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  const res = await fetch(path, {
    ...opts,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* bo'sh javob */
  }
  if (!res.ok) {
    if (res.status === 401 && opts.admin) adminToken.clear();
    const msg = (data as { error?: string })?.error || `Xatolik (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

export const fetcher = <T,>(path: string) => api<T>(path);
export const adminFetcher = <T,>(path: string) => api<T>(path, { admin: true });
