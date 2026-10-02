import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Building2,
  Coins,
  Landmark,
  Percent,
  Smartphone,
  Wallet as WalletIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import {
  aria,
  ErrorState,
  Field,
  FormAlert,
  PageHeader,
  Spinner,
} from "@/components/common/states";
import { WithdrawalStatusBadge, withdrawalDestination } from "@/components/console/withdrawals";
import { ApiError, errorMessage } from "@/lib/api/client";
import {
  cancelWithdrawal,
  getWallet,
  listMyWithdrawals,
  listWalletTransactions,
  requestWithdrawal,
} from "@/lib/api/endpoints";
import { qk } from "@/lib/api/queries";
import type { WalletSummary, WalletTransaction, Withdrawal } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";
import { dateTime, displayTicketNumber, isKenyanPhone, money } from "@/lib/format";
import { useTitle } from "@/hooks/use-title";
import { cn } from "@/lib/utils";

const kes = (v: unknown) => money(Number(v ?? 0), false);
const pct = (rate: unknown) => `${Math.round(Number(rate ?? 0) * 100)}%`;

export default function WalletPage() {
  useTitle("Wallet");
  const { user } = useAuth();
  const sponsor = user?.user_type === "sponsor";
  const w = useQuery({ queryKey: qk.wallet, queryFn: getWallet });
  const [open, setOpen] = useState(false);

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Wallet"
        description={
          sponsor
            ? "Funds credited to your account by MyEvents."
            : "Your ticket sales, after the MyEvents commission, ready to withdraw."
        }
      />
      {w.isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-44 rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      ) : w.isError ? (
        <ErrorState error={w.error} onRetry={() => w.refetch()} />
      ) : (
        <div className="space-y-6">
          <BalanceCard w={w.data} onWithdraw={() => setOpen(true)} />
          <Totals w={w.data} sponsor={sponsor} />
          <WithdrawalsSection />
          <LedgerSection />
          <WithdrawDialog open={open} onOpenChange={setOpen} wallet={w.data} />
        </div>
      )}
    </div>
  );
}

function BalanceCard({ w, onWithdraw }: { w: WalletSummary; onWithdraw: () => void }) {
  const balance = Number(w.balance);
  const min = Number(w.min_withdrawal);
  const progress = min > 0 ? Math.min(100, (balance / min) * 100) : 100;
  return (
    <section
      aria-label="Balance"
      className="overflow-hidden rounded-2xl bg-[#172554] p-6 text-white sm:p-8 dark:bg-[#111c3a]"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-blue-200">
            <WalletIcon className="size-4" aria-hidden /> Available to withdraw
          </p>
          <p className="mt-2 text-4xl font-extrabold tabular sm:text-5xl">{kes(w.balance)}</p>
          {w.totals.pending_count > 0 && (
            <p className="mt-2 text-sm text-blue-100">
              {kes(w.totals.pending_withdrawals)} on hold in {w.totals.pending_count} pending{" "}
              {w.totals.pending_count === 1 ? "withdrawal" : "withdrawals"}
            </p>
          )}
        </div>
        <Button
          size="lg"
          onClick={onWithdraw}
          disabled={!w.can_withdraw}
          className="bg-white text-[#1d4ed8] hover:bg-blue-50"
        >
          <ArrowUpRight /> Withdraw
        </Button>
      </div>
      <div className="mt-6">
        {w.can_withdraw ? (
          <p className="text-sm text-blue-100">
            Minimum withdrawal is {kes(w.min_withdrawal)}. Payouts go to M-Pesa or your bank.
          </p>
        ) : (
          <>
            <div className="h-2 overflow-hidden rounded-full bg-white/15" aria-hidden>
              <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-sm text-blue-100">
              You can withdraw once you reach {kes(w.min_withdrawal)}:{" "}
              <span className="font-semibold text-white tabular">
                {kes(Math.max(0, min - balance))} to go
              </span>
              .
            </p>
          </>
        )}
      </div>
    </section>
  );
}

function Totals({ w, sponsor }: { w: WalletSummary; sponsor: boolean }) {
  const t = w.totals;
  const tiles = sponsor
    ? [
        { label: "Credited", value: kes(t.adjustments), Icon: ArrowDownLeft },
        { label: "Withdrawn", value: kes(t.withdrawn), Icon: Banknote },
      ]
    : [
        { label: "Ticket sales", value: kes(t.gross_sales), Icon: Coins },
        {
          label: `Commission (${pct(w.commission_rate)})`,
          value: kes(t.commission),
          Icon: Percent,
        },
        { label: "Your earnings", value: kes(t.net_earnings), Icon: ArrowDownLeft },
        { label: "Withdrawn", value: kes(t.withdrawn), Icon: Banknote },
      ];
  return (
    <section
      aria-label="Totals"
      className={cn("grid gap-4 sm:grid-cols-2", !sponsor && "lg:grid-cols-4")}
    >
      {tiles.map(({ label, value, Icon }) => (
        <div key={label} className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <Icon className="size-[18px] text-muted-foreground" aria-hidden />
          </div>
          <p className="mt-2 text-2xl font-bold tabular">{value}</p>
        </div>
      ))}
    </section>
  );
}

