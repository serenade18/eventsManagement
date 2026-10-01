import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState, PageHeader } from "@/components/common/states";
import { IntegrationCard, INTEGRATIONS_KEY } from "@/components/admin/integration-card";
import { listIntegrations } from "@/lib/api/endpoints";
import { PROVIDERS } from "@/lib/integrations";
import { useTitle } from "@/hooks/use-title";

export default function IntegrationsPage() {
  useTitle("Integrations");
  const q = useQuery({
    queryKey: INTEGRATIONS_KEY,
    queryFn: listIntegrations,
    // Never keep credential metadata around longer than the page is open.
    gcTime: 0,
  });

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Integrations"
        description="Payment and SMS provider credentials used by MyEvents."
      />
      <div className="mb-6 flex gap-3 rounded-xl border border-info/30 bg-info-soft p-4 text-sm text-info">
        <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
        <p>
          Keys are sent straight to the MyEvents server and stored there. Once saved, a secret is
          never shown again: only its last 4 characters. Every change needs your password and is
          recorded with your name.
        </p>
      </div>

      {q.isPending ? (
        <div className="space-y-4">
          {PROVIDERS.map((p) => (
            <Skeleton key={p.id} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        (["Payments", "Messaging"] as const).map((cat) => (
          <div key={cat} className="mb-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {cat}
            </h2>
            <div className="space-y-4">
              {PROVIDERS.filter((p) => p.category === cat).map((p) => {
                const data = q.data.find((i) => i.provider === p.id);
                return (
                  <IntegrationCard
                    key={`${p.id}-${data?.updated_at ?? "new"}`}
                    def={p}
                    data={data}
                  />
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
