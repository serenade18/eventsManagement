import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useFieldArray, useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ImagePlus, Lock, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  aria,
  ErrorState,
  Field,
  FormAlert,
  PageHeader,
  Spinner,
} from "@/components/common/states";
import { ApiError, errorMessage } from "@/lib/api/client";
import { createEvent, listMyEvents, updateEvent } from "@/lib/api/endpoints";
import { myEventQuery, qk, ticketsQuery } from "@/lib/api/queries";
import type { Event } from "@/lib/api/types";
import { eventsLabel, useAuth } from "@/lib/auth";
import { fromNairobiInput, money, todayNairobi, toNairobiInput } from "@/lib/format";
import { eventSchema, POSTER_TYPES, type EventValues, type TierValues } from "@/lib/schemas";
import { useTitle } from "@/hooks/use-title";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Music",
  "Festival",
  "Tech",
  "Arts",
  "Comedy",
  "Sports",
  "Business",
  "Food & Drink",
  "Church",
  "Community",
];
const TIERS_REPLACE_REFUSED = "Ticket types that already have orders cannot be replaced";

const blankTier = (eventStart?: string): TierValues => ({
  name: "",
  description: "",
  price: "",
  quantity: "",
  sales_start: toNairobiInput(new Date().toISOString()),
  sales_end: eventStart ?? "",
});

export default function EventFormPage() {
  const { id } = useParams();
  const editing = !!id;
  useTitle(editing ? "Edit event" : "Create event");
  const ev = useQuery({ ...myEventQuery(id ?? ""), enabled: editing });
  // Tier editing locks after the first sale (backend gap #7). Tickets only exist for paid orders.
  const tix = useQuery({ ...ticketsQuery(), enabled: editing });

  if (editing && (ev.isPending || tix.isPending))
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  if (editing && ev.isError) return <ErrorState error={ev.error} onRetry={() => ev.refetch()} />;

  const event = ev.data;
  const hasSales = !!event && !!tix.data?.some((t) => t.ticket_type_details.event === event.id);
  return <EventForm key={event?.id ?? "new"} event={event} hasSales={hasSales} />;
}

function toValues(e: Event | undefined, hasSales: boolean): EventValues {
  if (!e)
    return {
      title: "",
      category: "",
      description: "",
      venue: "",
      date: "",
      time: "",
      poster: null,
      is_open: true,
      is_free: false,
      is_feature: false,
      tiersLocked: false,
      tiers: [blankTier()],
    };
  return {
    title: e.title,
    category: e.category,
    description: e.description,
    venue: e.venue,
    date: e.date,
    time: e.time.slice(0, 5),
    poster: null,
    is_open: e.is_open,
    is_free: e.is_free,
    is_feature: e.is_feature,
    tiersLocked: hasSales,
    tiers: e.ticket_types.map((t) => ({
      name: t.name,
      description: t.description ?? "",
      price: String(Number(t.price)),
      quantity: String(t.quantity),
      sales_start: toNairobiInput(t.sales_start),
      sales_end: toNairobiInput(t.sales_end),
    })),
  };
}

