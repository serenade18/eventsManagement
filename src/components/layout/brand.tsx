import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function Logo({ to = "/", className }: { to?: string; className?: string }) {
  return (
    <Link
      to={to}
      className={cn("flex items-center gap-2 rounded-md font-bold", className)}
      aria-label="HostMe home"
    >
      <span
        className="grid size-8 place-items-center rounded-lg bg-brand text-primary-foreground"
        aria-hidden
      >
        <svg viewBox="0 0 32 32" className="size-5">
          <path
            d="M10 8v16M22 8v16M10 16h12"
            stroke="currentColor"
            strokeWidth="3.4"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </span>
      <span className="text-lg tracking-tight">HostMe</span>
    </Link>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
