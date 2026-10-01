import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  KeyRound,
  PlugZap,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { aria, Field, Spinner } from "@/components/common/states";
import { PasswordConfirm } from "./password-confirm";
import { ApiError, errorMessage } from "@/lib/api/client";
import { testIntegration, updateIntegration } from "@/lib/api/endpoints";
import type { Integration, IntegrationTestResult } from "@/lib/api/types";
import { dateTime } from "@/lib/format";
import type { FieldDef, ProviderDef } from "@/lib/integrations";
import { cn } from "@/lib/utils";

export const INTEGRATIONS_KEY = ["integrations"] as const;

function initialValues(def: ProviderDef, data: Integration | undefined) {
  const out: Record<string, string> = {};
  for (const f of def.fields)
    if (!f.secret) out[f.name] = data?.fields[f.name]?.value ?? f.options?.[0]?.value ?? "";
  return out;
}

export function IntegrationCard({
  def,
  data,
}: {
  def: ProviderDef;
  data: Integration | undefined;
}) {
  const qc = useQueryClient();
  const base = useMemo(() => initialValues(def, data), [def, data]);
  const [values, setValues] = useState(base);
  // Secrets the admin chose to replace. Absent = keep the stored one.
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [enabled, setEnabled] = useState(data?.enabled ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState<IntegrationTestResult | null>(null);

  const isSet = (f: FieldDef) =>
    f.secret ? !!secrets[f.name] || !!data?.fields[f.name]?.configured : !!values[f.name]?.trim();
  const missing = def.fields.filter((f) => f.required && !isSet(f));
  const complete = missing.length === 0;

  const changed: Record<string, string> = {};
  for (const f of def.fields) {
    if (f.secret) {
      const v = secrets[f.name]?.trim();
      if (v) changed[f.name] = v;
    } else if ((values[f.name] ?? "") !== (base[f.name] ?? "")) {
      changed[f.name] = values[f.name]!.trim();
    }
  }
  const enabledChanged = enabled !== (data?.enabled ?? false);
  const dirty = Object.keys(changed).length > 0 || enabledChanged;

  const status =
    !data || !def.fields.some((f) => data.fields[f.name]?.configured)
      ? { label: "Not set up", variant: "secondary" as const, Icon: CircleDashed }
      : data.enabled
        ? { label: "Active", variant: "success" as const, Icon: CheckCircle2 }
        : { label: "Disabled", variant: "warning" as const, Icon: XCircle };

  const validate = () => {
    const errs: Record<string, string> = {};
    for (const f of def.fields) {
      const v = f.secret ? secrets[f.name]?.trim() : values[f.name]?.trim();
      if (v && f.check) {
        const m = f.check(v);
        if (m) errs[f.name] = m;
      }
      if (enabled && f.required && !isSet(f))
        errs[f.name] = `${f.label} is required to turn this on`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const reset = () => {
    setValues(base);
    setSecrets({});
    setEnabled(data?.enabled ?? false);
    setErrors({});
  };

  const save = async (password: string) => {
    let updated: Integration;
    try {
      updated = await updateIntegration(def.id, {
        password,
        ...(enabledChanged ? { enabled } : {}),
        ...(Object.keys(changed).length ? { fields: changed } : {}),
      });
    } catch (e) {
      // Field problems belong next to the fields; anything else stays in the dialog.
      if (e instanceof ApiError && Object.keys(e.fieldErrors).length) {
        setErrors(
          Object.fromEntries(Object.entries(e.fieldErrors).map(([k, v]) => [k, v[0] ?? ""])),
        );
        toast.error("Some fields need attention");
        return;
      }
      throw e;
    }
    qc.setQueryData<Integration[]>(INTEGRATIONS_KEY, (old) =>
      old ? old.map((i) => (i.provider === def.id ? updated : i)) : [updated],
    );
    setSecrets({});
    setValues(initialValues(def, updated));
    setEnabled(updated.enabled);
    setTest(null);
    toast.success(`${def.name} saved`);
  };

  const runTest = async () => {
    setTesting(true);
    setTest(null);
    try {
      setTest(await testIntegration(def.id));
    } catch (e) {
      setTest({ ok: false, message: errorMessage(e) });
    } finally {
      setTesting(false);
    }
  };

  const switchId = `${def.id}-enabled`;

  return (
    <section
      aria-labelledby={`${def.id}-title`}
      className="rounded-xl border border-border bg-surface"
    >
      <header className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={`${def.id}-title`} className="text-lg font-semibold">
              {def.name}
            </h2>
            <Badge variant={status.variant}>
              <status.Icon aria-hidden /> {status.label}
            </Badge>
            {!def.live && <Badge variant="info">Not used by checkout yet</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{def.description}</p>
          {data?.updated_at && (
            <p className="mt-1 text-xs text-muted-foreground">
              Last changed {dateTime(data.updated_at)}
              {data.updated_by ? ` by ${data.updated_by}` : ""}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <label htmlFor={switchId} className="text-sm font-medium">
            {enabled ? "On" : "Off"}
          </label>
          <Switch
            id={switchId}
            checked={enabled}
            onCheckedChange={setEnabled}
            aria-label={`Use ${def.name}`}
          />
        </div>
      </header>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (dirty && validate()) setConfirming(true);
        }}
        className="p-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {def.fields.map((f) => {
            const id = `${def.id}-${f.name}`;
            const err = errors[f.name];
            if (f.secret)
              return (
                <SecretField
                  key={f.name}
                  id={id}
                  def={f}
                  stored={data?.fields[f.name]}
                  value={secrets[f.name]}
                  error={err}
                  onChange={(v) =>
                    setSecrets((s) => {
                      const next = { ...s };
                      if (v === undefined) delete next[f.name];
                      else next[f.name] = v;
                      return next;
                    })
                  }
                />
              );
            return (
              <Field
                key={f.name}
                id={id}
                label={f.label}
                optional={!f.required}
                error={err}
                hint={f.hint}
                className={f.kind === "url" ? "sm:col-span-2" : ""}
              >
                {f.kind === "select" ? (
                  <Select
                    value={values[f.name] ?? ""}
                    onValueChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))}
                  >
                    <SelectTrigger {...aria(id, err, !!f.hint)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options?.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    {...aria(id, err, !!f.hint)}
                    type={f.kind === "url" ? "url" : "text"}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={f.placeholder}
                    value={values[f.name] ?? ""}
                    onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))}
                  />
                )}
              </Field>
            );
          })}
        </div>

        {enabled && !complete && (
          <p className="mt-4 text-sm text-warning">
            Still needed before this can run: {missing.map((f) => f.label).join(", ")}.
          </p>
        )}

        {test && (
          <p
            role="status"
            className={cn(
              "mt-4 flex items-start gap-2 rounded-lg px-3 py-2 text-sm",
              test.ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
            )}
          >
            {test.ok ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            ) : (
              <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            )}
            {test.message}
          </p>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={runTest}
              disabled={testing || dirty || !complete}
              title={dirty ? "Save your changes first" : undefined}
            >
              {testing ? <Spinner /> : <PlugZap />} Test connection
            </Button>
            <Button asChild type="button" variant="ghost">
              <a href={def.docs} target="_blank" rel="noreferrer">
                <ExternalLink /> Provider dashboard
              </a>
            </Button>
          </div>
          <div className="flex gap-2">
            {dirty && (
              <Button type="button" variant="ghost" onClick={reset}>
                <RotateCcw /> Discard
              </Button>
            )}
            <Button type="submit" disabled={!dirty}>
              Save changes
            </Button>
          </div>
        </div>
      </form>

      <PasswordConfirm
        open={confirming}
        onOpenChange={setConfirming}
        title={`Save ${def.name} settings?`}
        description="Changing payment or SMS credentials affects live sales. Confirm it's you."
        onConfirm={save}
      />
    </section>
  );
}

