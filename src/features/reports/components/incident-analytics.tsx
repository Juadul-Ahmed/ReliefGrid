
"use client";

import type { IncidentAnalytics } from "@/lib/reports/types";
import {
  BarChartCard,
  LineChartCard,
  PieChartCard,
} from "./charts";

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "var(--color-critical)",
  HIGH: "var(--color-emergency)",
  MODERATE: "var(--color-info)",
  LOW: "var(--color-success)",
};

interface IncidentAnalyticsProps {
  data: IncidentAnalytics;
}

export function IncidentAnalytics({ data }: IncidentAnalyticsProps) {
  const severityColors = data.bySeverity.map(
    (item) => SEVERITY_COLORS[item.name] ?? "var(--color-muted)",
  );

  const trendData = data.trends.map((point) => ({
    name: point.date,
    value: point.count,
  }));

  return (
    <section className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground">
          Incident Analytics
        </h2>
        <p className="mt-1 text-xs text-muted">
          Incident creation and distribution for your organization.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 p-5">
        <LineChartCard
          data={trendData}
          title="Incidents Over Time"
          description="New incidents created per day"
          color="var(--color-critical)"
        />

        <BarChartCard
          data={data.bySeverity.map((item) => ({ name: item.name, value: item.count }))}
          title="Incidents by Severity"
          description="Distribution of incidents by severity level"
          colors={severityColors}
        />

        <PieChartCard
          data={data.byStatus.map((item) => ({ name: item.name, value: item.count }))}
          title="Incidents by Status"
          description="Distribution of incidents by current status"
        />
      </div>

      <div className="border-t border-border bg-surface-secondary p-5">
        <BarChartCard
          data={data.byCategory.map((item) => ({ name: item.name, value: item.count }))}
          title="Incidents by Category"
          description="Distribution of incidents by category"
          colors={data.byCategory.map(() => "var(--color-info)")}
          hideLegend
        />
      </div>
    </section>
  );
}