function EventForm({ event, hasSales }: { event: Event | undefined; hasSales: boolean }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.user_type === "admin";
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EventValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: toValues(event, hasSales),
  });
  const tiers = useFieldArray({ control, name: "tiers" });
  const [date, time, isFree, locked] = watch(["date", "time", "is_free", "tiersLocked"]);
  const eventStart = date && time ? `${date}T${time}` : undefined;

  const onSubmit = async (v: EventValues) => {
    setFormError(null);
    const fd = new FormData();
    fd.append("title", v.title);
    fd.append("category", v.category);
    fd.append("description", v.description);
    fd.append("venue", v.venue);
    fd.append("date", v.date);
    fd.append("time", v.time);
    fd.append("is_open", String(v.is_open));
    fd.append("is_free", String(v.is_free));
    if (isAdmin) fd.append("is_feature", String(v.is_feature));
    if (v.poster) fd.append("poster", v.poster);
    // Sending ticket_type replaces every tier, so omit it once sales exist.
    if (!v.tiersLocked)
      fd.append(
        "ticket_type",
        JSON.stringify(
          v.tiers.map((t) => ({
            name: t.name,
            description: t.description,
            price: v.is_free ? "0" : t.price,
            quantity: Number(t.quantity),
            sales_start: fromNairobiInput(t.sales_start),
            sales_end: fromNairobiInput(t.sales_end),
          })),
        ),
      );
    try {
      let targetId = event?.id;
      if (event) {
        await updateEvent(event.id, fd);
      } else {
        await createEvent(fd);
        // Create doesn't return the new event (backend gap #5): refetch and take the newest.
        const mine = await listMyEvents();
        qc.setQueryData(qk.myEvents, mine);
        targetId = mine.reduce((max, e) => (e.id > max ? e.id : max), 0) || undefined;
      }
      toast.success(event ? "Event updated" : "Event created");
      void qc.invalidateQueries({ queryKey: qk.myEvents });
      void qc.invalidateQueries({ queryKey: qk.publicEvents });
      void qc.invalidateQueries({ queryKey: qk.dashboard });
      navigate(targetId ? `/console/events/${targetId}` : "/console/events");
    } catch (e) {
      if (!(e instanceof ApiError)) return setFormError(errorMessage(e));
      if (e.message === TIERS_REPLACE_REFUSED) {
        setValue("tiersLocked", true);
        setFormError(
          "This event already has orders, so its ticket tiers are now locked. Save again to update the other details.",
        );
        return;
      }
      let mapped = false;
      for (const [k, msgs] of Object.entries(e.fieldErrors)) {
        const m = msgs[0];
        if (!m) continue;
        setError(k as keyof EventValues, { message: m });
        mapped = true;
      }
      setFormError(mapped ? "Please fix the highlighted fields" : e.message);
    }
  };

  const err = (k: keyof EventValues) => (errors[k] as { message?: string } | undefined)?.message;

  return (
    <div className="max-w-3xl">
      <Link
        to={event ? `/console/events/${event.id}` : "/console/events"}
        className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />{" "}
        {event ? "Back to event" : eventsLabel(user?.user_type)}
      </Link>
      <PageHeader title={event ? "Edit event" : "Create event"} />
      <form
        onSubmit={handleSubmit(onSubmit, () => setFormError("Please fix the highlighted fields"))}
        noValidate
        className="space-y-6"
      >
        <Card title="Event details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="title" label="Title" error={err("title")} className="sm:col-span-2">
              <Input {...aria("title", err("title"))} {...register("title")} />
            </Field>
            <Field
              id="category"
              label="Category"
              error={err("category")}
              hint="Pick one or type your own."
            >
              <Input
                {...aria("category", err("category"), true)}
                list="categories"
                autoComplete="off"
                {...register("category")}
              />
              <datalist id="categories">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field id="venue" label="Venue" error={err("venue")}>
              <Input {...aria("venue", err("venue"))} {...register("venue")} />
            </Field>
            <Field
              id="date"
              label="Date"
              error={err("date")}
              hint={date && date < todayNairobi() ? "This date is in the past." : undefined}
            >
              <Input {...aria("date", err("date"), true)} type="date" {...register("date")} />
            </Field>
            <Field id="time" label="Start time" error={err("time")}>
              <Input {...aria("time", err("time"))} type="time" {...register("time")} />
            </Field>
            <Field
              id="description"
              label="Description"
              error={err("description")}
              className="sm:col-span-2"
            >
              <Textarea
                {...aria("description", err("description"))}
                rows={5}
                {...register("description")}
              />
            </Field>
          </div>
        </Card>

        <Card title="Poster">
          <Controller
            control={control}
            name="poster"
            render={({ field }) => (
              <PosterUpload
                file={field.value}
                existing={event?.poster ?? null}
                onChange={field.onChange}
                error={err("poster")}
              />
            )}
          />
        </Card>

        <Card title="Settings">
          <div className="divide-y divide-border">
            <Toggle
              control={control}
              name="is_open"
              label="On sale"
              desc="Buyers can purchase tickets."
            />
            <Toggle
              control={control}
              name="is_free"
              label="Free event"
              desc="All tiers are free (price 0)."
            />
            {isAdmin && (
              <Toggle
                control={control}
                name="is_feature"
                label="Featured"
                desc="Show on the home page Featured section."
              />
            )}
          </div>
        </Card>

        <Card
          title="Ticket tiers"
          action={
            !locked && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => tiers.append(blankTier(eventStart))}
              >
                <Plus /> Add tier
              </Button>
            )
          }
        >
          {locked ? (
            <LockedTiers tiers={event?.ticket_types ?? []} />
          ) : (
            <div className="space-y-4">
              {tiers.fields.map((f, i) => (
                <TierEditor
                  key={f.id}
                  i={i}
                  register={register}
                  errors={errors.tiers?.[i]}
                  isFree={isFree}
                  canRemove={tiers.fields.length > 1}
                  onRemove={() => tiers.remove(i)}
                />
              ))}
              {errors.tiers?.root?.message || errors.tiers?.message ? (
                <p className="text-sm font-medium text-danger">
                  {errors.tiers?.root?.message ?? errors.tiers?.message}
                </p>
              ) : null}
            </div>
          )}
        </Card>

        <FormAlert message={formError} />
        <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner />} {event ? "Save changes" : "Create event"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Toggle({
  control,
  name,
  label,
  desc,
}: {
  control: ReturnType<typeof useForm<EventValues>>["control"];
  name: "is_open" | "is_free" | "is_feature";
  label: string;
  desc: string;
}) {
  const id = `toggle-${name}`;
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div>
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        <p id={`${id}-desc`} className="text-sm text-muted-foreground">
          {desc}
        </p>
      </div>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Switch
            id={id}
            aria-describedby={`${id}-desc`}
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />
    </div>
  );
}

