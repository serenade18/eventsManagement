import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const RELOAD_FLAG = "hostme.chunk-reload";

/** A lazy page's code couldn't be fetched (new deploy, dev re-bundle, flaky network). */
function isChunkLoadError(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  return /dynamically imported module|Importing a module script failed|Loading chunk|error loading dynamically imported module/i.test(
    msg,
  );
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors below it. For a failed lazy-page fetch it reloads once
 * automatically (the usual fix); otherwise, or if that already happened, it shows
 * a recovery screen instead of a blank app.
 */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error) {
    if (!isChunkLoadError(error)) return;
    try {
      if (!sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.setItem(RELOAD_FLAG, "1");
        window.location.reload();
      }
    } catch {
      /* storage unavailable: fall through to the recovery screen */
    }
  }

  override componentDidUpdate(prev: { resetKey?: string }) {
    // Navigating elsewhere clears the error.
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  override render() {
    const { error } = this.state;
    if (!error) {
      try {
        sessionStorage.removeItem(RELOAD_FLAG);
      } catch {
        /* ignore */
      }
      return this.props.children;
    }
    const chunk = isChunkLoadError(error);
    return (
      <div
        role="alert"
        className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center"
      >
        <span className="mb-4 grid size-14 place-items-center rounded-full bg-danger-soft text-danger">
          <AlertTriangle className="size-7" aria-hidden />
        </span>
        <h1 className="text-xl font-bold">
          {chunk ? "This page needs a refresh" : "Something went wrong on this page"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {chunk
            ? "A newer version of HostMe is available, or the connection dropped while loading."
            : "Try again. If it keeps happening, let us know what you were doing."}
        </p>
        <Button className="mt-6" onClick={() => window.location.reload()}>
          <RotateCw /> Reload page
        </Button>
      </div>
    );
  }
}
