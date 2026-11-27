
import { SkeletonCard, SkeletonDetailItem } from "@/features/skeleton/components";

export default function ResourceDetailsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <SkeletonCard className="h-4 w-32" />
          <SkeletonCard className="mt-1 h-6 w-48" />
          <SkeletonCard className="mt-1 h-4 w-40" />
        </div>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">
          Resource Details
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonDetailItem />
          <SkeletonDetailItem />
          <SkeletonDetailItem />
          <SkeletonDetailItem />
          <SkeletonDetailItem />
          <SkeletonDetailItem />
          <SkeletonDetailItem />
          <SkeletonDetailItem />
        </div>
      </section>
    </div>
  );
}
