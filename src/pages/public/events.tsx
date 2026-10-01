import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarSearch, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EventCard, EventCardSkeleton, EventGrid } from "@/components/events/event-card";
import { EmptyState, ErrorState, PageHeader } from "@/components/common/states";
import { WidePage } from "@/components/layout/public-layout";
import { publicEventsQuery } from "@/lib/api/queries";
import {
  categories,
  filterEvents,
  type DateFilter,
  type EventFilters,
  type PriceFilter,
} from "@/lib/events";
import { useTitle } from "@/hooks/use-title";
import { cn } from "@/lib/utils";

const WHEN: { value: DateFilter; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "past", label: "Past events" },
  { value: "all", label: "Any date" },
];
const PRICE: { value: PriceFilter; label: string }[] = [
  { value: "all", label: "Any price" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];

export default function EventsPage() {
  useTitle("Browse events");
  const [params, setParams] = useSearchParams();
  const f: EventFilters = {
    q: params.get("q") ?? "",
    category: params.get("category") ?? "",
    when: (WHEN.some((w) => w.value === params.get("when"))
      ? params.get("when")
      : "upcoming") as DateFilter,
    price: (PRICE.some((p) => p.value === params.get("price"))
      ? params.get("price")
      : "all") as PriceFilter,
  };
  const set = (k: keyof EventFilters, v: string) => {
    const next = new URLSearchParams(params);
    const isDefault = !v || (k === "when" && v === "upcoming") || (k === "price" && v === "all");
    if (isDefault) next.delete(k);
    else next.set(k, v);
    setParams(next, { replace: true });
  };
  const active = !!(f.q || f.category || f.when !== "upcoming" || f.price !== "all");

  const q = useQuery(publicEventsQuery());
  const cats = useMemo(() => (q.data ? categories(q.data) : []), [q.data]);
  const results = q.data ? filterEvents(q.data, f) : [];
  // Chip counts reflect every other active filter, so a chip never promises results it can't show.
  const pool = q.data ? filterEvents(q.data, { ...f, category: "" }) : [];
  const countFor = (c: string) => pool.filter((e) => e.category === c).length;

  return (
    <WidePage>
      <PageHeader
        title="Events"
        description="Concerts, festivals, talks and more. Find something to go to."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px_160px]">
        <div className="relative">
          <label htmlFor="search" className="sr-only">
            Search events
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="search"
            type="search"
            placeholder="Search by title, venue or category"
            className="pl-9"
            value={f.q}
            onChange={(e) => set("q", e.target.value)}
          />
        </div>
        <FilterSelect label="Date" value={f.when} onChange={(v) => set("when", v)} options={WHEN} />
        <FilterSelect
          label="Price"
          value={f.price}
          onChange={(v) => set("price", v)}
          options={PRICE}
        />
      </div>

      {cats.length > 0 && (
        <div
          role="radiogroup"
          aria-label="Category"
          className="-mx-4 mb-6 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
        >
          <CategoryChip
            label="All"
            count={pool.length}
            active={!f.category}
            onClick={() => set("category", "")}
          />
          {cats.map((c) => (
            <CategoryChip
              key={c}
              label={c}
              count={countFor(c)}
              active={f.category === c}
              onClick={() => set("category", f.category === c ? "" : c)}
            />
          ))}
        </div>
      )}

      <div className="mb-4 flex min-h-9 items-center justify-between gap-2" aria-live="polite">
        <p className="text-sm text-muted-foreground">
          {q.data ? `${results.length} ${results.length === 1 ? "event" : "events"}` : ""}
        </p>
        {active && (
          <Button variant="ghost" size="sm" onClick={() => setParams({}, { replace: true })}>
            <X /> Clear filters
          </Button>
        )}
      </div>

      {q.isPending ? (
        <EventGrid>
          {Array.from({ length: 8 }, (_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </EventGrid>
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} title="We couldn't load events" />
      ) : results.length ? (
        <EventGrid>
          {results.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </EventGrid>
      ) : (
        <EmptyState
          icon={<CalendarSearch />}
          title="No events match"
          description={
            active
              ? "Try a different search or clear your filters."
              : "There are no upcoming events right now."
          }
          action={
            active && (
              <Button variant="outline" onClick={() => setParams({}, { replace: true })}>
                Clear filters
              </Button>
            )
          }
        />
      )}
    </WidePage>
  );
}

function CategoryChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "flex h-10 shrink-0 snap-start items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-surface text-foreground hover:border-input",
      )}
    >
      {label}
      <span className="text-xs tabular opacity-60">{count}</span>
    </button>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
