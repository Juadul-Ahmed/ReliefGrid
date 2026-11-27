
import type { InventoryOverview } from "@/lib/inventory/queries";
import type { RecentIncident } from "@/lib/incidents/queries";
import type { DashboardStat } from "../types/dashboard.types";
import { DashboardWelcome } from "./dashboard-welcome";
import { DashboardStats } from "./dashboard-stats";
import { LowStockPanel } from "./low-stock-panel";
import { RecentIncidents } from "./recent-incidents";
import { IncidentSeverity } from "./incident-severity";
import { EmergencyRequestOverview } from "./emergency-request-overview";
import { ResourceOverview } from "./resource-overview";
import { RecentActivity } from "./recent-activity";
import { OperationalAlerts } from "./operational-alerts";

interface DashboardOverviewProps {
  stats: DashboardStat[];
  overview: InventoryOverview;
  incidents: RecentIncident[];
  severityBreakdown: Array<{ severity: string; count: number }>;
  recentRequests: Array<{
    id: string;
    requestNumber: string;
    title: string;
    category: string;
    priority: string;
    status: string;
    requiredBy: Date | null;
    createdAt: Date;
  }>;
  requestStats: {
    total: number;
    submitted: number;
    underReview: number;
    verified: number;
    rejected: number;
    fulfilled: number;
  };
  resourceStats: { total: number; active: number };
  inventoryStats: {
    activeResources: number;
    inventoryItems: number;
    onHand: string;
    reserved: string;
    available: string;
  };
  categoryBreakdown: Array<{ category: string; count: number }>;
  recentMovements: Array<{
    id: string;
    type: string;
    quantity: string;
    reason: string | null;
    createdAt: Date;
    resourceName: string;
    unit: string;
  }>;
  activity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    actorName: string | null;
    actorUserId: string | null;
    createdAt: Date;
  }>;
  alerts: Array<{
    title: string;
    description: string;
    severity: "critical" | "warning" | "info";
    count: number;
    href?: string;
  }>;
}

export function DashboardOverview({
  stats,
  overview,
  incidents,
  severityBreakdown,
  recentRequests,
  requestStats,
  resourceStats,
  inventoryStats,
  categoryBreakdown,
  recentMovements,
  activity,
  alerts,
}: DashboardOverviewProps) {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <DashboardWelcome />

      <DashboardStats stats={stats} />

      <OperationalAlerts alerts={alerts} />

      <LowStockPanel
        lowStock={overview.lowStock}
        outOfStock={overview.outOfStock}
      />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <RecentIncidents incidents={incidents} />
        <IncidentSeverity breakdown={severityBreakdown} />
      </section>

      <EmergencyRequestOverview
        stats={requestStats}
        recentRequests={recentRequests}
      />

      <ResourceOverview
        totalResources={resourceStats.total}
        activeResources={resourceStats.active}
        availableStock={inventoryStats.available}
        reservedStock={inventoryStats.reserved}
        lowStock={overview.lowStock}
        outOfStock={overview.outOfStock}
        categoryBreakdown={categoryBreakdown}
        recentMovements={recentMovements}
      />

      <RecentActivity activity={activity} />
    </div>
  );
}
