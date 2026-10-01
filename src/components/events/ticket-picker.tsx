import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Lock, MessageSquare, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantityPicker } from "@/components/checkout/quantity";
import type { Event, TicketType } from "@/lib/api/types";
import { isPast, money, saleState } from "@/lib/format";
import { cn } from "@/lib/utils";

export function tierBlockReason(event: Event, tier: TicketType): string | null {
  if (isPast(event)) return "Event ended";
  if (!event.is_open) return "Sales closed";
  const s = saleState(tier);
  return s.state === "open" ? null : s.label;
}

/**
 * Pick one tier and a quantity right on the event page (an order is a single tier).
 * Continue carries both into checkout.
 */
export function TicketPicker({
  event,
  selected,
  onSelect,
  qty,
  onQty,
}: {
  event: Event;
  selected: number | null;
  onSelect: (id: number) => void;
  qty: number;
  onQty: (n: number) => void;
}) {
  const tier = event.ticket_types.find((t) => t.id === selected);
  const total = tier ? Number(tier.price) * qty : 0;

  if (!event.ticket_types.length)
    return <p className="text-sm text-muted-foreground">Tickets aren't available yet.</p>;

  return (
    <div>
      <div role="radiogroup" aria-label="Ticket type" className="space-y-2.5">
        {event.ticket_types.map((t) => {
          const blocked = tierBlockReason(event, t);
          const active = t.id === selected;
          return (
            <label
              key={t.id}
              className={cn(
                "relative flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                active ? "border-brand bg-brand-soft" : "border-border hover:border-input",
                blocked && "cursor-not-allowed opacity-60 hover:border-border",
              )}
            >
              <input
                type="radio"
                name="tier"
                className="sr-only"
                checked={active}
                disabled={!!blocked}
                onChange={() => onSelect(t.id)}
              />
              <span
                className={cn(
                  "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border",
                  active ? "border-brand bg-brand text-primary-foreground" : "border-input",
                )}
                aria-hidden
              >
                {active && <Check className="size-3" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-3">
                  <span className="font-semibold">{t.name}</span>
                  <span className="shrink-0 font-bold tabular">{money(t.price)}</span>
                </span>
                {t.description && (
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {t.description}
                  </span>
                )}
                {blocked && (
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <Lock className="size-3" aria-hidden /> {blocked}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      {tier && (
        <div className="mt-4 rounded-xl border border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <span id="picker-qty-label" className="text-sm font-medium">
              How many?
            </span>
            <QuantityPicker id="picker-qty" value={qty} onChange={onQty} />
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-3">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-xl font-bold tabular" aria-live="polite">
              {money(total)}
            </span>
          </div>
          <Button asChild size="lg" className="mt-4 w-full">
            <Link to={`/events/${event.id}/checkout?tier=${tier.id}&qty=${qty}`}>
              {Number(tier.price) === 0 ? "Get free tickets" : "Continue"}
            </Link>
          </Button>
        </div>
      )}

      <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <Smartphone className="size-4 shrink-0 text-brand" aria-hidden /> Pay with M-Pesa on your
          phone
        </li>
        <li className="flex items-center gap-2">
          <MessageSquare className="size-4 shrink-0 text-brand" aria-hidden /> Tickets by SMS and
          email. No account needed
        </li>
      </ul>
    </div>
  );
}

export function useTicketSelection(event: Event | undefined) {
  const [selected, setSelected] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const firstOpen = event?.ticket_types.find((t) => !tierBlockReason(event, t));
  // Preselect the first tier on sale when there's only one choice to make.
  const effective =
    selected ??
    (event && firstOpen && event.ticket_types.filter((t) => !tierBlockReason(event, t)).length === 1
      ? firstOpen.id
      : null);
  return { selected: effective, setSelected, qty, setQty, firstOpen };
}
