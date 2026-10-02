/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- loosely typed in-browser mock of the backend
// In-browser mock of the MyEvents backend, used when no VITE_API_BASE_URL is set
// (or VITE_USE_MOCKS=true). Mirrors the response shapes from the spec.
import QRCode from "qrcode";
import jazz from "@/assets/poster-jazz.jpg";
import tech from "@/assets/poster-tech.jpg";
import festival from "@/assets/poster-festival.jpg";
import type { Event, Order, Ticket, TicketType, User } from "./types";
import { PROVIDERS } from "../integrations";

interface MockUser extends User {
  password: string;
}
interface MockOrder {
  reference: string;
  status: Order["status"];
  quantity: number;
  ticket_type: number;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string | null;
  created: number;
  expires_at: string;
  paid_at: string | null;
  checkout_request_id: string;
}
interface MockTicket {
  id: number;
  ticket_number: string;
  ticket_type: number;
  order: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string | null;
  purchase_date: string;
  qr_code: string | null;
}
interface DB {
  users: MockUser[];
  events: Omit<Event, "organizer" | "ticket_types">[] & { organizer_id?: number }[];
  tiers: TicketType[];
  orders: MockOrder[];
  tickets: MockTicket[];
  seq: number;
}

const KEY = "hostme.mockdb.v2";
let db: DB | null = null;

const iso = (ms: number) => new Date(ms).toISOString();
const dayOffset = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);

function seed(): DB {
  const now = Date.now();
  const users: MockUser[] = [
    {
      id: 1,
      email: "admin@myevents.africa",
      name: "MyEvents Admin",
      phone: "0700000001",
      user_type: "admin",
      organization: "MyEvents",
      country: "Kenya",
      city: "Nairobi",
      bio: null,
      added_on: iso(now - 90 * 864e5),
      password: "admin1234",
    },
    {
      id: 2,
      email: "org@myevents.africa",
      name: "Sauti Live",
      phone: "0712345678",
      user_type: "organizer",
      organization: "Sauti Live Ltd",
      country: "Kenya",
      city: "Nairobi",
      bio: "We put on nights to remember.",
      added_on: iso(now - 60 * 864e5),
      password: "organizer1",
    },
    {
      id: 3,
      email: "sponsor@myevents.africa",
      name: "Safari Brews",
      phone: "0722000111",
      user_type: "sponsor",
      organization: "Safari Brews",
      country: "Kenya",
      city: "Mombasa",
      bio: null,
      added_on: iso(now - 30 * 864e5),
      password: "sponsor12",
    },
  ];
  const mk = (
    id: number,
    title: string,
    category: string,
    poster: string,
    venue: string,
    d: number,
    time: string,
    feat: boolean,
    free: boolean,
    desc: string,
  ) => ({
    id,
    title,
    category,
    poster,
    venue,
    date: dayOffset(d),
    time,
    is_feature: feat,
    is_free: free,
    is_open: true,
    added_on: iso(now - 20 * 864e5),
    sponsors: id === 1 ? [3] : [],
    description: desc,
    organizer_id: 2,
  });
  const events = [
    mk(
      1,
      "Jazz Night at the Alliance",
      "Music",
      jazz,
      "Alliance Française, Nairobi",
      12,
      "19:00:00",
      true,
      false,
      "An intimate night of live jazz with the Nairobi Horns Collective. Doors open at 6:30 PM.",
    ),
    mk(
      2,
      "Silicon Savannah Summit",
      "Tech",
      tech,
      "KICC, Nairobi",
      25,
      "09:00:00",
      true,
      false,
      "Founders, builders and investors shaping Africa's tech future. Talks, workshops and demos.",
    ),
    mk(
      3,
      "Kilifi Food & Sound Festival",
      "Festival",
      festival,
      "Kilifi Creek Grounds",
      40,
      "14:00:00",
      false,
      false,
      "A full day of coastal food, live bands and sunset sets by the creek.",
    ),
    mk(
      4,
      "Open Mic Poetry Evening",
      "Arts",
      null as unknown as string,
      "The Mall, Westlands",
      5,
      "18:30:00",
      false,
      true,
      "Bring your words. Free entry, all voices welcome.",
    ),
    mk(
      5,
      "Gengetone Throwback Party",
      "Music",
      null as unknown as string,
      "Carnivore Grounds",
      -10,
      "20:00:00",
      false,
      false,
      "The biggest throwback night of the year.",
    ),
  ];
  const t = (
    id: number,
    event: number,
    name: string,
    desc: string,
    price: string,
    qty: number,
    start: number,
    end: number,
  ): TicketType => ({
    id,
    event,
    name,
    description: desc,
    price,
    quantity: qty,
    sales_start: iso(now + start * 864e5),
    sales_end: iso(now + end * 864e5),
    created_at: iso(now),
    updated_at: iso(now),
  });
  const tiers = [
    t(1, 1, "Regular", "General admission", "1500.00", 200, -5, 11),
    t(2, 1, "VIP", "Front tables + welcome drink", "4000.00", 30, -5, 11),
    t(3, 2, "Early bird", "Limited early pricing", "2500.00", 100, -10, -1),
    t(4, 2, "Standard", "Full two-day access", "5000.00", 500, -1, 24),
    t(5, 2, "Student", "Valid student ID required", "1000.00", 100, 3, 24),
    t(6, 3, "Day pass", "All-day access", "2000.00", 800, -3, 39),
    t(7, 4, "Free entry", "Reserve your spot", "0.00", 80, -3, 5),
    t(8, 5, "Regular", "Entry", "1000.00", 1000, -40, -10),
  ];
  return { users, events: events as DB["events"], tiers, orders: [], tickets: [], seq: 100 };
}

