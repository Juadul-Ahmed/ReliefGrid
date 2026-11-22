
"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  HiOutlineBars3,
  HiOutlineMagnifyingGlass,
  HiOutlineBell,
  HiOutlineUserCircle,
} from "react-icons/hi2";

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/incidents": "Incidents",
  "/requests": "Emergency Requests",
  "/resources": "Resources",
  "/allocations": "Allocations",
  "/shelters": "Shelters",
  "/volunteers": "Volunteers",
  "/teams": "Teams",
  "/map": "Live Map",
  "/reports": "Reports",
  "/settings": "Settings",
};

export function DashboardHeader({
  onMenuClick,
}: DashboardHeaderProps) {
  const pathname = usePathname();

  const pageTitle =
    pageTitles[pathname] ?? "Emergency Operations";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
      {/* Left section */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground lg:hidden"
        >
          <HiOutlineBars3 className="size-6" />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-foreground">
            {pageTitle}
          </h1>

          <p className="hidden text-xs text-muted sm:block">
            Emergency Response Command Center
          </p>
        </div>
      </div>

      {/* Right section */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Search placeholder */}
        <button
          type="button"
          aria-label="Search"
          className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
        >
          <HiOutlineMagnifyingGlass className="size-5" />
        </button>

        {/* Notifications placeholder */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
        >
          <HiOutlineBell className="size-5" />

          <span className="absolute right-2 top-2 size-2 rounded-full bg-emergency" />
        </button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Profile placeholder */}
        <div className="ml-1 flex items-center gap-2 border-l border-border pl-3">
          <HiOutlineUserCircle className="size-8 text-muted" />

          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground">
              Coordinator
            </p>

            <p className="text-xs text-muted">
              Operations Team
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
