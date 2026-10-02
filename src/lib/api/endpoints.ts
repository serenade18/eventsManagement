import { request, setTokens } from "./client";
import type {
  Dashboard,
  Event,
  EventPerformance,
  Integration,
  IntegrationProvider,
  IntegrationTestResult,
  IntegrationUpdate,
  Order,
  PaymentMethod,
  PaymentMethods,
  PurchaseRequest,
  PurchaseResult,
  Ticket,
  TicketDetail,
  User,
  UserOverview,
  Money,
  PayoutSettings,
  WalletSummary,
  WalletTransaction,
  WalletsOverview,
  Withdrawal,
  WithdrawalRequestBody,
  WithdrawalStatus,
} from "./types";

interface Env<T> {
  error: boolean;
  message: string;
  data: T;
}

// ---- auth ----
export async function login(email: string, password: string) {
  const t = await request<{ access: string; refresh: string }>("/gettoken/", {
    method: "POST",
    json: { email, password },
  });
  setTokens(t);
  return t;
}
export interface RegisterBody {
  email: string;
  name: string;
  phone: string;
  user_type: "organizer" | "sponsor";
  password: string;
  organization?: string;
}
export const register = (body: RegisterBody) =>
  request<{ message: string }>("/users/", { method: "POST", json: body });
export const getMe = () => request<User>("/userinfo/", { auth: true });
export type ProfileBody = Pick<
  User,
  "name" | "phone" | "organization" | "country" | "city" | "bio"
>;
export const updateMe = (body: Partial<ProfileBody>) =>
  request<User>("/userinfo/", { method: "PATCH", json: body, auth: true });
export const deleteMe = () => request("/userinfo/", { method: "DELETE", auth: true });
export const changePassword = (current_password: string, new_password: string) =>
  request<{ message: string }>("/userinfo/change-password/", {
    method: "POST",
    json: { current_password, new_password },
    auth: true,
  });
export const listUsers = async () => (await request<Env<User[]>>("/users/", { auth: true })).data;

// ---- public events ----
export const listPublicEvents = async () => (await request<Env<Event[]>>("/all-events/")).data;
export const getPublicEvent = async (id: number | string) =>
  (await request<Env<Event>>(`/all-events/${encodeURIComponent(String(id))}/`)).data;

// ---- organizer events ----
export const listMyEvents = async () =>
  (await request<Env<Event[]>>("/events/", { auth: true })).data;
export const getMyEvent = async (id: number | string) =>
  (await request<Env<Event>>(`/events/${encodeURIComponent(String(id))}/`, { auth: true })).data;
export const createEvent = (fd: FormData) =>
  request<Env<unknown>>("/events/", { method: "POST", form: fd, auth: true });
export const updateEvent = (id: number | string, fd: FormData) =>
  request<Env<unknown>>(`/events/${id}/`, { method: "PUT", form: fd, auth: true });
export const deleteEvent = (id: number | string) =>
  request<Env<unknown>>(`/events/${id}/`, { method: "DELETE", auth: true });

// ---- tickets / orders (public: never authenticated) ----
export async function purchase(body: PurchaseRequest): Promise<PurchaseResult> {
  const r = await request<{ data: Record<string, unknown>; order?: Order }>("/tickets/", {
    method: "POST",
    json: body,
  });
  if (r.order) return { kind: "issued", order: r.order };
  const d = r.data as {
    order_reference: string;
    payment_method?: PaymentMethod;
    checkout_request_id: string;
    checkout_url: string;
    amount: number;
    expires_at: string;
  };
  if (d.payment_method === "card")
    return {
      kind: "awaiting_payment",
      method: "card",
      reference: d.order_reference,
      checkoutUrl: d.checkout_url,
      amount: Number(d.amount),
      expiresAt: d.expires_at,
    };
  return {
    kind: "awaiting_payment",
    method: "mpesa",
    reference: d.order_reference,
    checkoutRequestId: d.checkout_request_id,
    amount: Number(d.amount),
    expiresAt: d.expires_at,
  };
}
export const getOrder = async (ref: string) =>
  (await request<Env<Order>>(`/orders/${encodeURIComponent(ref)}/`)).data;
/** Buyer came back from card checkout without paying: release the tickets. */
export const cancelCardOrder = async (ref: string) =>
  (await request<Env<Order>>(`/orders/${encodeURIComponent(ref)}/cancel-card/`, { method: "POST" }))
    .data;
export const getPaymentMethods = async () =>
  (await request<Env<PaymentMethods>>("/payment-methods/")).data;
export const getTicket = async (num: string) =>
  (await request<Env<TicketDetail>>(`/tickets/${encodeURIComponent(num)}/`)).data;

