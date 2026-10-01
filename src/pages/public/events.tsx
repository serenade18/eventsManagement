import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarSearch, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventCard, EventCardSkeleton, EventGrid } from "@/components/events/event-card";
import { EmptyState, ErrorState, PageHeader } from "@/components/common/states";
import { WidePage } from "@/components/layout/public-layout";
import { publicEventsQuery } from "@/lib/api/queries";
import { categories, filterEvents, type DateFilter, type EventFilters, type PriceFilter } from "@/lib/events";
import { useTitle } from "@/hooks/use-title";

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
const ALL = "__all";

export default function EventsPage() {
  useTitle("Browse events");
  const [params, setParams] = useSearchParams();
  const f: EventFilters = {
    q: params.get("q") ?? "",
    category: params.get("category") ?? "",
    when: (WHEN.some((w) => w.value === params.get("when")) ? params.get("when") : "upcoming") as DateFilter,
    price: (PRICE.some((p) => p.value === params.get("price")) ? params.get("price") : "all") as PriceFilter,
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
  const results = useMemo(() => (q.data ? filterEvents(q.data, f) : []), [q.data, f.q, f.category, f.when, f.price]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <WidePage>
      <PageHeader title="Events" description="Concerts, festivals, talks and more. Find something to go to." />

      <div className="mb-6 grid gap-3 rounded-xl border border-border bg-surface p-3 sm:grid-cols-2 lg:grid-cols-[1fr_200px_180px_160px]">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <label htmlFor="search" className="sr-only">
            Search events
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id="search"
            type="search"
            placeholder="Search by title, venue or category"
            className="pl-9"
            value={f.q}
            onChange={(e) => set("q", e.target.value)}
          />
        </div>
        <FilterSelect label="Category" value={f.category || ALL} onChange={(v) => set("category", v === ALL ? "" : v)}
          options={[{ value: ALL, label: "All categories" }, ...cats.map((c) => ({ value: c, label: c }))]} />
        <FilterSelect label="Date" value={f.when} onChange={(v) => set("when", v)} options={WHEN} />
        <FilterSelect label="Price" value={f.price} onChange={(v) => set("price", v)} options={PRICE} />
      </div>

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
          description={active ? "Try a different search or clear your filters." : "There are no upcoming events right now."}
          action={active && <Button variant="outline" onClick={() => setParams({}, { replace: true })}>Clear filters</Button>}
        />
      )}
    </WidePage>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
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
