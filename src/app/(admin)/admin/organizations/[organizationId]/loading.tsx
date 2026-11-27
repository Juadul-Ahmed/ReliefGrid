
import { SkeletonCard, SkeletonDetailItem, SkeletonListItem } from "@/features/skeleton/components";

export default function OrganizationDetailsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <SkeletonCard className="h-4 w-32" />
          <SkeletonCard className="mt-1 h-6 w-48" />
          <SkeletonCard className="mt-1 h-4 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonCard className="h-8 w-20 rounded-lg" />
          <SkeletonCard className="h-8 w-20 rounded-lg" />
        </div>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">
          Organization Information
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonDetailItem key={index} />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <SkeletonCard className="h-5 w-48" />
          <SkeletonCard className="mt-1 h-3 w-48" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonListItem key={index} withAvatar />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground mb-5">
          Organization Actions
        </h2>
        <div className="flex gap-3">
          <SkeletonCard className="h-9 w-24 rounded-lg" />
          <SkeletonCard className="h-9 w-24 rounded-lg" />
          <SkeletonCard className="h-9 w-24 rounded-lg" />
        </div>
      </section>
    </div>
  );
}
