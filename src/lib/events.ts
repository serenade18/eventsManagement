import type { Event } from "./api/types";
import { eventStartMs, isPast, lowestPrice, todayNairobi } from "./format";

export const bySoonest = (a: Event, b: Event) =>
  eventStartMs(a.date, a.time) - eventStartMs(b.date, b.time);

export function upcoming(events: Event[]) {
  const today = todayNairobi();
  return events.filter((e) => e.date >= today).sort(bySoonest);
}

export type DateFilter = "upcoming" | "week" | "month" | "past" | "all";
export type PriceFilter = "all" | "free" | "paid";

export interface EventFilters {
  q: string;
  category: string;
  when: DateFilter;
  price: PriceFilter;
}

function addDays(ymd: string, n: number) {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function filterEvents(events: Event[], f: EventFilters) {
  const today = todayNairobi();
  const q = f.q.trim().toLowerCase();
  const out = events.filter((e) => {
    if (q && ![e.title, e.venue, e.category].some((s) => s.toLowerCase().includes(q))) return false;
    if (f.category && e.category !== f.category) return false;
    const free = e.is_free || lowestPrice(e) === 0;
    if (f.price === "free" && !free) return false;
    if (f.price === "paid" && free) return false;
    switch (f.when) {
      case "upcoming":
        return e.date >= today;
      case "week":
        return e.date >= today && e.date <= addDays(today, 7);
      case "month":
        return e.date >= today && e.date <= addDays(today, 31);
      case "past":
        return e.date < today;
      default:
        return true;
    }
  });
  return f.when === "past" ? out.sort((a, b) => bySoonest(b, a)) : out.sort(bySoonest);
}

export function categories(events: Event[]) {
  return [...new Set(events.map((e) => e.category).filter(Boolean))].sort();
}

export { isPast };
