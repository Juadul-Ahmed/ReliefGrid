
import { SkeletonCard, SkeletonTableRow } from "@/features/skeleton/components";

export default function AllocationsLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <SkeletonCard className="h-6 w-48" />
          <SkeletonCard className="mt-1 h-4 w-64 max-w-full" />
        </div>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="border-b border-border px-5 py-4">
          <SkeletonCard className="h-5 w-32" />
          <SkeletonCard className="mt-1 h-3 w-48" />
        </div>
        <div className="p-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonTableRow key={index} cellCount={8} />
          ))}
        </div>
      </section>
    </div>
  );
}
