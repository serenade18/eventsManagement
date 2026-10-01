import { Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

/** Fixed-ratio poster with a consistent fallback for null posters (no layout shift). */
export function Poster({
  src,
  title,
  className,
  ratio = "aspect-[4/3]",
  eager,
}: {
  src: string | null;
  title: string;
  className?: string;
  ratio?: string;
  eager?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-muted", ratio, className)}>
      {src ? (
        <img
          src={src}
          alt={`${title} poster`}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={`${title} poster`}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-brand-deep via-brand to-sky-500 p-4 text-center text-white dark:from-[#0b1220] dark:via-[#172554] dark:to-[#1e3a8a]"
        >
          <Ticket className="size-8 opacity-80" aria-hidden />
          <span className="line-clamp-2 max-w-[90%] text-sm font-semibold opacity-90">{title}</span>
        </div>
      )}
    </div>
  );
}
