import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { QrBox } from "./qr-box";
import type { Ticket } from "@/lib/api/types";
import { displayTicketNumber } from "@/lib/format";

export function TicketCard({
  ticket,
  index,
  total,
}: {
  ticket: Ticket;
  index: number;
  total: number;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface sm:flex-row">
      <div className="flex items-center justify-center bg-muted/40 p-4">
        <QrBox src={ticket.qr_code} ticketNumber={ticket.ticket_number} size="sm" />
      </div>
      <div className="flex flex-1 flex-col justify-between gap-3 border-t border-dashed border-border p-4 sm:border-l sm:border-t-0">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ticket {index + 1} of {total}
          </p>
          <p className="mt-1 font-semibold">{ticket.ticket_type_details.event_title}</p>
          <p className="text-sm text-muted-foreground">{ticket.ticket_type_details.name}</p>
          <p className="ticket-id mt-2 break-all text-sm">
            {displayTicketNumber(ticket.ticket_number)}
          </p>
        </div>
        <Link
          to={`/tickets/${ticket.ticket_number}`}
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand hover:underline"
        >
          View ticket <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
