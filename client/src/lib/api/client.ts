import type { ApiErrorBody } from "./types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;
interface Opts {
  body?: unknown;
  query?: Query;
  headers?: Record<string, string>;
}

function qs(query?: Query) {
  if (!query) return "";
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export async function api<T>(method: string, path: string, opts: Opts = {}): Promise<T> {
  const res = await fetch(`/api/proxy${path}${qs(opts.query)}`, {
    method,
    headers: {
      ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...opts.headers,
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: "same-origin",
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const b = (await res.json()) as ApiErrorBody;
      msg = Array.isArray(b.message) ? b.message.join(", ") : b.message;
    } catch {}
    throw new ApiError(res.status, msg);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const get = <T>(path: string, query?: Query) => api<T>("GET", path, { query });
export const post = <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
  api<T>("POST", path, { body: body ?? {}, headers });
export const patch = <T>(path: string, body?: unknown) => api<T>("PATCH", path, { body: body ?? {} });
