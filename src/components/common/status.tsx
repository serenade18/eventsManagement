import {
  CheckCircle2,
  Clock,
  Lock,
  Star,
  XCircle,
  AlertOctagon,
  CalendarClock,
  History,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Event, OrderStatus } from "@/lib/api/types";
import { isPast } from "@/lib/format";

const ORDER: Record<
  OrderStatus,
  {
    label: string;
    variant: "success" | "warning" | "destructive" | "secondary";
    Icon: typeof Clock;
  }
> = {
  pending: { label: "Payment pending", variant: "warning", Icon: Clock },
  paid: { label: "Paid", variant: "success", Icon: CheckCircle2 },
  failed: { label: "Payment failed", variant: "destructive", Icon: XCircle },
  expired: { label: "Expired", variant: "secondary", Icon: History },
  refund_required: { label: "Refund required", variant: "destructive", Icon: AlertOctagon },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER[status];
  return (
    <Badge variant={s.variant}>
      <s.Icon aria-hidden /> {s.label}
    </Badge>
  );
}

export function EventBadges({
  event,
  showFeatured = true,
}: {
  event: Event;
  showFeatured?: boolean;
}) {
  const past = isPast(event);
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {past ? (
        <Badge variant="secondary">
          <History aria-hidden /> Past
        </Badge>
      ) : event.is_open ? (
        <Badge variant="success">
          <CalendarClock aria-hidden /> On sale
        </Badge>
      ) : (
        <Badge variant="warning">
          <Lock aria-hidden /> Closed
        </Badge>
      )}
      {showFeatured && event.is_feature && (
        <Badge variant="default">
          <Star aria-hidden /> Featured
        </Badge>
      )}
    </span>
  );
}
