
"use client";

import Link from "next/link";

import type { ShelterAnalytics } from "@/lib/reports/types";
import { BarChartCard, PieChartCard } from "./charts";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "var(--color-success)",
  INACTIVE: "var(--color-muted)",
  CLOSED: "var(--color-critical)",
};

interface ShelterAnalyticsProps {
  data: ShelterAnalytics;
}

export function ShelterAnalytics({ data }: ShelterAnalyticsProps) {
  const { capacity } = data;
  const statusColors = data.statusBreakdown.map(
    (item) => STATUS_COLORS[item.name] ?? "var(--color-muted)",
  );

  return (
    <section className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="border-b border-border px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Shelter Analytics
          </h2>
          <p className="mt-1 text-xs text-muted">
            Shelter capacity, occupancy, and status. Capacity is a current
            snapshot, not a historical trend.
          </p>
        </div>
        <Link
          href="/shelters"
          className="text-sm text-primary hover:underline"
        >
          View shelters
        </Link>
      </div>

      {capacity.total === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-muted">
            No shelters recorded for your organization.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 p-5">
            <div className="bg-surface-secondary p-4 rounded-xl">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                Total Shelters
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {capacity.total}
              </p>
            </div>
            <div className="bg-surface-secondary p-4 rounded-xl">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                Active Shelters
              </p>
              <p className="mt-1 text-2xl font-bold text-success">
                {capacity.active}
              </p>
            </div>
            <div className="bg-surface-secondary p-4 rounded-xl">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                Total Capacity
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {capacity.totalCapacity}
              </p>
            </div>
            <div className="bg-surface-secondary p-4 rounded-xl">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                Current Occupancy
              </p>
              <p className="mt-1 text-2xl font-bold text-emergency">
                {capacity.totalOccupancy}
              </p>
            </div>
            <div className="bg-surface-secondary p-4 rounded-xl">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                Utilization
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {capacity.utilization}%
              </p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 p-5">
            <PieChartCard
              data={data.statusBreakdown.map((item) => ({ name: item.name, value: item.count }))}
              title="Shelters by Status"
              description="Distribution of shelters by status"
              colors={statusColors}
            />

            <BarChartCard
              data={[
                { name: "Capacity", value: capacity.totalCapacity },
                { name: "Occupied", value: capacity.totalOccupancy },
                { name: "Available", value: capacity.availableCapacity },
              ]}
              title="Capacity vs Occupancy"
              description="Shelter capacity versus current occupancy"
              colors={[
                "var(--color-info)",
                "var(--color-emergency)",
                "var(--color-success)",
              ]}
              hideLegend
            />
          </div>

          <div className="border-t border-border p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted">
                Overall Occupancy Utilization
              </span>
              <span className="text-sm font-bold text-foreground">
                {capacity.utilization}%
              </span>
            </div>
            <div className="w-full bg-surface-secondary rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-success"
                style={{
                  width: Math.min(100, Math.max(0, capacity.utilization)),
                }}
              />
            </div>
            <p className="mt-1 text-xs text-muted">
              {capacity.totalOccupancy} of {capacity.totalCapacity} capacity
              occupied ({capacity.availableCapacity} available)
            </p>
          </div>
        </>
      )}
    </section>
  );
}
