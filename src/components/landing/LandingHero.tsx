
"use client";

import Link from "next/link";
import {
  HiOutlineArrowRight,
  HiOutlineMap,
  HiOutlineShieldCheck,
  HiOutlineUsers,
  HiOutlineBuildingOffice2,
} from "react-icons/hi2";

interface LandingHeroProps {
  isAuthenticated: boolean;
  userRole: "SYSTEM_ADMIN" | "OWNER" | "ADMIN" | "MEMBER" | null;
}

export function LandingHero({
  isAuthenticated,
  userRole,
}: LandingHeroProps) {
  const isSystemAdmin = userRole === "SYSTEM_ADMIN";
  const isOrgOwner = userRole === "OWNER";
  const isOrgAdmin = userRole === "ADMIN";

  // Determine primary and secondary CTAs based on role.
  let primaryCta: { href: string; label: string; icon: React.ElementType } | null;
  let secondaryCta: { href: string; label: string } | null;
  let heading: string;
  let subheading: string;
  let introText: string;
  let badgeText: string;

  if (!isAuthenticated) {
    heading = "When disaster strikes, coordination matters.";
    subheading =
      "ReliefGrid connects organizations, response teams, and communities through one coordinated disaster response platform.";
    badgeText = "Coordinating response. Saving lives.";
    introText =
      "Report incidents, coordinate resources, and collaborate with response organizations — all from one platform.";
    primaryCta = {
      href: "/report-incident",
      label: "Report an Incident",
      icon: HiOutlineArrowRight,
    };
    secondaryCta = {
      href: "/about",
      label: "Learn More",
    };
  } else if (isSystemAdmin) {
    heading = "Platform administration at your fingertips.";
    subheading =
      "Manage users, organizations, audit logs, and platform settings from the System Admin dashboard.";
    badgeText = "System Administrator";
    introText =
      "Oversee platform-wide activity, review incident reports, and manage organizational access.";
    primaryCta = {
      href: "/admin",
      label: "Open Admin Panel",
      icon: HiOutlineArrowRight,
    };
    secondaryCta = {
      href: "/admin/users",
      label: "Manage Users",
    };
  } else if (isOrgOwner) {
    heading = "Lead your organization's response.";
    subheading =
      "Manage your organization, coordinate incident participants, and oversee resource allocation.";
    badgeText = "Organization Owner";
    introText =
      "View your organization's incidents, manage members, and lead response efforts.";
    primaryCta = {
      href: "/dashboard",
      label: "Open Organization Dashboard",
      icon: HiOutlineArrowRight,
    };
    secondaryCta = {
      href: "/incidents",
      label: "View Incidents",
    };
  } else if (isOrgAdmin) {
    heading = "Coordinate your organization's response.";
    subheading =
      "Manage incident participants, assign coordinators, and track resource allocations for your organization.";
    badgeText = "Organization Administrator";
    introText =
      "Stay on top of your organization's incidents and response activities.";
    primaryCta = {
      href: "/dashboard",
      label: "Open Organization Dashboard",
      icon: HiOutlineArrowRight,
    };
    secondaryCta = {
      href: "/incidents",
      label: "View Incidents",
    };
  } else {
    // MEMBER
    heading = "Welcome back to your organization's workspace.";
    subheading =
      "Track incidents you're involved in, view resource allocations, and collaborate with your team.";
    badgeText = "Organization Member";
    introText =
      "Access your organization's dashboard to see active incidents and your assigned tasks.";
    primaryCta = {
      href: "/dashboard",
      label: "Open Dashboard",
      icon: HiOutlineArrowRight,
    };
    secondaryCta = {
      href: "/incidents",
      label: "View Incidents",
    };
  }

  const PrimaryIcon = primaryCta?.icon;

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />

      <div className="relative mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <HiOutlineShieldCheck className="size-4" />
            {badgeText}
          </span>

          <h1 className="mt-7 max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {heading}
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-muted sm:text-lg">
            {subheading}
          </p>

          <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
            {introText}
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            {primaryCta && (
              <Link
                href={primaryCta.href}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90"
              >
                {primaryCta.label}
                <PrimaryIcon className="size-5" />
              </Link>
            )}

            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                className="rounded-xl border border-border bg-surface px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-secondary"
              >
                {secondaryCta.label}
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 rounded-3xl border border-border bg-surface p-7 shadow-xl">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HiOutlineMap className="size-7" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-foreground">
              Unified Incident Coordination
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Keep incident information, updates, and response
              coordination connected.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-surface p-6 shadow-lg">
            <div className="flex size-11 items-center justify-center rounded-xl bg-success/10 text-success">
              <HiOutlineUsers className="size-6" />
            </div>
            <h3 className="mt-4 font-semibold text-foreground">
              Team Collaboration
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Connect response organizations and teams.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-surface p-6 shadow-lg">
            <div className="flex size-11 items-center justify-center rounded-xl bg-emergency/10 text-emergency">
              <HiOutlineShieldCheck className="size-6" />
            </div>
            <h3 className="mt-4 font-semibold text-foreground">
              Resource Management
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Coordinate resources and emergency support.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-surface p-6 shadow-lg">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HiOutlineBuildingOffice2 className="size-6" />
            </div>
            <h3 className="mt-4 font-semibold text-foreground">
              Organization Collaboration
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Bring approved organizations together with controlled access.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
