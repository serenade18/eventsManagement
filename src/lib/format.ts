import type { Event, Money, TicketType } from "./api/types";

const TZ = "Africa/Nairobi";
const kes = new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 });

export function money(v: Money | null | undefined, freeLabel = true) {
  const n = Number(v ?? 0);
  if (freeLabel && n === 0) return "Free";
  return kes.format(n);
}

export function dateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(d);
  return `${day} · ${time}`;
}

export function shortDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

/** Event date + time are local values; format without timezone conversion. */
export function eventWhen(date: string, time: string) {
  const [y = 1970, m = 1, d = 1] = date.split("-").map(Number);
  const [hh = 0, mm = 0] = (time || "00:00").split(":").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, hh, mm));
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(dt);
  const t = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", hour: "numeric", minute: "2-digit" }).format(dt);
  return { day, time: t, month: new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "short" }).format(dt), dom: d };
}

export function todayNairobi() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export const isPast = (e: Event) => e.date < todayNairobi();

export function lowestPrice(e: Event) {
  if (!e.ticket_types.length) return 0;
  return Math.min(...e.ticket_types.map((t) => Number(t.price)));
}

export type SaleState = { state: "upcoming" | "closed" | "open"; label: string };
export function saleState(t: TicketType, now = Date.now()): SaleState {
  if (now < new Date(t.sales_start).getTime()) return { state: "upcoming", label: `On sale from ${dateTime(t.sales_start)}` };
  if (now > new Date(t.sales_end).getTime()) return { state: "closed", label: "Sales closed" };
  return { state: "open", label: "On sale" };
}

export function countdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Kenyan mobile: 07…, 01…, +2547…, 2547…, 7… with optional spaces. */
export function isKenyanPhone(v: string) {
  const s = v.replace(/[\s-]/g, "");
  return /^(?:\+?254|0)?[17]\d{8}$/.test(s);
}

export function maskPhone(p: string | null | undefined) {
  if (!p) return "";
  const s = p.replace(/\D/g, "");
  const local = s.startsWith("254") ? "0" + s.slice(3) : s.startsWith("0") ? s : "0" + s;
  return `${local.slice(0, 2)}XX XXX ${local.slice(-3)}`;
}

export function downloadFile(name: string, content: string | Blob, type = "text/plain") {
  const blob = typeof content === "string" ? new Blob([content], { type }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function toCsv(rows: (string | number | null | undefined)[][]) {
  return rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function buildIcs(opts: { title: string; date: string; time: string; location: string; description?: string }) {
  const d = opts.date.replace(/-/g, "");
  const t = (opts.time || "00:00").replace(/:/g, "").slice(0, 4) + "00";
  const [hh = 0] = (opts.time || "00").split(":").map(Number);
  const endH = String(Math.min(23, hh + 3)).padStart(2, "0");
  const esc = (s: string) => s.replace(/[,;\\]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//HostMe//EN", "BEGIN:VEVENT",
    `UID:${Date.now()}@hostme`, `DTSTART;TZID=Africa/Nairobi:${d}T${t}`, `DTEND;TZID=Africa/Nairobi:${d}T${endH}${t.slice(2)}`,
    `SUMMARY:${esc(opts.title)}`, `LOCATION:${esc(opts.location)}`, `DESCRIPTION:${esc(opts.description || "")}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

/** Nairobi is UTC+3 all year (no DST), so datetime-local values map to a fixed offset. */
export function toNairobiInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 3 * 3600_000);
  return d.toISOString().slice(0, 16);
}
export function fromNairobiInput(v: string) {
  return v ? `${v}:00+03:00` : "";
}

export function displayTicketNumber(n: string) {
  return n.toUpperCase();
}

/** Event's local start as a timestamp (treated as Nairobi time). */
export function eventStartMs(date: string, time: string) {
  return new Date(`${date}T${(time || "00:00").slice(0, 5)}:00+03:00`).getTime();
}
