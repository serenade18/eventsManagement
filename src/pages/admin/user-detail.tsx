import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  CalendarCheck2,
  CalendarDays,
  Clock,
  Coins,
  Handshake,
  Mail,
  MapPin,
  Phone,
  Receipt,
  Ticket,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CopyButton } from "@/components/common/copy-button";
import { EmptyState, ErrorState } from "@/components/common/states";
import { ApiError } from "@/lib/api/client";
import { getUserOverview } from "@/lib/api/endpoints";
import { qk } from "@/lib/api/queries";
import type { UserOverview } from "@/lib/api/types";
import {
  dateTime,
  displayTicketNumber,
  eventWhen,
  money,
  shortDate,
  todayNairobi,
} from "@/lib/format";
import { useTitle } from "@/hooks/use-title";

const ROLE_VARIANT = { admin: "solid", organizer: "default", sponsor: "info" } as const;
const num = new Intl.NumberFormat("en-KE");

export default function UserDetailPage() {
  const { id = "" } = useParams();
  const q = useQuery({ queryKey: qk.userOverview(id), queryFn: () => getUserOverview(id) });
  useTitle(q.data?.user.name ?? "User");

  return (
    <div className="space-y-6">
      <Link
        to="/console/users"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Users
      </Link>
      {q.isPending ? (
        <DetailSkeleton />
      ) : q.isError ? (
        q.error instanceof ApiError && q.error.status === 404 ? (
          <EmptyState
            icon={<UserRound />}
            title="We couldn't find that user"
            description="The account may have been deleted."
            action={
              <Button asChild>
                <Link to="/console/users">Back to users</Link>
              </Button>
            }
          />
        ) : (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        )
      ) : (
        <Detail data={q.data} />
      )}
    </div>
  );
}

