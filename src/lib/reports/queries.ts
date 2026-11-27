
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  DATE_RANGE_OPTIONS,
  getDateRangeFilter,
  getEmergencyRequestTrends,
  getIncidentTrends,
  groupTrendsByDate,
  type DateRange,
  type TrendDataPoint,
} from "@/lib/dashboard/queries";
import {
  getEmergencyRequestScope,
  getEmergencyRequestStats,
} from "@/lib/requests/queries";
import {
  getIncidentStats,
  getIncidentSeverityBreakdown,
  getIncidentStatusBreakdown,
  getOrganizationIncidentScope,
} from "@/lib/incidents/queries";
import { getInventoryOverview, getInventoryStats } from "@/lib/inventory/queries";
import {
  getResourceCategoryBreakdown,
  getResourceStats,
} from "@/lib/resources/queries";
import type {
  IncidentAnalytics,
  InventoryAnalytics,
  KpiSummary,
  RequestAnalytics,
  ResourceAnalytics,
  ShelterAnalytics,
  StockMovementAnalytics,
} from "./types";

export type { DateRange, TrendDataPoint };
export type { ReportsDateRange } from "./types";
export { DATE_RANGE_OPTIONS, getDateRangeFilter };

const DEFAULT_DAYS = 30;
const TREND_TAKE_LIMIT = 1000;

export async function getIncidentAnalytics(
  organizationId: string,
  days: number = DEFAULT_DAYS,
): Promise<IncidentAnalytics> {
  const scope = getOrganizationIncidentScope(organizationId);

  const [stats, severity, status, categoryRows, trends] = await Promise.all([
    getIncidentStats(organizationId),
    getIncidentSeverityBreakdown(organizationId),
    getIncidentStatusBreakdown(organizationId),
    prisma.incident.groupBy({
      by: ["category"],
      where: scope,
      _count: { category: true },
    }),
    getIncidentTrends(organizationId, days),
  ]);

  return {
    total: stats.total,
    active: stats.active,
    critical: stats.critical,
    resolved: stats.resolved,
    byStatus: status.map((row) => ({
      name: row.status,
      count: row.count,
    })),
    bySeverity: severity.map((row) => ({
      name: row.severity,
      count: row.count,
    })),
    byCategory: categoryRows.map((row) => ({
      name: row.category,
      count: row._count.category,
    })),
    trends,
  };
}

export async function getEmergencyRequestAnalytics(
  organizationId: string,
  days: number = DEFAULT_DAYS,
): Promise<RequestAnalytics> {
  const scope = getEmergencyRequestScope(organizationId);

  const [stats, statusRows, priorityRows, categoryRows, trends] =
    await Promise.all([
      getEmergencyRequestStats(organizationId),
      prisma.emergencyRequest.groupBy({
        by: ["status"],
        where: scope,
        _count: { status: true },
      }),
      prisma.emergencyRequest.groupBy({
        by: ["priority"],
        where: scope,
        _count: { priority: true },
      }),
      prisma.emergencyRequest.groupBy({
        by: ["category"],
        where: scope,
        _count: { category: true },
      }),
      getEmergencyRequestTrends(organizationId, days),
    ]);

  const pending = stats.submitted + stats.underReview;
  const fulfillmentRate =
    stats.total > 0 ? Math.round((stats.fulfilled / stats.total) * 100) : 0;

  return {
    total: stats.total,
    pending,
    fulfilled: stats.fulfilled,
    fulfillmentRate,
    byStatus: statusRows.map((row) => ({
      name: row.status,
      count: row._count.status,
    })),
    byPriority: priorityRows.map((row) => ({
      name: row.priority,
      count: row._count.priority,
    })),
    byCategory: categoryRows.map((row) => ({
      name: row.category,
      count: row._count.category,
    })),
    trends,
  };
}

export async function getResourceAnalytics(
  organizationId: string,
): Promise<ResourceAnalytics> {
  const [stats, categoryRows] = await Promise.all([
    getResourceStats(organizationId),
    getResourceCategoryBreakdown(organizationId),
  ]);

  return {
    total: stats.total,
    active: stats.active,
    inactive: stats.total - stats.active,
    byCategory: categoryRows.map((row) => ({
      name: row.category,
      count: row.count,
    })),
  };
}