function load(): DB {
  if (db) return db;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) db = JSON.parse(raw);
  } catch {
    /* ignore */
  }
  if (!db) db = seed();
  return db;
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* quota */
  }
}
const nextId = () => ++load().seq;
const hex = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const publicUser = (u: MockUser): User => {
  const { password: _p, ...rest } = u;
  return { ...rest, last_login: null };
};
function fullEvent(e: DB["events"][number]): Event {
  const d = load();
  const org =
    d.users.find((u) => u.id === (e as { organizer_id?: number }).organizer_id) || d.users[1];
  const { organizer_id: _o, ...rest } = e as typeof e & { organizer_id?: number };
  return {
    ...(rest as Omit<Event, "organizer" | "ticket_types">),
    organizer: publicUser(org),
    ticket_types: d.tiers.filter((t) => t.event === e.id),
  };
}
function tierMini(tierId: number) {
  const d = load();
  const t = d.tiers.find((x) => x.id === tierId)!;
  const ev = d.events.find((e) => e.id === t.event)!;
  return {
    id: t.id,
    name: t.name,
    price: t.price,
    quantity: t.quantity,
    event: t.event,
    event_title: ev.title,
  };
}
async function ensureQr(t: MockTicket) {
  if (!t.qr_code && Date.now() - new Date(t.purchase_date).getTime() > 1500) {
    t.qr_code = await QRCode.toDataURL(t.ticket_number, {
      color: { dark: "#ffffffff", light: "#00000000" },
      margin: 1,
      width: 320,
    });
    save();
  }
}
function ticketOut(t: MockTicket): Ticket {
  return {
    id: t.id,
    ticket_number: t.ticket_number,
    qr_code: t.qr_code,
    purchased: true,
    buyer_name: t.buyer_name,
    buyer_email: t.buyer_email,
    buyer_phone: t.buyer_phone,
    purchase_date: t.purchase_date,
    ticket_type: t.ticket_type,
    ticket_type_details: tierMini(t.ticket_type),
  };
}
function issue(o: MockOrder) {
  const d = load();
  for (let i = 0; i < o.quantity; i++) {
    d.tickets.unshift({
      id: nextId(),
      ticket_number: i === 0 ? o.reference : `${o.reference}-${i + 1}`,
      ticket_type: o.ticket_type,
      order: o.reference,
      buyer_name: o.buyer_name,
      buyer_phone: o.buyer_phone,
      buyer_email: o.buyer_email,
      purchase_date: iso(Date.now()),
      qr_code: null,
    });
  }
  o.status = "paid";
  o.paid_at = iso(Date.now());
  creditOrder(o);
}
function soldFor(tierId: number) {
  const d = load();
  const held = d.orders.filter(
    (o) =>
      o.ticket_type === tierId &&
      (o.status === "paid" ||
        (o.status === "pending" && new Date(o.expires_at).getTime() > Date.now())),
  );
  return held.reduce((s, o) => s + o.quantity, 0);
}
async function orderOut(o: MockOrder): Promise<Order> {
  const d = load();
  // Simulated M-Pesa: pays after ~8 s; phones ending 000 fail; ending 999 never pay.
  if (o.status === "pending") {
    const age = Date.now() - o.created;
    if (o.buyer_phone.endsWith("000") && age > 6000) o.status = "failed";
    else if (!o.buyer_phone.endsWith("999") && age > 8000) issue(o);
    else if (Date.now() > new Date(o.expires_at).getTime()) o.status = "expired";
    save();
  }
  const tickets = d.tickets.filter((t) => t.order === o.reference);
  for (const t of tickets) await ensureQr(t);
  const tier = d.tiers.find((t) => t.id === o.ticket_type)!;
  return {
    reference: o.reference,
    status: o.status,
    quantity: o.quantity,
    unit_price: tier.price,
    total_amount: (Number(tier.price) * o.quantity).toFixed(2),
    buyer_name: o.buyer_name,
    expires_at: o.expires_at,
    paid_at: o.paid_at,
    ticket_type: o.ticket_type,
    ticket_type_details: tierMini(o.ticket_type),
    tickets: tickets.reverse().map(ticketOut),
  };
}

// ---------- transport ----------
type R = { status: number; data: unknown };
const ok = (data: unknown, status = 200): R => ({ status, data });
const fail = (status: number, data: unknown): R => ({ status, data });

function authUser(headers: Record<string, string>): MockUser | null {
  const m = /^Bearer mock-access-(\d+)$/.exec(headers.Authorization || "");
  return m ? load().users.find((u) => u.id === Number(m[1])) || null : null;
}

async function readForm(body: BodyInit | null): Promise<Record<string, string | File>> {
  const out: Record<string, string | File> = {};
  if (body instanceof FormData) body.forEach((v, k) => (out[k] = v));
  return out;
}
const fileToDataUrl = (f: File) =>
  new Promise<string>((res) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.readAsDataURL(f);
  });