function Detail({ data }: { data: UserOverview }) {
  const { user, stats } = data;
  const organizer = user.user_type === "organizer" || stats.events > 0;
  const sponsor = user.user_type === "sponsor" || stats.sponsored_events > 0;

  return (
    <>
      <header className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center">
        <div
          className="grid size-16 shrink-0 place-items-center rounded-full bg-brand-soft text-2xl font-bold text-brand"
          aria-hidden
        >
          {user.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <Badge variant={ROLE_VARIANT[user.user_type]} className="capitalize">
              {user.user_type}
            </Badge>
            {!user.is_active && <Badge variant="destructive">Deactivated</Badge>}
          </div>
          {user.organization && <p className="mt-0.5 text-muted-foreground">{user.organization}</p>}
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden /> Joined {shortDate(user.added_on)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden />
              {user.last_login ? `Last signed in ${dateTime(user.last_login)}` : "Never signed in"}
            </span>
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-6">
          <section
            aria-labelledby="contact"
            className="rounded-xl border border-border bg-surface p-5"
          >
            <h2 id="contact" className="mb-4 text-lg font-semibold">
              Contact
            </h2>
            <dl className="space-y-4 text-sm">
              <ContactRow icon={<Mail />} label="Email">
                <a href={`mailto:${user.email}`} className="break-all text-brand hover:underline">
                  {user.email}
                </a>
                <CopyButton
                  value={user.email}
                  label="Copy"
                  aria-label="Copy email"
                  className="mt-1.5"
                />
              </ContactRow>
              <ContactRow icon={<Phone />} label="Phone">
                <a href={`tel:${user.phone}`} className="tabular text-brand hover:underline">
                  {user.phone}
                </a>
              </ContactRow>
              {user.organization && (
                <ContactRow icon={<Building2 />} label="Organization">
                  {user.organization}
                </ContactRow>
              )}
              {(user.city || user.country) && (
                <ContactRow icon={<MapPin />} label="Location">
                  {[user.city, user.country].filter(Boolean).join(", ")}
                </ContactRow>
              )}
            </dl>
            {user.bio && (
              <div className="mt-5 border-t border-border pt-4">
                <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Bio
                </h3>
                <p className="whitespace-pre-line text-sm">{user.bio}</p>
              </div>
            )}
          </section>
        </aside>

        <div className="min-w-0 space-y-6">
          {organizer || !sponsor ? (
            <section aria-label="Activity" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat icon={<CalendarDays />} label="Events" value={num.format(stats.events)} />
              <Stat
                icon={<CalendarCheck2 />}
                label="Upcoming"
                value={num.format(stats.upcoming_events)}
              />
              <Stat icon={<Ticket />} label="Tickets sold" value={num.format(stats.tickets_sold)} />
              <Stat icon={<Coins />} label="Revenue" value={money(stats.revenue, false)} />
            </section>
          ) : (
            <section aria-label="Activity" className="grid gap-4 sm:grid-cols-2">
              <Stat
                icon={<Handshake />}
                label="Sponsored events"
                value={num.format(stats.sponsored_events)}
              />
            </section>
          )}

          {(organizer || !sponsor) && <EventsTable events={data.events} />}
          {organizer && <SalesTable sales={data.recent_sales} total={stats.orders_paid} />}
          {sponsor && <SponsoredTable events={data.sponsored_events} />}
          {user.user_type === "admin" && stats.events === 0 && (
            <p className="text-sm text-muted-foreground">
              Admins manage the platform; this account hasn't created events of its own.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-muted-foreground [&_svg]:size-4" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-0.5">{children}</dd>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className="text-muted-foreground [&_svg]:size-[18px]" aria-hidden>
          {icon}
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular">{value}</p>
    </div>
  );
}

function EventsTable({ events }: { events: UserOverview["events"] }) {
  const today = todayNairobi();
  return (
    <section aria-labelledby="u-events" className="rounded-xl border border-border bg-surface">
      <h2 id="u-events" className="px-5 pt-4 text-lg font-semibold">
        Events
      </h2>
      {events.length === 0 ? (
        <p className="px-5 pb-5 pt-2 text-sm text-muted-foreground">No events created yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Sold</TableHead>
                <TableHead className="pr-5 text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e) => {
                const when = eventWhen(e.date, e.time);
                const past = e.date < today;
                return (
                  <TableRow key={e.id}>
                    <TableCell className="pl-5">
                      <Link
                        to={`/console/events/${e.id}`}
                        className="font-medium hover:text-brand hover:underline"
                      >
                        {e.title}
                      </Link>
                      <span className="block text-xs text-muted-foreground">
                        {e.category} · {e.venue}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{when.day}</TableCell>
                    <TableCell>
                      <span className="inline-flex flex-wrap gap-1">
                        {past ? (
                          <Badge variant="secondary">Ended</Badge>
                        ) : e.is_open ? (
                          <Badge variant="success">On sale</Badge>
                        ) : (
                          <Badge variant="warning">Closed</Badge>
                        )}
                        {e.is_feature && <Badge>Featured</Badge>}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular">
                      {num.format(e.tickets_sold)}
                    </TableCell>
                    <TableCell className="pr-5 text-right tabular">
                      {money(e.revenue, false)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}

function SalesTable({ sales, total }: { sales: UserOverview["recent_sales"]; total: number }) {
  return (
    <section aria-labelledby="u-sales" className="rounded-xl border border-border bg-surface">
      <div className="flex items-baseline justify-between gap-2 px-5 pt-4">
        <h2 id="u-sales" className="text-lg font-semibold">
          Recent sales
        </h2>
        {total > sales.length && (
          <span className="text-sm text-muted-foreground">
            Latest {sales.length} of {num.format(total)}
          </span>
        )}
      </div>
      {sales.length === 0 ? (
        <div className="flex items-center gap-2 px-5 pb-5 pt-2 text-sm text-muted-foreground">
          <Receipt className="size-4" aria-hidden /> No paid orders yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Order</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="pr-5">Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((s) => (
                <TableRow key={s.reference}>
                  <TableCell className="ticket-id pl-5 text-xs">
                    {displayTicketNumber(s.reference)}
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/console/events/${s.event_id}`}
                      className="hover:text-brand hover:underline"
                    >
                      {s.event_title}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {s.quantity} × {s.tier}
                    </span>
                  </TableCell>
                  <TableCell>{s.buyer_name}</TableCell>
                  <TableCell className="text-right tabular">{money(s.total_amount)}</TableCell>
                  <TableCell className="whitespace-nowrap pr-5">{dateTime(s.paid_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}

function SponsoredTable({ events }: { events: UserOverview["sponsored_events"] }) {
  return (
    <section aria-labelledby="u-sponsored" className="rounded-xl border border-border bg-surface">
      <h2 id="u-sponsored" className="px-5 pt-4 text-lg font-semibold">
        Sponsored events
      </h2>
      {events.length === 0 ? (
        <p className="px-5 pb-5 pt-2 text-sm text-muted-foreground">
          Not attached to any events yet.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {events.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
              <div className="min-w-0">
                <Link to={`/console/events/${e.id}`} className="font-medium hover:underline">
                  {e.title}
                </Link>
                <p className="truncate text-muted-foreground">
                  {e.venue} · by {e.organizer}
                </p>
              </div>
              <span className="shrink-0 text-muted-foreground">{shortDate(e.date)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Skeleton className="h-64 rounded-xl" />
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
