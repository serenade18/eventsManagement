import { request, setTokens } from "./client";
import type { Dashboard, Event, Order, PurchaseRequest, PurchaseResult, Ticket, TicketDetail, User } from "./types";

interface Env<T> { error: boolean; message: string; data: T }

// ---- auth ----
export async function login(email: string, password: string) {
  const t = await request<{ access: string; refresh: string }>("/gettoken/", { method: "POST", json: { email, password } });
  setTokens(t);
  return t;
}
export const register = (body: { email: string; name: string; phone: string; user_type: "organizer" | "sponsor"; password: string; organization?: string }) =>
  request<{ message: string }>("/users/", { method: "POST", json: body });
export const getMe = () => request<User>("/userinfo/", { auth: true });
export const updateMe = (body: Partial<User>) => request<User>("/userinfo/", { method: "PATCH", json: body, auth: true });
export const deleteMe = () => request("/userinfo/", { method: "DELETE", auth: true });
export const changePassword = (current_password: string, new_password: string) =>
  request<{ message: string }>("/userinfo/change-password/", { method: "POST", json: { current_password, new_password }, auth: true });
export const listUsers = async () => (await request<Env<User[]>>("/users/", { auth: true })).data;

// ---- public events ----
export const listPublicEvents = async () => (await request<Env<Event[]>>("/all-events/")).data;
export const getPublicEvent = async (id: number | string) => (await request<Env<Event>>(`/all-events/${id}/`)).data;

// ---- organizer events ----
export const listMyEvents = async () => (await request<Env<Event[]>>("/events/", { auth: true })).data;
export const getMyEvent = async (id: number | string) => (await request<Env<Event>>(`/events/${id}/`, { auth: true })).data;
export const createEvent = (fd: FormData) => request<Env<unknown>>("/events/", { method: "POST", form: fd, auth: true });
export const updateEvent = (id: number | string, fd: FormData) => request<Env<unknown>>(`/events/${id}/`, { method: "PUT", form: fd, auth: true });
export const deleteEvent = (id: number | string) => request<Env<unknown>>(`/events/${id}/`, { method: "DELETE", auth: true });

// ---- tickets / orders ----
export async function purchase(body: PurchaseRequest): Promise<PurchaseResult> {
  const r = await request<{ data: Record<string, unknown>; order?: Order }>("/tickets/", { method: "POST", json: body });
  if (r.order) return { kind: "issued", order: r.order };
  const d = r.data as { order_reference: string; checkout_request_id: string; amount: number; expires_at: string };
  return { kind: "awaiting_payment", reference: d.order_reference, checkoutRequestId: d.checkout_request_id, amount: Number(d.amount), expiresAt: d.expires_at };
}
export const getOrder = async (ref: string) => (await request<Env<Order>>(`/orders/${encodeURIComponent(ref)}/`)).data;
export const getTicket = async (num: string) => (await request<Env<TicketDetail>>(`/tickets/${encodeURIComponent(num)}/`)).data;
export const listTickets = async () => (await request<Env<Ticket[]>>("/tickets/", { auth: true })).data;
export const getDashboard = () => request<Dashboard & { error: boolean }>("/dashboard/", { auth: true });
