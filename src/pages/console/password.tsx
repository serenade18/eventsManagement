import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aria, Field, FormAlert, PageHeader, Spinner } from "@/components/common/states";
import { ApiError, errorMessage } from "@/lib/api/client";
import { changePassword } from "@/lib/api/endpoints";
import { passwordSchema, type PasswordValues } from "@/lib/schemas";
import { useTitle } from "@/hooks/use-title";

export default function PasswordPage() {
  useTitle("Change password");
  const [msg, setMsg] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: "", new_password: "", confirm: "" },
  });

  const onSubmit = async (v: PasswordValues) => {
    setMsg(null);
    try {
      await changePassword(v.current_password, v.new_password);
      reset();
      toast.success("Password updated");
    } catch (e) {
      if (e instanceof ApiError && /current password/i.test(e.message))
        setError("current_password", { message: e.message });
      else
        setMsg(
          e instanceof ApiError
            ? (e.fieldErrors["new_password"]?.[0] ?? e.message)
            : errorMessage(e),
        );
    }
  };
  const err = (k: keyof PasswordValues) => errors[k]?.message;

  return (
    <div className="max-w-md">
      <PageHeader title="Change password" />
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-4 rounded-xl border border-border bg-surface p-5"
      >
        <Field id="current_password" label="Current password" error={err("current_password")}>
          <Input
            {...aria("current_password", err("current_password"))}
            type="password"
            autoComplete="current-password"
            {...register("current_password")}
          />
        </Field>
        <Field
          id="new_password"
          label="New password"
          error={err("new_password")}
          hint="At least 8 characters, not only numbers, and different from your current password."
        >
          <Input
            {...aria("new_password", err("new_password"), true)}
            type="password"
            autoComplete="new-password"
            {...register("new_password")}
          />
        </Field>
        <Field id="confirm" label="Confirm new password" error={err("confirm")}>
          <Input
            {...aria("confirm", err("confirm"))}
            type="password"
            autoComplete="new-password"
            {...register("confirm")}
          />
        </Field>
        <FormAlert message={msg} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Spinner />} Update password
        </Button>
      </form>
    </div>
  );
}