export async function mockTransport(
  method: string,
  path: string,
  headers: Record<string, string>,
  body: BodyInit | null,
): Promise<R> {
  await new Promise((r) => setTimeout(r, 250 + Math.random() * 250));
  const d = load();
  const json = typeof body === "string" ? JSON.parse(body) : null;
  const seg = path.split("?")[0].split("/").filter(Boolean);
  const me = authUser(headers);
  const needAuth = () => fail(401, { detail: "Authentication credentials were not provided." });
  const r = route(seg);

  // ---- auth ----
  if (r === "gettoken" && method === "POST") {
    const u = d.users.find(
      (x) =>
        x.email.toLowerCase() === String(json?.email).toLowerCase() &&
        x.password === json?.password,
    );
    return u
      ? ok({ refresh: `mock-refresh-${u.id}`, access: `mock-access-${u.id}` })
      : fail(401, { detail: "No active account found with the given credentials" });
  }
  if (r === "refresh_token" && method === "POST") {
    const m = /^mock-refresh-(\d+)$/.exec(json?.refresh || "");
    return m
      ? ok({ access: `mock-access-${m[1]}` })
      : fail(401, { detail: "Token is invalid or expired" });
  }
  if (r === "admin-signup" && method === "POST") {
    // Demo mode only. The real code lives in the backend's ADMIN_SIGNUP_CODE.
    if (json?.code !== "myevents-demo-admin-code")
      return fail(403, { detail: "Invalid signup code" });
    if (d.users.some((u) => u.email.toLowerCase() === String(json.email).toLowerCase()))
      return fail(400, { email: ["user account with this email already exists."] });
    d.users.push({
      id: nextId(),
      email: String(json.email).toLowerCase(),
      name: json.name,
      phone: json.phone,
      user_type: "admin",
      organization: null,
      country: null,
      city: null,
      bio: null,
      added_on: iso(Date.now()),
      password: json.password,
    });
    save();
    return ok({ message: "Admin account created successfully" }, 201);
  }
  if (r === "users" && method === "POST") {
    const errs: Record<string, string[]> = {};
    if (json?.user_type === "admin") errs.user_type = ["Admin accounts can't be created here."];
    if (!json?.email || !/^\S+@\S+\.\S+$/.test(json.email))
      errs.email = ["Enter a valid email address."];
    else if (d.users.some((u) => u.email.toLowerCase() === json.email.toLowerCase()))
      errs.email = ["user with this email already exists."];
    if (!json?.password) errs.password = ["This field is required."];
    if (!json?.name) errs.name = ["This field is required."];
    if (Object.keys(errs).length) return fail(400, errs);
    d.users.push({
      id: nextId(),
      email: json.email,
      name: json.name,
      phone: json.phone,
      user_type: json.user_type,
      organization: json.organization || null,
      country: null,
      city: null,
      bio: null,
      added_on: iso(Date.now()),
      password: json.password,
    });
    save();
    return ok({ message: "User account created successfully" }, 201);
  }
  if (r === "users" && method === "GET") {
    if (!me) return needAuth();
    if (me.user_type !== "admin")
      return fail(403, { detail: "You do not have permission to perform this action." });
    return ok({ error: false, message: "All Users List Data", data: d.users.map(publicUser) });
  }
  if (seg[0] === "users" && seg[2] === "overview" && method === "GET") {
    if (!me) return needAuth();
    if (me.user_type !== "admin")
      return fail(403, { detail: "You do not have permission to perform this action." });
    const u = d.users.find((x) => x.id === Number(seg[1]));
    if (!u) return fail(404, { detail: "Not found." });
    const today = new Date().toISOString().slice(0, 10);
    const evs = d.events.filter((e) => e.organizer_id === u.id);
    const tierIds = new Set(
      d.tiers.filter((t) => evs.some((e) => e.id === t.event)).map((t) => t.id),
    );
    const tix = d.tickets.filter((t) => tierIds.has(t.ticket_type));
    const paid = d.orders.filter((o) => o.status === "paid" && tierIds.has(o.ticket_type));
    const priceOf = (id) => Number(d.tiers.find((t) => t.id === id)?.price || 0);
    const eventOf = (tierId) =>
      d.events.find((e) => e.id === d.tiers.find((t) => t.id === tierId)?.event);
    const rows = [...evs]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((e) => {
        const ids = d.tiers.filter((t) => t.event === e.id).map((t) => t.id);
        const et = tix.filter((t) => ids.includes(t.ticket_type));
        return {
          id: e.id,
          title: e.title,
          category: e.category,
          venue: e.venue,
          date: e.date,
          time: e.time,
          is_open: e.is_open,
          is_feature: e.is_feature,
          tickets_sold: et.length,
          revenue: et.reduce((s2, t) => s2 + priceOf(t.ticket_type), 0),
        };
      });
    const sponsored = d.events
      .filter((e) => (e.sponsors || []).includes(u.id))
      .map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        venue: e.venue,
        organizer: d.users.find((x) => x.id === e.organizer_id)?.name || "",
      }));
    const { password: _pw, ...profile } = u;
    return ok({
      error: false,
      message: "User Overview",
      data: {
        user: { ...profile, last_login: null, is_active: true },
        stats: {
          events: evs.length,
          upcoming_events: evs.filter((e) => e.date >= today).length,
          tickets_sold: tix.length,
          orders_paid: paid.length,
          revenue: tix.reduce((s2, t) => s2 + priceOf(t.ticket_type), 0),
          sponsored_events: sponsored.length,
        },
        events: rows,
        sponsored_events: sponsored,
        recent_sales: [...paid]
          .sort((a, b) => String(b.paid_at).localeCompare(String(a.paid_at)))
          .slice(0, 10)
          .map((o) => ({
            reference: o.reference,
            event_id: eventOf(o.ticket_type)?.id,
            event_title: eventOf(o.ticket_type)?.title,
            tier: d.tiers.find((t) => t.id === o.ticket_type)?.name,
            quantity: o.quantity,
            total_amount: priceOf(o.ticket_type) * o.quantity,
            buyer_name: o.buyer_name,
            paid_at: o.paid_at,
          })),
      },
    });
  }
  if (r === "userinfo") {
    if (!me) return needAuth();
    if (method === "GET") return ok(publicUser(me));
    if (method === "PATCH" || method === "PUT") {
      for (const k of ["name", "phone", "organization", "country", "city", "bio"] as const)
        if (json && k in json) (me as unknown as Record<string, unknown>)[k] = json[k];
      save();
      return ok(publicUser(me));
    }
    if (method === "DELETE") {
      d.users = d.users.filter((u) => u.id !== me.id);
      save();
      return ok(null, 204);
    }
  }
  if (r === "userinfo/change-password" && method === "POST") {
    if (!me) return needAuth();
    if (json?.current_password !== me.password)
      return fail(400, { error: "Current password is incorrect" });
    me.password = json.new_password;
    save();
    return ok({ message: "Password updated successfully" });
  }

  // ---- wallets & payouts ----
  if (seg[0] === "wallet") {
    if (!me) return needAuth();
    if (!["organizer", "sponsor"].includes(me.user_type))
      return fail(403, { detail: "Only organizers and sponsors have wallets." });
    const w = walletOf(me.id);
    if (seg.length === 1 && method === "GET")
      return ok({ error: false, message: "Wallet", data: walletSummary(me.id) });
    if (seg[1] === "transactions")
      return ok({ error: false, message: "Wallet transactions", data: w.txs });
    if (seg[1] === "withdrawals" && seg.length === 2 && method === "GET")
      return ok({ error: false, message: "Withdrawals", data: w.withdrawals });
    if (seg[1] === "withdrawals" && seg.length === 2 && method === "POST") {
      if (json?.password !== me.password) return fail(403, { detail: "Incorrect password" });
      const amount = Number(json.amount);
      const min = (d.payoutSettings || {}).min_withdrawal ?? 15000;
      if (!(amount >= min))
        return fail(400, {
          error: true,
          message: `The minimum withdrawal is KES ${min.toLocaleString()}`,
          errors: { amount: [`Minimum is KES ${min.toLocaleString()}.`] },
        });
      if (amount > w.balance)
        return fail(400, {
          error: true,
          message: "That's more than your available balance",
          errors: { amount: ["More than your balance."] },
        });
      const wd = {
        id: nextId(),
        amount,
        method: json.method,
        status: "pending",
        mpesa_phone: json.mpesa_phone || "",
        bank_name: json.bank_name || "",
        account_name: json.account_name || "",
        account_number: json.account_number || "",
        payout_reference: "",
        admin_note: "",
        requested_at: iso(Date.now()),
        processed_at: null,
      };
      w.withdrawals.unshift(wd);
      post(
        w,
        "withdrawal",
        -amount,
        `Withdrawal #${wd.id} to ${wd.method === "mpesa" ? "M-Pesa" : "Bank transfer"}`,
        { withdrawal_id: wd.id },
      );
      save();
      return ok({ error: false, message: "Withdrawal requested", data: wd }, 201);
    }
    if (seg[1] === "withdrawals" && seg[3] === "cancel" && method === "POST") {
      const wd = w.withdrawals.find((x) => x.id === Number(seg[2]));
      if (!wd) return fail(404, { detail: "Not found." });
      if (wd.status !== "pending")
        return fail(400, { error: true, message: `This withdrawal is already ${wd.status}` });
      post(w, "withdrawal_return", wd.amount, `Withdrawal #${wd.id} cancelled`, {
        withdrawal_id: wd.id,
      });
      Object.assign(wd, { status: "cancelled", processed_at: iso(Date.now()) });
      save();
      return ok({ error: false, message: "Withdrawal cancelled", data: wd });
    }
  }
  if (seg[0] === "admin" && ["payout-settings", "withdrawals", "wallets"].includes(seg[1])) {
    if (!me) return needAuth();
    if (me.user_type !== "admin")
      return fail(403, { detail: "You do not have permission to perform this action." });
    d.payoutSettings ||= { min_withdrawal: 15000, updated_at: null, updated_by: null };
    const settingsOut = () => ({ ...d.payoutSettings, commission_rate: COMMISSION });
    if (seg[1] === "payout-settings" && method === "GET")
      return ok({ error: false, message: "Payout settings", data: settingsOut() });
    if (seg[1] === "payout-settings" && method === "PATCH") {
      const v = Number(json?.min_withdrawal);
      if (!(v >= 1))
        return fail(400, {
          error: true,
          message: "Validation Error",
          errors: { min_withdrawal: ["Enter an amount of at least KES 1."] },
        });
      Object.assign(d.payoutSettings, {
        min_withdrawal: v,
        updated_at: iso(Date.now()),
        updated_by: me.name,
      });
      save();
      return ok({ error: false, message: "Payout settings", data: settingsOut() });
    }
    if (seg[1] === "withdrawals" && seg.length === 2) {
      const status = new URLSearchParams(path.split("?")[1] || "").get("status");
      const rows = allWithdrawals()
        .filter(({ x }) => !status || x.status === status)
        .sort((a, b) => b.x.requested_at.localeCompare(a.x.requested_at));
      return ok({
        error: false,
        message: "Withdrawals",
        data: rows.map(({ x, w, user }) => ({
          ...x,
          wallet_balance: w.balance,
          user: user && {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            user_type: user.user_type,
            organization: user.organization,
          },
        })),
      });
    }
    if (seg[1] === "withdrawals" && seg.length === 4 && method === "POST") {
      const row = allWithdrawals().find(({ x }) => x.id === Number(seg[2]));
      if (!row) return fail(404, { detail: "Not found." });
      const { x, w } = row;
      if (x.status !== "pending")
        return fail(400, { error: true, message: `This withdrawal is already ${x.status}` });
      if (seg[3] === "paid") {
        if (!String(json?.reference || "").trim())
          return fail(400, {
            error: true,
            message: "Enter the payout reference",
            errors: { reference: ["M-Pesa receipt or bank reference."] },
          });
        Object.assign(x, {
          status: "paid",
          payout_reference: json.reference.trim(),
          admin_note: json.note || "",
          processed_at: iso(Date.now()),
        });
      } else if (seg[3] === "reject") {
        if (!String(json?.reason || "").trim())
          return fail(400, {
            error: true,
            message: "Give a reason",
            errors: { reason: ["Tell the user why."] },
          });
        post(w, "withdrawal_return", x.amount, `Withdrawal #${x.id} rejected`, {
          withdrawal_id: x.id,
        });
        Object.assign(x, {
          status: "rejected",
          admin_note: json.reason.trim(),
          processed_at: iso(Date.now()),
        });
      } else return fail(404, { detail: "Not found." });
      save();
      return ok({ error: false, message: "Withdrawal updated", data: x });
    }
    if (seg[1] === "wallets" && seg.length === 2) {
      const people = d.users.filter((u) => ["organizer", "sponsor"].includes(u.user_type));
      const pending = allWithdrawals().filter(({ x }) => x.status === "pending");
      return ok({
        error: false,
        message: "Wallets",
        data: {
          wallets: people.map((u) => ({
            user: {
              id: u.id,
              name: u.name,
              email: u.email,
              user_type: u.user_type,
              organization: u.organization,
            },
            balance: walletOf(u.id).balance,
          })),
          totals: {
            balances: people.reduce((a, u) => a + walletOf(u.id).balance, 0),
            pending_withdrawals: pending.reduce((a, { x }) => a + x.amount, 0),
            pending_count: pending.length,
            commission_earned: Object.values(d.wallets || {})
              .flatMap((w) => w.txs)
              .filter((t) => t.kind === "sale")
              .reduce((a, t) => a + t.commission, 0),
          },
        },
      });
    }
    if (seg[1] === "wallets" && seg[3] === "adjust" && method === "POST") {
      if (json?.password !== me.password) return fail(403, { detail: "Incorrect password" });
      const u = d.users.find((x) => x.id === Number(seg[2]));
      if (!u) return fail(404, { detail: "Not found." });
      if (!["organizer", "sponsor"].includes(u.user_type))
        return fail(400, { error: true, message: "Only organizers and sponsors have wallets" });
      if (!String(json.reason || "").trim())
        return fail(400, {
          error: true,
          message: "Validation Error",
          errors: { reason: ["Say what this adjustment is for."] },
        });
      const w = walletOf(u.id);
      try {
        post(w, "adjustment", Number(json.amount), json.reason.trim());
      } catch {
        return fail(400, { error: true, message: "Insufficient balance" });
      }
      save();
      return ok({ error: false, message: "Wallet adjusted", data: { balance: w.balance } });
    }
  }

  // ---- event views + performance ----
  if (seg[0] === "all-events" && seg[2] === "view" && method === "POST") {
    const e = d.events.find((x) => x.id === Number(seg[1]));
    if (!e) return fail(404, { detail: "Not found." });
    const day = new Date().toISOString().slice(0, 10);
    d.views ||= {};
    d.views[e.id] ||= {};
    d.views[e.id][day] = (d.views[e.id][day] || 0) + 1;
    save();
    return ok(null, 204);
  }
  if (seg[0] === "events" && seg[2] === "performance" && method === "GET") {
    if (!me) return needAuth();
    const e = d.events.find(
      (x) => x.id === Number(seg[1]) && (me.user_type === "admin" || x.organizer_id === me.id),
    );
    if (!e) return fail(404, { detail: "Not found." });
    return ok({ error: false, message: "Event Performance", data: mockPerformance(d, e) });
  }

  // ---- public events ----
  if (r === "all-events") {
    const list = [...d.events].sort((a, b) => b.date.localeCompare(a.date)).map(fullEvent);
    return ok({ error: false, message: "All Events List Data", data: list });
  }
  if (r === "all-events/:id") {
    const e = d.events.find((x) => x.id === Number(seg[1]));
    return e
      ? ok({ error: false, message: "Single Data Fetch", data: fullEvent(e) })
      : fail(404, { detail: "Not found." });
  }

  // ---- organizer events ----
  if (r === "events" || r === "events/:id") {
    if (!me) return needAuth();
    const mine = (e: DB["events"][number]) =>
      me.user_type === "admin" || (e as { organizer_id?: number }).organizer_id === me.id;
    if (r === "events" && method === "GET")
      return ok({ error: false, message: "Events", data: d.events.filter(mine).map(fullEvent) });
    const ev =
      r === "events/:id" ? d.events.find((x) => x.id === Number(seg[1]) && mine(x)) : undefined;
    if (r === "events/:id" && !ev) return fail(404, { detail: "Not found." });
    if (method === "GET")
      return ok({ error: false, message: "Single Data Fetch", data: fullEvent(ev!) });
    if (method === "DELETE") {
      const tierIds = d.tiers.filter((t) => t.event === ev!.id).map((t) => t.id);
      if (d.orders.some((o) => tierIds.includes(o.ticket_type)))
        return fail(400, {
          error: true,
          message: "Events that already have ticket orders cannot be deleted",
        });
      d.events = d.events.filter((x) => x.id !== ev!.id);
      d.tiers = d.tiers.filter((t) => t.event !== ev!.id);
      save();
      return ok({ error: false, message: "Event deleted successfully" });
    }
    const f = await readForm(body);
    const errs: Record<string, string[]> = {};
    if (method === "POST")
      for (const k of ["title", "category", "description", "venue", "date", "time"])
        if (!f[k]) errs[k] = ["This field is required."];
    if (Object.keys(errs).length)
      return fail(400, { error: true, message: "Validation Error", errors: errs });
    let tiersIn: Array<Record<string, unknown>> | null = null;
    if (typeof f.ticket_type === "string") {
      try {
        tiersIn = JSON.parse(f.ticket_type);
      } catch {
        return fail(400, { error: true, message: "Invalid ticket_type JSON" });
      }
    }
    const target =
      ev ??
      ({
        id: nextId(),
        added_on: iso(Date.now()),
        sponsors: [],
        poster: null,
        is_feature: false,
        is_free: false,
        is_open: true,
        organizer_id: me.id,
      } as unknown as DB["events"][number]);
    if (ev && tiersIn) {
      const ids = d.tiers.filter((t) => t.event === ev.id).map((t) => t.id);
      if (d.orders.some((o) => ids.includes(o.ticket_type)))
        return fail(400, {
          error: true,
          message: "Ticket types that already have orders cannot be replaced",
        });
    }
    const t = target as unknown as Record<string, unknown>;
    for (const k of ["title", "category", "description", "venue", "date"])
      if (typeof f[k] === "string") t[k] = f[k];
    if (typeof f.time === "string") t.time = f.time.length === 5 ? `${f.time}:00` : f.time;
    for (const k of ["is_open", "is_free", "is_feature"])
      if (typeof f[k] === "string") t[k] = f[k] === "true";
    if (me.user_type !== "admin" && !ev) t.is_feature = false;
    if (f.poster instanceof File) t.poster = await fileToDataUrl(f.poster);
    if (!ev) d.events.push(target);
    if (tiersIn) {
      d.tiers = d.tiers.filter((x) => x.event !== target.id);
      for (const ti of tiersIn)
        d.tiers.push({
          id: nextId(),
          event: target.id,
          name: String(ti.name),
          description: String(ti.description || ""),
          price: Number(ti.price).toFixed(2),
          quantity: Number(ti.quantity),
          sales_start: new Date(String(ti.sales_start)).toISOString(),
          sales_end: new Date(String(ti.sales_end)).toISOString(),
          created_at: iso(Date.now()),
          updated_at: iso(Date.now()),
        });
    }
    save();
    return ev
      ? ok({ error: false, message: "Event updated successfully" })
      : ok({ error: false, message: "Event created successfully" }, 201);
  }

  // ---- tickets ----
  if (r === "tickets" && method === "POST") {
    const errs: Record<string, string[]> = {};
    if (!json?.buyer_name) errs.buyer_name = ["This field is required."];
    if (!json?.buyer_phone) errs.buyer_phone = ["This field is required."];
    if (Object.keys(errs).length)
      return fail(400, { error: true, message: "Validation Error", errors: errs });
    const tier = d.tiers.find((x) => x.id === Number(json.ticket_type));
    if (!tier) return fail(400, { error: true, message: "Ticket type not found" });
    const q = Number(json.quantity);
    if (!(q >= 1 && q <= 10))
      return fail(400, { error: true, message: "Quantity must be between 1 and 10" });
    if (Date.now() < new Date(tier.sales_start).getTime())
      return fail(400, { error: true, message: "Ticket sales for this type have not started yet" });
    if (Date.now() > new Date(tier.sales_end).getTime())
      return fail(400, { error: true, message: "Ticket sales for this type have ended" });
    if (soldFor(tier.id) + q > tier.quantity)
      return fail(400, { error: true, message: "Tickets for this type are sold out" });
    const ref = hex();
    const o: MockOrder = {
      reference: ref,
      status: "pending",
      quantity: q,
      ticket_type: tier.id,
      buyer_name: json.buyer_name,
      buyer_phone: json.buyer_phone,
      buyer_email: json.buyer_email || null,
      created: Date.now(),
      expires_at: iso(Date.now() + 10 * 60e3),
      paid_at: null,
      checkout_request_id: `ws_CO_${hex()}`,
    };
    d.orders.push(o);
    if (Number(tier.price) === 0) {
      issue(o);
      save();
      const out = await orderOut(o);
      return ok(
        {
          error: false,
          message: "Free ticket issued successfully",
          data: out.tickets[0],
          order: out,
        },
        201,
      );
    }
    save();
    const first = json.buyer_name.split(" ")[0];
    return ok({
      error: false,
      message: `Hey ${first}! STK Push sent, complete payment on your phone.`,
      data: {
        ticket_number: ref,
        order_reference: ref,
        checkout_request_id: o.checkout_request_id,
        amount: Number(tier.price) * q,
        expires_at: o.expires_at,
      },
    });
  }
  if (r === "tickets" && method === "GET") {
    if (!me) return needAuth();
    const myTierIds = new Set(
      d.tiers
        .filter((t) => {
          const e = d.events.find((x) => x.id === t.event) as { organizer_id?: number } | undefined;
          return me.user_type === "admin" || e?.organizer_id === me.id;
        })
        .map((t) => t.id),
    );
    return ok({
      error: false,
      message: "All Tickets List Data",
      data: d.tickets.filter((t) => myTierIds.has(t.ticket_type)).map(ticketOut),
    });
  }
  if (r === "tickets/:id") {
    const t = d.tickets.find((x) => x.ticket_number === decodeURIComponent(seg[1]));
    if (!t)
      return fail(400, {
        error: true,
        message: "Error fetching ticket",
        details: "No Ticket matches the given query.",
      });
    await ensureQr(t);
    const tier = d.tiers.find((x) => x.id === t.ticket_type)!;
    const ev = d.events.find((e) => e.id === tier.event)!;
    return ok({
      error: false,
      message: "Single Ticket Fetch",
      data: { ...ticketOut(t), ticket_type_details: { ...tier, event_name: ev.title } },
    });
  }
  if (r === "orders/:id") {
    const o = d.orders.find((x) => x.reference === decodeURIComponent(seg[1]));
    return o
      ? ok({ error: false, message: "Order Fetch", data: await orderOut(o) })
      : fail(404, { detail: "No Order matches the given query." });
  }
  if (r === "dashboard") {
    if (!me) return needAuth();
    const evs = d.events.filter(
      (e) => me.user_type === "admin" || (e as { organizer_id?: number }).organizer_id === me.id,
    );
    const tierIds = new Set(
      d.tiers.filter((t) => evs.some((e) => e.id === t.event)).map((t) => t.id),
    );
    const tix = d.tickets.filter((t) => tierIds.has(t.ticket_type));
    const price = (id: number) => Number(d.tiers.find((t) => t.id === id)?.price || 0);
    const revenue = tix.reduce((s, t) => s + price(t.ticket_type), 0);
    const months = new Map<string, { month: string; revenue: number; tickets: number }>();
    for (let i = 5; i >= 0; i--) {
      const dt = new Date();
      dt.setMonth(dt.getMonth() - i);
      const m = dt.toLocaleString("en-US", { month: "short" });
      months.set(m, { month: m, revenue: 0, tickets: 0 });
    }
    for (const t of tix) {
      const m = new Date(t.purchase_date).toLocaleString("en-US", { month: "short" });
      const row = months.get(m);
      if (row) {
        row.revenue += price(t.ticket_type);
        row.tickets++;
      }
    }
    const today = new Date().toISOString().slice(0, 10);
    return ok({
      error: false,
      message: "Dashboard API",
      scope: me.user_type === "admin" ? "platform" : "organizer",
      overview: {
        ticketsSold: tix.length,
        revenue,
        systemFee: revenue * 0.1,
        netRevenue: revenue * 0.9,
        total_events: evs.length,
        active_events: evs.filter((e) => e.date >= today).length,
      },
      topEvents: [...evs]
        .sort((a, b) => b.id - a.id)
        .slice(0, 5)
        .map((e) => {
          const ids = d.tiers.filter((t) => t.event === e.id).map((t) => t.id);
          const et = tix.filter((t) => ids.includes(t.ticket_type));
          return {
            id: e.id,
            name: e.title,
            tickets: et.length,
            revenue: et.reduce((s, t) => s + price(t.ticket_type), 0),
            status: e.date < today ? "Ended" : e.is_open ? "Active" : "Closed",
          };
        }),
      monthlyData: [...months.values()],
      demographics: [],
    });
  }

  // ---- integrations (admin). Secrets are reduced to last4 here; the value is discarded. ----
  if (
    r === "settings/integrations" ||
    r === "settings/integrations/:p" ||
    r === "settings/integrations/:p/test"
  ) {
    if (!me) return needAuth();
    if (me.user_type !== "admin")
      return fail(403, { detail: "You do not have permission to perform this action." });
    d.integrations ||= seedIntegrations();
    const out = (id) => ({ provider: id, ...d.integrations[id] });
    if (r === "settings/integrations" && method === "GET")
      return ok({ error: false, message: "Integrations", data: PROVIDERS.map((p) => out(p.id)) });
    const def = PROVIDERS.find((p) => p.id === seg[2]);
    if (!def) return fail(404, { detail: "Not found." });
    const cur = d.integrations[def.id];
    if (r === "settings/integrations/:p" && method === "PATCH") {
      if (!json?.password || json.password !== me.password)
        return fail(403, { detail: "Incorrect password" });
      const errs = {};
      for (const [k, v] of Object.entries(json.fields || {})) {
        const f = def.fields.find((x) => x.name === k);
        if (!f) {
          errs[k] = ["Unknown field."];
          continue;
        }
        const m = v && f.check ? f.check(String(v)) : null;
        if (m) {
          errs[k] = [m];
          continue;
        }
        cur.fields[k] = f.secret
          ? { value: null, configured: !!v, last4: v ? String(v).slice(-4) : null }
          : { value: String(v), configured: !!v, last4: null };
      }
      if (Object.keys(errs).length)
        return fail(400, { error: true, message: "Validation Error", errors: errs });
      if (typeof json.enabled === "boolean") {
        const missing = def.fields.filter((f) => f.required && !cur.fields[f.name]?.configured);
        if (json.enabled && missing.length)
          return fail(400, {
            error: true,
            message: `Add ${missing.map((f) => f.label).join(", ")} before turning this on`,
          });
        cur.enabled = json.enabled;
      }
      cur.updated_at = iso(Date.now());
      cur.updated_by = me.name;
      save();
      return ok({ error: false, message: "Integration updated", data: out(def.id) });
    }
    if (r === "settings/integrations/:p/test" && method === "POST") {
      const missing = def.fields.filter((f) => f.required && !cur.fields[f.name]?.configured);
      if (missing.length)
        return ok({
          error: false,
          message: "Test",
          data: { ok: false, message: `Missing: ${missing.map((f) => f.label).join(", ")}.` },
        });
      const msg = {
        mpesa: "Got an access token from Daraja.",
        sms: "Onfon accepted the credentials.",
        sasapay: "SasaPay accepted the credentials.",
        stripe: "Stripe accepted the secret key.",
      }[def.id];
      return ok({
        error: false,
        message: "Test",
        data: { ok: true, message: `${msg} (simulated in demo mode)` },
      });
    }
  }
  return fail(404, { detail: "Not found." });
}

