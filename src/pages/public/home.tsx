import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  CalendarSearch,
  QrCode,
  ShieldCheck,
  Smartphone,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EventCard, EventCardSkeleton, EventGrid } from "@/components/events/event-card";
import { HeroSearch } from "@/components/events/hero-search";
import { Poster } from "@/components/events/poster";
import { EmptyState, ErrorState } from "@/components/common/states";
import { WidePage } from "@/components/layout/public-layout";
import { publicEventsQuery } from "@/lib/api/queries";
import type { Event } from "@/lib/api/types";
import { upcoming } from "@/lib/events";
import { eventWhen, priceRange } from "@/lib/format";
import { useTitle } from "@/hooks/use-title";

function categoryCounts(events: Event[]): [string, number][] {
  const m = new Map<string, number>();
  for (const e of events) m.set(e.category, (m.get(e.category) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 6);
}

export default function HomePage() {
  useTitle("Event tickets in Kenya");
  const q = useQuery(publicEventsQuery());
  const soon = q.data ? upcoming(q.data) : [];
  const onSale = soon.filter((e) => e.is_open);
  const featured = soon.filter((e) => e.is_feature);
  const spotlight = featured[0] ?? soon[0];

  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#172554] text-white dark:bg-[#0b1220]">
        <div
          className="absolute inset-0 -z-10 opacity-60 [background:radial-gradient(60%_80%_at_85%_10%,#1d4ed8_0%,transparent_60%),radial-gradient(40%_60%_at_0%_100%,#0369a1_0%,transparent_70%)]"
          aria-hidden
        />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:gap-16 lg:px-8 lg:pb-20">
          <div>
            <p
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-blue-100"
              aria-live="polite"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              {q.data ? (
                <span>
                  <span className="tabular">{onSale.length}</span>{" "}
                  {onSale.length === 1 ? "event" : "events"} on sale now
                </span>
              ) : (
                "Live events across Kenya"
              )}
            </p>
            <h1 className="max-w-xl text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              Your next great night out starts here.
            </h1>
            <p className="mt-4 max-w-lg text-lg text-blue-100/90">
              Pick a ticket, pay with M-Pesa, get your QR code by SMS. No account needed.
            </p>
            <div className="mt-8 max-w-xl">
              <HeroSearch categories={categoryCounts(soon)} total={soon.length} />
            </div>
          </div>

          <div className="hidden lg:block">
            {q.isPending ? (
              <Skeleton className="aspect-[4/5] rounded-2xl bg-white/10" />
            ) : spotlight ? (
              <Spotlight
                event={spotlight}
                label={spotlight.is_feature ? "Featured" : "Coming up"}
              />
            ) : null}
          </div>
        </div>
      </section>

      <WidePage className="space-y-16">
        {q.isPending ? (
          <Section title="Coming up">
            <EventGrid>
              {Array.from({ length: 4 }, (_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </EventGrid>
          </Section>
        ) : q.isError ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} title="We couldn't load events" />
        ) : (
          <>
            {featured.length > 1 && (
              <Section title="Featured" subtitle="Hand-picked events worth planning for">
                <EventGrid>
                  {featured.slice(0, 4).map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </EventGrid>
              </Section>
            )}
            <Section
              title="Coming up"
              subtitle={soon.length ? "Soonest first" : undefined}
              action={
                soon.length > 0 && (
                  <Button asChild variant="link">
                    <Link to="/events">
                      See all events <ArrowRight />
                    </Link>
                  </Button>
                )
              }
            >
              {soon.length ? (
                <EventGrid>
                  {soon.slice(0, 8).map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </EventGrid>
              ) : (
                <EmptyState
                  icon={<CalendarSearch />}
                  title="No upcoming events yet"
                  description="New events are added all the time. Check back soon."
                />
              )}
            </Section>
          </>
        )}

        <section aria-labelledby="how" className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:gap-12">
          <div>
            <h2 id="how" className="text-2xl font-bold sm:text-3xl">
              Three taps to the gate
            </h2>
            <p className="mt-2 text-muted-foreground">
              Built for phones and M-Pesa. Tickets reach you by SMS and email, so there's no
              password to forget.
            </p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-3">
            {[
              {
                Icon: Ticket,
                t: "Choose",
                d: "Pick a ticket type and how many you need, up to 10.",
              },
              { Icon: Smartphone, t: "Pay", d: "Approve the M-Pesa prompt on your phone." },
              { Icon: QrCode, t: "Show", d: "Your QR code arrives by SMS. Show it at the gate." },
            ].map(({ Icon, t, d }, i) => (
              <li key={t} className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center justify-between">
                  <Icon className="size-6 text-brand" aria-hidden />
                  <span className="text-sm font-semibold text-muted-foreground tabular">
                    0{i + 1}
                  </span>
                </div>
                <p className="mt-4 font-semibold">{t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="organizers"
          className="overflow-hidden rounded-2xl bg-brand-soft p-6 sm:p-10 dark:bg-[#111c3a]"
        >
          <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-brand">
                For organizers
              </p>
              <h2 id="organizers" className="mt-2 text-2xl font-bold sm:text-3xl">
                Hosting something? Sell tickets on HostMe.
              </h2>
              <p className="mt-3 max-w-md text-muted-foreground">
                Set up ticket tiers, take M-Pesa payments and watch sales come in, all from one
                dashboard.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/register">Start selling</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/organizers">How it works</Link>
                </Button>
              </div>
            </div>
            <ul className="grid gap-3 text-sm">
              {[
                {
                  Icon: Ticket,
                  t: "Multiple ticket tiers",
                  d: "Early bird, Regular, VIP, with their own sale windows.",
                },
                {
                  Icon: BarChart3,
                  t: "Live sales dashboard",
                  d: "Tickets, revenue and attendee lists, exportable to CSV.",
                },
                {
                  Icon: ShieldCheck,
                  t: "QR check-in",
                  d: "Every ticket carries a unique QR code.",
                },
              ].map(({ Icon, t, d }) => (
                <li key={t} className="flex gap-3 rounded-xl bg-surface p-4">
                  <Icon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
                  <span>
                    <span className="block font-semibold">{t}</span>
                    <span className="text-muted-foreground">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </WidePage>
    </>
  );
}

function Spotlight({ event, label }: { event: Event; label: string }) {
  const when = eventWhen(event.date, event.time);
  return (
    <Link
      to={`/events/${event.id}`}
      className="group block overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/15 transition hover:ring-white/40"
    >
      <div className="relative">
        <Poster src={event.poster} title={event.title} ratio="aspect-[4/3]" eager />
        <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#172554]">
          {label}
        </span>
      </div>
      <div className="flex items-end justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-sm text-blue-100">
            {when.day} · {when.time}
          </p>
          <p className="mt-1 line-clamp-2 text-xl font-bold">{event.title}</p>
          <p className="mt-1 line-clamp-1 text-sm text-blue-100">{event.venue}</p>
        </div>
        <span className="shrink-0 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#1d4ed8] tabular">
          {priceRange(event)}
        </span>
      </div>
    </Link>
  );
}

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string | undefined;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
