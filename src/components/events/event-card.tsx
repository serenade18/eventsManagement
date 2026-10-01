import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Poster } from "./poster";
import type { Event } from "@/lib/api/types";
import { eventWhen, isPast, priceRange, weekday } from "@/lib/format";

/**
 * Poster-led card: a tall poster carries the date, details sit beneath it.
 * The whole card is one link; text below stays in text tokens for contrast.
 */
export function EventCard({ event }: { event: Event }) {
  const when = eventWhen(event.date, event.time);
  const past = isPast(event);
  const price = priceRange(event);
  return (
    <Link
      to={`/events/${event.id}`}
      className="group block rounded-xl focus-visible:outline-offset-4"
      aria-label={`${event.title}, ${when.day} at ${event.venue}, ${past ? "ended" : price}`}
    >
      <div className="relative overflow-hidden rounded-xl border border-border bg-muted">
        <Poster
          src={event.poster}
          title={event.title}
          ratio="aspect-[4/5]"
          className="transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/30 to-transparent"
          aria-hidden
        />
        <div className="absolute bottom-3 left-3 text-white" aria-hidden>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] opacity-85">
            {weekday(event.date)}
          </span>
          <span className="flex items-baseline gap-1.5 leading-none">
            <span className="text-3xl font-extrabold tabular">{when.dom}</span>
            <span className="text-sm font-bold uppercase tracking-wider">{when.month}</span>
          </span>
        </div>
        <span className="absolute left-3 top-3 rounded-full bg-surface/90 px-2.5 py-1 text-[11px] font-semibold text-foreground backdrop-blur">
          {event.category}
        </span>
        {past && (
          <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white">
            Ended
          </span>
        )}
      </div>
      <div className="px-0.5 pt-3" aria-hidden>
        <h3 className="line-clamp-2 font-semibold leading-snug group-hover:text-brand">
          {event.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
          {when.time} · {event.venue}
        </p>
        <p className="mt-1.5 text-sm font-semibold tabular">
          {past ? (
            <span className="text-muted-foreground">Sales closed</span>
          ) : price === "Free" ? (
            <span className="text-success">Free</span>
          ) : (
            price
          )}
        </p>
      </div>
    </Link>
  );
}

export function EventCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[4/5] rounded-xl" />
      <Skeleton className="mt-3 h-5 w-4/5" />
      <Skeleton className="mt-2 h-4 w-3/5" />
      <Skeleton className="mt-2 h-4 w-24" />
    </div>
  );
}

export function EventGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
      {children}
    </div>
  );
}
