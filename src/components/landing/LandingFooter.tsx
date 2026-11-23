
import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <Link href="/" className="text-lg font-bold text-foreground">
          ReliefGrid
        </Link>

        <p className="text-sm text-muted">
          Coordinating resources. Strengthening disaster response.
        </p>

        <p className="text-xs text-muted">
          © {new Date().getFullYear()} ReliefGrid. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
