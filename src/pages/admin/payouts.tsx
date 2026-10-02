import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  CheckCircle2,
  Coins,
  Percent,
  SlidersHorizontal,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EmptyState,
  ErrorState,
  Field,
  FormAlert,
  PageHeader,
  Spinner,
} from "@/components/common/states";
import { WithdrawalStatusBadge, withdrawalDestination } from "@/components/console/withdrawals";
import { ApiError, errorMessage } from "@/lib/api/client";
import {
  adjustWallet,
  getPayoutSettings,
  getWalletsOverview,
  listAllWithdrawals,
  markWithdrawalPaid,
  rejectWithdrawal,
  updatePayoutSettings,
} from "@/lib/api/endpoints";
import { qk } from "@/lib/api/queries";
import type { Withdrawal, WithdrawalStatus, WalletsOverview } from "@/lib/api/types";
import { dateTime, money } from "@/lib/format";
import { useTitle } from "@/hooks/use-title";

const kes = (v: unknown) => money(Number(v ?? 0), false);
type Tab = WithdrawalStatus | "all";

export default function PayoutsPage() {
  useTitle("Payouts");
  const overview = useQuery({ queryKey: qk.walletsOverview, queryFn: getWalletsOverview });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Payouts"
        description="Withdrawal requests, wallet balances and payout rules."
      />
      {overview.isPending ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : overview.isError ? (
        <ErrorState error={overview.error} onRetry={() => overview.refetch()} />
      ) : (
        <section aria-label="Overview" className="grid gap-4 sm:grid-cols-3">
          <Stat
            label="Waiting to be paid"
            value={kes(overview.data.totals.pending_withdrawals)}
            sub={`${overview.data.totals.pending_count} pending ${overview.data.totals.pending_count === 1 ? "request" : "requests"}`}
            Icon={Banknote}
          />
          <Stat
            label="Held in wallets"
            value={kes(overview.data.totals.balances)}
            sub="Available to organizers and sponsors"
            Icon={Wallet}
          />
          <Stat
            label="Commission earned"
            value={kes(overview.data.totals.commission_earned)}
            sub="From paid ticket orders"
            Icon={Coins}
          />
        </section>
      )}
      <SettingsCard />
      <WithdrawalQueue />
      {overview.data && <WalletsTable data={overview.data} />}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  Icon,
}: {
  label: string;
  value: string;
  sub: string;
  Icon: typeof Wallet;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className="size-[18px] text-muted-foreground" aria-hidden />
      </div>
      <p className="mt-2 text-2xl font-bold tabular">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function SettingsCard() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: qk.payoutSettings, queryFn: getPayoutSettings });
  const [value, setValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const m = useMutation({
    mutationFn: (v: string) => updatePayoutSettings(v),
    onSuccess: (data) => {
      qc.setQueryData(qk.payoutSettings, data);
      void qc.invalidateQueries({ queryKey: qk.wallet });
      setValue(null);
      toast.success(`Minimum withdrawal is now ${kes(data.min_withdrawal)}`);
    },
    onError: (e) =>
      setError(
        e instanceof ApiError
          ? (e.fieldErrors["min_withdrawal"]?.[0] ?? e.message)
          : errorMessage(e),
      ),
  });
  if (q.isPending) return <Skeleton className="h-32 rounded-xl" />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const current = value ?? String(Math.round(Number(q.data.min_withdrawal)));
  const dirty = value !== null && Number(value) !== Number(q.data.min_withdrawal);
  return (
    <section
      aria-labelledby="payout-rules"
      className="rounded-xl border border-border bg-surface p-5"
    >
      <h2 id="payout-rules" className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <SlidersHorizontal className="size-5 text-brand" aria-hidden /> Payout rules
      </h2>
      <form
        className="flex flex-col gap-4 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          if (!/^\d+(\.\d{1,2})?$/.test(current.trim()) || Number(current) < 1)
            return setError("Enter an amount of at least KES 1");
          m.mutate(current.trim());
        }}
      >
        <Field
          id="min-w"
          label="Minimum withdrawal (KES)"
          error={error ?? undefined}
          className="sm:w-64"
          hint={q.data.updated_by ? `Last changed by ${q.data.updated_by}` : undefined}
        >
          <Input
            id="min-w"
            inputMode="decimal"
            value={current}
            onChange={(e) => setValue(e.target.value)}
          />
        </Field>
        <Button type="submit" disabled={!dirty || m.isPending}>
          {m.isPending && <Spinner />} Save
        </Button>
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm sm:ml-auto">
          <Percent className="size-4 text-muted-foreground" aria-hidden />
          Platform commission:{" "}
          <strong className="tabular">
            {Math.round(Number(q.data.commission_rate) * 100)}%
          </strong>{" "}
          of every paid ticket order
        </div>
      </form>
    </section>
  );
}