function WithdrawalsSection() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: qk.myWithdrawals, queryFn: listMyWithdrawals });
  const [cancelling, setCancelling] = useState<Withdrawal | null>(null);
  return (
    <section aria-labelledby="w-list" className="rounded-xl border border-border bg-surface">
      <h2 id="w-list" className="px-5 pt-4 text-lg font-semibold">
        Withdrawals
      </h2>
      {q.isPending ? (
        <div className="p-5">
          <Skeleton className="h-20" />
        </div>
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} className="m-5" />
      ) : q.data.length === 0 ? (
        <p className="px-5 pb-5 pt-2 text-sm text-muted-foreground">No withdrawals yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {q.data.map((w) => (
            <li key={w.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold tabular">{kes(w.amount)}</span>
                  <WithdrawalStatusBadge status={w.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {withdrawalDestination(w)} · requested {dateTime(w.requested_at)}
                </p>
                {w.status === "paid" && w.payout_reference && (
                  <p className="text-sm">
                    Reference <span className="ticket-id">{w.payout_reference}</span>
                  </p>
                )}
                {w.status === "rejected" && w.admin_note && (
                  <p className="text-sm text-danger">Reason: {w.admin_note}</p>
                )}
              </div>
              {w.status === "pending" && (
                <Button variant="outline" size="sm" onClick={() => setCancelling(w)}>
                  Cancel
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={!!cancelling}
        onOpenChange={(o) => !o && setCancelling(null)}
        title="Cancel this withdrawal?"
        description={`${kes(cancelling?.amount)} goes back to your available balance.`}
        confirmLabel="Cancel withdrawal"
        onConfirm={async () => {
          if (!cancelling) return;
          await cancelWithdrawal(cancelling.id);
          toast.success("Withdrawal cancelled");
          void qc.invalidateQueries({ queryKey: qk.wallet });
        }}
      />
    </section>
  );
}

const KIND: Record<
  WalletTransaction["kind"],
  { label: string; variant: "success" | "secondary" | "info" | "default" }
> = {
  sale: { label: "Ticket sale", variant: "success" },
  withdrawal: { label: "Withdrawal", variant: "secondary" },
  withdrawal_return: { label: "Returned", variant: "info" },
  adjustment: { label: "Adjustment", variant: "default" },
};

function LedgerSection() {
  const q = useQuery({ queryKey: qk.walletTx, queryFn: listWalletTransactions });
  return (
    <section aria-labelledby="ledger" className="rounded-xl border border-border bg-surface">
      <h2 id="ledger" className="px-5 pt-4 text-lg font-semibold">
        Activity
      </h2>
      {q.isPending ? (
        <div className="p-5">
          <Skeleton className="h-40" />
        </div>
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} className="m-5" />
      ) : q.data.length === 0 ? (
        <p className="px-5 pb-5 pt-2 text-sm text-muted-foreground">
          Nothing yet. Earnings appear here as soon as a ticket order is paid.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Date</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="pr-5 text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.data.map((t) => {
                const amount = Number(t.amount);
                const k = KIND[t.kind];
                return (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap pl-5 text-sm">
                      {dateTime(t.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={k.variant}>{k.label}</Badge>
                        <span className="text-sm">{t.description}</span>
                      </div>
                      {t.kind === "sale" && (
                        <p className="mt-0.5 text-xs text-muted-foreground tabular">
                          {kes(t.gross_amount)} paid · {kes(t.commission)} commission
                          {t.order_reference && (
                            <>
                              {" · order "}
                              <span className="ticket-id">
                                {displayTicketNumber(t.order_reference)}
                              </span>
                            </>
                          )}
                        </p>
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "whitespace-nowrap text-right font-semibold tabular",
                        amount >= 0 ? "text-success" : "text-foreground",
                      )}
                    >
                      {amount >= 0 ? "+" : "−"}
                      {kes(Math.abs(amount))}
                    </TableCell>
                    <TableCell className="whitespace-nowrap pr-5 text-right tabular text-muted-foreground">
                      {kes(t.balance_after)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}

function withdrawSchema(min: number, max: number) {
  return z
    .object({
      amount: z
        .string()
        .trim()
        .min(1, "Enter an amount")
        .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), "Use a number like 15000")
        .refine((v) => Number(v) >= min, `Minimum is ${kes(min)}`)
        .refine((v) => Number(v) <= max, `You have ${kes(max)} available`),
      method: z.enum(["mpesa", "bank"]),
      mpesa_phone: z.string().trim(),
      bank_name: z.string().trim().max(100),
      account_name: z.string().trim().max(150),
      account_number: z.string().trim().max(50),
      password: z.string().min(1, "Enter your password"),
    })
    .superRefine((v, ctx) => {
      if (v.method === "mpesa" && !isKenyanPhone(v.mpesa_phone))
        ctx.addIssue({
          code: "custom",
          path: ["mpesa_phone"],
          message: "Enter a Kenyan M-Pesa number",
        });
      if (v.method === "bank")
        for (const [k, label] of [
          ["bank_name", "the bank"],
          ["account_name", "the account name"],
          ["account_number", "the account number"],
        ] as const)
          if (!v[k]) ctx.addIssue({ code: "custom", path: [k], message: `Enter ${label}` });
    });
}
type WithdrawValues = z.infer<ReturnType<typeof withdrawSchema>>;

function WithdrawDialog({
  open,
  onOpenChange,
  wallet,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  wallet: WalletSummary;
}) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const max = Number(wallet.balance);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<WithdrawValues>({
    resolver: zodResolver(withdrawSchema(Number(wallet.min_withdrawal), max)),
    defaultValues: {
      amount: "",
      method: "mpesa",
      mpesa_phone: user?.phone ?? "",
      bank_name: "",
      account_name: user?.name ?? "",
      account_number: "",
      password: "",
    },
  });
  const { register, handleSubmit, watch, setValue, setError, reset, formState } = form;
  const method = watch("method");
  const err = (k: keyof WithdrawValues) => formState.errors[k]?.message;

  const m = useMutation({
    mutationFn: (v: WithdrawValues) =>
      requestWithdrawal({
        password: v.password,
        amount: v.amount,
        method: v.method,
        ...(v.method === "mpesa"
          ? { mpesa_phone: v.mpesa_phone }
          : {
              bank_name: v.bank_name,
              account_name: v.account_name,
              account_number: v.account_number,
            }),
      }),
    onSuccess: () => {
      toast.success("Withdrawal requested. We'll notify you when it's paid.");
      void qc.invalidateQueries({ queryKey: qk.wallet });
      reset();
      onOpenChange(false);
    },
    onError: (e) => {
      if (e instanceof ApiError && e.status === 403)
        return setError("password", { message: "Incorrect password" });
      if (e instanceof ApiError && Object.keys(e.fieldErrors).length) {
        for (const [k, msgs] of Object.entries(e.fieldErrors))
          setError(k as keyof WithdrawValues, { message: msgs[0] ?? "" });
        return setFormError("Please fix the highlighted fields");
      }
      setFormError(errorMessage(e));
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (m.isPending) return;
        setFormError(null);
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <form onSubmit={handleSubmit((v) => m.mutate(v))} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>Withdraw funds</DialogTitle>
            <DialogDescription>
              {kes(wallet.balance)} available · minimum {kes(wallet.min_withdrawal)}. The amount is
              held until an admin sends the payout.
            </DialogDescription>
          </DialogHeader>

          <Field id="w-amount" label="Amount (KES)" error={err("amount")}>
            <div className="flex gap-2">
              <Input
                {...aria("w-amount", err("amount"))}
                inputMode="decimal"
                {...register("amount")}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setValue("amount", String(Math.floor(max)), { shouldValidate: true })
                }
              >
                All
              </Button>
            </div>
          </Field>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Send it to</legend>
            <div role="radiogroup" className="grid grid-cols-2 gap-2">
              {(
                [
                  ["mpesa", "M-Pesa", Smartphone],
                  ["bank", "Bank", Landmark],
                ] as const
              ).map(([value, label, Icon]) => (
                <label
                  key={value}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                    method === value ? "border-brand bg-brand-soft text-brand" : "border-border",
                  )}
                >
                  <input type="radio" value={value} className="sr-only" {...register("method")} />
                  <Icon className="size-4" aria-hidden /> {label}
                </label>
              ))}
            </div>
          </fieldset>

          {method === "mpesa" ? (
            <Field id="w-phone" label="M-Pesa number" error={err("mpesa_phone")}>
              <Input
                {...aria("w-phone", err("mpesa_phone"))}
                type="tel"
                inputMode="tel"
                {...register("mpesa_phone")}
              />
            </Field>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="w-bank" label="Bank" error={err("bank_name")}>
                <Input
                  {...aria("w-bank", err("bank_name"))}
                  placeholder="e.g. KCB"
                  {...register("bank_name")}
                />
              </Field>
              <Field id="w-accnum" label="Account number" error={err("account_number")}>
                <Input
                  {...aria("w-accnum", err("account_number"))}
                  inputMode="numeric"
                  {...register("account_number")}
                />
              </Field>
              <Field
                id="w-accname"
                label="Account name"
                error={err("account_name")}
                className="sm:col-span-2"
              >
                <Input {...aria("w-accname", err("account_name"))} {...register("account_name")} />
              </Field>
            </div>
          )}

          <Field
            id="w-pw"
            label="Your password"
            error={err("password")}
            hint="Confirms it's really you."
          >
            <Input
              {...aria("w-pw", err("password"), true)}
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
          </Field>

          <FormAlert message={formError} />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={m.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={m.isPending}>
              {m.isPending ? <Spinner /> : <Building2 />} Request withdrawal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
