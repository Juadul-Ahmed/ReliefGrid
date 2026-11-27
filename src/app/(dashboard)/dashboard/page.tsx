
import {
  HiOutlineClipboardDocumentList,
  HiOutlineCube,
  HiOutlineExclamationTriangle,
  HiOutlineFire,
  HiOutlineTruck,
} from "react-icons/hi2";

import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import {
  getInventoryOverview,
  getInventoryStats,
} from "@/lib/inventory/queries";
import {
  getIncidentSeverityBreakdown,
  getIncidentStats,
  getRecentIncidents,
} from "@/lib/incidents/queries";
import {
  getEmergencyRequestStats,
  getEmergencyRequests,
} from "@/lib/requests/queries";
import {
  getResourceCategoryBreakdown,
  getResourceStats,
} from "@/lib/resources/queries";
import {
  getStockMovements,
} from "@/lib/inventory/queries";
import { getAuditActivity } from "@/lib/dashboard/queries";
import { requireOrganization } from "@/lib/permissions/organization";

export default async function DashboardPage() {
  const { organizationId } = await requireOrganization();

  const [
    stats,
    overview,
    incidents,
    incidentStats,
    requestStatsResult,
    resourceStats,
    severityBreakdown,
    recentRequests,
    categoryBreakdown,
    recentMovements,
    auditActivity,
  ] = await Promise.all([
    getInventoryStats(organizationId),
    getInventoryOverview(organizationId),
    getRecentIncidents(organizationId),
    getIncidentStats(organizationId),
    getEmergencyRequestStats(organizationId),
    getResourceStats(organizationId),
    getIncidentSeverityBreakdown(organizationId),
    getEmergencyRequests(organizationId).then((rows) =>
      rows.slice(0, 10),
    ),
    getResourceCategoryBreakdown(organizationId),
    getStockMovements(organizationId, { page: 1 }).then((result) =>
      result.items.slice(0, 10),
    ),
    getAuditActivity(organizationId),
  ]);

  const pendingRequests =
    requestStatsResult.submitted + requestStatsResult.underReview;

  // Build operational alerts from real data
  const alerts: Array<{
    title: string;
    description: string;
    severity: "critical" | "warning" | "info";
    count: number;
    href?: string;
  }> = [];

  // Critical active incidents
  if (incidentStats.critical > 0) {
    alerts.push({
      title: "Critical active incidents",
      description: "Unresolved critical severity incidents require attention",
      severity: "critical",
      count: incidentStats.critical,
      href: "/incidents",
    });
  }

  // Out of stock items
  if (overview.outOfStock.length > 0) {
    alerts.push({
      title: "Out of stock items",
      description: "Inventory items with zero stock on hand",
      severity: "critical",
      count: overview.outOfStock.length,
      href: "/resources",
    });
  }

  // Low stock items
  if (overview.lowStock.length > 0) {
    alerts.push({
      title: "Low stock items",
      description: "Inventory items at or below low-stock threshold",
      severity: "warning",
      count: overview.lowStock.length,
      href: "/resources",
    });
  }

  // Pending requests
  if (pendingRequests > 0) {
    alerts.push({
      title: "Pending emergency requests",
      description: "Requests submitted or under review awaiting action",
      severity: "warning",
      count: pendingRequests,
      href: "/requests",
    });
  }

  const dashboardStats = [
    {
      title: "Active Resources",
      value: String(stats.activeResources),
      change: "Now",
      trend: "up" as const,
      description: "Active resource records",
      icon: HiOutlineCube,
      iconStyle: "bg-info/10 text-info",
    },
    {
      title: "Total Resources",
      value: String(resourceStats.total),
      change: "Now",
      trend: "up" as const,
      description: `${resourceStats.active} active`,
      icon: HiOutlineCube,
      iconStyle: "bg-info/10 text-info",
    },
    {
      title: "Inventory Items",
      value: String(stats.inventoryItems),
      change: "Now",
      trend: "up" as const,
      description: "Tracked stock items",
      icon: HiOutlineClipboardDocumentList,
      iconStyle: "bg-emergency/10 text-emergency",
    },
    {
      title: "Available Stock",
      value: stats.available,
      change: "Now",
      trend: "up" as const,
      description: "On hand minus reserved",
      icon: HiOutlineTruck,
      iconStyle: "bg-success/10 text-success",
    },
    {
      title: "Stock Alerts",
      value: String(overview.lowStock.length + overview.outOfStock.length),
      change: "Now",
      trend: "up" as const,
      description: `${overview.outOfStock.length} out of stock`,
      icon: HiOutlineExclamationTriangle,
      iconStyle: "bg-critical/10 text-critical",
    },
    {
      title: "Active Incidents",
      value: String(incidentStats.active),
      change: "Now",
      trend: "up" as const,
      description: "Open, assessing, or active",
      icon: HiOutlineFire,
      iconStyle: "bg-critical/10 text-critical",
    },
    {
      title: "Critical Incidents",
      value: String(incidentStats.critical),
      change: "Now",
      trend: "up" as const,
      description: "Critical severity, unresolved",
      icon: HiOutlineExclamationTriangle,
      iconStyle: "bg-critical/10 text-critical",
    },
    {
      title: "Pending Requests",
      value: String(pendingRequests),
      change: "Now",
      trend: "up" as const,
      description: "Submitted or under review",
      icon: HiOutlineClipboardDocumentList,
      iconStyle: "bg-emergency/10 text-emergency",
    },
  ];

  return (
    <DashboardOverview
      stats={dashboardStats}
      overview={overview}
      incidents={incidents}
      severityBreakdown={severityBreakdown}
      recentRequests={recentRequests}
      requestStats={requestStatsResult}
      resourceStats={resourceStats}
      inventoryStats={stats}
      categoryBreakdown={categoryBreakdown}
      recentMovements={recentMovements}
      activity={auditActivity}
      alerts={alerts}
    />
  );
}
