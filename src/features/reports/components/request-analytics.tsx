
"use client";

import Link from "next/link";

import type { RequestAnalytics } from "@/lib/reports/types";
import {
  BarChartCard,
  LineChartCard,
  PieChartCard,
} from "./charts";

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "var(--color-critical)",
  HIGH: "var(--color-emergency)",
  MEDIUM: "var(--color-info)",
  LOW: "var(--color-success)",
};

interface RequestAnalyticsProps {
  data: RequestAnalytics;
}

export function RequestAnalytics({ data }: RequestAnalyticsProps) {
  const priorityColors = data.byPriority.map(
    (item) => PRIORITY_COLORS[item.name] ?? "var(--color-muted)",
  );

  const trendData = data.trends.map((point) => ({
    name: point.date,
    value: point.count,
  }));

  return (
    <section className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="border-b border-border px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Emergency Request Analytics
          </h2>
          <p className="mt-1 text-xs text-muted">
            Request volume, status, and fulfillment for your organization.
          </p>
        </div>
        <Link
          href="/requests"
          className="text-sm text-primary hover:underline"
        >
          View all requests
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 p-5">
        <LineChartCard
          data={trendData}
          title="Requests Over Time"
          description="New requests created per day"
          color="var(--color-info)"
        />

        <BarChartCard
          data={data.byPriority.map((item) => ({ name: item.name, value: item.count }))}
          title="Requests by Priority"
          description="Distribution of requests by priority level"
          colors={priorityColors}
        />

        <PieChartCard
          data={data.byStatus.map((item) => ({ name: item.name, value: item.count }))}
          title="Requests by Status"
          description="Distribution of requests by current status"
        />
      </div>

      <div className="border-t border-border bg-surface-secondary p-5">
        <BarChartCard
          data={data.byCategory.map((item) => ({ name: item.name, value: item.count }))}
          title="Requests by Category"
          description="Distribution of requests by category"
          colors={data.byCategory.map(() => "var(--color-emergency)")}
          hideLegend
        />
      </div>

      <div className="border-t border-border p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Fulfillment Rate
            </p>
            <p className="mt-1 text-3xl font-bold text-foreground">
              {data.fulfillmentRate}%
            </p>
            <p className="mt-1 text-xs text-muted">
              {data.fulfilled} of {data.total} requests fulfilled
            </p>
          </div>
          <div className="flex size-20 items-center justify-center rounded-full bg-success/10 text-success border border-success/20">
            <span className="text-sm font-semibold">{data.fulfilled}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
