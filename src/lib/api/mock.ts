/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- loosely typed in-browser mock of the backend
// In-browser mock of the HostMe backend, used when no VITE_API_BASE_URL is set
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

const KEY = "hostme.mockdb.v1";
let db: DB | null = null;

const iso = (ms: number) => new Date(ms).toISOString();
const dayOffset = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);

function seed(): DB {
  const now = Date.now();
  const users: MockUser[] = [
    {
      id: 1,
      email: "admin@hostme.co.ke",
      name: "HostMe Admin",
      phone: "0700000001",
      user_type: "admin",
      organization: "HostMe",
      country: "Kenya",
      city: "Nairobi",
      bio: null,
      added_on: iso(now - 90 * 864e5),
      password: "admin1234",
    },
    {
      id: 2,
      email: "org@hostme.co.ke",
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
      email: "sponsor@hostme.co.ke",
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
    if (json?.code !== "hostme-demo-admin-code")
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
            name: e.title,
            tickets: et.length,
            revenue: et.reduce((s, t) => s + price(t.ticket_type), 0),
            status: e.date >= today ? "Active" : "Ended",
          };
        }),
      monthlyData: [...months.values()],
      demographics: [{ ageGroup: "18-25", percentage: 35, count: 857 }],
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
  set("mpesa", "callback_url", "https://api.hostme.co.ke/api/mpesa/callback/");
  all.mpesa.enabled = true;
  set("sms", "api_key", "3f2a", true);
  set("sms", "access_key", "b81e", true);
  set("sms", "client_id", "hostme");
  set("sms", "sender_id", "HostMe");
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
