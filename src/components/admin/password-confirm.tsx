import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormAlert, Spinner } from "@/components/common/states";
import { ApiError, errorMessage } from "@/lib/api/client";

/** Re-enter the account password before a sensitive change. The password is never kept. */
export function PasswordConfirm({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: string;
  onConfirm: (password: string) => Promise<void>;
}) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const close = (o: boolean) => {
    if (busy) return;
    setPw("");
    setErr(null);
    onOpenChange(o);
  };
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!pw) return setErr("Enter your password");
            setBusy(true);
            setErr(null);
            try {
              await onConfirm(pw);
              setPw("");
              onOpenChange(false);
            } catch (e2) {
              setErr(
                e2 instanceof ApiError && e2.status === 403
                  ? "That password is incorrect"
                  : errorMessage(e2),
              );
            } finally {
              setBusy(false);
            }
          }}
          className="space-y-4"
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label htmlFor="confirm-pw" className="text-sm font-medium">
              Your password
            </label>
            <Input
              id="confirm-pw"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
          </div>
          <FormAlert message={err} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => close(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Spinner />} Confirm and save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
