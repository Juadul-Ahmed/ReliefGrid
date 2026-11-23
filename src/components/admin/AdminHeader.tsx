
"use client";

import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/ui/theme-toggle";

import {
  HiOutlineBars3,
  HiOutlineMagnifyingGlass,
  HiOutlineBell,
  HiOutlineUserCircle,
} from "react-icons/hi2";

interface AdminHeaderProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
  "/admin": "Admin Dashboard",
  "/admin/applications": "Organization Applications",
  "/admin/organizations": "Organizations",
  "/admin/users": "Users",
  "/admin/audit-logs": "Audit Logs",
  "/admin/settings": "Settings",
};

export default function AdminHeader({
  onMenuClick,
}: AdminHeaderProps) {
  const pathname = usePathname();

  const pageTitle =
    pageTitles[pathname] ?? "Platform Administration";

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
            ReliefGrid System Administration
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

        <ThemeToggle />

        {/* Admin profile placeholder */}
        <div className="ml-1 flex items-center gap-2 border-l border-border pl-3">
          <HiOutlineUserCircle className="size-8 text-muted" />

          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground">
              System Admin
            </p>

            <p className="text-xs text-muted">
              Platform Administrator
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
