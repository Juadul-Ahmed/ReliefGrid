
import { prisma } from "@/lib/db/prisma";
import { getOrganizationIncidentScope } from "@/lib/incidents/queries";
import { getEmergencyRequestScope } from "@/lib/requests/queries";

export type DateRange = "7d" | "30d" | "90d";

export interface DateRangeOption {
  value: DateRange;
  label: string;
  days: number;
}

export const DATE_RANGE_OPTIONS: DateRangeOption[] = [
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
];

export function getDateRangeFilter(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export interface TrendDataPoint {
  date: string;
  count: number;
}

export function groupTrendsByDate(
  items: Array<{ createdAt: Date | string }>,
  days: number,
): TrendDataPoint[] {
  const map = new Map<string, number>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Initialize all dates in range with zero
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split("T")[0];
    map.set(key, 0);
  }

  // Count items per date (only within range)
  const validDates = new Set(map.keys());
  for (const item of items) {
    const itemDate = new Date(item.createdAt);
    itemDate.setHours(0, 0, 0, 0);
    const key = itemDate.toISOString().split("T")[0];
    if (validDates.has(key)) {
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }

  return Array.from(map.entries()).map(([date, count]) => ({
    date,
    count,
  }));
}

/**
 * Returns incident creation trends over the specified number of days.
 * Scoped to the organization's visible incidents.
 */
export async function getIncidentTrends(
  organizationId: string,
  days: number,
): Promise<TrendDataPoint[]> {
  const scope = getOrganizationIncidentScope(organizationId);
  const startDate = getDateRangeFilter(days);

  const rows = await prisma.incident.findMany({
    where: {
      AND: [scope, { createdAt: { gte: startDate } }],
    },
    orderBy: { createdAt: "asc" },
    select: {
      createdAt: true,
    },
    take: 1000,
  });

  return groupTrendsByDate(rows, days);
}

/**
 * Returns emergency request creation trends over the specified number of days.
 * Scoped to the organization's visible requests.
 */
export async function getEmergencyRequestTrends(
  organizationId: string,
  days: number,
): Promise<TrendDataPoint[]> {
  const scope = getEmergencyRequestScope(organizationId);
  const startDate = getDateRangeFilter(days);

  const rows = await prisma.emergencyRequest.findMany({
    where: {
      AND: [scope, { createdAt: { gte: startDate } }],
    },
    orderBy: { createdAt: "asc" },
    select: {
      createdAt: true,
    },
    take: 1000,
  });

  return groupTrendsByDate(rows, days);
}

/**
 * Returns recent audit log activity for the organization.
 */
export interface AuditActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorName: string | null;
  actorUserId: string | null;
  createdAt: Date;
}

export async function getAuditActivity(
  organizationId: string,
): Promise<AuditActivityItem[]> {
  const rows = await prisma.auditLog.findMany({
    where: {
      organizationId,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      actorNameSnapshot: true,
      actorUserId: true,
      createdAt: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    actorName: row.actorNameSnapshot ?? null,
    actorUserId: row.actorUserId,
    createdAt: row.createdAt,
  }));
}
