import { Ban, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Withdrawal, WithdrawalStatus } from "@/lib/api/types";

const STATUS: Record<
  WithdrawalStatus,
  {
    label: string;
    variant: "warning" | "success" | "destructive" | "secondary";
    Icon: typeof Clock;
  }
> = {
  pending: { label: "Pending", variant: "warning", Icon: Clock },
  paid: { label: "Paid", variant: "success", Icon: CheckCircle2 },
  rejected: { label: "Rejected", variant: "destructive", Icon: XCircle },
  cancelled: { label: "Cancelled", variant: "secondary", Icon: Ban },
};

export function WithdrawalStatusBadge({ status }: { status: WithdrawalStatus }) {
  const s = STATUS[status];
  return (
    <Badge variant={s.variant}>
      <s.Icon aria-hidden /> {s.label}
    </Badge>
  );
}

export function withdrawalDestination(w: Withdrawal) {
  return w.method === "mpesa"
    ? `M-Pesa ${w.mpesa_phone}`
    : `${w.bank_name} · ${w.account_name} · ${w.account_number}`;
}