function mockPerformance(d, e) {
  const tiers = d.tiers.filter((t) => t.event === e.id);
  const ids = tiers.map((t) => t.id);
  const orders = d.orders.filter((o) => ids.includes(o.ticket_type));
  const paid = orders.filter((o) => o.status === "paid");
  const tix = d.tickets.filter((t) => ids.includes(t.ticket_type));
  const views = (d.views && d.views[e.id]) || {};
  const totalViews = Object.values(views).reduce((a, b) => a + b, 0);
  const day = (offset) => new Date(Date.now() - offset * 864e5).toISOString().slice(0, 10);
  const last7 = new Set(Array.from({ length: 7 }, (_, i) => day(i)));
  const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);
  const tierRows = tiers.map((t) => {
    const sold = tix.filter((x) => x.ticket_type === t.id).length;
    return {
      id: t.id,
      name: t.name,
      price: t.price,
      capacity: t.quantity,
      sold,
      remaining: Math.max(t.quantity - sold, 0),
      revenue: sold * Number(t.price),
      sell_through: pct(sold, t.quantity),
      sales_start: t.sales_start,
      sales_end: t.sales_end,
    };
  });
  const sold = tierRows.reduce((a, r) => a + r.sold, 0);
  const capacity = tierRows.reduce((a, r) => a + r.capacity, 0);
  const revenue = tierRows.reduce((a, r) => a + r.revenue, 0);
  const byStatus = { pending: 0, paid: 0, failed: 0, expired: 0, refund_required: 0 };
  for (const o of orders) byStatus[o.status] += 1;
  const daily = Array.from({ length: 30 }, (_, i) => {
    const date = day(29 - i);
    const dayTix = tix.filter((t) => t.purchase_date.slice(0, 10) === date);
    return {
      date,
      views: views[date] || 0,
      tickets: dayTix.length,
      revenue: dayTix.reduce(
        (a, t) => a + Number(d.tiers.find((x) => x.id === t.ticket_type)?.price || 0),
        0,
      ),
    };
  });
  const org = d.users.find((u) => u.id === e.organizer_id);
  return {
    event: { id: e.id, title: e.title, organizer: { id: org?.id, name: org?.name || "" } },
    totals: {
      views: totalViews,
      views_7d: Object.entries(views)
        .filter(([k]) => last7.has(k))
        .reduce((a, [, v]) => a + v, 0),
      tickets_sold: sold,
      capacity,
      sell_through: pct(sold, capacity),
      revenue,
      orders_paid: paid.length,
      avg_order_value: paid.length ? Math.round((revenue / paid.length) * 100) / 100 : 0,
      conversion_rate: pct(paid.length, totalViews),
    },
    orders_by_status: byStatus,
    tiers: tierRows,
    daily,
    recent_orders: [...orders]
      .sort((a, b) => b.created - a.created)
      .slice(0, 10)
      .map((o) => ({
        reference: o.reference,
        status: o.status,
        tier: d.tiers.find((t) => t.id === o.ticket_type)?.name,
        quantity: o.quantity,
        total_amount: Number(d.tiers.find((t) => t.id === o.ticket_type)?.price || 0) * o.quantity,
        buyer_name: o.buyer_name,
        created_at: iso(o.created),
        paid_at: o.paid_at,
      })),
  };
}

