// React Query keys and options shared by pages, so caches line up across views.
import { queryOptions } from "@tanstack/react-query";
import * as api from "./endpoints";

export const qk = {
  publicEvents: ["public-events"] as const,
  publicEvent: (id: string) => ["public-events", id] as const,
  myEvents: ["my-events"] as const,
  myEvent: (id: string) => ["my-events", id] as const,
  tickets: ["tickets"] as const,
  order: (ref: string) => ["order", ref] as const,
  ticket: (num: string) => ["ticket", num] as const,
  dashboard: ["dashboard"] as const,
  eventPerformance: (id: string) => ["my-events", id, "performance"] as const,
  users: ["users"] as const,
  userOverview: (id: string) => ["users", id, "overview"] as const,
  me: ["me"] as const,
  wallet: ["wallet"] as const,
  walletTx: ["wallet", "transactions"] as const,
  myWithdrawals: ["wallet", "withdrawals"] as const,
  payoutSettings: ["payouts", "settings"] as const,
  allWithdrawals: (status: string) => ["payouts", "withdrawals", status] as const,
  walletsOverview: ["payouts", "wallets"] as const,
  paymentMethods: ["payment-methods"] as const,
};

/** The public list is cached for 60 s (spec §14). */
export const publicEventsQuery = () =>
  queryOptions({ queryKey: qk.publicEvents, queryFn: api.listPublicEvents, staleTime: 60_000 });

export const publicEventQuery = (id: string) =>
  queryOptions({
    queryKey: qk.publicEvent(id),
    queryFn: () => api.getPublicEvent(id),
    staleTime: 60_000,
  });

/** Checkout payment options; falls back to M-Pesa only while loading or on error. */
export const paymentMethodsQuery = () =>
  queryOptions({ queryKey: qk.paymentMethods, queryFn: api.getPaymentMethods, staleTime: 60_000 });

export const myEventsQuery = () =>
  queryOptions({ queryKey: qk.myEvents, queryFn: api.listMyEvents });
export const myEventQuery = (id: string) =>
  queryOptions({ queryKey: qk.myEvent(id), queryFn: () => api.getMyEvent(id) });
export const ticketsQuery = () => queryOptions({ queryKey: qk.tickets, queryFn: api.listTickets });
