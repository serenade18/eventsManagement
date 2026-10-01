// Thin HTTP layer: base URL, bearer auth with single-flight refresh, error normalization.
import { mockTransport } from "./mock";

const RAW_BASE = import.meta.env["VITE_API_BASE_URL"] as string | undefined;
export const API_BASE = RAW_BASE ? RAW_BASE.replace(/\/$/, "") : "";
export const USE_MOCKS = import.meta.env["VITE_USE_MOCKS"] === "true" || !API_BASE;
export const SUPPORT_CONTACT =
  (import.meta.env["VITE_SUPPORT_CONTACT"] as string | undefined) || "support@hostme.co.ke";

const GENERIC = "Something went wrong. Check your connection and try again.";

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string[]>;
  constructor(status: number, message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function toStrings(v: unknown): string[] {
  if (Array.isArray(v)) return v.flatMap((x) => (typeof x === "string" ? [x] : toStrings(x)));
  if (typeof v === "string") return [v];
  if (v && typeof v === "object") return Object.values(v).flatMap(toStrings);
  return [];
}

export function normalizeError(status: number, body: unknown): ApiError {
  if (!body || typeof body !== "object") return new ApiError(status, GENERIC);
  const b = body as any;
  if (b.error === true && typeof b.message === "string") {
    const fe: Record<string, string[]> = {};
    if (Array.isArray(b.errors)) {
      b.errors.forEach((tier, i) => {
        if (tier && typeof tier === "object")
          for (const [k, v] of Object.entries(tier)) fe[`tiers.${i}.${k}`] = toStrings(v);
      });
    } else if (b.errors && typeof b.errors === "object") {
      for (const [k, v] of Object.entries(b.errors)) fe[k] = toStrings(v);
    }
    if (b.details) console.warn("[api]", b.details);
    const details = typeof b.details === "string" ? b.details : "";
    const err = new ApiError(status, b.message, fe);
    if (details.includes("No Ticket matches")) err.status = 404;
    return err;
  }
  if (typeof b.error === "string") return new ApiError(status, b.error);
  if (typeof b.detail === "string") return new ApiError(status, b.detail);
  const fe: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(b)) fe[k] = toStrings(v);
  if (Object.keys(fe).length) return new ApiError(status, "Please fix the highlighted fields", fe);
  return new ApiError(status, GENERIC);
}

// ---------- tokens ----------
const TOKEN_KEY = "hostme.auth";
export interface Tokens { access: string; refresh: string }
export function getTokens(): Tokens | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(TOKEN_KEY) || "null"); } catch { return null; }
}
export function setTokens(t: Tokens | null) {
  if (t) localStorage.setItem(TOKEN_KEY, JSON.stringify(t));
  else localStorage.removeItem(TOKEN_KEY);
}

let onAuthFailure: (() => void) | null = null;
export function setAuthFailureHandler(fn: () => void) { onAuthFailure = fn; }

// ---------- transport ----------
interface RawResponse { status: number; data: unknown }

async function transport(method: string, path: string, headers: Record<string, string>, body?: BodyInit | null): Promise<RawResponse> {
  if (USE_MOCKS) return mockTransport(method, path, headers, body ?? null);
  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: body ?? null });
  let data: unknown = null;
  if (res.status !== 204) {
    const text = await res.text();
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  }
  return { status: res.status, data };
}

let refreshing: Promise<boolean> | null = null;
async function refreshAccess(): Promise<boolean> {
  const t = getTokens();
  if (!t?.refresh) return false;
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const r = await transport("POST", "/refresh_token/", { "Content-Type": "application/json" }, JSON.stringify({ refresh: t.refresh }));
        const access = (r.data as { access?: string } | null)?.access;
        if (r.status === 200 && access) { setTokens({ ...t, access }); return true; }
        return false;
      } catch { return false; } finally { setTimeout(() => (refreshing = null), 0); }
    })();
  }
  return refreshing;
}

export interface RequestOptions { method?: string; json?: unknown; form?: FormData; auth?: boolean }

export async function request<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const method = opts.method || "GET";
  const send = async (): Promise<RawResponse> => {
    const headers: Record<string, string> = { Accept: "application/json" };
    let body: BodyInit | null = null;
    if (opts.form) body = opts.form;
    else if (opts.json !== undefined) { headers["Content-Type"] = "application/json"; body = JSON.stringify(opts.json); }
    if (opts.auth) { const t = getTokens(); if (t) headers["Authorization"] = `Bearer ${t.access}`; }
    return transport(method, path, headers, body);
  };
  let res: RawResponse;
  try { res = await send(); } catch { throw new ApiError(0, GENERIC); }
  if (res.status === 401 && opts.auth) {
    const ok = await refreshAccess();
    if (ok) {
      try { res = await send(); } catch { throw new ApiError(0, GENERIC); }
    }
    if (res.status === 401) { setTokens(null); onAuthFailure?.(); }
  }
  if (res.status >= 400) throw normalizeError(res.status, res.data);
  return res.data as T;
}
