// Thin HTTP layer: base URL, bearer auth with single-flight refresh, error normalization.
const RAW_BASE = import.meta.env["VITE_API_BASE_URL"] as string | undefined;
export const API_BASE = RAW_BASE ? RAW_BASE.replace(/\/$/, "") : "";
export const USE_MOCKS = import.meta.env["VITE_USE_MOCKS"] === "true" || !API_BASE;
export const SUPPORT_CONTACT =
  (import.meta.env["VITE_SUPPORT_CONTACT"] as string | undefined) || "support@myevents.africa";

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

export function errorMessage(e: unknown): string {
  return e instanceof ApiError ? e.message : GENERIC;
}

function toStrings(v: unknown): string[] {
  if (Array.isArray(v)) return v.flatMap((x) => (typeof x === "string" ? [x] : toStrings(x)));
  if (typeof v === "string") return [v];
  if (v && typeof v === "object") return Object.values(v).flatMap(toStrings);
  return [];
}

/** Map every backend error shape (spec §8.3) to one ApiError. */
export function normalizeError(status: number, body: unknown): ApiError {
  if (!body || typeof body !== "object") return new ApiError(status, GENERIC);
  const b = body as Record<string, unknown>;
  if (b["error"] === true && typeof b["message"] === "string") {
    const fe: Record<string, string[]> = {};
    const errors = b["errors"];
    if (Array.isArray(errors)) {
      errors.forEach((tier: unknown, i: number) => {
        if (tier && typeof tier === "object")
          for (const [k, v] of Object.entries(tier)) fe[`tiers.${i}.${k}`] = toStrings(v);
      });
    } else if (errors && typeof errors === "object") {
      for (const [k, v] of Object.entries(errors)) fe[k] = toStrings(v);
    }
    const details = typeof b["details"] === "string" ? b["details"] : "";
    if (details) console.warn("[api]", details);
    const err = new ApiError(status, b["message"], fe);
    // Backend gap #4: unknown tickets come back as 400.
    if (details.includes("No Ticket matches")) err.status = 404;
    return err;
  }
  if (typeof b["error"] === "string") return new ApiError(status, b["error"]);
  if (typeof b["detail"] === "string") return new ApiError(status, b["detail"]);
  const fe: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(b)) fe[k] = toStrings(v);
  if (Object.keys(fe).length) return new ApiError(status, "Please fix the highlighted fields", fe);
  return new ApiError(status, GENERIC);
}

// ---------- tokens: access in memory, refresh in localStorage (spec §15) ----------
const REFRESH_KEY = "hostme.refresh";
let accessToken: string | null = null;

function readRefresh(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function hasSession() {
  return !!accessToken || !!readRefresh();
}

export function setTokens(t: { access: string; refresh: string } | null) {
  accessToken = t?.access ?? null;
  try {
    if (t) localStorage.setItem(REFRESH_KEY, t.refresh);
    else localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* storage unavailable: session lasts for this tab only */
  }
}

let onAuthFailure: (() => void) | null = null;
export function setAuthFailureHandler(fn: (() => void) | null) {
  onAuthFailure = fn;
}

// ---------- transport ----------
interface RawResponse {
  status: number;
  data: unknown;
}

async function transport(
  method: string,
  path: string,
  headers: Record<string, string>,
  body?: BodyInit | null,
): Promise<RawResponse> {
  if (USE_MOCKS) {
    // The simulated backend (and its QR library) only loads in demo mode.
    const { mockTransport } = await import("./mock");
    return mockTransport(method, path, headers, body ?? null);
  }
  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: body ?? null });
  let data: unknown = null;
  if (res.status !== 204) {
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
  }
  return { status: res.status, data };
}

// One refresh in flight, shared by every concurrent 401.
let refreshing: Promise<boolean> | null = null;
function refreshAccess(): Promise<boolean> {
  const refresh = readRefresh();
  if (!refresh) return Promise.resolve(false);
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const r = await transport(
          "POST",
          "/refresh_token/",
          { "Content-Type": "application/json", Accept: "application/json" },
          JSON.stringify({ refresh }),
        );
        const access = (r.data as { access?: string } | null)?.access;
        if (r.status === 200 && access) {
          accessToken = access;
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        setTimeout(() => (refreshing = null), 0);
      }
    })();
  }
  return refreshing;
}

export interface RequestOptions {
  method?: string;
  json?: unknown;
  form?: FormData;
  /** Console endpoints only. Never send the token to public endpoints (spec §8.2). */
  auth?: boolean;
}

export async function request<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const method = opts.method || "GET";
  const send = async (): Promise<RawResponse> => {
    const headers: Record<string, string> = { Accept: "application/json" };
    let body: BodyInit | null = null;
    if (opts.form) body = opts.form;
    else if (opts.json !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(opts.json);
    }
    if (opts.auth && accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    return transport(method, path, headers, body);
  };

  // After a reload only the refresh token survives; get an access token first.
  if (opts.auth && !accessToken && readRefresh()) await refreshAccess();

  let res: RawResponse;
  try {
    res = await send();
  } catch {
    throw new ApiError(0, GENERIC);
  }
  if (res.status === 401 && opts.auth) {
    if (await refreshAccess()) {
      try {
        res = await send();
      } catch {
        throw new ApiError(0, GENERIC);
      }
    }
    if (res.status === 401) {
      setTokens(null);
      onAuthFailure?.();
    }
  }
  if (res.status >= 400) throw normalizeError(res.status, res.data);
  return res.data as T;
}
