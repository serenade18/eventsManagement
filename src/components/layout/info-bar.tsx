import { MessageSquare, Smartphone } from "lucide-react";
import { USE_MOCKS } from "@/lib/api/client";

/** Thin reassurance strip above the public header. Demo mode adds a second, amber line. */
export function InfoBar() {
  return (
    <div className="no-print">
      <div className="bg-[#172554] px-4 py-2 text-center text-[12.5px] text-blue-100 dark:bg-[#0b1220]">
        <span className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5">
          <span className="inline-flex items-center gap-1.5">
            <Smartphone className="size-3.5" aria-hidden />
            Prices in <strong className="font-semibold text-white">KES</strong>, paid with M-Pesa
          </span>
          <span className="hidden text-blue-300/60 sm:inline" aria-hidden>
            ·
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="size-3.5" aria-hidden />
            Tickets by SMS and email. No account needed.
          </span>
        </span>
      </div>
      {USE_MOCKS && (
        <div className="bg-warning-soft px-4 py-1.5 text-center text-xs text-warning">
          Demo mode: running against a simulated backend. Data lives in this browser only.
        </div>
      )}
    </div>
  );
}