// ---- wallets (demo): mirrors hostmeApps.wallets ----
const COMMISSION = 0.1;
function walletOf(userId) {
  const d = load();
  d.wallets ||= {};
  d.wallets[userId] ||= { balance: 0, txs: [], withdrawals: [] };
  return d.wallets[userId];
}
function post(w, kind, amount, description, extra = {}) {
  const next = Math.round((w.balance + amount) * 100) / 100;
  if (next < 0) throw new Error("Insufficient balance");
  w.balance = next;
  w.txs.unshift({
    id: nextId(),
    kind,
    amount,
    balance_after: next,
    gross_amount: null,
    commission: null,
    order_reference: null,
    withdrawal_id: null,
    description,
    created_at: iso(Date.now()),
    ...extra,
  });
}
function creditOrder(o) {
  const d = load();
  const tier = d.tiers.find((t) => t.id === o.ticket_type);
  const ev = d.events.find((e) => e.id === tier.event);
  const gross = Number(tier.price) * o.quantity;
  if (gross <= 0) return;
  const w = walletOf(ev.organizer_id);
  if (w.txs.some((t) => t.order_reference === o.reference)) return;
  const commission = Math.round(gross * COMMISSION * 100) / 100;
  post(w, "sale", gross - commission, `${o.quantity} × ${tier.name} · ${ev.title}`, {
    gross_amount: gross,
    commission,
    order_reference: o.reference,
  });
}
function walletSummary(userId) {
  const d = load();
  const w = walletOf(userId);
  const min = (d.payoutSettings || {}).min_withdrawal ?? 15000;
  const sum = (arr, f) => arr.reduce((a, x) => a + (f(x) || 0), 0);
  const sales = w.txs.filter((t) => t.kind === "sale");
  const pending = w.withdrawals.filter((x) => x.status === "pending");
  return {
    balance: w.balance,
    currency: "KES",
    min_withdrawal: min,
    commission_rate: COMMISSION,
    can_withdraw: w.balance >= min,
    totals: {
      gross_sales: sum(sales, (t) => t.gross_amount),
      commission: sum(sales, (t) => t.commission),
      net_earnings: sum(sales, (t) => t.amount),
      adjustments: sum(
        w.txs.filter((t) => t.kind === "adjustment"),
        (t) => t.amount,
      ),
      withdrawn: sum(
        w.withdrawals.filter((x) => x.status === "paid"),
        (x) => x.amount,
      ),
      pending_withdrawals: sum(pending, (x) => x.amount),
      pending_count: pending.length,
    },
  };
}
function allWithdrawals() {
  const d = load();
  return Object.entries(d.wallets || {}).flatMap(([uid, w]) =>
    w.withdrawals.map((x) => ({ x, w, user: d.users.find((u) => u.id === Number(uid)) })),
  );
}