function TierEditor({
  i,
  register,
  errors,
  isFree,
  canRemove,
  onRemove,
}: {
  i: number;
  register: ReturnType<typeof useForm<EventValues>>["register"];
  errors: FieldErrors<TierValues> | undefined;
  isFree: boolean;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const id = (k: string) => `tiers-${i}-${k}`;
  const e = (k: keyof TierValues) => errors?.[k]?.message;
  return (
    <fieldset className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <legend className="text-sm font-semibold">Tier {i + 1}</legend>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-danger hover:text-danger"
            onClick={onRemove}
            aria-label={`Remove tier ${i + 1}`}
          >
            <Trash2 /> Remove
          </Button>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={id("name")} label="Name" error={e("name")}>
          <Input
            {...aria(id("name"), e("name"))}
            placeholder="Regular, VIP…"
            {...register(`tiers.${i}.name`)}
          />
        </Field>
        <Field id={id("description")} label="Description" optional error={e("description")}>
          <Input
            {...aria(id("description"), e("description"))}
            {...register(`tiers.${i}.description`)}
          />
        </Field>
        <Field
          id={id("price")}
          label="Price (KES)"
          error={e("price")}
          hint={isFree ? "Free event: sent as 0." : "0 for free."}
        >
          <Input
            {...aria(id("price"), e("price"), true)}
            inputMode="decimal"
            disabled={isFree}
            {...register(`tiers.${i}.price`)}
          />
        </Field>
        <Field id={id("quantity")} label="Capacity" error={e("quantity")}>
          <Input
            {...aria(id("quantity"), e("quantity"))}
            inputMode="numeric"
            {...register(`tiers.${i}.quantity`)}
          />
        </Field>
        <Field
          id={id("sales_start")}
          label="Sales start"
          error={e("sales_start")}
          hint="Nairobi time"
        >
          <Input
            {...aria(id("sales_start"), e("sales_start"), true)}
            type="datetime-local"
            {...register(`tiers.${i}.sales_start`)}
          />
        </Field>
        <Field
          id={id("sales_end")}
          label="Sales end"
          error={e("sales_end")}
          hint="No later than the event start"
        >
          <Input
            {...aria(id("sales_end"), e("sales_end"), true)}
            type="datetime-local"
            {...register(`tiers.${i}.sales_end`)}
          />
        </Field>
      </div>
    </fieldset>
  );
}

function LockedTiers({ tiers }: { tiers: Event["ticket_types"] }) {
  return (
    <div>
      <p className="mb-4 flex gap-2 rounded-lg bg-info-soft px-3 py-2.5 text-sm text-info">
        <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
        Tickets have been sold, so tiers can't be changed. You can still edit the other details.
      </p>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {tiers.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span>
              <span className="font-medium">{t.name}</span>
              {t.description && <span className="text-muted-foreground"> · {t.description}</span>}
            </span>
            <span className="shrink-0 tabular">
              {money(t.price)} · {t.quantity} cap.
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PosterUpload({
  file,
  existing,
  onChange,
  error,
}: {
  file: File | null;
  existing: string | null;
  onChange: (f: File | null) => void;
  error?: string | undefined;
}) {
  const input = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);
  const shown = preview ?? existing;
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div
        className={cn(
          "relative grid aspect-[4/3] w-full shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-border bg-muted sm:w-56",
          error && "border-danger",
        )}
      >
        {shown ? (
          <img
            src={shown}
            alt="Poster preview"
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <ImagePlus className="size-8 text-muted-foreground" aria-hidden />
        )}
      </div>
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">JPG, PNG or WebP, up to 5 MB.</p>
        {file && <p className="truncate font-medium">{file.name}</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => input.current?.click()}>
            <ImagePlus /> {shown ? "Replace poster" : "Upload poster"}
          </Button>
          {file && (
            <Button type="button" variant="ghost" onClick={() => onChange(null)}>
              <X /> Remove
            </Button>
          )}
        </div>
        <input
          ref={input}
          id="poster"
          type="file"
          accept={POSTER_TYPES.join(",")}
          className="sr-only"
          aria-label="Poster image"
          onChange={(e) => {
            onChange(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
        {error && <p className="font-medium text-danger">{error}</p>}
      </div>
    </div>
  );
}
