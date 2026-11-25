import Link from "next/link";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";

import type { InventoryOverviewItem } from "@/lib/inventory/queries";

interface LowStockPanelProps {
  lowStock: InventoryOverviewItem[];
  outOfStock: InventoryOverviewItem[];
}

function StockBadge({ status }: { status: InventoryOverviewItem["status"] }) {
  const styles =
    status === "OUT"
      ? "bg-red-500/10 text-red-600"
      : "bg-amber-500/10 text-amber-600";

  const label = status === "OUT" ? "Out of stock" : "Low stock";

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles}`}
    >
      {label}
    </span>
  );
}

export function LowStockPanel({ lowStock, outOfStock }: LowStockPanelProps) {
  const alerts = [...outOfStock, ...lowStock];

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HiOutlineExclamationTriangle className="size-5 text-amber-500" />
          <h2 className="text-lg font-semibold">Stock Alerts</h2>
        </div>

        <Link
          href="/resources"
          className="text-sm text-primary hover:underline"
        >
          View resources
        </Link>
      </div>

      {alerts.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          No low-stock or out-of-stock items. All inventory is healthy.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {alerts.slice(0, 8).map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <Link
                  href={`/resources/${item.resourceId}`}
                  className="truncate text-sm font-medium hover:text-primary"
                >
                  {item.resourceName}
                </Link>
                <p className="text-xs text-muted">
                  {item.available} {item.unit} available
                  {item.lowStockThreshold !== null
                    ? ` · threshold ${item.lowStockThreshold} ${item.unit}`
                    : ""}
                </p>
              </div>

              <StockBadge status={item.status} />
            </li>
          ))}
        </ul>
      )}

      {alerts.length > 8 && (
        <p className="mt-3 text-xs text-muted">
          Showing 8 of {alerts.length} alerts.
        </p>
      )}
    </section>
  );
}