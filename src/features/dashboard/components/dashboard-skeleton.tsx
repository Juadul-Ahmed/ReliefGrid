
interface SkeletonBlockProps {
  className?: string;
}

function SkeletonBlock({ className = "" }: SkeletonBlockProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse motion-reduce:animate-none rounded-md bg-surface-secondary ${className}`}
    />
  );
}

function WelcomeSkeleton() {
  return (
    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-36" />
          <SkeletonBlock className="h-4 w-72 max-w-full" />
        </div>

        <SkeletonBlock className="h-10 w-48 rounded-lg" />
      </div>

      <SkeletonBlock className="h-12 w-full rounded-lg" />
    </section>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="h-9 w-20" />
        </div>

        <SkeletonBlock className="size-11 rounded-xl" />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <SkeletonBlock className="h-4 w-12" />
        <SkeletonBlock className="h-4 w-32" />
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <section
      aria-label="Loading statistics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <StatCardSkeleton key={index} />
      ))}
    </section>
  );
}

function RecentIncidentsSkeleton() {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface xl:col-span-2">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-5 w-36" />
          <SkeletonBlock className="h-3 w-52" />
        </div>

        <SkeletonBlock className="h-7 w-20 rounded-md" />
      </div>

      <div className="space-y-5 p-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-2 gap-4 sm:grid-cols-5"
          >
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-3 w-16" />
            </div>

            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-6 w-16 rounded-md" />
            <SkeletonBlock className="h-6 w-20 rounded-md" />
            <SkeletonBlock className="hidden h-4 w-24 sm:block" />
          </div>
        ))}
      </div>
    </section>
  );
}

function IncidentSeveritySkeleton() {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="space-y-2">
        <SkeletonBlock className="h-5 w-36" />
        <SkeletonBlock className="h-3 w-48" />
      </div>

      <SkeletonBlock className="mt-6 h-3 w-full rounded-full" />

      <div className="mt-6 space-y-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between">
              <SkeletonBlock className="h-4 w-20" />
              <SkeletonBlock className="h-4 w-8" />
            </div>

            <SkeletonBlock className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>

      <div className="mt-7 border-t border-border pt-4">
        <SkeletonBlock className="h-3 w-32" />
        <SkeletonBlock className="mt-2 h-8 w-16" />
      </div>
    </section>
  );
}

function OperationalActivitySkeleton() {
  return (
    <section className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4 space-y-2">
        <SkeletonBlock className="h-5 w-48" />
        <SkeletonBlock className="h-3 w-56" />
      </div>

      <div className="divide-y divide-border">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-5 py-4">
            <SkeletonBlock className="size-10 shrink-0 rounded-lg" />

            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-40 max-w-full" />
              <SkeletonBlock className="h-3 w-52 max-w-full" />
            </div>

            <SkeletonBlock className="h-3 w-20 shrink-0" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading dashboard"
      aria-busy="true"
      className="mx-auto w-full max-w-[1600px] space-y-6"
    >
      <span className="sr-only">Loading dashboard...</span>

      <WelcomeSkeleton />

      <StatsSkeleton />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <RecentIncidentsSkeleton />
        <IncidentSeveritySkeleton />
      </section>

      <OperationalActivitySkeleton />
    </div>
  );
}
