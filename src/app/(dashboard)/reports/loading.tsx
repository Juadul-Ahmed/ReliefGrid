
import {
  SkeletonCard,
  SkeletonStatCard,
  SkeletonChartCard,
} from "@/features/skeleton/components";

export default function ReportsLoading() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <SkeletonCard className="h-8 w-48" />
          <SkeletonCard className="mt-1 h-4 w-72 max-w-full" />
        </div>
        <div className="flex items-center gap-3">
          <SkeletonCard className="size-8" />
          <SkeletonCard className="size-8" />
          <SkeletonCard className="size-8" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonStatCard key={index} />
        ))}
      </section>

      <section className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <SkeletonCard className="h-5 w-36" />
          <SkeletonCard className="mt-1 h-3 w-48" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 p-5">
          <SkeletonChartCard />
          <SkeletonChartCard />
          <SkeletonChartCard />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-t border-border p-5">
          <SkeletonChartCard />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <SkeletonCard className="h-5 w-36" />
          <SkeletonCard className="mt-1 h-3 w-48" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 p-5">
          <SkeletonChartCard />
          <SkeletonChartCard />
        </div>
        <div className="border-t border-border p-5">
          <SkeletonChartCard />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <SkeletonCard className="h-5 w-36" />
          <SkeletonCard className="mt-1 h-3 w-48" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 p-5">
          <SkeletonChartCard />
          <SkeletonChartCard />
        </div>
        <div className="border-t border-border p-5">
          <SkeletonCard className="h-16 w-full rounded-lg bg-surface-secondary" />
        </div>
      </section>
    </div>
  );
}
