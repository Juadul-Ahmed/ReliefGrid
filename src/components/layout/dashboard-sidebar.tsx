
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { IconType } from "react-icons";
import { toast } from "react-toastify";

import {
  authClient,
  signOut,
  organization,
} from "@/lib/auth-client";

import {
  HiOutlineShieldCheck,
  HiOutlineSquares2X2,
  HiOutlineExclamationTriangle,
  HiOutlineClipboardDocumentList,
  HiOutlineCube,
  HiOutlineTruck,
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineMap,
  HiOutlineChartBar,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
  HiHome,
  HiOutlineBuildingOffice2,
  HiOutlineChevronDown,
  HiOutlineCheck,
} from "react-icons/hi2";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavigationItem {
  label: string;
  href: string;
  icon: IconType;
}

interface NavigationGroup {
  label?: string;
  items: NavigationItem[];
}

const navigationGroups: NavigationGroup[] = [
  {
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: HiOutlineSquares2X2,
      },
      {
        label: "Home",
        href: "/",
        icon: HiHome,
      },
    ],
  },
  {
    label: "Emergency Operations",
    items: [
      {
        label: "Incidents",
        href: "/incidents",
        icon: HiOutlineExclamationTriangle,
      },
      {
        label: "Emergency Requests",
        href: "/requests",
        icon: HiOutlineClipboardDocumentList,
      },
      {
        label: "Resources",
        href: "/resources",
        icon: HiOutlineCube,
      },
      {
        label: "Allocations",
        href: "/allocations",
        icon: HiOutlineTruck,
      },
      {
        label: "Shelters",
        href: "/shelters",
        icon: HiOutlineHome,
      },
    ],
  },
  {
    label: "People & Coordination",
    items: [
      {
        label: "Volunteers",
        href: "/volunteers",
        icon: HiOutlineUsers,
      },
      {
        label: "Teams",
        href: "/teams",
        icon: HiOutlineUsers,
      },
    ],
  },
  {
    label: "Intelligence",
    items: [
      {
        label: "Live Map",
        href: "/map",
        icon: HiOutlineMap,
      },
      {
        label: "Reports",
        href: "/reports",
        icon: HiOutlineChartBar,
      },
    ],
  },
  {
    items: [
      {
        label: "Settings",
        href: "/settings",
        icon: HiOutlineCog6Tooth,
      },
      {
        label: "Members",
        href: "/settings/members",
        icon: HiOutlineUsers,
      },
    ],
  },
];

export function DashboardSidebar({
  isOpen,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isOrganizationMenuOpen, setIsOrganizationMenuOpen] =
    useState(false);
  const [isSwitchingOrganization, setIsSwitchingOrganization] =
    useState(false);

  // Better Auth organization hooks.
  const {
    data: organizations,
    isPending: isOrganizationsLoading,
  } = authClient.useListOrganizations();

  const {
    data: activeOrganization,
    isPending: isActiveOrganizationLoading,
  } = authClient.useActiveOrganization();

  // Switch active organization.
  async function handleOrganizationSwitch(organizationId: string) {
    if (
      isSwitchingOrganization ||
      organizationId === activeOrganization?.id
    ) {
      setIsOrganizationMenuOpen(false);
      return;
    }

    setIsSwitchingOrganization(true);

    try {
      const result = await organization.setActive({
        organizationId,
      });

      if (result.error) {
        toast.error(
          result.error.message ??
            "Unable to switch organization.",
        );
        return;
      }

      toast.success("Organization switched successfully.");

      setIsOrganizationMenuOpen(false);

      // Refresh server components using the new active organization.
      router.refresh();
    } catch {
      toast.error("Something went wrong while switching organizations.");
    } finally {
      setIsSwitchingOrganization(false);
    }
  }

  // Sign out.
  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      const result = await signOut();

      if (result.error) {
        toast.error("Unable to sign out. Please try again.");
        setIsSigningOut(false);
        return;
      }

      toast.success("Signed out successfully.");
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Something went wrong while signing out.");
      setIsSigningOut(false);
    }
  }

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col
        border-r border-border bg-surface
        transition-transform duration-300
        lg:sticky lg:top-0 lg:translate-x-0
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
            Command Center
          </p>
        </div>
      </div>

      {/* Organization Switcher */}
      <div className="shrink-0 border-b border-border p-3">
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setIsOrganizationMenuOpen((current) => !current)
            }
            disabled={
              isOrganizationsLoading ||
              isActiveOrganizationLoading ||
              isSwitchingOrganization
            }
            aria-expanded={isOrganizationMenuOpen}
            aria-label="Switch organization"
            className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HiOutlineBuildingOffice2 className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                Current organization
              </p>

              <p className="mt-1 truncate text-sm font-semibold text-foreground">
                {isOrganizationsLoading ||
                isActiveOrganizationLoading
                  ? "Loading..."
                  : activeOrganization?.name ??
                    "Select organization"}
              </p>
            </div>

            <HiOutlineChevronDown
              className={`size-4 shrink-0 text-muted transition-transform ${
                isOrganizationMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Organization Dropdown */}
          {isOrganizationMenuOpen && (
            <>
              <button
                type="button"
                aria-label="Close organization menu"
                onClick={() => setIsOrganizationMenuOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />

              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
                <div className="border-b border-border px-3 py-2">
                  <p className="text-xs font-semibold text-foreground">
                    Your organizations
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted">
                    Switch your workspace
                  </p>
                </div>

                <div className="max-h-64 overflow-y-auto p-2">
                  {isOrganizationsLoading ? (
                    <p className="px-3 py-4 text-center text-xs text-muted">
                      Loading organizations...
                    </p>
                  ) : !organizations || organizations.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-muted">
                      No organizations found.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {organizations.map((org) => {
                        const isActive =
                          org.id === activeOrganization?.id;

                        return (
                          <button
                            key={org.id}
                            type="button"
                            disabled={isSwitchingOrganization}
                            onClick={() =>
                              void handleOrganizationSwitch(org.id)
                            }
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-foreground hover:bg-surface-secondary"
                            }`}
                          >
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-secondary">
                              <HiOutlineBuildingOffice2 className="size-4" />
                            </div>

                            <span className="min-w-0 flex-1 truncate text-xs font-medium">
                              {org.name}
                            </span>

                            {isActive && (
                              <HiOutlineCheck className="size-4 shrink-0 text-primary" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {isSwitchingOrganization && (
                  <div className="border-t border-border px-3 py-2">
                    <p className="text-center text-xs text-muted">
                      Switching organization...
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-6">
        {navigationGroups.map((group, index) => (
          <div key={group.label ?? `group-${index}`}>
            {group.label && (
              <h2 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-muted">
                {group.label}
              </h2>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;

                const isActive =
                  pathname === item.href ||
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
          disabled={isSigningOut}
          className="mb-4 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <HiOutlineArrowRightOnRectangle className="size-5" />
          {isSigningOut ? "Signing out..." : "Sign Out"}
        </button>

        <div className="border-t border-border pt-3">
          <p className="text-xs text-muted">
            Emergency Response Platform
          </p>
          <p className="mt-1 text-[10px] text-muted">
            ReliefGrid v0.1.0
          </p>
        </div>
      </div>
    </aside>
  );
}
