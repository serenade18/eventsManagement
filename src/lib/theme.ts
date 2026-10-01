import { useEffect, useState } from "react";

export type Theme = "light" | "dark";
const KEY = "hostme.theme";

function current(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(current);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  };
  return { theme, toggle };
}
