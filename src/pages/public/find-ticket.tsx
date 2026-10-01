import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aria, Field, FormAlert, Spinner } from "@/components/common/states";
import { NarrowPage } from "@/components/layout/public-layout";
import { ApiError, errorMessage } from "@/lib/api/client";
import { getOrder, getTicket } from "@/lib/api/endpoints";
import { lookupSchema } from "@/lib/schemas";
import { useTitle } from "@/hooks/use-title";

type Values = z.infer<typeof lookupSchema>;
const isNotFound = (e: unknown) => e instanceof ApiError && e.status === 404;

export default function FindTicketPage() {
  useTitle("Find my ticket");
  const navigate = useNavigate();
  const [msg, setMsg] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(lookupSchema), defaultValues: { value: "" } });

  const onSubmit = async ({ value }: Values) => {
    setMsg(null);
    // References are generated lowercase; accept what people copy from the uppercase display.
    const candidates = [...new Set([value, value.toLowerCase()])];
    try {
      for (const v of candidates) {
        try {
          const o = await getOrder(v);
          navigate(o.status === "paid" ? `/orders/${o.reference}` : `/orders/${o.reference}/pay`);
          return;
        } catch (e) {
          if (!isNotFound(e)) throw e;
        }
        try {
          const t = await getTicket(v);
          navigate(`/tickets/${t.ticket_number}`);
          return;
        } catch (e) {
          if (!isNotFound(e)) throw e;
        }
      }
      setMsg("We couldn't find a ticket or order with that number. Check your SMS and try again.");
    } catch (e) {
      setMsg(errorMessage(e));
    }
  };

  return (
    <NarrowPage>
      <div className="mb-6 text-center">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-brand-soft text-brand">
          <Ticket className="size-7" aria-hidden />
        </span>
        <h1 className="text-3xl font-bold">Find my ticket</h1>
        <p className="mt-2 text-muted-foreground">Enter the ticket number or order reference from your SMS or email.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 rounded-2xl border border-border bg-surface p-5">
        <Field id="value" label="Ticket number or order reference" error={errors.value?.message} hint="12 letters and numbers, e.g. 2BE2B6C7F346 or 2BE2B6C7F346-2">
          <Input {...aria("value", errors.value?.message, true)} autoComplete="off" autoCapitalize="characters" spellCheck={false} className="ticket-id text-base" {...register("value")} />
        </Field>
        <FormAlert message={msg} />
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : <Search />} Find my ticket
        </Button>
      </form>
    </NarrowPage>
  );
}
