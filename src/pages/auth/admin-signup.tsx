import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aria, Field, FormAlert, Spinner } from "@/components/common/states";
import { NarrowPage } from "@/components/layout/public-layout";
import { ApiError, errorMessage } from "@/lib/api/client";
import { adminSignup } from "@/lib/api/endpoints";
import { homeFor, useAuth } from "@/lib/auth";
import { adminSignupSchema, type AdminSignupValues } from "@/lib/schemas";
import { useTitle } from "@/hooks/use-title";

/** Keep this page out of search results. It's linked from nowhere. */
function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
}

/**
 * Admin account creation, gated by the backend's ADMIN_SIGNUP_CODE.
 * The unlisted URL is a convenience; the code is what protects it.
 */
export default function AdminSignupPage() {
  useTitle("Admin access");
  useNoIndex();
  const { status, user, login } = useAuth();
  const navigate = useNavigate();
  const [msg, setMsg] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AdminSignupValues>({
    resolver: zodResolver(adminSignupSchema),
    defaultValues: { code: "", name: "", email: "", phone: "", password: "", confirm: "" },
  });

  if (status === "authed" && !isSubmitting) return <Navigate to={homeFor(user)} replace />;

  const onSubmit = async (v: AdminSignupValues) => {
    setMsg(null);
    try {
      await adminSignup({
        code: v.code,
        email: v.email,
        name: v.name,
        phone: v.phone,
        password: v.password,
      });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return setUnavailable(true);
      if (e instanceof ApiError && e.status === 403)
        return setError("code", { message: "That code isn't valid" });
      if (e instanceof ApiError && e.status === 429)
        return setMsg("Too many attempts. Wait a while before trying again.");
      if (e instanceof ApiError && Object.keys(e.fieldErrors).length) {
        for (const k of ["name", "email", "phone", "password"] as const) {
          const m = e.fieldErrors[k]?.[0];
          if (m) setError(k, { message: m });
        }
        return setMsg("Please fix the highlighted fields");
      }
      return setMsg(errorMessage(e));
    }
    try {
      await login(v.email, v.password);
      navigate("/console", { replace: true });
    } catch {
      navigate("/login", { replace: true });
    }
  };

  const err = (k: keyof AdminSignupValues) => errors[k]?.message;

  if (unavailable)
    return (
      <NarrowPage className="max-w-md">
        <div className="rounded-2xl border border-border bg-surface p-6 text-center sm:p-8">
          <h1 className="text-xl font-bold">Admin signup isn't available</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ask an existing admin to set it up, or sign in if you already have an account.
          </p>
          <Button className="mt-5" onClick={() => navigate("/login")}>
            Go to sign in
          </Button>
        </div>
      </NarrowPage>
    );

  return (
    <NarrowPage className="max-w-md">
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <span className="mb-4 grid size-11 place-items-center rounded-full bg-brand-soft text-brand">
          <ShieldCheck className="size-5" aria-hidden />
        </span>
        <h1 className="text-2xl font-bold">Create an admin account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You need the signup code from your HostMe administrator.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
          <Field id="code" label="Signup code" error={err("code")}>
            <Input
              {...aria("code", err("code"))}
              type="password"
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
              {...register("code")}
            />
          </Field>
          <Field id="name" label="Name" error={err("name")}>
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
            id="password"
            label="Password"
            error={err("password")}
            hint="At least 10 characters. Admins control payments, so make it strong."
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
          <FormAlert message={msg} />
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Spinner />} Create admin account
          </Button>
        </form>
      </div>
    </NarrowPage>
  );
}
