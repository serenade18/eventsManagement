import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  ExternalLink,
  MapPin,
  Pencil,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { EventBadges } from "@/components/common/status";
import { Poster } from "@/components/events/poster";
import { Pager, usePaged } from "@/components/console/pager";
import { EventPerformancePanel } from "@/components/console/event-performance";
import { EventQuickControls } from "@/components/console/event-quick-controls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { myEventQuery, ticketsQuery } from "@/lib/api/queries";
import { dateTime, displayTicketNumber, downloadFile, eventWhen, money, toCsv } from "@/lib/format";
import { eventsLabel, useAuth } from "@/lib/auth";
import { useTitle } from "@/hooks/use-title";

export default function EventOverviewPage() {
  const { user } = useAuth();
  const { id = "" } = useParams();
  const ev = useQuery(myEventQuery(id));
  const tix = useQuery(ticketsQuery());
  const [search, setSearch] = useState("");
  useTitle(ev.data?.title ?? "Event");

  const attendees = useMemo(
    () => (tix.data ?? []).filter((t) => String(t.ticket_type_details.event) === id),
    [tix.data, id],
  );
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return attendees;
    return attendees.filter((t) =>
      [t.ticket_number, t.buyer_name, t.buyer_phone, t.buyer_email].some((v) =>
        v?.toLowerCase().includes(s),
      ),
    );
  }, [attendees, search]);
  const paged = usePaged(filtered);

  if (ev.isPending)
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  if (ev.isError) return <ErrorState error={ev.error} onRetry={() => ev.refetch()} />;

  const e = ev.data;
  const when = eventWhen(e.date, e.time);
  const publicUrl = `${window.location.origin}/events/${e.id}`;

  const exportCsv = () => {
    const rows = [
      ["Ticket number", "Buyer name", "Phone", "Email", "Tier", "Purchase date"],
      ...attendees.map((t) => [
        t.ticket_number,
        t.buyer_name,
        t.buyer_phone,
        t.buyer_email,
        t.ticket_type_details.name,
        t.purchase_date,
      ]),
    ];
    downloadFile(
      `${e.title.replace(/[^\w]+/g, "-").toLowerCase()}-attendees.csv`,
      toCsv(rows),
      "text/csv",
    );
  };

  return (
    <div className="space-y-6">
      <Link
        to="/console/events"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> {eventsLabel(user?.user_type)}
      </Link>

      <header className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-5 sm:flex-row">
        <Poster src={e.poster} title={e.title} className="w-full shrink-0 rounded-lg sm:w-48" />
        <div className="min-w-0 flex-1">
          <EventBadges event={e} />
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{e.title}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="size-4" aria-hidden /> {when.day} · {when.time}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4" aria-hidden /> {e.venue}
          </p>
          {user?.user_type === "admin" && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <UserRound className="size-4" aria-hidden /> Organized by{" "}
              <Link
                to={`/console/users/${e.organizer.id}`}
                className="font-medium text-foreground hover:text-brand hover:underline"
              >
                {e.organizer.organization || e.organizer.name}
              </Link>
            </p>
          )}
          <div className="mt-4">
            <EventQuickControls event={e} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button asChild>
              <Link to={`/console/events/${e.id}/edit`}>
                <Pencil /> Edit event
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a href={`/events/${e.id}`} target="_blank" rel="noreferrer">
                <ExternalLink /> Public page
              </a>
            </Button>
            <CopyButton
              value={publicUrl}
              label="Copy link"
              size="default"
              aria-label="Copy public event link"
            />
          </div>
        </div>
      </header>

      <Tabs defaultValue="performance">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="attendees">
            Attendees{tix.data ? ` (${attendees.length})` : ""}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="performance" className="mt-4">
          <EventPerformancePanel eventId={id} />
        </TabsContent>
        <TabsContent value="attendees" className="mt-4">
          <section
            aria-labelledby="attendees"
            className="rounded-xl border border-border bg-surface"
          >
            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 id="attendees" className="text-lg font-semibold">
                Attendees{" "}
                {tix.data && (
                  <span className="font-normal text-muted-foreground">({attendees.length})</span>
                )}
              </h2>
              <div className="flex gap-2">
                <div className="relative flex-1 sm:w-64">
                  <label htmlFor="att-search" className="sr-only">
                    Search attendees
                  </label>
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="att-search"
                    type="search"
                    placeholder="Search"
                    className="pl-9"
                    value={search}
                    onChange={(ev) => setSearch(ev.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={exportCsv} disabled={!attendees.length}>
                  <Download /> CSV
                </Button>
              </div>
            </div>
            {tix.isPending ? (
              <div className="space-y-2 p-5">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : tix.isError ? (
              <ErrorState error={tix.error} onRetry={() => tix.refetch()} className="m-5" />
            ) : attendees.length === 0 ? (
              <EmptyState
                icon={<Users />}
                title="No attendees yet"
                description="Tickets sold for this event will appear here."
                className="m-5"
              />
            ) : filtered.length === 0 ? (
              <p className="px-5 pb-6 text-sm text-muted-foreground">
                No attendees match "{search}".
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-5">Ticket</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead className="pr-5">Purchased</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paged.slice.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="ticket-id pl-5 text-xs">
                            {displayTicketNumber(t.ticket_number)}
                          </TableCell>
                          <TableCell className="font-medium">{t.buyer_name ?? "—"}</TableCell>
                          <TableCell className="tabular">{t.buyer_phone ?? "—"}</TableCell>
                          <TableCell>{t.buyer_email ?? "—"}</TableCell>
                          <TableCell>{t.ticket_type_details.name}</TableCell>
                          <TableCell className="whitespace-nowrap pr-5">
                            {dateTime(t.purchase_date)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Pager {...paged} />
              </>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