// ---- organizer data ----
export const listTickets = async () =>
  (await request<Env<Ticket[]>>("/tickets/", { auth: true })).data;
export const getDashboard = () => request<Dashboard>("/dashboard/", { auth: true });

// ---- integrations (admin only; see docs/integrations-api.md) ----
export const listIntegrations = async () =>
  (await request<Env<Integration[]>>("/settings/integrations/", { auth: true })).data;
export const updateIntegration = async (provider: IntegrationProvider, body: IntegrationUpdate) =>
  (
    await request<Env<Integration>>(`/settings/integrations/${provider}/`, {
      method: "PATCH",
      json: body,
      auth: true,
    })
  ).data;
export const testIntegration = async (provider: IntegrationProvider) =>
  (
    await request<Env<IntegrationTestResult>>(`/settings/integrations/${provider}/test/`, {
      method: "POST",
      auth: true,
    })
  ).data;

/** Code-protected admin signup (unlinked page). 404 when the backend has it turned off. */
export const adminSignup = (body: {
  code: string;
  email: string;
  name: string;
  phone: string;
  password: string;
}) => request<{ message: string }>("/admin-signup/", { method: "POST", json: body });

export const getUserOverview = async (id: number | string) =>
  (
    await request<Env<UserOverview>>(`/users/${encodeURIComponent(String(id))}/overview/`, {
      auth: true,
    })
  ).data;

export const getEventPerformance = async (id: number | string) =>
  (
    await request<Env<EventPerformance>>(`/events/${encodeURIComponent(String(id))}/performance/`, {
      auth: true,
    })
  ).data;

/** Public page-view ping. Never authenticated; failures are ignored. */
export const trackEventView = (id: number | string) =>
  request(`/all-events/${encodeURIComponent(String(id))}/view/`, { method: "POST" }).catch(
    () => {},
  );

/** Quick toggles without the full form: sends only the changed flags (PUT is partial). */
export const setEventFlags = (
  id: number | string,
  flags: Partial<Record<"is_open" | "is_feature", boolean>>,
) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(flags)) fd.append(k, String(v));
  return updateEvent(id, fd);
};

// ---- wallet (organizers & sponsors) ----
export const getWallet = async () =>
  (await request<Env<WalletSummary>>("/wallet/", { auth: true })).data;
export const listWalletTransactions = async () =>
  (await request<Env<WalletTransaction[]>>("/wallet/transactions/", { auth: true })).data;
export const listMyWithdrawals = async () =>
  (await request<Env<Withdrawal[]>>("/wallet/withdrawals/", { auth: true })).data;
export const requestWithdrawal = async (body: WithdrawalRequestBody) =>
  (
    await request<Env<Withdrawal>>("/wallet/withdrawals/", {
      method: "POST",
      json: body,
      auth: true,
    })
  ).data;
export const cancelWithdrawal = async (id: number) =>
  (
    await request<Env<Withdrawal>>(`/wallet/withdrawals/${id}/cancel/`, {
      method: "POST",
      auth: true,
    })
  ).data;

// ---- payouts (admin) ----
export const getPayoutSettings = async () =>
  (await request<Env<PayoutSettings>>("/admin/payout-settings/", { auth: true })).data;
export const updatePayoutSettings = async (min_withdrawal: string) =>
  (
    await request<Env<PayoutSettings>>("/admin/payout-settings/", {
      method: "PATCH",
      json: { min_withdrawal },
      auth: true,
    })
  ).data;
export const listAllWithdrawals = async (status?: WithdrawalStatus) =>
  (
    await request<Env<Withdrawal[]>>(`/admin/withdrawals/${status ? `?status=${status}` : ""}`, {
      auth: true,
    })
  ).data;
export const markWithdrawalPaid = async (id: number, reference: string, note: string) =>
  (
    await request<Env<Withdrawal>>(`/admin/withdrawals/${id}/paid/`, {
      method: "POST",
      json: { reference, note },
      auth: true,
    })
  ).data;
export const rejectWithdrawal = async (id: number, reason: string) =>
  (
    await request<Env<Withdrawal>>(`/admin/withdrawals/${id}/reject/`, {
      method: "POST",
      json: { reason },
      auth: true,
    })
  ).data;
export const getWalletsOverview = async () =>
  (await request<Env<WalletsOverview>>("/admin/wallets/", { auth: true })).data;
export const adjustWallet = async (
  userId: number,
  amount: string,
  reason: string,
  password: string,
) =>
  (
    await request<Env<{ balance: Money }>>(`/admin/wallets/${userId}/adjust/`, {
      method: "POST",
      json: { amount, reason, password },
      auth: true,
    })
  ).data;
