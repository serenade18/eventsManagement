import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { aria, Field, FormAlert, PageHeader, Spinner } from "@/components/common/states";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ApiError, errorMessage } from "@/lib/api/client";
import { deleteMe, updateMe } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth";
import { profileSchema, type ProfileValues } from "@/lib/schemas";
import { shortDate } from "@/lib/format";
import { useTitle } from "@/hooks/use-title";

export default function ProfilePage() {
  useTitle("Profile");
  const { user, setUser, logout } = useAuth();
  const [msg, setMsg] = useState<string | null>(null);
  const [delOpen, setDelOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      organization: user?.organization ?? "",
      country: user?.country ?? "",
      city: user?.city ?? "",
      bio: user?.bio ?? "",
    },
  });
  if (!user) return null;

  const onSubmit = async (v: ProfileValues) => {
    setMsg(null);
    try {
      const u = await updateMe({
        name: v.name,
        phone: v.phone,
        organization: v.organization || null,
        country: v.country || null,
        city: v.city || null,
        bio: v.bio || null,
      });
      setUser(u);
      reset(v);
      toast.success("Profile saved");
    } catch (e) {
      if (e instanceof ApiError) {
        for (const k of ["name", "phone", "organization", "country", "city", "bio"] as const) {
          const m = e.fieldErrors[k]?.[0];
          if (m) setError(k, { message: m });
        }
        setMsg(e.message);
      } else setMsg(errorMessage(e));
    }
  };
  const err = (k: keyof ProfileValues) => errors[k]?.message;
  const confirmWord = "DELETE";

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Profile"
        description={`${user.user_type[0]!.toUpperCase()}${user.user_type.slice(1)} account${user.added_on ? ` · joined ${shortDate(user.added_on)}` : ""}`}
      />
      {user.user_type === "sponsor" && (
        <p className="mb-6 rounded-lg bg-info-soft px-4 py-3 text-sm text-info">
          Sponsor accounts can manage their profile for now. Organizers can list you as a sponsor on
          their events.
        </p>
      )}
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-5 rounded-xl border border-border bg-surface p-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="email" label="Email" hint="Email can't be changed." className="sm:col-span-2">
            <Input {...aria("email", undefined, true)} value={user.email} readOnly disabled />
          </Field>
          <Field id="name" label="Name" error={err("name")}>
            <Input {...aria("name", err("name"))} autoComplete="name" {...register("name")} />
          </Field>
          <Field id="phone" label="Phone" error={err("phone")}>
            <Input
              {...aria("phone", err("phone"))}
              type="tel"
              autoComplete="tel"
              {...register("phone")}
            />
          </Field>
          <Field
            id="organization"
            label="Organization"
            optional
            error={err("organization")}
            className="sm:col-span-2"
          >
            <Input {...aria("organization", err("organization"))} {...register("organization")} />
          </Field>
          <Field id="country" label="Country" optional error={err("country")}>
            <Input
              {...aria("country", err("country"))}
              autoComplete="country-name"
              {...register("country")}
            />
          </Field>
          <Field id="city" label="City" optional error={err("city")}>
            <Input
              {...aria("city", err("city"))}
              autoComplete="address-level2"
              {...register("city")}
            />
          </Field>
          <Field id="bio" label="Bio" optional error={err("bio")} className="sm:col-span-2">
            <Textarea {...aria("bio", err("bio"))} rows={4} {...register("bio")} />
          </Field>
        </div>
        <FormAlert message={msg} />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Spinner />} Save changes
          </Button>
        </div>
      </form>

      <section aria-labelledby="danger" className="mt-8 rounded-xl border border-danger/40 p-5">
        <h2 id="danger" className="text-lg font-semibold text-danger">
          Danger zone
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Deleting your account is permanent and signs you out.
        </p>
        <Button variant="destructive" className="mt-4" onClick={() => setDelOpen(true)}>
          Delete account
        </Button>
      </section>

      <ConfirmDialog
        open={delOpen}
        onOpenChange={(o) => {
          setDelOpen(o);
          if (!o) setTyped("");
        }}
        title="Delete your account?"
        description={`This can't be undone. Type ${confirmWord} to confirm.`}
        confirmLabel="Delete account"
        confirmDisabled={typed !== confirmWord}
        onConfirm={async () => {
          await deleteMe();
          toast.success("Account deleted");
          logout();
        }}
      >
        <label htmlFor="confirm-delete" className="sr-only">
          Type {confirmWord} to confirm
        </label>
        <Input
          id="confirm-delete"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          placeholder={confirmWord}
        />
      </ConfirmDialog>
    </div>
  );
}
