import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Clock, Lock, MapPin, Ticket, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Poster } from "@/components/events/poster";
import { EmptyState, ErrorState } from "@/components/common/states";
import { WidePage } from "@/components/layout/public-layout";
import { publicEventQuery } from "@/lib/api/queries";
import { ApiError } from "@/lib/api/client";
import type { Event, TicketType } from "@/lib/api/types";
import { eventWhen, isPast, money, saleState } from "@/lib/format";
import { useTitle } from "@/hooks/use-title";

export default function EventDetailPage() {
  const { id = "" } = useParams();
  const q = useQuery(publicEventQuery(id));
  useTitle(
    q.data?.title,
    q.data ? { description: q.data.description, image: q.data.poster } : undefined,
  );

  if (q.isPending) return <DetailSkeleton />;
  if (q.isError) {
    const nf = q.error instanceof ApiError && q.error.status === 404;
    return (
      <WidePage>
        {nf ? (
          <EmptyState
            icon={<CalendarDays />}
            title="We couldn't find that event"
            description="It may have been removed or the link is wrong."
            action={
              <Button asChild>
                <Link to="/events">Browse events</Link>
              </Button>
            }
          />
        ) : (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        )}
      </WidePage>
    );
  }

  const e = q.data;
  const when = eventWhen(e.date, e.time);
  const past = isPast(e);

  return (
    <WidePage>
      <Link
        to="/events"
        className="mb-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> All events
      </Link>
      <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-12">
        <div className="min-w-0 space-y-6">
          <Poster
            src={e.poster}
            title={e.title}
            ratio="aspect-[16/10]"
            className="rounded-2xl"
            eager
          />
          <div>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {e.category}
            </span>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{e.title}</h1>
          </div>
          <dl className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2">
            <Meta icon={<CalendarDays />} label="Date" value={when.day} />
            <Meta icon={<Clock />} label="Time" value={when.time} />
            <Meta icon={<MapPin />} label="Venue" value={e.venue} />
            <Meta
              icon={<UserRound />}
              label="Organizer"
              value={e.organizer.organization || e.organizer.name}
            />
          </dl>
          {past && (
            <div
              role="status"
              className="rounded-xl border border-border bg-muted px-4 py-3 font-medium"
            >
              This event has ended.
            </div>
          )}
          <section aria-labelledby="about">
            <h2 id="about" className="mb-2 text-xl font-semibold">
              About this event
            </h2>
            <p className="max-w-prose whitespace-pre-line text-muted-foreground">{e.description}</p>
          </section>
          {e.sponsors.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Supported by {e.sponsors.length} {e.sponsors.length === 1 ? "sponsor" : "sponsors"}.
            </p>
          )}
        </div>
        <aside aria-labelledby="tickets" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 id="tickets" className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <Ticket className="size-5 text-brand" aria-hidden /> Tickets
            </h2>
            {!past && !e.is_open && (
              <p className="mb-4 flex items-center gap-2 rounded-lg bg-warning-soft px-3 py-2 text-sm font-medium text-warning">
                <Lock className="size-4" aria-hidden /> Ticket sales are closed for this event.
              </p>
            )}
            {e.ticket_types.length ? (
              <ul className="space-y-3">
                {e.ticket_types.map((t) => (
                  <TierRow key={t.id} event={e} tier={t} />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Tickets aren't available yet.</p>
            )}
          </div>
        </aside>
      </div>
    </WidePage>
  );
}

function TierRow({ event, tier }: { event: Event; tier: TicketType }) {
  const s = saleState(tier);
  const past = isPast(event);
  const canBuy = !past && event.is_open && s.state === "open";
  const note = past
    ? "Event ended"
    : !event.is_open
      ? "Sales closed"
      : s.state === "open"
        ? null
        : s.label;
  return (
    <li className="rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{tier.name}</p>
          {tier.description && <p className="text-sm text-muted-foreground">{tier.description}</p>}
        </div>
        <p className="shrink-0 text-lg font-bold tabular">{money(tier.price)}</p>
      </div>
      <div className="mt-3">
        {canBuy ? (
          <Button asChild className="w-full">
            <Link
              to={`/events/${event.id}/checkout?tier=${tier.id}`}
              aria-label={`Buy ${tier.name} ticket`}
            >
              Buy ticket
            </Link>
          </Button>
        ) : (
          <Badge variant={s.state === "upcoming" && !past ? "info" : "secondary"} className="py-1">
            {note}
          </Badge>
        )}
      </div>
    </li>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-brand [&_svg]:size-5" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </dt>
        <dd className="font-medium">{value}</dd>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <WidePage>
      <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-12">
        <div className="space-y-4">
          <Skeleton className="aspect-[16/10] rounded-2xl" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </WidePage>
  );
}
