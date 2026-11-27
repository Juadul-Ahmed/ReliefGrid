
import { SkeletonCard } from "@/features/skeleton/components";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
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
        <h2 className="text-lg font-semibold text-foreground">
          Organization Information
        </h2>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <SkeletonCard className="h-4 w-24" />
            <SkeletonCard className="h-6 w-48" />
          </div>
          <div className="flex items-center gap-3">
            <SkeletonCard className="h-4 w-24" />
            <SkeletonCard className="h-6 w-48" />
          </div>
          <div className="flex items-center gap-3">
            <SkeletonCard className="h-4 w-24" />
            <SkeletonCard className="h-6 w-48" />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <SkeletonCard className="h-5 w-36" />
          <SkeletonCard className="mt-1 h-3 w-48" />
        </div>
        <div className="flex items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <SkeletonCard className="size-5 rounded-lg" />
            </div>
            <div className="flex flex-col gap-1">
              <SkeletonCard className="h-4 w-24" />
              <SkeletonCard className="mt-1 h-3 w-48 max-w-full" />
            </div>
          </div>
          <SkeletonCard className="h-5 w-20 shrink-0 rounded-lg" />
        </div>
      </section>
    </div>
  );
}