/** Write-only secret: shows "saved, ends in 1234" and only reveals an input to replace it. */
function SecretField({
  id,
  def,
  stored,
  value,
  error,
  onChange,
}: {
  id: string;
  def: FieldDef;
  stored: Integration["fields"][string] | undefined;
  value: string | undefined;
  error: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  const editing = value !== undefined || !stored?.configured;
  return (
    <Field id={id} label={def.label} optional={!def.required} error={error} hint={def.hint}>
      {editing ? (
        <div className="flex gap-2">
          <Input
            {...aria(id, error, !!def.hint)}
            type="password"
            autoComplete="new-password"
            spellCheck={false}
            placeholder={stored?.configured ? "Enter a new value" : def.placeholder}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="font-mono"
          />
          {stored?.configured && (
            <Button type="button" variant="ghost" onClick={() => onChange(undefined)}>
              Keep
            </Button>
          )}
        </div>
      ) : (
        <div className="flex h-11 items-center justify-between gap-2 rounded-md border border-input bg-muted/50 px-3 sm:h-10">
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <KeyRound className="size-4 shrink-0 text-success" aria-hidden />
            <span className="truncate">
              Saved
              {stored?.last4 && (
                <>
                  {" · ends in "}
                  <span className="font-mono">{stored.last4}</span>
                </>
              )}
            </span>
          </span>
          <Button
            type="button"
            variant="link"
            className="shrink-0"
            onClick={() => onChange("")}
            aria-label={`Replace ${def.label}`}
          >
            Replace
          </Button>
        </div>
      )}
    </Field>
  );
}
