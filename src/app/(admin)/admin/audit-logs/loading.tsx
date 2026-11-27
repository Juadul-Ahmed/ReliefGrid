
import {
  SkeletonCard,
  SkeletonStatCard,
} from "@/features/skeleton/components";

export default function AuditLogsLoading() {
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
        <div className="flex items-center gap-3">
          <input
            type="search"
            disabled
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface-secondary px-3 py-2.5 text-sm"
          />
          {["ALL", "USER_CREATED", "USER_BLOCKED", "USER_UNBLOCKED", "USER_DELETED", "ORGANIZATION_BLOCKED", "ORGANIZATION_UNBLOCKED"].map((label) => (
            <button
              key={label}
              type="button"
              disabled
              className="rounded-lg border border-border bg-surface-secondary px-3 py-1.5 text-xs animate-pulse"
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonStatCard key={index} />
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-secondary text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-4 font-semibold">Timestamp</th>
                <th className="px-5 py-4 font-semibold">Actor</th>
                <th className="px-5 py-4 font-semibold">Action</th>
                <th className="px-5 py-4 font-semibold">Entity Type</th>
                <th className="px-5 py-4 font-semibold">Entity ID</th>
                <th className="px-5 py-4 font-semibold">Organization</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Array.from({ length: 4 }).map((_, index) => (
                <tr
                  key={index}
                  className="transition-colors hover:bg-surface-secondary/50"
                >
                  <td className="px-5 py-4">
                    <SkeletonCard className="h-4 w-24" />
                  </td>
                  <td className="px-5 py-4">
                    <SkeletonCard className="h-4 w-32" />
                    <SkeletonCard className="mt-1 h-3 w-48" />
                  </td>
                  <td className="px-5 py-4">
                    <SkeletonCard className="h-6 w-24 rounded-md" />
                  </td>
                  <td className="px-5 py-4">
                    <SkeletonCard className="h-4 w-24" />
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <SkeletonCard className="h-4 w-24" />
                  </td>
                  <td className="px-5 py-4">
                    <SkeletonCard className="h-4 w-24" />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <SkeletonCard
                          key={i}
                          className="h-8 w-16 rounded-md"
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
