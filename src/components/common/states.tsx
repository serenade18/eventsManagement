import type { ReactNode } from "react";
import { AlertTriangle, Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 grid size-12 place-items-center rounded-full bg-brand-soft text-brand [&_svg]:size-6">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  title = "We couldn't load this",
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-danger/30 bg-danger-soft/50 px-6 py-10 text-center",
        className,
      )}
    >
      <AlertTriangle className="mb-3 size-7 text-danger" aria-hidden />
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          <RotateCw /> Retry
        </Button>
      )}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-sm font-medium text-muted-foreground">{eyebrow}</div>}
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return <Loader2 className={cn("size-4 animate-spin", className)} aria-label={label} />;
}

/** Labelled form field with helper text and an error tied to the control via aria-describedby. */
export function Field({
  id,
  label,
  error,
  hint,
  optional,
  children,
  className,
}: {
  id: string;
  label: ReactNode;
  error?: string | undefined;
  hint?: ReactNode;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Spread onto an input inside <Field> to wire up accessibility attributes. */
export function aria(id: string, error?: string, hint?: boolean) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  } as const;
}

export function FormAlert({ message }: { message?: string | null | undefined }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex gap-2 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
