import { QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { displayTicketNumber } from "@/lib/format";

/**
 * Backend QR PNGs are white on transparent, so they always sit on a dark box,
 * including in print (spec §7.7, backend gap #3).
 */
export function QrBox({
  src,
  ticketNumber,
  size = "md",
}: {
  src: string | null;
  ticketNumber: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "lg" ? "size-64 sm:size-72" : size === "sm" ? "size-32" : "size-44";
  return (
    <div className={cn("qr-box grid place-items-center rounded-xl bg-slate-900 p-4", dim)}>
      {src ? (
        <img
          src={src}
          alt={`QR code for ticket ${displayTicketNumber(ticketNumber)}`}
          className="size-full object-contain"
        />
      ) : (
        <div
          className="flex flex-col items-center gap-2 text-center text-xs text-slate-300"
          role="status"
        >
          <QrCode className="size-8 animate-pulse" aria-hidden />
          Generating QR code…
        </div>
      )}
    </div>
  );
}
