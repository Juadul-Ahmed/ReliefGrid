
import Link from "next/link";

const platformLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Report Incident", href: "/report-incident" },
  { label: "Onboard", href: "/onboarding" },
];

const authLinks = [
  { label: "Sign In", href: "/login" },
  { label: "Register", href: "/register" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <svg
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                ReliefGrid
              </span>
            </Link>

            <p className="mb-6 text-sm leading-7 text-muted">
              ReliefGrid is an emergency response and resource coordination
              platform that helps organizations manage incidents, resources,
              and response teams during disasters.
            </p>

            <div className="flex flex-wrap gap-4 text-sm text-muted">
              <p>© {new Date().getFullYear()} ReliefGrid. All rights reserved.</p>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
              Platform
            </h4>
            <ul className="space-y-3">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
              Account
            </h4>
            <ul className="space-y-3">
              {authLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-xs text-muted">
            Built for emergency response coordination.
          </p>
        </div>
      </div>
    </footer>
  );
}
