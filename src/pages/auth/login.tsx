import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aria, Field, FormAlert, Spinner } from "@/components/common/states";
import { NarrowPage } from "@/components/layout/public-layout";
import { ApiError, errorMessage, USE_MOCKS } from "@/lib/api/client";
import { homeFor, safeNext, useAuth } from "@/lib/auth";
import { loginSchema, type LoginValues } from "@/lib/schemas";
import { useTitle } from "@/hooks/use-title";

export default function LoginPage() {
  useTitle("Log in");
  const { status, user, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const [msg, setMsg] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (status === "authed" && !isSubmitting) return <Navigate to={next ?? homeFor(user)} replace />;

  const onSubmit = async (v: LoginValues) => {
    setMsg(null);
    try {
      const u = await login(v.email, v.password);
      navigate(next ?? homeFor(u), { replace: true });
    } catch (e) {
      setMsg(
        e instanceof ApiError && e.status === 401
          ? "Email or password is incorrect"
          : errorMessage(e),
      );
    }
  };

  return (
    <NarrowPage className="max-w-md">
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Log in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your events and track ticket sales.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
          <Field id="email" label="Email" error={errors.email?.message}>
            <Input
              {...aria("email", errors.email?.message)}
              type="email"
              autoComplete="email"
              inputMode="email"
              {...register("email")}
            />
          </Field>
          <Field id="password" label="Password" error={errors.password?.message}>
            <Input
              {...aria("password", errors.password?.message)}
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
          </Field>
          <FormAlert message={msg} />
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Spinner />} Log in
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to HostMe?{" "}
          <Link to="/register" className="font-medium text-brand hover:underline">
            Create an account
          </Link>
        </p>
      </div>
      {USE_MOCKS && (
        <div className="mt-4 rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Demo accounts</p>
          <p className="mt-1">Organizer: org@hostme.co.ke / organizer1</p>
          <p>Admin: admin@hostme.co.ke / admin1234</p>
          <p>Sponsor: sponsor@hostme.co.ke / sponsor12</p>
        </div>
      )}
    </NarrowPage>
  );
}
