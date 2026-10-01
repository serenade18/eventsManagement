import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Megaphone, Menu, Search, Ticket } from "lucide-react";
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
        Sign in
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
            <NavLink to="/register" className={navCls}>
              For organizers
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
                  <NavLink to="/register" className={navCls} onClick={() => setOpen(false)}>
                    <span className="flex items-center gap-2 py-1 text-base">
                      <Megaphone className="size-4" /> For organizers
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
      <footer className="no-print mt-20 border-t border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Event tickets for Kenya. Pay with M-Pesa, get your tickets by SMS and email. No
              account, no password.
            </p>
          </div>
          <FooterGroup title="Buyers">
            <FooterLink to="/events">Browse events</FooterLink>
            <FooterLink to="/find-ticket">Find my ticket</FooterLink>
          </FooterGroup>
          <FooterGroup title="Organizers">
            <FooterLink to="/register">Sell tickets</FooterLink>
            <FooterLink to="/login">Organizer sign in</FooterLink>
          </FooterGroup>
          <FooterGroup title="Support">
            <a
              href={`mailto:${SUPPORT_CONTACT}`}
              className="text-muted-foreground hover:text-foreground"
            >
              {SUPPORT_CONTACT}
            </a>
          </FooterGroup>
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
            <span>© {new Date().getFullYear()} HostMe</span>
            <span>Prices in KES · Times in East Africa Time</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-2.5 text-sm">
      <p className="font-semibold text-foreground">{title}</p>
      {children}
    </nav>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-muted-foreground hover:text-foreground">
      {children}
    </Link>
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
