
"use client";

import Link from "next/link";

import type { InventoryAnalytics } from "@/lib/reports/types";
import type { ResourceAnalytics } from "@/lib/reports/types";
import type { StockMovementAnalytics } from "@/lib/reports/types";
import {
  BarChartCard,
  LineChartCard,
  PieChartCard,
} from "./charts";

interface ResourceAnalyticsProps {
  resources: ResourceAnalytics;
  inventory: InventoryAnalytics;
  stockMovements: StockMovementAnalytics;
}

function formatDecimal(value: string): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export { formatDecimal };

function formatDecimalDisplay(value: string): string {
  const num = formatDecimal(value);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function ResourceAnalytics({
  resources,
  inventory,
  stockMovements,
}: ResourceAnalyticsProps) {
  const movementTypeColors: Record<string, string> = {
    IN: "var(--color-success)",
    OUT: "var(--color-critical)",
    RESERVE: "var(--color-emergency)",
    RELEASE: "var(--color-info)",
    ADJUST: "var(--color-muted)",
  };

  const movementTrendData = stockMovements.trends.map((point) => ({
    name: point.date,
    value: point.count,
  }));

  return (
    <section className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="border-b border-border px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Resource &amp; Inventory Analytics
          </h2>
          <p className="mt-1 text-xs text-muted">
            Resource catalog, stock levels, and movement trends. Inventory
            balances are current snapshots, not historical values.
          </p>
        </div>
        <Link
          href="/resources"
          className="text-sm text-primary hover:underline"
        >
          View resources
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 p-5">
        <div className="bg-surface-secondary p-4 rounded-xl">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">
            Total Resources
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {resources.total}
          </p>
        </div>
        <div className="bg-surface-secondary p-4 rounded-xl">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">
            Active Resources
          </p>
          <p className="mt-1 text-2xl font-bold text-success">
            {resources.active}
          </p>
        </div>
        <div className="bg-surface-secondary p-4 rounded-xl">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">
            On Hand
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {formatDecimalDisplay(inventory.onHand)}
          </p>
        </div>
        <div className="bg-surface-secondary p-4 rounded-xl">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">
            Available
          </p>
          <p className="mt-1 text-2xl font-bold text-success">
            {formatDecimalDisplay(inventory.available)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 p-5">
        <PieChartCard
          data={resources.byCategory.map((item) => ({ name: item.name, value: item.count }))}
          title="Resources by Category"
          description="Distribution of resources by category"
        />

        <BarChartCard
          data={[
            { name: "On Hand", value: formatDecimal(inventory.onHand) },
            { name: "Reserved", value: formatDecimal(inventory.reserved) },
            { name: "Available", value: formatDecimal(inventory.available) },
          ]}
          title="Stock Availability"
          description="Current stock quantities (snapshot)"
          colors={[
            "var(--color-info)",
            "var(--color-emergency)",
            "var(--color-success)",
          ]}
          hideLegend
        />

        <BarChartCard
          data={stockMovements.byType.map((item) => ({ name: item.type, value: item.count }))}
          title="Stock Movements by Type"
          description="Movement count by type"
          colors={stockMovements.byType.map(
            (item) => movementTypeColors[item.type] ?? "var(--color-muted)",
          )}
          hideLegend
        />
      </div>

      <div className="border-t border-border p-5">
        <LineChartCard
          data={movementTrendData}
          title="Stock Movement Trends"
          description="Stock movements created per day"
          color="var(--color-info)"
        />
      </div>

      <div className="border-t border-border p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-4 rounded-xl bg-surface-secondary">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Reserved Stock
            </p>
            <p className="mt-1 text-xl font-bold text-foreground">
              {formatDecimalDisplay(inventory.reserved)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-secondary">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Low-Stock Items
            </p>
            <p className={`mt-1 text-xl font-bold ${inventory.lowStockCount > 0 ? "text-critical" : "text-success"}`}>
              {inventory.lowStockCount}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-secondary">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Out-of-Stock Items
            </p>
            <p className={`mt-1 text-xl font-bold ${inventory.outOfStockCount > 0 ? "text-critical" : "text-success"}`}>
              {inventory.outOfStockCount}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
