import { SUPPORT_CONTACT } from "@/lib/api/client";
import { displayTicketNumber } from "@/lib/format";

export function RefundNotice({ reference }: { reference: string }) {
  return (
    <div className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-left text-sm">
      <p>
        Contact support with this reference and you will be refunded:
      </p>
      <p className="ticket-id mt-2 text-lg">{displayTicketNumber(reference)}</p>
      <a href={`mailto:${SUPPORT_CONTACT}?subject=${encodeURIComponent(`Refund for order ${reference}`)}`} className="mt-2 inline-block font-medium text-brand underline">
        {SUPPORT_CONTACT}
      </a>
    </div>
  );
}
