
"use client";

import { useRouter } from "next/navigation";

import AuditLogsFilters from "@/features/admin/audit-logs/audit-logs-filters";
import AuditLogsStats from "@/features/admin/audit-logs/audit-logs-stats";
import AuditLogsTable from "@/features/admin/audit-logs/audit-logs-table";

interface AuditLogRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorNameSnapshot: string | null;
  actorEmail: string | null;
  actorSystemRole: string | null;
  organizationName: string | null;
  organizationSlug: string | null;
  before: unknown;
  after: unknown;
  metadata: unknown;
  createdAt: Date;
}

type AuditLogStatsType = {
  totalEvents: number;
  eventsToday: number;
  eventsLast7Days: number;
  distinctActors: number;
};

interface AuditLogsOverviewProps {
  initial: {
    auditLogs: AuditLogRow[];
    total: number;
    page: number;
    pageSize: number;
  };
  stats: AuditLogStatsType;
  search: string;
  action: string;
  organizationId: string;
  entityType: string;
  startDate: string;
  endDate: string;
}

export default function AuditLogsOverview({
  initial,
  stats,
  search,
  action,
  organizationId,
  entityType,
  startDate,
  endDate,
}: AuditLogsOverviewProps) {
  const router = useRouter();

  const handleFiltersChange = (params: {
    search?: string;
    action?: string;
    organizationId?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.search !== undefined) {
      query.set("search", params.search);
    }
    if (params.action !== undefined) {
      query.set("action", params.action);
    }
    if (params.organizationId !== undefined) {
      query.set("organizationId", params.organizationId);
    }
    if (params.entityType !== undefined) {
      query.set("entityType", params.entityType);
    }
    if (params.startDate !== undefined) {
      query.set("startDate", params.startDate);
    }
    if (params.endDate !== undefined) {
      query.set("endDate", params.endDate);
    }
    router.push(`/admin/audit-logs?${query.toString()}`);
  };

  const handleView = () => {
    // Log data is already available in the row; dialog receives it directly.
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <AuditLogsFilters
        search={search}
        action={action}
        organizationId={organizationId}
        entityType={entityType}
        startDate={startDate}
        endDate={endDate}
        onChange={handleFiltersChange}
      />

      <AuditLogsStats
        totalEvents={stats.totalEvents}
        eventsToday={stats.eventsToday}
        eventsLast7Days={stats.eventsLast7Days}
        distinctActors={stats.distinctActors}
      />

      <AuditLogsTable
        auditLogs={initial.auditLogs}
        total={initial.total}
        onView={handleView}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
