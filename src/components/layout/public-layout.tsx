import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Menu, Search, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo, ThemeToggle } from "./brand";
import { useAuth, homeFor } from "@/lib/auth";
import { SUPPORT_CONTACT, USE_MOCKS } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const navCls = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
    isActive ? "text-brand" : "text-muted-foreground hover:text-foreground",
  );

function AccountLink({ onNavigate, block }: { onNavigate?: () => void; block?: boolean }) {
  const { status, user } = useAuth();
  if (status === "authed")
    return (
      <Button asChild variant={block ? "default" : "outline"} className={block ? "w-full" : ""}>
        <Link to={homeFor(user)} onClick={onNavigate}>
          Console
        </Link>
      </Button>
    );
  return (
    <Button asChild variant={block ? "default" : "outline"} className={block ? "w-full" : ""}>
      <Link to="/login" onClick={onNavigate}>
        Organizer sign in
      </Link>
    </Button>
  );
}

export function PublicLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      {USE_MOCKS && (
        <div className="no-print bg-warning-soft px-4 py-1.5 text-center text-xs text-warning">
          Demo mode: running against a simulated backend. Data lives in this browser only.
        </div>
      )}
      <header className="no-print sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
            <NavLink to="/events" className={navCls}>
              Events
            </NavLink>
            <NavLink to="/find-ticket" className={navCls}>
              Find my ticket
            </NavLink>
          </nav>
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <AccountLink />
          </div>
          <div className="ml-auto flex items-center gap-1 md:hidden">
            <Button asChild variant="ghost" size="icon" aria-label="Find my ticket">
              <Link to="/find-ticket">
                <Ticket />
              </Link>
            </Button>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <nav aria-label="Mobile" className="mt-8 flex flex-col gap-1">
                  <NavLink to="/events" className={navCls} onClick={() => setOpen(false)}>
                    <span className="flex items-center gap-2 py-1 text-base">
                      <Search className="size-4" /> Events
                    </span>
                  </NavLink>
                  <NavLink to="/find-ticket" className={navCls} onClick={() => setOpen(false)}>
                    <span className="flex items-center gap-2 py-1 text-base">
                      <Ticket className="size-4" /> Find my ticket
                    </span>
                  </NavLink>
                </nav>
                <div className="mt-6 space-y-3">
                  <AccountLink block onNavigate={() => setOpen(false)} />
                  <div className="flex items-center justify-between rounded-md border border-border px-3 py-1">
                    <span className="text-sm text-muted-foreground">Theme</span>
                    <ThemeToggle />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <footer className="no-print mt-16 border-t border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-8">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Discover events across Kenya and pay with M-Pesa. No account needed.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-col gap-2 text-sm">
            <Link to="/events" className="text-muted-foreground hover:text-foreground">
              Browse events
            </Link>
            <Link to="/find-ticket" className="text-muted-foreground hover:text-foreground">
              Find my ticket
            </Link>
            <Link to="/login" className="text-muted-foreground hover:text-foreground">
              Organizer login
            </Link>
          </nav>
          <div className="text-sm">
            <p className="font-medium">Need help?</p>
            <a href={`mailto:${SUPPORT_CONTACT}`} className="text-brand hover:underline">
              {SUPPORT_CONTACT}
            </a>
          </div>
        </div>
        <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} HostMe
        </div>
      </footer>
    </div>
  );
}

/** Narrow centred column for checkout, payment and auth screens. */
export function NarrowPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-xl px-4 py-8 sm:py-12", className)}>{children}</div>
  );
}
export function WidePage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8", className)}>
      {children}
    </div>
  );
}
