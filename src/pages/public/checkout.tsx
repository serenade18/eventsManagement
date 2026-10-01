import { useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CalendarDays, Lock, MapPin, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { QuantityPicker } from "@/components/checkout/quantity";
import { aria, EmptyState, ErrorState, Field, FormAlert, Spinner } from "@/components/common/states";
import { NarrowPage } from "@/components/layout/public-layout";
import { publicEventQuery, qk } from "@/lib/api/queries";
import { ApiError, errorMessage } from "@/lib/api/client";
import { purchase } from "@/lib/api/endpoints";
import { getPrefill, savePending, setPrefill, clearPending } from "@/lib/checkout";
import { purchaseSchema, type PurchaseValues } from "@/lib/schemas";
import { eventWhen, isPast, money, saleState } from "@/lib/format";
import { useTitle } from "@/hooks/use-title";

export default function CheckoutPage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const tierId = Number(params.get("tier"));
  const q = useQuery(publicEventQuery(id));
  useTitle("Checkout");

  if (q.isPending)
    return (
      <NarrowPage>
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-4 h-32" />
        <Skeleton className="h-72" />
      </NarrowPage>
    );
  if (q.isError)
    return (
      <NarrowPage>
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      </NarrowPage>
    );

  const event = q.data;
  const tier = event.ticket_types.find((t) => t.id === tierId);
  const blocked = !tier
    ? "That ticket type isn't available for this event."
    : isPast(event)
      ? "This event has ended."
      : !event.is_open
        ? "Ticket sales are closed for this event."
        : saleState(tier).state !== "open"
          ? saleState(tier).label
          : null;

  if (blocked || !tier)
    return (
      <NarrowPage>
        <EmptyState
          icon={<Lock />}
          title="You can't buy this ticket right now"
          description={blocked}
          action={<Button asChild><Link to={`/events/${event.id}`}>Back to event</Link></Button>}
        />
      </NarrowPage>
    );

  return <CheckoutForm eventId={event.id} eventTitle={event.title} venue={event.venue} when={eventWhen(event.date, event.time)} tier={tier} />;
}

function CheckoutForm({
  eventId,
  eventTitle,
  venue,
  when,
  tier,
}: {
  eventId: number;
  eventTitle: string;
  venue: string;
  when: ReturnType<typeof eventWhen>;
  tier: { id: number; name: string; price: string; description: string | null };
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const prefill = getPrefill(tier.id);
  const submitted = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      quantity: prefill?.quantity ?? 1,
      buyer_name: prefill?.buyer_name ?? "",
      buyer_phone: prefill?.buyer_phone ?? "",
      buyer_email: prefill?.buyer_email ?? "",
    },
  });
  const qty = watch("quantity");
  const unit = Number(tier.price);
  const total = unit * qty;
  const free = unit === 0;

  const onSubmit = async (v: PurchaseValues) => {
    if (submitted.current) return; // never submit twice
    submitted.current = true;
    setFormError(null);
    try {
      const r = await purchase({
        ticket_type: tier.id,
        quantity: v.quantity,
        buyer_name: v.buyer_name,
        buyer_phone: v.buyer_phone,
        ...(v.buyer_email ? { buyer_email: v.buyer_email } : {}),
      });
      setPrefill({ tier_id: tier.id, quantity: v.quantity, buyer_name: v.buyer_name, buyer_phone: v.buyer_phone, buyer_email: v.buyer_email });
      if (r.kind === "issued") {
        clearPending();
        qc.setQueryData(qk.order(r.order.reference), r.order);
        navigate(`/orders/${r.order.reference}`, { replace: true });
      } else {
        savePending({
          reference: r.reference,
          amount: r.amount,
          expires_at: r.expiresAt,
          event_id: eventId,
          event_title: eventTitle,
          tier_id: tier.id,
          tier_name: tier.name,
          quantity: v.quantity,
          buyer_name: v.buyer_name,
          buyer_phone: v.buyer_phone,
        });
        navigate(`/orders/${r.reference}/pay`, { replace: true });
      }
    } catch (e) {
      submitted.current = false;
      if (e instanceof ApiError) {
        let mapped = false;
        for (const k of ["buyer_name", "buyer_phone", "buyer_email", "quantity"] as const) {
          const m = e.fieldErrors[k]?.[0];
          if (m) {
            setError(k, { message: m });
            mapped = true;
          }
        }
        if (!mapped || e.message !== "Validation Error") setFormError(e.message === "Validation Error" ? "Please fix the highlighted fields" : e.message);
      } else setFormError(errorMessage(e));
    }
  };

  return (
    <NarrowPage>
      <Link to={`/events/${eventId}`} className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Back to event
      </Link>
      <h1 className="text-2xl font-bold sm:text-3xl">Checkout</h1>

      <section aria-label="Your selection" className="mt-5 rounded-xl border border-border bg-surface p-4">
        <p className="font-semibold">{eventTitle}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDays className="size-4" aria-hidden /> {when.day} · {when.time}
        </p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4" aria-hidden /> {venue}
        </p>
        <div className="perforation my-4" />
        <div className="flex items-center justify-between gap-3">
          <div>
            <p id="qty-label" className="font-medium">
              {tier.name}
            </p>
            <p className="text-sm text-muted-foreground tabular">{money(tier.price)} each</p>
          </div>
          <Controller control={control} name="quantity" render={({ field }) => <QuantityPicker id="qty" value={field.value} onChange={field.onChange} />} />
        </div>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-5">
        <h2 className="text-lg font-semibold">Your details</h2>
        <Field id="buyer_name" label="Full name" error={errors.buyer_name?.message}>
          <Input {...aria("buyer_name", errors.buyer_name?.message)} autoComplete="name" {...register("buyer_name")} />
        </Field>
        <Field id="buyer_phone" label="M-Pesa phone number" error={errors.buyer_phone?.message} hint={free ? "Your tickets will be sent here by SMS." : "We'll send the M-Pesa prompt and your tickets to this number."}>
          <Input {...aria("buyer_phone", errors.buyer_phone?.message, true)} type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" {...register("buyer_phone")} />
        </Field>
        <Field id="buyer_email" label="Email" optional error={errors.buyer_email?.message} hint="We'll email your tickets too.">
          <Input {...aria("buyer_email", errors.buyer_email?.message, true)} type="email" inputMode="email" autoComplete="email" {...register("buyer_email")} />
        </Field>

        <FormAlert message={formError} />

        <div className="rounded-xl border border-border bg-surface p-4">
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                {qty} × {tier.name}
              </dt>
              <dd className="tabular">{money(tier.price)}</dd>
            </div>
            <div className="flex justify-between pt-2 text-lg font-bold">
              <dt>Total</dt>
              <dd className="tabular" aria-live="polite">
                {money(total)}
              </dd>
            </div>
          </dl>
          <Button type="submit" size="lg" className="mt-4 w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner /> {free ? "Issuing tickets…" : "Sending M-Pesa prompt…"}
              </>
            ) : free ? (
              "Get free tickets"
            ) : (
              <>
                <Smartphone /> Continue to payment
              </>
            )}
          </Button>
          {!free && <p className="mt-3 text-center text-xs text-muted-foreground">You'll get an M-Pesa prompt on your phone to pay {money(total)}.</p>}
        </div>
      </form>
    </NarrowPage>
  );
}
