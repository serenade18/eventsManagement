import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Search box plus category chips (with live counts) that hand off to /events. */
export function HeroSearch({
  categories,
  total,
}: {
  categories: [string, number][];
  total: number;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  return (
    <div>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          navigate(q.trim() ? `/events?q=${encodeURIComponent(q.trim())}` : "/events");
        }}
        className="flex gap-2 rounded-2xl bg-surface p-1.5 shadow-xl shadow-black/20"
      >
        <label htmlFor="hero-q" className="sr-only">
          Search events
        </label>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="hero-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Artist, event, venue or city"
            className="h-12 w-full rounded-xl bg-transparent pl-11 pr-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <Button type="submit" size="lg" className="h-12 rounded-xl px-6">
          Search
        </Button>
      </form>
      {categories.length > 0 && (
        <nav
          aria-label="Browse by category"
          className="-mx-4 mt-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
        >
          <Chip to="/events" label="All" count={total} active />
          {categories.map(([c, n]) => (
            <Chip key={c} to={`/events?category=${encodeURIComponent(c)}`} label={c} count={n} />
          ))}
        </nav>
      )}
    </div>
  );
}

function Chip({
  to,
  label,
  count,
  active,
}: {
  to: string;
  label: string;
  count: number;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex h-10 shrink-0 snap-start items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors",
        active
          ? "border-white bg-white text-[#172554]"
          : "border-white/25 bg-white/5 text-white hover:border-white/60 hover:bg-white/10",
      )}
    >
      {label}
      <span className="text-xs tabular opacity-60">{count}</span>
    </Link>
  );
}
