import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Coins, Eye, Percent, Ticket } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ErrorState } from "@/components/common/states";
import { OrderStatusBadge } from "@/components/common/status";
import { getEventPerformance } from "@/lib/api/endpoints";
import { qk } from "@/lib/api/queries";
import type { EventPerformance, OrderStatus } from "@/lib/api/types";
import { dateTime, displayTicketNumber, money } from "@/lib/format";
import { cn } from "@/lib/utils";

const num = new Intl.NumberFormat("en-KE");
const dayLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short" }).format(
    new Date(`${iso}T00:00:00Z`),
  );

export function EventPerformancePanel({ eventId }: { eventId: string }) {
  const q = useQuery({
    queryKey: qk.eventPerformance(eventId),
    queryFn: () => getEventPerformance(eventId),
  });
  if (q.isPending) return <PerformanceSkeleton />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  return <Performance p={q.data} />;
}

function Performance({ p }: { p: EventPerformance }) {
  const t = p.totals;
  return (
    <div className="space-y-6">
      <section aria-label="Key figures" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={<Eye />}
          label="Page views"
          value={num.format(t.views)}
          sub={`${num.format(t.views_7d)} in the last 7 days`}
        />
        <Stat
          icon={<Ticket />}
          label="Tickets sold"
          value={`${num.format(t.tickets_sold)} / ${num.format(t.capacity)}`}
          sub={t.sell_through === null ? "No capacity set" : `${t.sell_through}% sold`}
          progress={t.sell_through}
        />
        <Stat
          icon={<Coins />}
          label="Revenue"
          value={money(t.revenue, false)}
          sub={
            t.orders_paid
              ? `${num.format(t.orders_paid)} paid ${t.orders_paid === 1 ? "order" : "orders"} · avg ${money(t.avg_order_value, false)}`
              : "No paid orders yet"
          }
        />
        <Stat
          icon={<Percent />}
          label="Conversion"
          value={t.conversion_rate === null ? "—" : `${t.conversion_rate}%`}
          sub={
            t.conversion_rate === null
              ? "Shows once the page gets views"
              : "of page views became a paid order"
          }
        />
      </section>

      <section aria-label="Last 30 days" className="grid gap-4 lg:grid-cols-2">
        <DailyChart data={p.daily} kind="views" />
        <DailyChart data={p.daily} kind="tickets" />
      </section>
      <details className="rounded-xl border border-border bg-surface px-5 py-3 text-sm">
        <summary className="cursor-pointer py-1 font-medium">Daily figures as a table</summary>
        <div className="mt-2 max-h-80 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Tickets</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...p.daily].reverse().map((d) => (
                <TableRow key={d.date}>
                  <TableCell>{dayLabel(d.date)}</TableCell>
                  <TableCell className="text-right tabular">{num.format(d.views)}</TableCell>
                  <TableCell className="text-right tabular">{num.format(d.tickets)}</TableCell>
                  <TableCell className="text-right tabular">{money(d.revenue, false)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </details>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <TierPerformance tiers={p.tiers} />
        <OrderOutcomes byStatus={p.orders_by_status} />
      </div>

      <RecentOrders orders={p.recent_orders} />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  progress?: number | null;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className="text-muted-foreground [&_svg]:size-[18px]" aria-hidden>
          {icon}
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular">{value}</p>
      {progress !== undefined && progress !== null && <Meter value={progress} className="mt-3" />}
      {sub && <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Thin progress bar; the percentage is always also given as text nearby. */
function Meter({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)} aria-hidden>
      <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

const viewsConfig = { views: { label: "Views", color: "var(--brand)" } } satisfies ChartConfig;
const ticketsConfig = {
  tickets: { label: "Tickets", color: "var(--brand)" },
} satisfies ChartConfig;

function DailyChart({
  data,
  kind,
}: {
  data: EventPerformance["daily"];
  kind: "views" | "tickets";
}) {
  const total = data.reduce((s, d) => s + d[kind], 0);
  const rows = data.map((d) => ({ ...d, label: dayLabel(d.date) }));
  return (
    <figure className="rounded-xl border border-border bg-surface p-5">
      <figcaption className="mb-4 flex items-baseline justify-between gap-2">
        <span className="font-semibold">
          {kind === "views" ? "Page views per day" : "Tickets sold per day"}
        </span>
        <span className="text-sm text-muted-foreground tabular">
          {num.format(total)} in 30 days
        </span>
      </figcaption>
      {total === 0 ? (
        <div className="grid h-48 place-items-center text-sm text-muted-foreground">
          {kind === "views" ? "No views yet" : "No sales yet"}
        </div>
      ) : (
        <ChartContainer
          config={kind === "views" ? viewsConfig : ticketsConfig}
          className="aspect-auto h-48 w-full"
        >
          <BarChart data={rows} margin={{ left: -20, right: 4, top: 4 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44} />
            <ChartTooltip cursor={{ fillOpacity: 0.5 }} content={<ChartTooltipContent />} />
            <Bar
              dataKey={kind}
              fill={`var(--color-${kind})`}
              radius={[3, 3, 0, 0]}
              maxBarSize={18}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
      )}
    </figure>
  );
}

function TierPerformance({ tiers }: { tiers: EventPerformance["tiers"] }) {
  return (
    <section aria-labelledby="perf-tiers" className="rounded-xl border border-border bg-surface">
      <h2 id="perf-tiers" className="px-5 pt-4 text-lg font-semibold">
        Ticket tiers
      </h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Tier</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="min-w-40">Sold</TableHead>
              <TableHead className="text-right">Left</TableHead>
              <TableHead className="pr-5 text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="pl-5 font-medium">{t.name}</TableCell>
                <TableCell className="text-right tabular">{money(t.price)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Meter value={t.sell_through ?? 0} className="flex-1" />
                    <span className="w-24 shrink-0 text-right text-xs tabular text-muted-foreground">
                      {num.format(t.sold)}/{num.format(t.capacity)}
                      {t.sell_through !== null && ` · ${t.sell_through}%`}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular">{num.format(t.remaining)}</TableCell>
                <TableCell className="pr-5 text-right tabular">{money(t.revenue, false)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

const OUTCOMES: { status: OrderStatus; label: string; bar: string }[] = [
  { status: "paid", label: "Paid", bar: "bg-success" },
  { status: "pending", label: "Waiting for payment", bar: "bg-warning" },
  { status: "failed", label: "Payment failed", bar: "bg-danger" },
  { status: "expired", label: "Expired", bar: "bg-subtle-foreground" },
  { status: "refund_required", label: "Refund required", bar: "bg-danger" },
];

function OrderOutcomes({ byStatus }: { byStatus: EventPerformance["orders_by_status"] }) {
  const total = OUTCOMES.reduce((s, o) => s + (byStatus[o.status] ?? 0), 0);
  return (
    <section
      aria-labelledby="perf-orders"
      className="rounded-xl border border-border bg-surface p-5"
    >
      <div className="mb-4 flex items-baseline justify-between">
        <h2 id="perf-orders" className="text-lg font-semibold">
          Checkout outcomes
        </h2>
        <span className="text-sm text-muted-foreground tabular">
          {num.format(total)} {total === 1 ? "order" : "orders"}
        </span>
      </div>
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">No checkouts started yet.</p>
      ) : (
        <ul className="space-y-3">
          {OUTCOMES.map((o) => {
            const n = byStatus[o.status] ?? 0;
            const share = total ? Math.round((n / total) * 100) : 0;
            return (
              <li key={o.status}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{o.label}</span>
                  <span className="tabular text-muted-foreground">
                    {num.format(n)} · {share}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div
                    className={cn("h-full rounded-full", o.bar)}
                    style={{ width: `${share}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {byStatus.refund_required > 0 && (
        <p className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {byStatus.refund_required} {byStatus.refund_required === 1 ? "buyer has" : "buyers have"}{" "}
          paid without getting tickets and need a refund.
        </p>
      )}
    </section>
  );
}

function RecentOrders({ orders }: { orders: EventPerformance["recent_orders"] }) {
  return (
    <section aria-labelledby="perf-recent" className="rounded-xl border border-border bg-surface">
      <h2 id="perf-recent" className="px-5 pt-4 text-lg font-semibold">
        Latest orders
      </h2>
      {orders.length === 0 ? (
        <p className="px-5 pb-5 pt-2 text-sm text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Order</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Tickets</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5">Started</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.reference}>
                  <TableCell className="ticket-id pl-5 text-xs">
                    {displayTicketNumber(o.reference)}
                  </TableCell>
                  <TableCell>{o.buyer_name}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {o.quantity} × {o.tier}
                  </TableCell>
                  <TableCell className="text-right tabular">{money(o.total_amount)}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap pr-5">{dateTime(o.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}

function PerformanceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <Skeleton className="h-56 rounded-xl" />
    </div>
  );
}
