
import { listAuditLogs, getAuditLogStats } from "@/app/actions/admin-audit-logs";
import AuditLogsOverview from "@/features/admin/audit-logs/audit-logs-overview";

interface AuditLogsPageProps {
  searchParams: Promise<{
    search?: string;
    action?: string;
    organizationId?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

type AuditLogStatsType = {
  totalEvents: number;
  eventsToday: number;
  eventsLast7Days: number;
  distinctActors: number;
};

export default async function AuditLogsPage({
  searchParams,
}: AuditLogsPageProps) {
  const params = await searchParams;

  const [logs, stats] = await Promise.all([
    listAuditLogs({
      search: params.search,
      action: params.action,
      organizationId: params.organizationId,
      entityType: params.entityType,
      startDate: params.startDate,
      endDate: params.endDate,
      page: params.page ?? "1",
      pageSize: params.pageSize ?? "20",
      sortBy: params.sortBy ?? "createdAt",
      sortOrder: params.sortOrder ?? "desc",
    }),
    getAuditLogStats({
      startDate: params.startDate,
      endDate: params.endDate,
      organizationId: params.organizationId,
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <AuditLogsOverview
        initial={
          logs as unknown as {
            auditLogs: Array<{
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
            }>;
            total: number;
            page: number;
            pageSize: number;
          }
        }
        stats={stats as unknown as AuditLogStatsType}
        search={params.search ?? ""}
        action={params.action ?? ""}
        organizationId={params.organizationId ?? ""}
        entityType={params.entityType ?? ""}
        startDate={params.startDate ?? ""}
        endDate={params.endDate ?? ""}
      />
    </div>
  );
}
