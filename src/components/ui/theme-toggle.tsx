
"use client";

import { useTheme } from "@teispace/next-themes";
import {
  HiOutlineMoon,
  HiOutlineSun,
} from "react-icons/hi2";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
    >
      {isDark ? (
        <HiOutlineSun className="size-5" />
      ) : (
        <HiOutlineMoon className="size-5" />
      )}
    </button>
  );
}
