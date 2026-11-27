
import { SkeletonCard, SkeletonListItem } from "@/features/skeleton/components";

export default function MembersLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <SkeletonCard className="size-6 rounded-lg" />
          </div>
          <div className="flex flex-col gap-2">
            <SkeletonCard className="h-6 w-40" />
            <SkeletonCard className="mt-1 h-4 w-64 max-w-full" />
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <SkeletonCard className="h-5 w-40" />
          <SkeletonCard className="mt-1 h-3 w-48" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonListItem key={index} />
          ))}
        </div>
      </section>
    </div>
  );
}
