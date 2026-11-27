
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { signOut } from "@/lib/auth-client";

import { InvitationNotifications } from "@/components/organization/InvitationNotifications";
import { ThemeToggle } from "@/components/ui/theme-toggle";

import {
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineShieldCheck,
} from "react-icons/hi2";

import { useState } from "react";

interface LandingNavbarProps {
  isAuthenticated: boolean;
  hasOrganization: boolean;
  isSystemAdmin: boolean;
}

export function LandingNavbar({
  isAuthenticated,
  hasOrganization,
  isSystemAdmin,
}: LandingNavbarProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) return;

    setIsSigningOut(true);

    try {
      await signOut();

      toast.success("Signed out successfully.");
      setIsMenuOpen(false);
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Unable to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={() => setIsMenuOpen(false)}
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-white">
            <HiOutlineShieldCheck className="size-6" />
          </div>

          <span className="text-xl font-bold tracking-tight text-foreground">
            ReliefGrid
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-7 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            Home
          </Link>

          <Link
            href="/#about"
            className="text-sm font-medium text-muted transition-colors hover:text-primary"
          >
            About
          </Link>

          <Link
            href="/#contact"
            className="text-sm font-medium text-muted transition-colors hover:text-primary"
          >
            Contact Us
          </Link>

          <Link
            href="/onboarding"
            className="text-sm font-medium text-muted transition-colors hover:text-primary"
          >
            Onboard
          </Link>

          <Link
            href="/report-incident"
            className="text-sm font-medium text-muted transition-colors hover:text-primary"
          >
            Report Incident
          </Link>

          {hasOrganization && !isSystemAdmin && (
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-primary transition-colors hover:opacity-80"
            >
              Dashboard
            </Link>
          )}

          {isSystemAdmin && (
            <Link
              href="/admin"
              className="text-sm font-semibold text-primary transition-colors hover:opacity-80"
            >
              Admin Panel
            </Link>
          )}
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              <InvitationNotifications />

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((current) => !current)}
          className="flex size-10 items-center justify-center rounded-lg text-foreground hover:bg-surface-secondary md:hidden"
        >
          {isMenuOpen ? (
            <HiOutlineXMark className="size-6" />
          ) : (
            <HiOutlineBars3 className="size-6" />
          )}
        </button>
      </nav>

      {/* Mobile navigation */}
      {isMenuOpen && (
        <div className="border-t border-border bg-surface px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-secondary"
            >
              Home
            </Link>

            <Link
              href="/#about"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-secondary"
            >
              About
            </Link>

            <Link
              href="/#contact"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-secondary"
            >
              Contact Us
            </Link>

            <Link
              href="/onboarding"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-secondary"
            >
              Onboard
            </Link>

            <Link
              href="/report-incident"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-secondary"
            >
              Report Incident
            </Link>

            {hasOrganization && !isSystemAdmin && (
              <Link
                href="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-primary hover:bg-surface-secondary"
              >
                Dashboard
              </Link>
            )}

            {isSystemAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-primary hover:bg-surface-secondary"
              >
                Admin Panel
              </Link>
            )}

              <div className="mt-3 flex items-center justify-between border-t border-border pt-4">
                <ThemeToggle />

                {isAuthenticated ? (
                  <>
                    <InvitationNotifications />

                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {isSigningOut ? "Signing out..." : "Sign Out"}
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    Sign In
                  </Link>
                )}
              </div>
          </div>
        </div>
      )}
    </header>
  );
}
