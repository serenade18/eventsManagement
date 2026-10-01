import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Clock, MapPin, Ticket, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Poster } from "@/components/events/poster";
import { EventActions } from "@/components/events/event-actions";
import { TicketPicker, useTicketSelection } from "@/components/events/ticket-picker";
import { EmptyState, ErrorState } from "@/components/common/states";
import { WidePage } from "@/components/layout/public-layout";
import { publicEventQuery } from "@/lib/api/queries";
import { trackEventView } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import type { Event } from "@/lib/api/types";
import { eventWhen, isPast, money, priceRange } from "@/lib/format";
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
  return <EventDetail event={q.data} />;
}

/** Count one view per event per browser session (reloads don't inflate it). */
function useTrackView(id: number) {
  useEffect(() => {
    const key = `hostme.viewed.${id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* storage blocked: still count once per page load */
    }
    void trackEventView(id);
  }, [id]);
}

function EventDetail({ event: e }: { event: Event }) {
  useTrackView(e.id);
  const when = eventWhen(e.date, e.time);
  const past = isPast(e);
  const sel = useTicketSelection(e);
  const tier = e.ticket_types.find((t) => t.id === sel.selected);
  const showBar = !past && !!sel.firstOpen;

  // Reserve room so the fixed mobile buy bar never covers the footer.
  useEffect(() => {
    if (!showBar) return;
    document.body.classList.add("has-buy-bar");
    return () => document.body.classList.remove("has-buy-bar");
  }, [showBar]);

  return (
    <>
      <div className="relative isolate overflow-hidden border-b border-border bg-[#0f172a]">
        {e.poster && (
          <img
            src={e.poster}
            alt=""
            className="absolute inset-0 -z-10 size-full scale-110 object-cover opacity-40 blur-2xl"
          />
        )}
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 md:grid-cols-[320px_1fr] md:items-end md:gap-10 md:py-10 lg:px-8">
          <Link
            to="/events"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white md:col-span-2"
          >
            <ArrowLeft className="size-4" aria-hidden /> All events
          </Link>
          <Poster
            src={e.poster}
            title={e.title}
            ratio="aspect-[4/5]"
            className="mx-auto w-full max-w-[320px] rounded-2xl shadow-2xl ring-1 ring-white/10"
            eager
          />
          <div className="text-white">
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
              {e.category}
            </span>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-5xl">{e.title}</h1>
            <p className="mt-3 text-lg text-white/85">
              {when.day} · {when.time}
            </p>
            <p className="text-white/70">{e.venue}</p>
            {!past && <p className="mt-4 text-lg font-semibold tabular">{priceRange(e)}</p>}
          </div>
        </div>
      </div>

      <WidePage>
        <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-12">
          <div className="min-w-0 space-y-8">
            <EventActions event={e} />
            {past && (
              <div
                role="status"
                className="rounded-xl border border-border bg-muted px-4 py-3 font-medium"
              >
                This event has ended.
              </div>
            )}
            <dl className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2">
              <Meta icon={<CalendarDays />} label="Date" value={when.day} />
              <Meta icon={<Clock />} label="Starts" value={when.time} />
              <Meta icon={<MapPin />} label="Venue" value={e.venue} />
              <Meta
                icon={<UserRound />}
                label="Organizer"
                value={e.organizer.organization || e.organizer.name}
              />
            </dl>
            <section aria-labelledby="about">
              <h2 id="about" className="mb-3 text-xl font-semibold">
                About this event
              </h2>
              <p className="max-w-prose whitespace-pre-line leading-relaxed text-muted-foreground">
                {e.description}
              </p>
            </section>
            {e.sponsors.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Supported by {e.sponsors.length} {e.sponsors.length === 1 ? "sponsor" : "sponsors"}.
              </p>
            )}
          </div>

          <aside
            id="tickets"
            aria-labelledby="tickets-title"
            className="scroll-mt-20 lg:sticky lg:top-24 lg:self-start"
          >
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h2 id="tickets-title" className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <Ticket className="size-5 text-brand" aria-hidden /> Tickets
              </h2>
              <TicketPicker
                event={e}
                selected={sel.selected}
                onSelect={sel.setSelected}
                qty={sel.qty}
                onQty={sel.setQty}
              />
            </div>
          </aside>
        </div>
      </WidePage>

      {/* Mobile buy bar: keeps the price and next step in reach while reading. */}
      {showBar && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">
                {tier ? `${sel.qty} × ${tier.name}` : "Tickets"}
              </p>
              <p className="font-bold tabular">
                {tier ? money(Number(tier.price) * sel.qty) : priceRange(e)}
              </p>
            </div>
            {tier ? (
              <Button asChild size="lg">
                <Link to={`/events/${e.id}/checkout?tier=${tier.id}&qty=${sel.qty}`}>Continue</Link>
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() =>
                  document.getElementById("tickets")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Get tickets
              </Button>
            )}
          </div>
        </div>
      )}
    </>
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
    <>
      <div className="bg-[#0f172a]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-[320px_1fr] lg:px-8">
          <Skeleton className="aspect-[4/5] w-full max-w-[320px] rounded-2xl bg-white/10" />
          <div className="space-y-3 self-end">
            <Skeleton className="h-6 w-20 bg-white/10" />
            <Skeleton className="h-12 w-3/4 bg-white/10" />
            <Skeleton className="h-6 w-1/2 bg-white/10" />
          </div>
        </div>
      </div>
      <WidePage>
        <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
          <Skeleton className="h-64" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </WidePage>
    </>
  );
}