export async function getInventoryAnalytics(
  organizationId: string,
): Promise<InventoryAnalytics> {
  const [stats, overview] = await Promise.all([
    getInventoryStats(organizationId),
    getInventoryOverview(organizationId),
  ]);

  return {
    onHand: stats.onHand,
    reserved: stats.reserved,
    available: stats.available,
    lowStockCount: overview.lowStock.length,
    outOfStockCount: overview.outOfStock.length,
  };
}

export async function getStockMovementAnalytics(
  organizationId: string,
  days: number = DEFAULT_DAYS,
): Promise<StockMovementAnalytics> {
  const startDate = getDateRangeFilter(days);

  const movementWhere: Prisma.StockMovementWhereInput = {
    inventoryItem: { organizationId },
  };

  const [byTypeRows, trendRows] = await Promise.all([
    prisma.stockMovement.groupBy({
      by: ["type"],
      where: movementWhere,
      _sum: { quantity: true },
      _count: { type: true },
    }),
    prisma.stockMovement.findMany({
      where: {
        ...movementWhere,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
      take: TREND_TAKE_LIMIT,
    }),
  ]);

  const byType = byTypeRows.map((row) => ({
    type: row.type,
    quantity: row._sum.quantity?.toString() ?? new Prisma.Decimal(0).toString(),
    count: row._count.type,
  }));

  const trends = groupTrendsByDate(trendRows, days);

  return { byType, trends };
}

export async function getShelterAnalytics(
  organizationId: string,
): Promise<ShelterAnalytics> {
  const [aggregate, statusRows] = await Promise.all([
    prisma.shelter.aggregate({
      where: { organizationId },
      _count: { _all: true },
      _sum: { capacity: true, currentOccupancy: true },
    }),
    prisma.shelter.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: { status: true },
    }),
  ]);

  const totalCapacity = aggregate._sum.capacity ?? 0;
  const totalOccupancy = aggregate._sum.currentOccupancy ?? 0;
  const availableCapacity = Math.max(0, totalCapacity - totalOccupancy);
  const utilization =
    totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  const countByStatus = (status: string): number => {
    const row = statusRows.find((r) => r.status === status);
    return row?._count.status ?? 0;
  };

  return {
    capacity: {
      total: aggregate._count._all,
      active: countByStatus("ACTIVE"),
      inactive: countByStatus("INACTIVE"),
      closed: countByStatus("CLOSED"),
      totalCapacity,
      totalOccupancy,
      availableCapacity,
      utilization,
    },
    statusBreakdown: statusRows.map((row) => ({
      name: row.status,
      count: row._count.status,
    })),
  };
}

export async function getReportsKpiSummary(
  organizationId: string,
): Promise<KpiSummary> {
  const [
    incidents,
    requests,
    resources,
    inventoryOverview,
    shelters,
  ] = await Promise.all([
    getIncidentStats(organizationId),
    getEmergencyRequestStats(organizationId),
    getResourceStats(organizationId),
    getInventoryOverview(organizationId),
    getShelterAnalytics(organizationId),
  ]);

  const pending = requests.submitted + requests.underReview;
  const fulfillmentRate =
    requests.total > 0 ? Math.round((requests.fulfilled / requests.total) * 100) : 0;

  return {
    totalIncidents: incidents.total,
    activeIncidents: incidents.active,
    criticalIncidents: incidents.critical,
    resolvedIncidents: incidents.resolved,
    totalRequests: requests.total,
    pendingRequests: pending,
    fulfilledRequests: requests.fulfilled,
    fulfillmentRate,
    totalResources: resources.total,
    activeResources: resources.active,
    lowStockCount: inventoryOverview.lowStock.length,
    outOfStockCount: inventoryOverview.outOfStock.length,
    totalShelters: shelters.capacity.total,
    shelterUtilization: shelters.capacity.utilization,
  };
}
