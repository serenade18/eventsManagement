import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aria, Field, FormAlert, Spinner } from "@/components/common/states";
import { NarrowPage } from "@/components/layout/public-layout";
import { ApiError, errorMessage } from "@/lib/api/client";
import { register as registerUser } from "@/lib/api/endpoints";
import { homeFor, useAuth } from "@/lib/auth";
import { registerSchema, type RegisterValues } from "@/lib/schemas";
import { useTitle } from "@/hooks/use-title";
import { cn } from "@/lib/utils";

// Never offer "admin" here (backend gap #1).
const TYPES = [
  {
    value: "organizer",
    label: "Organizer",
    desc: "Create events, sell tickets and track sales.",
    Icon: Megaphone,
  },
  { value: "sponsor", label: "Sponsor", desc: "Set up a sponsor profile.", Icon: Building2 },
] as const;

export default function RegisterPage() {
  useTitle("Create an account");
  const { status, user, login } = useAuth();
  const navigate = useNavigate();
  const [msg, setMsg] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      organization: "",
      user_type: "organizer",
      password: "",
      confirm: "",
    },
  });

  if (status === "authed" && !isSubmitting) return <Navigate to={homeFor(user)} replace />;

  const onSubmit = async (v: RegisterValues) => {
    setMsg(null);
    try {
      await registerUser({
        name: v.name,
        email: v.email,
        phone: v.phone,
        user_type: v.user_type,
        password: v.password,
        ...(v.organization ? { organization: v.organization } : {}),
      });
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.fieldErrors).length) {
        const known = ["name", "email", "phone", "organization", "password", "user_type"] as const;
        let shown = false;
        for (const k of known) {
          const m = e.fieldErrors[k]?.[0];
          if (m) {
            setError(k, { message: m });
            shown = true;
          }
        }
        setMsg(shown ? "Please fix the highlighted fields" : e.message);
      } else setMsg(errorMessage(e));
      return;
    }
    try {
      const u = await login(v.email, v.password);
      navigate(homeFor(u), { replace: true });
    } catch {
      navigate("/login", { replace: true });
    }
  };

  const err = (k: keyof RegisterValues) => errors[k]?.message;

  return (
    <NarrowPage>
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Buyers don't need an account. This is for organizers and sponsors.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Account type</legend>
            <Controller
              control={control}
              name="user_type"
              render={({ field }) => (
                <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
                  {TYPES.map(({ value, label, desc, Icon }) => (
                    <label
                      key={value}
                      className={cn(
                        "flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                        field.value === value
                          ? "border-brand bg-brand-soft"
                          : "border-border hover:bg-muted",
                      )}
                    >
                      <input
                        type="radio"
                        name="user_type"
                        value={value}
                        checked={field.value === value}
                        onChange={() => field.onChange(value)}
                        className="sr-only"
                      />
                      <Icon
                        className={cn(
                          "mt-0.5 size-5 shrink-0",
                          field.value === value ? "text-brand" : "text-muted-foreground",
                        )}
                        aria-hidden
                      />
                      <span>
                        <span className="block font-semibold">{label}</span>
                        <span className="block text-sm text-muted-foreground">{desc}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            />
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="name" label="Name" error={err("name")} className="sm:col-span-2">
              <Input {...aria("name", err("name"))} autoComplete="name" {...register("name")} />
            </Field>
            <Field id="email" label="Email" error={err("email")}>
              <Input
                {...aria("email", err("email"))}
                type="email"
                autoComplete="email"
                {...register("email")}
              />
            </Field>
            <Field id="phone" label="Phone" error={err("phone")}>
              <Input
                {...aria("phone", err("phone"))}
                type="tel"
                autoComplete="tel"
                placeholder="0712 345 678"
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
              <Input
                {...aria("organization", err("organization"))}
                autoComplete="organization"
                {...register("organization")}
              />
            </Field>
            <Field
              id="password"
              label="Password"
              error={err("password")}
              hint="At least 8 characters, not only numbers."
            >
              <Input
                {...aria("password", err("password"), true)}
                type="password"
                autoComplete="new-password"
                {...register("password")}
              />
            </Field>
            <Field id="confirm" label="Confirm password" error={err("confirm")}>
              <Input
                {...aria("confirm", err("confirm"))}
                type="password"
                autoComplete="new-password"
                {...register("confirm")}
              />
            </Field>
          </div>
          <FormAlert message={msg} />
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Spinner />} Create account
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </NarrowPage>
  );
}
