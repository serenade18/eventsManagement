import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarSearch, ShieldCheck, Smartphone, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCard, EventCardSkeleton, EventGrid } from "@/components/events/event-card";
import { EmptyState, ErrorState } from "@/components/common/states";
import { WidePage } from "@/components/layout/public-layout";
import { publicEventsQuery } from "@/lib/api/queries";
import { upcoming } from "@/lib/events";
import { useTitle } from "@/hooks/use-title";
import hero from "@/assets/hero.jpg";

export default function HomePage() {
  useTitle("Event tickets in Kenya");
  const q = useQuery(publicEventsQuery());
  const soon = q.data ? upcoming(q.data) : [];
  const featured = soon.filter((e) => e.is_feature);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-brand-deep text-white dark:bg-[#0b1220]">
        <img
          src={hero}
          alt=""
          className="absolute inset-0 -z-10 size-full object-cover opacity-35"
        />
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-r from-[#172554] via-[#172554]/85 to-[#172554]/30"
          aria-hidden
        />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium ring-1 ring-white/20">
            <Smartphone className="size-4" aria-hidden /> Pay with M-Pesa · no account needed
          </p>
          <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
            Find your next night out.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-blue-100">
            Concerts, festivals, talks and more across Kenya. Pick a ticket, pay on your phone, and
            get your QR code by SMS.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-[#1d4ed8] hover:bg-blue-50">
              <Link to="/events">
                Browse events <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              <Link to="/find-ticket">Find my ticket</Link>
            </Button>
          </div>
        </div>
      </section>

      <WidePage className="space-y-14">
        {q.isPending ? (
          <Section title="Upcoming events">
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
            {featured.length > 0 && (
              <Section title="Featured">
                <EventGrid>
                  {featured.slice(0, 4).map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </EventGrid>
              </Section>
            )}
            <Section
              title="Upcoming events"
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

        <section
          aria-labelledby="how"
          className="rounded-2xl border border-border bg-surface p-6 sm:p-10"
        >
          <h2 id="how" className="text-2xl font-bold">
            How it works
          </h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              {
                Icon: Ticket,
                t: "Pick your tickets",
                d: "Choose a ticket type and how many you need. Up to 10 per order.",
              },
              {
                Icon: Smartphone,
                t: "Pay with M-Pesa",
                d: "We send a prompt to your phone. Enter your PIN to pay.",
              },
              {
                Icon: ShieldCheck,
                t: "Show your QR",
                d: "Tickets arrive by SMS (and email). Show the QR code at the gate.",
              },
            ].map(({ Icon, t, d }, i) => (
              <li key={t} className="flex gap-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                  <Icon className="size-5" aria-hidden />
                </div>
                <div>
                  <p className="font-semibold">
                    {i + 1}. {t}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </WidePage>
    </>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
