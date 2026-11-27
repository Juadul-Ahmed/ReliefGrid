
import {
  getEmergencyRequestAnalytics,
  getIncidentAnalytics,
  getInventoryAnalytics,
  getReportsKpiSummary,
  getResourceAnalytics,
  getShelterAnalytics,
  getStockMovementAnalytics,
} from "@/lib/reports/queries";
import { DATE_RANGE_OPTIONS, type ReportsDateRange } from "@/lib/reports/types";
import { requireOrganization } from "@/lib/permissions/organization";
import { ReportsOverview } from "@/features/reports/components/reports-overview";

const DEFAULT_RANGE: ReportsDateRange = "30d";

export function resolveDays(range: string): number {
  if (range === "7d") return 7;
  if (range === "90d") return 90;
  return 30;
}

export function resolveRange(rawRange: string | undefined): ReportsDateRange {
  return (
    DATE_RANGE_OPTIONS.find((o) => o.value === rawRange)?.value ?? DEFAULT_RANGE
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const { organizationId } = await requireOrganization();

  const rawRange = searchParams.range as ReportsDateRange | undefined;
  const range = resolveRange(rawRange);
  const days = resolveDays(range);

  const [
    kpis,
    incidents,
    requests,
    resources,
    inventory,
    stockMovements,
    shelters,
  ] = await Promise.all([
    getReportsKpiSummary(organizationId),
    getIncidentAnalytics(organizationId, days),
    getEmergencyRequestAnalytics(organizationId, days),
    getResourceAnalytics(organizationId),
    getInventoryAnalytics(organizationId),
    getStockMovementAnalytics(organizationId, days),
    getShelterAnalytics(organizationId),
  ]);

  return (
    <ReportsOverview
      kpis={kpis}
      incidents={incidents}
      requests={requests}
      resources={resources}
      inventory={inventory}
      stockMovements={stockMovements}
      shelters={shelters}
      range={range}
    />
  );
}
