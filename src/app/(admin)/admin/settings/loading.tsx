
import { SkeletonCard } from "@/features/skeleton/components";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <SkeletonCard className="size-6 rounded-lg" />
          </div>
          <div className="flex flex-col gap-2">
            <SkeletonCard className="h-6 w-32" />
            <SkeletonCard className="mt-1 h-4 w-64 max-w-full" />
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-border bg-surface-secondary px-4 py-3 animate-pulse">
              <SkeletonCard className="h-4 w-24" />
              <SkeletonCard className="mt-1 h-3 w-48" />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-border bg-surface-secondary p-4 animate-pulse">
              <SkeletonCard className="h-4 w-32" />
              <SkeletonCard className="mt-2 h-3 w-full" />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-border bg-surface-secondary p-4 animate-pulse">
              <SkeletonCard className="h-8 w-20 rounded-md" />
              <SkeletonCard className="mt-1 h-3 w-48" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
