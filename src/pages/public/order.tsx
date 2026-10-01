import { useRef } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Mail, MessageSquare, PartyPopper, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/common/copy-button";
import { EmptyState, ErrorState } from "@/components/common/states";
import { TicketCard } from "@/components/tickets/ticket-card";
import { NarrowPage } from "@/components/layout/public-layout";
import { ApiError } from "@/lib/api/client";
import { getOrder } from "@/lib/api/endpoints";
import { qk } from "@/lib/api/queries";
import { displayTicketNumber, maskPhone, money } from "@/lib/format";
import { useTitle } from "@/hooks/use-title";

const QR_POLL_MS = 2_000;
const QR_POLL_MAX_MS = 30_000;

export default function OrderPage() {
  const { reference = "" } = useParams();
  const started = useRef(Date.now());
  useTitle("Your tickets");
  const q = useQuery({
    queryKey: qk.order(reference),
    queryFn: () => getOrder(reference),
    // QR images are generated in the background; poll until every ticket has one.
    refetchInterval: (query) => {
      const o = query.state.data;
      if (!o || o.status !== "paid") return false;
      const missing = o.tickets.some((t) => !t.qr_code);
      return missing && Date.now() - started.current < QR_POLL_MAX_MS ? QR_POLL_MS : false;
    },
  });

  if (q.isPending)
    return (
      <NarrowPage className="max-w-2xl space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </NarrowPage>
    );
  if (q.isError)
    return (
      <NarrowPage>
        {q.error instanceof ApiError && q.error.status === 404 ? (
          <EmptyState
            icon={<Receipt />}
            title="We couldn't find that order"
            description="Check the reference in your SMS and try again."
            action={<Button asChild><Link to="/find-ticket">Find my ticket</Link></Button>}
          />
        ) : (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        )}
      </NarrowPage>
    );

  const o = q.data;
  if (o.status !== "paid") return <Navigate to={`/orders/${reference}/pay`} replace />;

  const first = o.tickets[0];
  const phone = first?.buyer_phone;
  const email = first?.buyer_email;

  return (
    <NarrowPage className="max-w-2xl">
      <header className="text-center">
        <span className="mx-auto mb-4 grid size-16 animate-pop-in place-items-center rounded-full bg-success-soft text-success">
          <PartyPopper className="size-8" aria-hidden />
        </span>
        <h1 className="text-3xl font-extrabold sm:text-4xl">You're going!</h1>
        <p className="mt-2 text-muted-foreground">
          {o.quantity} × {o.ticket_type_details.name} for <strong className="text-foreground">{o.ticket_type_details.event_title}</strong>
        </p>
      </header>

      <section aria-label="Order summary" className="mt-6 grid gap-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Order reference</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="ticket-id text-lg">{displayTicketNumber(o.reference)}</span>
            <CopyButton value={o.reference} label="Copy" aria-label="Copy order reference" />
          </div>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total paid</p>
          <p className="mt-1 text-2xl font-bold tabular">{money(o.total_amount)}</p>
        </div>
      </section>

      <div className="mt-4 space-y-1 text-sm text-muted-foreground">
        {phone && (
          <p className="flex items-center gap-2">
            <MessageSquare className="size-4" aria-hidden /> Tickets sent by SMS to {maskPhone(phone)}
          </p>
        )}
        {email && (
          <p className="flex items-center gap-2">
            <Mail className="size-4" aria-hidden /> Also emailed to the address you gave.
          </p>
        )}
      </div>

      <section aria-labelledby="tix" className="mt-8">
        <h2 id="tix" className="mb-4 text-xl font-semibold">
          Your tickets
        </h2>
        <div className="space-y-4">
          {o.tickets.map((t, i) => (
            <TicketCard key={t.id} ticket={t} index={i} total={o.tickets.length} />
          ))}
        </div>
        {o.tickets.length === 0 && <p className="text-muted-foreground">Your tickets are being issued. This page will update shortly.</p>}
      </section>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Show the QR code at the gate. Keep this page or your SMS handy.
      </p>
    </NarrowPage>
  );
}
