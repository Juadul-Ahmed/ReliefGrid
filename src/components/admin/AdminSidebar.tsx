
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { IconType } from "react-icons";
import { toast } from "react-toastify";

import { signOut } from "@/lib/auth-client";

import {
  HiOutlineShieldCheck,
  HiOutlineSquares2X2,
  HiOutlineClipboardDocumentCheck,
  HiOutlineBuildingOffice2,
  HiOutlineUsers,
  HiOutlineClipboardDocumentList,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
} from "react-icons/hi2";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavigationItem {
  label: string;
  href: string;
  icon: IconType;
}

interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

const navigationGroups: NavigationGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: HiOutlineSquares2X2,
      },
    ],
  },
  {
    label: "Organization Management",
    items: [
      {
        label: "Applications",
        href: "/admin/applications",
        icon: HiOutlineClipboardDocumentCheck,
      },
      {
        label: "Organizations",
        href: "/admin/organizations",
        icon: HiOutlineBuildingOffice2,
      },
    ],
  },
  {
    label: "Platform Management",
    items: [
      {
        label: "Users",
        href: "/admin/users",
        icon: HiOutlineUsers,
      },
      {
        label: "Audit Logs",
        href: "/admin/audit-logs",
        icon: HiOutlineClipboardDocumentList,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        label: "Settings",
        href: "/admin/settings",
        icon: HiOutlineCog6Tooth,
      },
    ],
  },
];

export default function AdminSidebar({
  isOpen,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    try {
      const result = await signOut();

      if (result.error) {
        toast.error("Unable to sign out. Please try again.");
        return;
      }

      toast.success("Signed out successfully.");
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Something went wrong while signing out.");
    }
  }

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col
        border-r border-border bg-surface
        transition-transform duration-300
        lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <HiOutlineShieldCheck className="size-6" />
        </div>

        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            ReliefGrid
          </h1>

          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
            Administration
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-6">
        {navigationGroups.map((group) => (
          <div key={group.label}>
            <h2 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-muted">
              {group.label}
            </h2>

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;

                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                    className={`
                      flex items-center gap-3 rounded-lg px-3 py-2.5
                      text-sm font-medium transition-colors
                      ${
                        isActive
                          ? "bg-emergency/10 text-emergency"
                          : "text-muted hover:bg-surface-secondary hover:text-foreground"
                      }
                    `}
                  >
                    <Icon className="size-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-border p-4">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-50"
        >
          <HiOutlineArrowRightOnRectangle className="size-5" />
          Sign Out
        </button>

        <div className="mt-3 border-t border-border pt-3">
          <p className="text-xs text-muted">
            ReliefGrid Platform Administration
          </p>

          <p className="mt-1 text-[10px] text-muted">
            ReliefGrid v0.1.0
          </p>
        </div>
      </div>
    </aside>
  );
}
