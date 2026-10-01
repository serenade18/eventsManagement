import { useState } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  PlugZap,
  CalendarDays,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Ticket,
  User,
  Users,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo, ThemeToggle } from "./brand";
import { eventsLabel, homeFor, useAuth } from "@/lib/auth";
import type { UserType } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const NAV: { to: string; label: string; icon: typeof User; roles: UserType[]; end?: boolean }[] = [
  {
    to: "/console",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["organizer", "admin"],
    end: true,
  },
  { to: "/console/events", label: "My events", icon: CalendarDays, roles: ["organizer", "admin"] },
  { to: "/console/tickets", label: "Tickets", icon: Ticket, roles: ["organizer", "admin"] },
  { to: "/console/users", label: "Users", icon: Users, roles: ["admin"] },
  { to: "/console/integrations", label: "Integrations", icon: PlugZap, roles: ["admin"] },
  {
    to: "/console/profile",
    label: "Profile",
    icon: User,
    roles: ["organizer", "admin", "sponsor"],
  },
  {
    to: "/console/password",
    label: "Change password",
    icon: KeyRound,
    roles: ["organizer", "admin", "sponsor"],
  },
];

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const items = NAV.filter((n) => user && n.roles.includes(user.user_type));
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo to={homeFor(user)} />
      </div>
      <nav aria-label="Console" className="flex-1 space-y-1 px-3 py-2">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end ?? false}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-soft text-brand"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            <Icon className="size-[18px]" aria-hidden />
            {to === "/console/events" ? eventsLabel(user?.user_type) : label}
          </NavLink>
        ))}
        <Link
          to="/"
          onClick={onNavigate}
          className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="size-[18px]" aria-hidden /> Public site
        </Link>
      </nav>
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div
            className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand"
            aria-hidden
          >
            {user?.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs capitalize text-muted-foreground">{user?.user_type}</p>
          </div>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={logout}
        >
          <LogOut /> Log out
        </Button>
      </div>
    </div>
  );
}

export function ConsoleLayout() {
  const { status } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (status === "anon") {
    const next = location.pathname + location.search;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-dvh border-r border-border bg-surface lg:block">
        {status === "authed" ? <SideNav /> : <NavSkeleton />}
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-surface/90 px-4 backdrop-blur lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {status === "authed" && <SideNav onNavigate={() => setOpen(false)} />}
            </SheetContent>
          </Sheet>
          <Logo to="/console" />
        </header>
        <main
          id="main"
          className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8"
        >
          {status === "authed" ? <Outlet /> : <PageSkeleton />}
        </main>
      </div>
    </div>
  );
}

/** Role gate for console pages. Cosmetic only; the backend enforces access. */
export function RequireRole({ roles, children }: { roles: UserType[]; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return null;
  if (!roles.includes(user.user_type)) return <Navigate to={homeFor(user)} replace />;
  return <>{children}</>;
}

function NavSkeleton() {
  return (
    <div className="space-y-3 p-5">
      <Skeleton className="h-8 w-28" />
      {Array.from({ length: 5 }, (_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
