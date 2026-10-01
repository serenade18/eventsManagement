import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  CalendarCheck2,
  CalendarDays,
  Coins,
  Landmark,
  Plus,
  Receipt,
  Ticket,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { EmptyState, ErrorState, PageHeader } from "@/components/common/states";
import { getDashboard } from "@/lib/api/endpoints";
import { qk } from "@/lib/api/queries";
import type { Dashboard } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/format";
import { useTitle } from "@/hooks/use-title";

const num = new Intl.NumberFormat("en-KE");
const STATUS_VARIANT: Record<string, "success" | "warning" | "info" | "secondary"> = {
  Active: "success",
  Closed: "warning",
  Upcoming: "info",
  Ended: "secondary",
};

export default function DashboardPage() {
  useTitle("Dashboard");
  const { user } = useAuth();
  const q = useQuery({ queryKey: qk.dashboard, queryFn: getDashboard });

  return (
    <>
      <PageHeader
        eyebrow={`Welcome back, ${user?.name.split(" ")[0] ?? ""}`}
        title="Dashboard"
        description={
          user?.user_type === "admin"
            ? "Sales across every organizer on MyEvents."
            : "Sales across your events."
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/console/tickets">
                <Ticket /> View tickets
              </Link>
            </Button>
            <Button asChild>
              <Link to="/console/events/new">
                <Plus /> Create event
              </Link>
            </Button>
          </>
        }
      />
      {q.isPending ? (
        <DashboardSkeleton />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <DashboardBody d={q.data} />
      )}
    </>
  );
}

function DashboardBody({ d }: { d: Dashboard }) {
  const o = d.overview;
  const tiles = [
    { label: "Tickets sold", value: num.format(o.ticketsSold), Icon: Ticket },
    { label: "Revenue", value: money(o.revenue, false), Icon: Coins },
    { label: "Platform fee (10%)", value: money(o.systemFee, false), Icon: Landmark },
    { label: "Net revenue", value: money(o.netRevenue, false), Icon: Wallet },
    { label: "Events", value: num.format(o.total_events), Icon: CalendarDays },
    { label: "Active events", value: num.format(o.active_events), Icon: CalendarCheck2 },
  ];
  const hasMonthly = d.monthlyData.some((m) => m.tickets > 0 || m.revenue > 0);

  return (
    <div className="space-y-6">
      <section aria-label="Overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map(({ label, value, Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <Icon className="size-[18px] text-muted-foreground" aria-hidden />
            </div>
            <p className="mt-2 text-2xl font-bold tabular sm:text-3xl">{value}</p>
          </div>
        ))}
      </section>

      {o.total_events === 0 ? (
        <EmptyState
          icon={<CalendarDays />}
          title="No events yet"
          description="Create your first event to start selling tickets."
          action={
            <Button asChild>
              <Link to="/console/events/new">
                <Plus /> Create event
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <section aria-label="Monthly performance" className="grid gap-4 lg:grid-cols-2">
            <MonthlyChart data={d.monthlyData} kind="tickets" hasData={hasMonthly} />
            <MonthlyChart data={d.monthlyData} kind="revenue" hasData={hasMonthly} />
          </section>
          {hasMonthly && (
            <details className="rounded-xl border border-border bg-surface px-5 py-3 text-sm">
              <summary className="cursor-pointer py-1 font-medium">
                Monthly figures as a table
              </summary>
              <Table className="mt-2">
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Tickets</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.monthlyData.map((m) => (
                    <TableRow key={m.month}>
                      <TableCell>{m.month}</TableCell>
                      <TableCell className="text-right tabular">{num.format(m.tickets)}</TableCell>
                      <TableCell className="text-right tabular">
                        {money(m.revenue, false)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </details>
          )}

          <section aria-labelledby="recent" className="rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 id="recent" className="text-lg font-semibold">
                Recent events
              </h2>
              <Button asChild variant="link">
                <Link to="/console/events">All events</Link>
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Event</TableHead>
                    <TableHead className="text-right">Tickets</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="pr-5">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.topEvents.map((e, i) => (
                    <TableRow key={`${e.name}-${i}`}>
                      <TableCell className="pl-5 font-medium">
                        {e.id ? (
                          <Link
                            to={`/console/events/${e.id}`}
                            className="hover:text-brand hover:underline"
                          >
                            {e.name}
                          </Link>
                        ) : (
                          e.name
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular">{num.format(e.tickets)}</TableCell>
                      <TableCell className="text-right tabular">
                        {money(e.revenue, false)}
                      </TableCell>
                      <TableCell className="pr-5">
                        <Badge variant={STATUS_VARIANT[e.status] ?? "secondary"}>{e.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        </>
      )}
      {/* demographics is placeholder data from the backend (gap #11): intentionally not shown. */}
    </div>
  );
}

const ticketsConfig = {
  tickets: { label: "Tickets", color: "var(--brand)" },
} satisfies ChartConfig;
const revenueConfig = {
  revenue: { label: "Revenue", color: "var(--brand)" },
} satisfies ChartConfig;

/** One measure per chart: tickets and revenue have different scales, so no dual axis. */
function MonthlyChart({
  data,
  kind,
  hasData,
}: {
  data: Dashboard["monthlyData"];
  kind: "tickets" | "revenue";
  hasData: boolean;
}) {
  const isTickets = kind === "tickets";
  const total = data.reduce((s, m) => s + m[kind], 0);
  return (
    <figure className="rounded-xl border border-border bg-surface p-5">
      <figcaption className="mb-4 flex items-baseline justify-between gap-2">
        <span className="font-semibold">
          {isTickets ? "Tickets sold by month" : "Revenue by month"}
        </span>
        <span className="text-sm text-muted-foreground tabular">
          {isTickets ? `${num.format(total)} total` : `${money(total, false)} total`}
        </span>
      </figcaption>
      {!hasData ? (
        <div className="grid h-56 place-items-center text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Receipt className="size-4" aria-hidden /> No sales yet
          </span>
        </div>
      ) : (
        <ChartContainer
          config={isTickets ? ticketsConfig : revenueConfig}
          className="aspect-auto h-56 w-full"
        >
          {isTickets ? (
            <BarChart data={data} margin={{ left: -16, right: 4, top: 4 }}>
              <CartesianGrid vertical={false} strokeDasharray="0" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={48} />
              <ChartTooltip cursor={{ fillOpacity: 0.5 }} content={<ChartTooltipContent />} />
              <Bar
                dataKey="tickets"
                fill="var(--color-tickets)"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
                isAnimationActive={false}
              />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(v) => <span className="tabular">{money(Number(v), false)}</span>}
                  />
                }
              />
              <Line
                dataKey="revenue"
                type="monotone"
                stroke="var(--color-revenue)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </LineChart>
          )}
        </ChartContainer>
      )}
    </figure>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
