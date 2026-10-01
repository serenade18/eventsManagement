import { Link } from "react-router-dom";
import { CalendarDays, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Poster } from "./poster";
import type { Event } from "@/lib/api/types";
import { eventWhen, isPast, lowestPrice, money } from "@/lib/format";

export function EventCard({ event }: { event: Event }) {
  const when = eventWhen(event.date, event.time);
  const low = lowestPrice(event);
  const free = event.is_free || low === 0;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-lg focus-within:ring-2 focus-within:ring-ring">
      <div className="relative">
        <Poster src={event.poster} title={event.title} />
        <div className="absolute left-3 top-3 rounded-lg bg-surface/95 px-2.5 py-1 text-center leading-tight shadow-sm">
          <div className="text-[11px] font-semibold uppercase text-brand">{when.month}</div>
          <div className="text-lg font-bold tabular">{when.dom}</div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="w-fit rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {event.category}
        </span>
        <h3 className="line-clamp-2 text-base font-semibold leading-snug">
          <Link
            to={`/events/${event.id}`}
            className="after:absolute after:inset-0 focus:outline-none"
          >
            {event.title}
          </Link>
        </h3>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <CalendarDays className="size-4 shrink-0" aria-hidden />
            {when.day} · {when.time}
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{event.venue}</span>
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-semibold tabular">
            {isPast(event) ? (
              <span className="text-muted-foreground">Ended</span>
            ) : free ? (
              <span className="text-success">Free</span>
            ) : (
              <>From {money(low)}</>
            )}
          </span>
          <span className="text-sm font-medium text-brand group-hover:underline" aria-hidden>
            View event
          </span>
        </div>
      </div>
    </article>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="mt-3 h-5 w-24" />
      </div>
    </div>
  );
}

export function EventGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>;
}
