
import { SkeletonCard, SkeletonTableRow } from "@/features/skeleton/components";

export default function StockMovementsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <SkeletonCard className="h-6 w-48" />
        <SkeletonCard className="mt-1 h-4 w-64 max-w-full" />
      </div>

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <SkeletonCard className="min-w-0 flex-1 h-10 rounded-lg border border-border bg-background" />
          <SkeletonCard className="h-10 w-24 rounded-lg border border-border bg-background" />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <SkeletonCard className="h-5 w-32" />
          <SkeletonCard className="mt-1 h-3 w-48" />
        </div>
        <div className="p-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonTableRow key={index} cellCount={6} />
          ))}
        </div>
      </section>
    </div>
  );
}
