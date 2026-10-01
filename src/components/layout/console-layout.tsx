import { useCallback, useEffect, useState, type ReactElement } from "react";
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
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const COLLAPSE_KEY = "hostme.sidebar";

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "collapsed";
  } catch {
    return false;
  }
}

/** Desktop sidebar collapse state, remembered per device, toggled with Ctrl/⌘+B. */
function useSidebarCollapse() {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const toggle = useCallback(() => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "expanded" : "collapsed");
      } catch {
        /* not persisted */
      }
      return !c;
    });
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b" && !e.altKey && !e.shiftKey) {
        const el = e.target as HTMLElement | null;
        if (el?.closest("input, textarea, [contenteditable=true]")) return;
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);
  return { collapsed, toggle };
}

/** Icon-only items need their label as a tooltip when collapsed. */
function NavTip({
  show,
  label,
  children,
}: {
  show: boolean;
  label: string;
  children: ReactElement;
}) {
  if (!show) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function SideNav({
  onNavigate,
  collapsed = false,
  onToggle,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const { user, logout } = useAuth();
  const items = NAV.filter((n) => user && n.roles.includes(user.user_type));
  const itemCls = (active: boolean) =>
    cn(
      "flex min-h-11 items-center gap-3 rounded-md text-sm font-medium transition-colors",
      collapsed ? "justify-center px-0" : "px-3",
      active
        ? "bg-brand-soft text-brand"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );
  const shortcut =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
      ? "⌘B"
      : "Ctrl+B";

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-16 items-center",
          collapsed ? "justify-center px-2" : "justify-between px-5",
        )}
      >
        <Logo to={homeFor(user)} compact={collapsed} />
        {onToggle && !collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            aria-label="Collapse sidebar"
            aria-expanded
            aria-controls="console-sidebar"
            title={`Collapse sidebar (${shortcut})`}
          >
            <PanelLeftClose />
          </Button>
        )}
      </div>
      {onToggle && collapsed && (
        <div className="flex justify-center pb-2">
          <NavTip show label={`Expand sidebar (${shortcut})`}>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              aria-label="Expand sidebar"
              aria-expanded={false}
              aria-controls="console-sidebar"
            >
              <PanelLeftOpen />
            </Button>
          </NavTip>
        </div>
      )}
      <nav
        aria-label="Console"
        className={cn("flex-1 space-y-1 overflow-y-auto py-2", collapsed ? "px-2" : "px-3")}
      >
        {items.map(({ to, label, icon: Icon, end }) => {
          const text = to === "/console/events" ? eventsLabel(user?.user_type) : label;
          return (
            <NavTip key={to} show={collapsed} label={text}>
              <NavLink
                to={to}
                end={end ?? false}
                onClick={onNavigate}
                className={({ isActive }) => itemCls(isActive)}
              >
                <Icon className="size-[18px] shrink-0" aria-hidden />
                <span className={collapsed ? "sr-only" : ""}>{text}</span>
              </NavLink>
            </NavTip>
          );
        })}
        <NavTip show={collapsed} label="Public site">
          <Link to="/" onClick={onNavigate} className={itemCls(false)}>
            <ExternalLink className="size-[18px] shrink-0" aria-hidden />
            <span className={collapsed ? "sr-only" : ""}>Public site</span>
          </Link>
        </NavTip>
      </nav>
      <div className={cn("border-t border-border", collapsed ? "p-2" : "p-3")}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            <DropdownMenu>
              <NavTip show label={user?.name ?? "Account"}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="grid size-10 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand"
                    aria-label={`Account menu for ${user?.name ?? "you"}`}
                  >
                    {user?.name.slice(0, 1).toUpperCase()}
                  </button>
                </DropdownMenuTrigger>
              </NavTip>
              <DropdownMenuContent side="right" align="end">
                <DropdownMenuLabel>
                  <span className="block truncate">{user?.name}</span>
                  <span className="block text-xs font-normal capitalize text-muted-foreground">
                    {user?.user_type}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={logout}>
                  <LogOut /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-2 py-2">
              <div
                className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand"
                aria-hidden
              >
                {user?.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user?.name}</p>
                <p className="truncate text-xs capitalize text-muted-foreground">
                  {user?.user_type}
                </p>
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
          </>
        )}
      </div>
    </div>
  );
}

export function ConsoleLayout() {
  const { status } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { collapsed, toggle } = useSidebarCollapse();

  if (status === "anon") {
    const next = location.pathname + location.search;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return (
    <div
      className={cn(
        "min-h-dvh lg:grid lg:transition-[grid-template-columns] lg:duration-200 motion-reduce:transition-none",
        collapsed ? "lg:grid-cols-[72px_1fr]" : "lg:grid-cols-[260px_1fr]",
      )}
    >
      <aside
        id="console-sidebar"
        className="sticky top-0 hidden h-dvh overflow-hidden border-r border-border bg-surface lg:block"
      >
        {status === "authed" ? (
          <SideNav collapsed={collapsed} onToggle={toggle} />
        ) : (
          <NavSkeleton />
        )}
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
