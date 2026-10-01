import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { getOrder } from "@/lib/api/endpoints";
import type { Order } from "@/lib/api/types";

const FAST_MS = 3_000;
const SLOW_MS = 10_000;
const FAST_WINDOW_MS = 2 * 60_000;
const GRACE_AFTER_EXPIRY_MS = 2 * 60_000;
const MAX_BACKOFF_MS = 30_000;
const TERMINAL = new Set(["paid", "failed", "refund_required"]);

export interface OrderPolling {
  order: Order | null;
  /** Fatal lookup error (e.g. unknown reference). Network blips are not errors. */
  error: ApiError | null;
  reconnecting: boolean;
  /** Polling gave up after expires_at + 2 minutes. */
  gaveUp: boolean;
  startedAt: number;
}

/**
 * Polls GET /orders/:reference/ per spec §10.3: every 3 s for 2 minutes, then every 10 s
 * until expires_at + 2 minutes. Stops on a terminal status, pauses while the tab is hidden,
 * and never turns a network error into a payment failure.
 */
export function useOrderPolling(reference: string, enabled = true): OrderPolling {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const startedAt = useRef(Date.now());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failures = useRef(0);
  const stopped = useRef(false);
  const expiresAt = useRef<number | null>(null);
  const inFlight = useRef(false);

  const tick = useCallback(async () => {
    if (stopped.current || inFlight.current) return;
    if (timer.current) clearTimeout(timer.current);
    if (typeof document !== "undefined" && document.hidden) return; // resumes on visibilitychange
    inFlight.current = true;
    let delay: number;
    try {
      const o = await getOrder(reference);
      failures.current = 0;
      setReconnecting(false);
      setOrder(o);
      expiresAt.current = new Date(o.expires_at).getTime();
      if (TERMINAL.has(o.status)) {
        stopped.current = true;
        return;
      }
      const elapsed = Date.now() - startedAt.current;
      delay = elapsed < FAST_WINDOW_MS && o.status === "pending" ? FAST_MS : SLOW_MS;
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError(0, "Network error");
      if (err.status === 404 || (err.status >= 400 && err.status < 500)) {
        setError(err);
        stopped.current = true;
        return;
      }
      failures.current += 1;
      setReconnecting(true);
      delay = Math.min(MAX_BACKOFF_MS, FAST_MS * 2 ** failures.current);
    } finally {
      inFlight.current = false;
    }
    if (expiresAt.current && Date.now() > expiresAt.current + GRACE_AFTER_EXPIRY_MS) {
      stopped.current = true;
      setGaveUp(true);
      return;
    }
    timer.current = setTimeout(tick, delay);
  }, [reference]);

  useEffect(() => {
    if (!enabled) return;
    stopped.current = false;
    startedAt.current = Date.now();
    void tick();
    const onVisible = () => {
      if (!document.hidden && !stopped.current) void tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      stopped.current = true;
      if (timer.current) clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [tick, enabled]);

  return { order, error, reconnecting, gaveUp, startedAt: startedAt.current };
}

/** Re-renders every second; returns ms remaining until `iso`. */
export function useCountdown(iso: string | null | undefined) {
  const target = iso ? new Date(iso).getTime() : 0;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  return target ? Math.max(0, target - now) : 0;
}

export function useElapsed(since: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now - since;
}
