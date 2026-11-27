
import Link from "next/link";

import type { InventoryOverviewItem } from "@/lib/inventory/queries";
import type { ResourceCategoryBreakdownItem } from "@/lib/resources/queries";

interface ResourceOverviewProps {
  totalResources: number;
  activeResources: number;
  availableStock: string;
  reservedStock: string;
  lowStock: InventoryOverviewItem[];
  outOfStock: InventoryOverviewItem[];
  categoryBreakdown: ResourceCategoryBreakdownItem[];
  recentMovements: Array<{
    id: string;
    type: string;
    quantity: string;
    reason: string | null;
    createdAt: Date;
    resourceName: string;
    unit: string;
  }>;
}

function categoryColor(category: string): string {
  switch (category) {
    case "FOOD":
      return "bg-success/10 text-success";
    case "DRINKING_WATER":
      return "bg-info/10 text-info";
    case "MEDICAL_SUPPLIES":
      return "bg-critical/10 text-critical";
    case "SHELTER":
      return "bg-emergency/10 text-emergency";
    case "RESCUE":
      return "bg-info/10 text-info";
    case "TRANSPORTATION":
      return "bg-success/10 text-success";
    default:
      return "bg-muted/10 text-muted";
  }
}

function formatCategory(category: string): string {
  return category
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function relativeTime(createdAt: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(createdAt).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;

  return new Date(createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function ResourceOverview({
  totalResources,
  activeResources,
  availableStock,
  reservedStock,
  lowStock,
  outOfStock,
  categoryBreakdown,
  recentMovements,
}: ResourceOverviewProps) {
  const totalAlerts = lowStock.length + outOfStock.length;

  return (
    <section className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">
              Resource Overview
            </h3>
            <p className="mt-1 text-xs text-muted">
              Registered resources and inventory status
            </p>
          </div>
          <Link
            href="/resources"
            className="text-sm text-primary hover:underline"
          >
            View all resources
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-5">
        <div className="bg-surface-secondary p-3 rounded-lg">
          <p className="text-xs text-muted">Total Resources</p>
          <p className="text-lg font-bold text-foreground">
            {totalResources}
          </p>
        </div>
        <div className="bg-surface-secondary p-3 rounded-lg">
          <p className="text-xs text-muted">Active</p>
          <p className="text-lg font-bold text-success">
            {activeResources}
          </p>
        </div>
        <div className="bg-surface-secondary p-3 rounded-lg">
          <p className="text-xs text-muted">Available Stock</p>
          <p className="text-lg font-bold text-foreground">
            {availableStock}
          </p>
        </div>
        <div className="bg-surface-secondary p-3 rounded-lg">
          <p className="text-xs text-muted">Reserved Stock</p>
          <p className="text-lg font-bold text-foreground">
            {reservedStock}
          </p>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="border-t border-border px-5 py-4">
        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
          Resources by Category
        </h4>

        {categoryBreakdown.length === 0 ? (
          <p className="text-sm text-muted">
            No resources registered for your organization.
          </p>
        ) : (
          <ul className="space-y-2">
            {categoryBreakdown.map((item) => (
              <li
                key={item.category}
                className="flex items-center justify-between gap-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold ${categoryColor(item.category)}`}
                  >
                    {formatCategory(item.category)}
                  </span>
                  <span className="text-xs text-muted">
                    {item.count}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Alerts summary */}
      {totalAlerts > 0 && (
        <div className="border-t border-border px-5 py-4">
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
            Stock Alerts
          </h4>
          <ul className="space-y-2">
            {outOfStock.slice(0, 3).map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-critical">
                    {item.resourceName} — Out of stock
                  </p>
                  <p className="text-xs text-muted">
                    {item.available} {item.unit} available
                  </p>
                </div>
                <span className="text-xs text-critical">
                  OUT
                </span>
              </li>
            ))}
            {lowStock.slice(0, 3).map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-emergency">
                    {item.resourceName} — Low stock
                  </p>
                  <p className="text-xs text-muted">
                    {item.available} {item.unit} available
                  </p>
                </div>
                <span className="text-xs text-emergency">
                  LOW
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent movements */}
      <div className="border-t border-border px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">
            Recent Stock Movements
          </h4>
          <Link
            href="/resources/movements"
            className="text-xs text-primary hover:underline"
          >
            View all
          </Link>
        </div>

        {recentMovements.length === 0 ? (
          <p className="text-sm text-muted">
            No stock movements recorded.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {recentMovements.slice(0, 5).map((movement) => (
              <li
                key={movement.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {movement.resourceName}
                  </p>
                  <p className="text-xs text-muted">
                    {movement.type} · {relativeTime(movement.createdAt)}
                    {movement.reason ? ` · ${movement.reason}` : ""}
                  </p>
                </div>
                <span className="text-xs font-mono text-muted">
                  {movement.quantity} {movement.unit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
