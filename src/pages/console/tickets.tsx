import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Search, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState, PageHeader } from "@/components/common/states";
import { Pager, usePaged } from "@/components/console/pager";
import { ticketsQuery } from "@/lib/api/queries";
import { dateTime, displayTicketNumber, downloadFile, toCsv } from "@/lib/format";
import { useTitle } from "@/hooks/use-title";

const ALL = "__all";

export default function TicketsPage() {
  useTitle("Tickets");
  const q = useQuery(ticketsQuery());
  const [search, setSearch] = useState("");
  const [eventId, setEventId] = useState(ALL);

  const events = useMemo(() => {
    const m = new Map<number, string>();
    for (const t of q.data ?? [])
      m.set(t.ticket_type_details.event, t.ticket_type_details.event_title);
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [q.data]);

  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (q.data ?? [])
      .filter((t) => eventId === ALL || String(t.ticket_type_details.event) === eventId)
      .filter(
        (t) =>
          !s ||
          [
            t.ticket_number,
            t.buyer_name,
            t.buyer_phone,
            t.ticket_type_details.event_title,
            t.ticket_type_details.name,
          ].some((v) => v?.toLowerCase().includes(s)),
      )
      .sort((a, b) => (b.purchase_date ?? "").localeCompare(a.purchase_date ?? ""));
  }, [q.data, search, eventId]);
  const paged = usePaged(rows);

  const exportCsv = () =>
    downloadFile(
      "myevents-tickets.csv",
      toCsv([
        ["Ticket number", "Event", "Tier", "Buyer", "Phone", "Email", "Purchase date"],
        ...rows.map((t) => [
          t.ticket_number,
          t.ticket_type_details.event_title,
          t.ticket_type_details.name,
          t.buyer_name,
          t.buyer_phone,
          t.buyer_email,
          t.purchase_date,
        ]),
      ]),
      "text/csv",
    );

  return (
    <>
      <PageHeader
        title="Tickets"
        description="Every ticket sold for your events, newest first."
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={!rows.length}>
            <Download /> Export CSV
          </Button>
        }
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_260px]">
        <div className="relative">
          <label htmlFor="t-search" className="sr-only">
            Search tickets
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="t-search"
            type="search"
            placeholder="Search ticket number, buyer, phone…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={eventId} onValueChange={setEventId}>
          <SelectTrigger aria-label="Filter by event">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All events</SelectItem>
            {events.map(([id, title]) => (
              <SelectItem key={id} value={String(id)}>
                {title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {q.isPending ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data.length ? (
        <EmptyState
          icon={<Ticket />}
          title="No tickets sold yet"
          description="When buyers get tickets for your events, they'll appear here."
        />
      ) : !rows.length ? (
        <EmptyState
          icon={<Search />}
          title="No tickets match"
          description="Try a different search or event."
        />
      ) : (
        <div className="rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Ticket</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="pr-5">Purchased</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.slice.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="ticket-id pl-5 text-xs">
                      {displayTicketNumber(t.ticket_number)}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate font-medium">
                      {t.ticket_type_details.event_title}
                    </TableCell>
                    <TableCell>{t.ticket_type_details.name}</TableCell>
                    <TableCell>{t.buyer_name ?? "—"}</TableCell>
                    <TableCell className="tabular">{t.buyer_phone ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap pr-5">
                      {dateTime(t.purchase_date)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pager {...paged} />
        </div>
      )}
    </>
  );
}