function seedIntegrations() {
  const blank = (id) => {
    const def = PROVIDERS.find((p) => p.id === id);
    const fields = {};
    for (const f of def.fields)
      fields[f.name] = {
        value: f.secret ? null : (f.options?.[0]?.value ?? null),
        configured: !!(!f.secret && f.options),
        last4: null,
      };
    return { enabled: false, fields, updated_at: null, updated_by: null };
  };
  const all = Object.fromEntries(PROVIDERS.map((p) => [p.id, blank(p.id)]));
  // Simulate the credentials the backend currently reads from its environment.
  const set = (id, name, v, secret) =>
    (all[id].fields[name] = secret
      ? { value: null, configured: true, last4: v }
      : { value: v, configured: true, last4: null });
  set("mpesa", "consumer_key", "x9Qa", true);
  set("mpesa", "consumer_secret", "7mKd", true);
  set("mpesa", "shortcode", "174379");
  set("mpesa", "passkey", "c919", true);
  set("mpesa", "callback_url", "https://api.myevents.africa/api/mpesa/callback/");
  all.mpesa.enabled = true;
  set("sms", "api_key", "3f2a", true);
  set("sms", "access_key", "b81e", true);
  set("sms", "client_id", "hostme");
  set("sms", "sender_id", "MyEvents");
  all.sms.enabled = true;
  return all;
}

function route(seg: string[]) {
  if (seg[0] === "userinfo" && seg[1] === "change-password") return "userinfo/change-password";
  if (seg[0] === "settings" && seg[1] === "integrations")
    return seg.length === 2
      ? "settings/integrations"
      : seg[3] === "test"
        ? "settings/integrations/:p/test"
        : "settings/integrations/:p";
  if (seg.length === 2 && ["all-events", "events", "tickets", "orders"].includes(seg[0]))
    return `${seg[0]}/:id`;
  return seg[0] || "";
}

export function resetMockData() {
  db = seed();
  save();
}
