import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AlertOctagon, CheckCircle2, Clock, History, Smartphone, WifiOff, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/common/states";
import { RefundNotice } from "@/components/checkout/refund-notice";
import { NarrowPage } from "@/components/layout/public-layout";
import { useCountdown, useElapsed, useOrderPolling } from "@/hooks/use-order-polling";
import { useTitle } from "@/hooks/use-title";
import { SUPPORT_CONTACT } from "@/lib/api/client";
import { qk } from "@/lib/api/queries";
import { clearPending, loadPending, setPrefill } from "@/lib/checkout";
import { countdown, displayTicketNumber, money } from "@/lib/format";

const PROMPT_HELP_AFTER_MS = 90_000;

export default function PaymentPage() {
  const { reference = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pending = useMemo(() => loadPending(reference), [reference]);
  const { order, error, reconnecting, gaveUp, startedAt } = useOrderPolling(reference);
  const status = order?.status;
  const remaining = useCountdown(order?.expires_at ?? pending?.expires_at);
  const elapsed = useElapsed(startedAt);
  useTitle("Complete your payment");

  const eventId = order?.ticket_type_details.event ?? pending?.event_id;
  const tierId = order?.ticket_type ?? pending?.tier_id;
  const retryHref = eventId && tierId ? `/events/${eventId}/checkout?tier=${tierId}` : "/events";

  // Terminal states: keep retry details in memory, then drop the persisted purchase.
  useEffect(() => {
    if (!status || status === "pending" || status === "expired") return;
    if (pending)
      setPrefill({ tier_id: pending.tier_id, quantity: pending.quantity, buyer_name: pending.buyer_name, buyer_phone: pending.buyer_phone });
    clearPending();
    if (status === "paid" && order) {
      qc.setQueryData(qk.order(reference), order);
      const t = setTimeout(() => navigate(`/orders/${reference}`, { replace: true }), 1600);
      return () => clearTimeout(t);
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error)
    return (
      <NarrowPage>
        {error.status === 404 ? (
          <EmptyState
            icon={<Clock />}
            title="We couldn't find that order"
            description="Check the reference in your SMS, or look it up."
            action={<Button asChild><Link to="/find-ticket">Find my ticket</Link></Button>}
          />
        ) : (
          <ErrorState error={error} onRetry={() => window.location.reload()} />
        )}
      </NarrowPage>
    );

  const amount = order ? Number(order.total_amount) : pending?.amount;
  const eventTitle = order?.ticket_type_details.event_title ?? pending?.event_title;
  const tierName = order?.ticket_type_details.name ?? pending?.tier_name;
  const qty = order?.quantity ?? pending?.quantity;

  return (
    <NarrowPage>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          {eventTitle ? (
            <>
              <p className="font-semibold">{eventTitle}</p>
              <p className="text-sm text-muted-foreground">
                {qty} × {tierName} · Order <span className="ticket-id">{displayTicketNumber(reference)}</span>
              </p>
            </>
          ) : (
            <Skeleton className="h-10 w-2/3" />
          )}
        </div>

        <div className="px-5 py-8 text-center" aria-live="polite" aria-atomic="true">
          {!order ? (
            <Waiting amount={amount} remaining={remaining} />
          ) : status === "pending" ? (
            <Waiting amount={amount} remaining={remaining} />
          ) : status === "paid" ? (
            <StatusBlock tone="success" icon={<CheckCircle2 className="animate-pop-in" />} title="Payment received. Your tickets are ready." body="Taking you to your tickets…">
              <Button asChild size="lg" className="w-full">
                <Link to={`/orders/${reference}`} replace>
                  View my tickets
                </Link>
              </Button>
            </StatusBlock>
          ) : status === "failed" ? (
            <StatusBlock tone="danger" icon={<XCircle />} title="The payment was not completed." body="It was cancelled or failed, and your tickets were released. You can try again; nothing was charged.">
              <Button asChild size="lg" className="w-full">
                <Link to={retryHref}>Try again</Link>
              </Button>
            </StatusBlock>
          ) : status === "expired" ? (
            <StatusBlock tone="muted" icon={<History />} title="This payment request has expired." body="Your reservation timed out. If you already paid, keep this page open: a late payment can still go through.">
              <Button asChild size="lg" className="w-full">
                <Link to={retryHref}>Start again</Link>
              </Button>
            </StatusBlock>
          ) : (
            <StatusBlock tone="danger" icon={<AlertOctagon />} title="We received your payment, but tickets could not be issued.">
              <RefundNotice reference={reference} />
            </StatusBlock>
          )}
        </div>

        {(status === "pending" || !order) && elapsed > PROMPT_HELP_AFTER_MS && (
          <div className="border-t border-border bg-muted/50 px-5 py-4 text-sm">
            <p className="font-medium">Didn't get the prompt?</p>
            <p className="mt-1 text-muted-foreground">Check that your phone is on and has signal, then start a new payment.</p>
            <Button asChild variant="outline" className="mt-3 w-full">
              <Link to={retryHref}>Try again</Link>
            </Button>
          </div>
        )}
        {gaveUp && status !== "paid" && (
          <div className="border-t border-border bg-warning-soft px-5 py-4 text-sm text-warning">
            Still waiting? Check your SMS for tickets or contact <a className="underline" href={`mailto:${SUPPORT_CONTACT}`}>{SUPPORT_CONTACT}</a> with
            reference <span className="ticket-id">{displayTicketNumber(reference)}</span>.
          </div>
        )}
      </div>
      {reconnecting && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground" role="status">
          <WifiOff className="size-3.5" aria-hidden /> Reconnecting… your payment status is safe.
        </p>
      )}
    </NarrowPage>
  );
}

function Waiting({ amount, remaining }: { amount: number | undefined; remaining: number }) {
  return (
    <div>
      <div className="relative mx-auto mb-5 grid size-24 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-brand/15 motion-reduce:hidden" aria-hidden />
        <span className="relative grid size-24 place-items-center rounded-full bg-brand-soft text-brand">
          <Smartphone className="size-11" aria-hidden />
        </span>
      </div>
      <h1 className="text-2xl font-bold">Check your phone</h1>
      <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
        Enter your M-Pesa PIN to pay{" "}
        <strong className="text-foreground tabular">{amount !== undefined ? money(amount, false) : "the amount shown"}</strong>.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">Waiting for your M-Pesa payment.</p>
      {remaining > 0 && (
        <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-warning-soft px-3 py-1.5 text-sm font-medium text-warning">
          <Clock className="size-4" aria-hidden />
          <span>
            Your tickets are held for <span className="tabular" aria-hidden>{countdown(remaining)}</span>
            <span className="sr-only">{Math.ceil(remaining / 60000)} minutes</span>
          </span>
        </p>
      )}
    </div>
  );
}

function StatusBlock({
  tone,
  icon,
  title,
  body,
  children,
}: {
  tone: "success" | "danger" | "muted";
  icon: React.ReactNode;
  title: string;
  body?: string;
  children?: React.ReactNode;
}) {
  const cls = tone === "success" ? "bg-success-soft text-success" : tone === "danger" ? "bg-danger-soft text-danger" : "bg-muted text-muted-foreground";
  return (
    <div>
      <span className={`mx-auto mb-5 grid size-20 place-items-center rounded-full [&_svg]:size-10 ${cls}`} aria-hidden>
        {icon}
      </span>
      <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
      {body && <p className="mx-auto mt-2 max-w-sm text-muted-foreground">{body}</p>}
      {children && <div className="mx-auto mt-6 max-w-sm">{children}</div>}
    </div>
  );
}
