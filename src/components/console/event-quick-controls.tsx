import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { errorMessage } from "@/lib/api/client";
import { setEventFlags } from "@/lib/api/endpoints";
import { qk } from "@/lib/api/queries";
import type { Event } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";
import { isPast } from "@/lib/format";

type Flags = Partial<Record<"is_open" | "is_feature", boolean>>;

/**
 * Change "on sale" / "featured" without opening the full edit form.
 * Updates caches optimistically and rolls back if the server refuses.
 */
export function useEventFlags(event: Pick<Event, "id" | "title">) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (flags: Flags) => setEventFlags(event.id, flags),
    onMutate: async (flags) => {
      await qc.cancelQueries({ queryKey: qk.myEvents });
      const prevList = qc.getQueryData<Event[]>(qk.myEvents);
      const prevOne = qc.getQueryData<Event>(qk.myEvent(String(event.id)));
      qc.setQueryData<Event[]>(qk.myEvents, (old) =>
        old?.map((e) => (e.id === event.id ? { ...e, ...flags } : e)),
      );
      qc.setQueryData<Event>(qk.myEvent(String(event.id)), (old) =>
        old ? { ...old, ...flags } : old,
      );
      return { prevList, prevOne };
    },
    onError: (err, _flags, ctx) => {
      qc.setQueryData(qk.myEvents, ctx?.prevList);
      qc.setQueryData(qk.myEvent(String(event.id)), ctx?.prevOne);
      toast.error(errorMessage(err));
    },
    onSuccess: (_d, flags) => {
      if ("is_open" in flags)
        toast.success(
          flags.is_open ? `Sales opened for ${event.title}` : `Sales paused for ${event.title}`,
        );
      if ("is_feature" in flags)
        toast.success(
          flags.is_feature ? `${event.title} is featured` : `${event.title} is no longer featured`,
        );
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: qk.myEvents });
      void qc.invalidateQueries({ queryKey: qk.publicEvents });
      void qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}

export function EventQuickControls({ event }: { event: Event }) {
  const { user } = useAuth();
  const m = useEventFlags(event);
  const past = isPast(event);
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
      <QuickSwitch
        id={`open-${event.id}`}
        label="On sale"
        hint={past ? "Event has ended" : event.is_open ? "Buyers can purchase" : "Sales paused"}
        checked={event.is_open}
        disabled={m.isPending || past}
        onChange={(v) => m.mutate({ is_open: v })}
      />
      {user?.user_type === "admin" && (
        <QuickSwitch
          id={`feature-${event.id}`}
          label="Featured"
          hint={event.is_feature ? "Shown on the home page" : "Not featured"}
          checked={event.is_feature}
          disabled={m.isPending}
          onChange={(v) => m.mutate({ is_feature: v })}
        />
      )}
    </div>
  );
}

function QuickSwitch({
  id,
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        aria-describedby={`${id}-hint`}
      />
      <div className="leading-tight">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      </div>
    </div>
  );
}
