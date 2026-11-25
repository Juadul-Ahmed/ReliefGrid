import Link from "next/link";
import { HiOutlineClock } from "react-icons/hi2";

import type { StockMovementPage } from "@/lib/inventory/queries";

interface StockMovementHistoryProps {
  page: StockMovementPage;
  basePath: string;
  type?: string;
  resourceId?: string;
  showResource?: boolean;
  hasFilters?: boolean;
}

const typeLabels: Record<string, string> = {
  IN: "Stock in",
  OUT: "Stock out",
  RESERVE: "Reserved",
  RELEASE: "Released",
  ADJUST: "Adjustment",
};

function typeStyle(type: string) {
  switch (type) {
    case "IN":
      return "bg-green-500/10 text-green-600";
    case "OUT":
      return "bg-orange-500/10 text-orange-600";
    case "RESERVE":
      return "bg-blue-500/10 text-blue-600";
    case "RELEASE":
      return "bg-yellow-500/10 text-yellow-600";
    default:
      return "bg-muted/10 text-muted";
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function buildHref(
  basePath: string,
  page: number,
  type?: string,
  resourceId?: string,
) {
  const params = new URLSearchParams();

  if (type) params.set("type", type);
  if (resourceId) params.set("resourceId", resourceId);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();

  return query ? `${basePath}?${query}` : basePath;
}

export function StockMovementHistory({
  page,
  basePath,
  type,
  resourceId,
  showResource = false,
  hasFilters = false,
}: StockMovementHistoryProps) {
  if (page.items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center">
        <HiOutlineClock className="mx-auto size-10 text-muted" />

        <h3 className="mt-3 text-base font-semibold">
          No stock movements found
        </h3>

        <p className="mt-1 text-sm text-muted">
          {hasFilters
            ? "Try adjusting your filters."
            : "Stock movements will appear here once inventory changes."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-semibold">Stock Movement History</h2>

        <p className="mt-1 text-sm text-muted">
          {page.total} movement{page.total !== 1 ? "s" : ""} · page {page.page}{" "}
          of {page.totalPages}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-background">
            <tr>
              {showResource && (
                <th className="px-5 py-3 font-medium">Resource</th>
              )}

              <th className="px-5 py-3 font-medium">Type</th>

              <th className="px-5 py-3 font-medium">Quantity</th>

              <th className="px-5 py-3 font-medium">Reason</th>

              <th className="px-5 py-3 font-medium">Actor</th>

              <th className="px-5 py-3 font-medium">Date</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {page.items.map((movement) => (
              <tr
                key={movement.id}
                className="transition hover:bg-background"
              >
                {showResource && (
                  <td className="px-5 py-4">
                    <Link
                      href={`/resources/${movement.resourceId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {movement.resourceName}
                    </Link>
                  </td>
                )}

                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${typeStyle(movement.type)}`}
                  >
                    {typeLabels[movement.type] ?? movement.type}
                  </span>
                </td>

                <td className="whitespace-nowrap px-5 py-4">
                  {movement.quantity} {movement.unit}
                </td>

                <td className="px-5 py-4">{movement.reason ?? "—"}</td>

                <td className="px-5 py-4">{movement.actorName ?? "—"}</td>

                <td className="whitespace-nowrap px-5 py-4">
                  {formatDate(movement.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(page.page > 1 || page.page < page.totalPages) && (
        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
          {page.page > 1 ? (
            <Link
              href={buildHref(basePath, page.page - 1, type, resourceId)}
              className="text-primary hover:underline"
            >
              ← Previous
            </Link>
          ) : (
            <span className="text-muted">← Previous</span>
          )}

          {page.page < page.totalPages ? (
            <Link
              href={buildHref(basePath, page.page + 1, type, resourceId)}
              className="text-primary hover:underline"
            >
              Next →
            </Link>
          ) : (
            <span className="text-muted">Next →</span>
          )}
        </div>
      )}
    </div>
  );
}