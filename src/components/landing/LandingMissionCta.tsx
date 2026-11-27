
"use client";

import Link from "next/link";
import { HiOutlineShieldCheck } from "react-icons/hi2";

interface LandingMissionCtaProps {
  isAuthenticated: boolean;
  userRole: "SYSTEM_ADMIN" | "OWNER" | "ADMIN" | "MEMBER" | null;
}

export function LandingMissionCta({
  isAuthenticated,
  userRole,
}: LandingMissionCtaProps) {
  const isSystemAdmin = userRole === "SYSTEM_ADMIN";
  const isOrgOwner = userRole === "OWNER";
  const isOrgAdmin = userRole === "ADMIN";
  const isMember = userRole === "MEMBER";

  const primaryCta =
    !isAuthenticated
      ? { href: "/report-incident", label: "Report an Incident" }
      : isSystemAdmin
        ? { href: "/admin", label: "Open Admin Panel" }
        : isOrgOwner || isOrgAdmin || isMember
          ? { href: "/dashboard", label: "Open Dashboard" }
          : { href: "/onboarding", label: "Get Started" };

  const secondaryCta =
    !isAuthenticated
      ? { href: "/about", label: "Learn More" }
      : { href: "/contact", label: "Contact Us" };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-border bg-primary p-10 sm:p-12 text-primary-foreground shadow-2xl">
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary-foreground/10 mx-auto mb-4">
              <HiOutlineShieldCheck className="size-6" />
            </div>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to coordinate your response?
            </h2>

            <p className="mt-5 leading-7 text-primary-foreground/90 max-w-xl mx-auto">
              Join ReliefGrid to manage incidents, coordinate resources, and
              collaborate with response organizations through one trusted
              platform.
            </p>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={primaryCta.href}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-foreground px-6 py-3.5 text-sm font-semibold text-primary transition-opacity hover:opacity-90"
            >
              {primaryCta.label}
            </Link>

            <Link
              href={secondaryCta.href}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary-foreground bg-transparent px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              {secondaryCta.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
