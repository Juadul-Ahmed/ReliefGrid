
"use client";

import type {
  IncidentAnalytics as IncidentAnalyticsType,
  InventoryAnalytics as InventoryAnalyticsType,
  KpiSummary as KpiSummaryType,
  ReportsDateRange,
  RequestAnalytics as RequestAnalyticsType,
  ResourceAnalytics as ResourceAnalyticsType,
  ShelterAnalytics as ShelterAnalyticsType,
  StockMovementAnalytics as StockMovementAnalyticsType,
} from "@/lib/reports/types";

import { ReportsHeader } from "./reports-header";
import { ReportsKpiGrid } from "./reports-kpi-grid";
import { IncidentAnalytics } from "./incident-analytics";
import { RequestAnalytics } from "./request-analytics";
import { ResourceAnalytics } from "./resource-analytics";
import { ShelterAnalytics } from "./shelter-analytics";

interface ReportsOverviewProps {
  kpis: KpiSummaryType;
  incidents: IncidentAnalyticsType;
  requests: RequestAnalyticsType;
  resources: ResourceAnalyticsType;
  inventory: InventoryAnalyticsType;
  stockMovements: StockMovementAnalyticsType;
  shelters: ShelterAnalyticsType;
  range: ReportsDateRange;
}

export function ReportsOverview({
  kpis,
  incidents,
  requests,
  resources,
  inventory,
  stockMovements,
  shelters,
  range,
}: ReportsOverviewProps) {
  const isEmpty =
    kpis.totalIncidents === 0 &&
    kpis.totalRequests === 0 &&
    kpis.totalResources === 0 &&
    kpis.totalShelters === 0 &&
    kpis.lowStockCount === 0 &&
    kpis.outOfStockCount === 0;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <ReportsHeader currentRange={range} />

      <ReportsKpiGrid kpis={kpis} />

      <IncidentAnalytics data={incidents} />

      <RequestAnalytics data={requests} />

      <ResourceAnalytics
        resources={resources}
        inventory={inventory}
        stockMovements={stockMovements}
      />

      <ShelterAnalytics data={shelters} />

      {isEmpty && (
        <section className="rounded-xl border border-border bg-surface p-12 text-center">
          <p className="text-sm text-muted">
            No data available for the selected range ({range}). Data appears
            as incidents, requests, resources, and shelters are recorded for
            your organization.
          </p>
        </section>
      )}
    </div>
  );
}
