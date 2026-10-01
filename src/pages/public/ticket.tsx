import { useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarPlus, Download, MapPin, Printer, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/common/states";
import { QrBox } from "@/components/tickets/qr-box";
import { NarrowPage } from "@/components/layout/public-layout";
import { ApiError } from "@/lib/api/client";
import { getTicket } from "@/lib/api/endpoints";
import { publicEventQuery, qk } from "@/lib/api/queries";
import { buildIcs, dateTime, displayTicketNumber, downloadFile, eventWhen } from "@/lib/format";
import { downloadQr } from "@/lib/qr-download";
import { useTitle } from "@/hooks/use-title";

export default function TicketPage({ download = false }: { download?: boolean }) {
  const { ticketNumber = "" } = useParams();
  const started = useRef(Date.now());
  const q = useQuery({
    queryKey: qk.ticket(ticketNumber),
    queryFn: () => getTicket(ticketNumber),
    refetchInterval: (query) =>
      query.state.data && !query.state.data.qr_code && Date.now() - started.current < 30_000
        ? 2_000
        : false,
  });
  const eventId = q.data?.ticket_type_details.event;
  const ev = useQuery({ ...publicEventQuery(String(eventId ?? "")), enabled: !!eventId });
  useTitle(q.data ? `Ticket ${displayTicketNumber(q.data.ticket_number)}` : "Ticket");

  if (q.isPending)
    return (
      <NarrowPage className="max-w-md">
        <Skeleton className="h-[560px] rounded-2xl" />
      </NarrowPage>
    );
  if (q.isError)
    return (
      <NarrowPage>
        {q.error instanceof ApiError && q.error.status === 404 ? (
          <EmptyState
            icon={<SearchX />}
            title="We couldn't find that ticket"
            description="Check the ticket number in your SMS or email and try again."
            action={
              <Button asChild>
                <Link to="/find-ticket">Find my ticket</Link>
              </Button>
            }
          />
        ) : (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        )}
      </NarrowPage>
    );

  const t = q.data;
  const event = ev.data;
  const when = event ? eventWhen(event.date, event.time) : null;

  const addToCalendar = () => {
    if (!event) return;
    downloadFile(
      `${event.title.replace(/[^\w]+/g, "-").toLowerCase()}.ics`,
      buildIcs({
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.venue,
        description: `Ticket ${displayTicketNumber(t.ticket_number)} (${t.ticket_type_details.name})`,
      }),
      "text/calendar",
    );
  };

  return (
    <NarrowPage className="max-w-md">
      {download && (
        <p className="no-print mb-4 rounded-lg bg-brand-soft px-4 py-3 text-sm text-brand">
          Save your QR code to your phone so you can show it at the gate, even offline.
        </p>
      )}
      <article className="print-ticket overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="bg-brand px-6 py-5 text-primary-foreground">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
            MyEvents ticket
          </p>
          <h1 className="mt-1 text-2xl font-bold leading-tight">
            {t.ticket_type_details.event_name}
          </h1>
          <p className="mt-1 font-medium opacity-90">{t.ticket_type_details.name}</p>
        </div>
        <div className="flex justify-center px-6 pt-6">
          <QrBox src={t.qr_code} ticketNumber={t.ticket_number} size="lg" />
        </div>
        <p className="ticket-id mt-3 text-center text-lg">{displayTicketNumber(t.ticket_number)}</p>
        <div className="perforation mx-6 my-5" />
        <dl className="grid grid-cols-2 gap-4 px-6 pb-6 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Name</dt>
            <dd className="font-medium">{t.buyer_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Purchased</dt>
            <dd className="font-medium">{dateTime(t.purchase_date)}</dd>
          </div>
          {when && event && (
            <>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">When</dt>
                <dd className="font-medium">
                  {when.day} · {when.time}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Where</dt>
                <dd className="flex items-start gap-1 font-medium">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  {event.venue}
                </dd>
              </div>
            </>
          )}
        </dl>
      </article>

      <div className={`no-print mt-5 grid gap-2 ${download ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
        <Button
          size={download ? "lg" : "default"}
          className={download ? "sm:col-span-2" : ""}
          variant={download ? "default" : "outline"}
          disabled={!t.qr_code}
          onClick={() => t.qr_code && downloadQr(t.qr_code, t.ticket_number)}
        >
          <Download /> Download QR
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer /> Print
        </Button>
        <Button variant="outline" onClick={addToCalendar} disabled={!event}>
          <CalendarPlus /> Add to calendar
        </Button>
      </div>
      {eventId && (
        <p className="no-print mt-6 text-center text-sm">
          <Link to={`/events/${eventId}`} className="text-brand hover:underline">
            View event details
          </Link>
        </p>
      )}
    </NarrowPage>
  );
}