function WithdrawalQueue() {
  const [tab, setTab] = useState<Tab>("pending");
  const q = useQuery({
    queryKey: qk.allWithdrawals(tab),
    queryFn: () => listAllWithdrawals(tab === "all" ? undefined : tab),
  });
  const [paying, setPaying] = useState<Withdrawal | null>(null);
  const [rejecting, setRejecting] = useState<Withdrawal | null>(null);
  return (
    <section aria-labelledby="queue" className="rounded-xl border border-border bg-surface">
      <div className="flex flex-col gap-3 px-5 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="queue" className="text-lg font-semibold">
          Withdrawal requests
        </h2>
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {q.isPending ? (
        <div className="p-5">
          <Skeleton className="h-32" />
        </div>
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} className="m-5" />
      ) : q.data.length === 0 ? (
        <EmptyState
          icon={<Banknote />}
          title={tab === "pending" ? "Nothing to pay right now" : "No withdrawals here"}
          description={
            tab === "pending" ? "New requests from organizers and sponsors appear here." : undefined
          }
          className="m-5"
        />
      ) : (
        <div className="mt-2 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Requested</TableHead>
                <TableHead>From</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Pay to</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.data.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="whitespace-nowrap pl-5 text-sm">
                    {dateTime(w.requested_at)}
                  </TableCell>
                  <TableCell>
                    {w.user && (
                      <>
                        <Link
                          to={`/console/users/${w.user.id}`}
                          className="font-medium hover:text-brand hover:underline"
                        >
                          {w.user.organization || w.user.name}
                        </Link>
                        <span className="block text-xs capitalize text-muted-foreground">
                          {w.user.user_type}
                        </span>
                      </>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold tabular">
                    {kes(w.amount)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {withdrawalDestination(w)}
                    {w.payout_reference && (
                      <span className="block text-xs text-muted-foreground">
                        Ref <span className="ticket-id">{w.payout_reference}</span>
                      </span>
                    )}
                    {w.status === "rejected" && w.admin_note && (
                      <span className="block text-xs text-danger">{w.admin_note}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <WithdrawalStatusBadge status={w.status} />
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    {w.status === "pending" && (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" onClick={() => setPaying(w)}>
                          <CheckCircle2 /> Mark paid
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger hover:text-danger"
                          onClick={() => setRejecting(w)}
                        >
                          <XCircle /> Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <PayDialog withdrawal={paying} onClose={() => setPaying(null)} />
      <RejectDialog withdrawal={rejecting} onClose={() => setRejecting(null)} />
    </section>
  );
}

function useAfterPayoutChange() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["payouts"] });
  };
}

function PayDialog({
  withdrawal: w,
  onClose,
}: {
  withdrawal: Withdrawal | null;
  onClose: () => void;
}) {
  const refresh = useAfterPayoutChange();
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const m = useMutation({
    mutationFn: () => markWithdrawalPaid(w!.id, reference.trim(), note.trim()),
    onSuccess: () => {
      toast.success("Marked as paid");
      refresh();
      close();
    },
    onError: (e) => setError(errorMessage(e)),
  });
  const close = () => {
    setReference("");
    setNote("");
    setError(null);
    onClose();
  };
  return (
    <Dialog open={!!w} onOpenChange={(o) => !o && !m.isPending && close()}>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!reference.trim()) return setError("Enter the M-Pesa receipt or bank reference");
            m.mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>Mark {kes(w?.amount)} as paid</DialogTitle>
            <DialogDescription>
              Send the money first, then record it here. Paying to {w && withdrawalDestination(w)}.
            </DialogDescription>
          </DialogHeader>
          <Field
            id="pay-ref"
            label="Payout reference"
            hint="M-Pesa receipt (e.g. QK12AB34CD) or bank reference"
          >
            <Input
              id="pay-ref"
              className="font-mono"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              autoFocus
            />
          </Field>
          <Field id="pay-note" label="Note" optional>
            <Textarea
              id="pay-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          <FormAlert message={error} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={m.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={m.isPending}>
              {m.isPending && <Spinner />} Mark paid
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({
  withdrawal: w,
  onClose,
}: {
  withdrawal: Withdrawal | null;
  onClose: () => void;
}) {
  const refresh = useAfterPayoutChange();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const m = useMutation({
    mutationFn: () => rejectWithdrawal(w!.id, reason.trim()),
    onSuccess: () => {
      toast.success("Rejected. The amount went back to their wallet.");
      refresh();
      close();
    },
    onError: (e) => setError(errorMessage(e)),
  });
  const close = () => {
    setReason("");
    setError(null);
    onClose();
  };
  return (
    <Dialog open={!!w} onOpenChange={(o) => !o && !m.isPending && close()}>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!reason.trim()) return setError("Tell them why");
            m.mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>Reject this withdrawal?</DialogTitle>
            <DialogDescription>
              {kes(w?.amount)} returns to {w?.user?.name ?? "their"} wallet. They'll see your
              reason.
            </DialogDescription>
          </DialogHeader>
          <Field id="rej-reason" label="Reason">
            <Textarea
              id="rej-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
            />
          </Field>
          <FormAlert message={error} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={m.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={m.isPending}>
              {m.isPending && <Spinner />} Reject
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WalletsTable({ data }: { data: WalletsOverview }) {
  const [adjusting, setAdjusting] = useState<WalletsOverview["wallets"][number] | null>(null);
  return (
    <section aria-labelledby="wallets" className="rounded-xl border border-border bg-surface">
      <h2 id="wallets" className="px-5 pt-4 text-lg font-semibold">
        Wallets
      </h2>
      {data.wallets.length === 0 ? (
        <p className="px-5 pb-5 pt-2 text-sm text-muted-foreground">
          No organizers or sponsors yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Account</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="pr-5 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.wallets.map((row) => (
                <TableRow key={row.user.id}>
                  <TableCell className="pl-5">
                    <Link
                      to={`/console/users/${row.user.id}`}
                      className="font-medium hover:text-brand hover:underline"
                    >
                      {row.user.name}
                    </Link>
                    <span className="block text-xs text-muted-foreground">{row.user.email}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={row.user.user_type === "sponsor" ? "info" : "default"}
                      className="capitalize"
                    >
                      {row.user.user_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular">
                    {kes(row.balance)}
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <Button size="sm" variant="outline" onClick={() => setAdjusting(row)}>
                      Adjust
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <AdjustDialog row={adjusting} onClose={() => setAdjusting(null)} />
    </section>
  );
}

function AdjustDialog({
  row,
  onClose,
}: {
  row: WalletsOverview["wallets"][number] | null;
  onClose: () => void;
}) {
  const refresh = useAfterPayoutChange();
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const m = useMutation({
    mutationFn: () =>
      adjustWallet(
        row!.user.id,
        direction === "debit" ? `-${amount.trim()}` : amount.trim(),
        reason.trim(),
        password,
      ),
    onSuccess: (data) => {
      toast.success(`${row?.user.name}'s balance is now ${kes(data.balance)}`);
      refresh();
      close();
    },
    onError: (e) =>
      setError(
        e instanceof ApiError && e.status === 403
          ? "That password is incorrect"
          : e instanceof ApiError
            ? (Object.values(e.fieldErrors)[0]?.[0] ?? e.message)
            : errorMessage(e),
      ),
  });
  const close = () => {
    setAmount("");
    setReason("");
    setPassword("");
    setDirection("credit");
    setError(null);
    onClose();
  };
  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && !m.isPending && close()}>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            if (!/^\d+(\.\d{1,2})?$/.test(amount.trim()) || Number(amount) <= 0)
              return setError("Enter an amount above 0");
            if (!reason.trim()) return setError("Say what this adjustment is for");
            if (!password) return setError("Enter your password");
            m.mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>Adjust {row?.user.name}'s wallet</DialogTitle>
            <DialogDescription>
              Current balance {kes(row?.balance)}. Use this for sponsor payments or corrections;
              it's recorded in their activity with your reason.
            </DialogDescription>
          </DialogHeader>
          <div role="radiogroup" aria-label="Direction" className="grid grid-cols-2 gap-2">
            {(["credit", "debit"] as const).map((d) => (
              <Button
                key={d}
                type="button"
                variant={direction === d ? "default" : "outline"}
                aria-pressed={direction === d}
                onClick={() => setDirection(d)}
              >
                {d === "credit" ? "Add funds" : "Remove funds"}
              </Button>
            ))}
          </div>
          <Field id="adj-amount" label="Amount (KES)">
            <Input
              id="adj-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Field id="adj-reason" label="Reason">
            <Input
              id="adj-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Sponsorship for Jazz Night"
            />
          </Field>
          <Field id="adj-pw" label="Your password">
            <Input
              id="adj-pw"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <FormAlert message={error} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={m.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={m.isPending}>
              {m.isPending && <Spinner />} {direction === "credit" ? "Add funds" : "Remove funds"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
