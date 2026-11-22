
import { HiOutlineClock } from "react-icons/hi2";

export function DashboardWelcome() {
  return (
    <section className="space-y-4">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Overview
          </h2>

          <p className="mt-1 text-sm text-muted">
            Monitor emergency operations and response activities.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted">
          <HiOutlineClock className="size-4" />
          <span>Operational Overview</span>
        </div>
      </div>

      {/* Demo data notice */}
      <div className="rounded-lg border border-info/20 bg-info/5 px-4 py-3">
        <p className="text-sm text-info">
          <span className="font-semibold">
            Demo dashboard:
          </span>{" "}
          All figures and activities currently use illustrative data.
        </p>
      </div>
    </section>
  );
}
