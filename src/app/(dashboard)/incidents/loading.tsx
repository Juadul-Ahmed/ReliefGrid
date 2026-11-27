
import { SkeletonCard, SkeletonListItem } from "@/features/skeleton/components";

export default function IncidentsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <SkeletonCard className="h-8 w-36" />
          <SkeletonCard className="mt-1 h-4 w-72 max-w-full" />
        </div>
        <SkeletonCard className="h-10 w-48 rounded-lg" />
      </div>

      <SkeletonCard>
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
          <SkeletonCard className="h-8 w-36" />
          <SkeletonCard className="mt-1 h-4 w-72 max-w-full" />
        </div>
      </SkeletonCard>

      <section className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <SkeletonCard className="h-5 w-32" />
          <SkeletonCard className="mt-1 h-3 w-48" />
        </div>
        <div className="p-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonListItem key={index} />
          ))}
        </div>
      </section>
    </div>
  );
}
