
"use client";

import { useState } from "react";
import { HiOutlineEye } from "react-icons/hi2";

import AuditLogDetailDialog from "@/features/admin/audit-logs/audit-log-detail-dialog";

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

interface AuditLogsTableProps {
  auditLogs: AuditLogRow[];
  total: number;
  onView: (log: AuditLogRow) => void;
  onRefresh: () => void;
}

const actionBadgeStyles: Record<string, string> = {
  USER_CREATED: "bg-emerald-500/10 text-emerald-600",
  USER_BLOCKED: "bg-red-500/10 text-red-600",
  USER_UNBLOCKED: "bg-emerald-500/10 text-emerald-600",
  USER_DELETED: "bg-critical/10 text-critical",
  ORGANIZATION_BLOCKED: "bg-red-500/10 text-red-600",
  ORGANIZATION_UNBLOCKED: "bg-emerald-500/10 text-emerald-600",
  ORGANIZATION_DELETED: "bg-critical/10 text-critical",
  EMERGENCY_RESOURCE_ALLOCATED: "bg-primary/10 text-primary",
};

export default function AuditLogsTable({
  auditLogs,
  total,
  onView,
  onRefresh,
}: AuditLogsTableProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);

  if (auditLogs.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-5 py-16 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-surface-secondary">
          <HiOutlineEye className="size-7 text-muted" />
        </div>

        <h3 className="mt-4 font-semibold text-foreground">
          No audit logs found
        </h3>

        <p className="mt-2 text-sm text-muted">
          Audit logs will appear here as platform activity occurs.
        </p>

        <button
          type="button"
          onClick={onRefresh}
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-secondary"
        >
          <HiOutlineEye className="size-4" /> Refresh
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-secondary text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-4 font-semibold">Timestamp</th>
                <th className="px-5 py-4 font-semibold">Actor</th>
                <th className="px-5 py-4 font-semibold">Action</th>
                <th className="px-5 py-4 font-semibold">Entity Type</th>
                <th className="px-5 py-4 font-semibold">Entity ID</th>
                <th className="px-5 py-4 font-semibold">Organization</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {auditLogs.map((log) => (
                <tr
                  key={log.id}
                  className="transition-colors hover:bg-surface-secondary/50"
                >
                  <td className="whitespace-nowrap px-5 py-4 text-muted">
                    {log.createdAt.toLocaleString()}
                  </td>

                  <td className="px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">
                        {log.actorNameSnapshot ?? log.actorEmail ?? "Unknown actor"}
                      </p>
                      <p className="mt-1 text-xs text-muted truncate">
                        {log.actorEmail ?? "N/A"}
                        {log.actorSystemRole ? ` (${log.actorSystemRole})` : ""}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${actionBadgeStyles[log.action] ?? "bg-muted/50 text-muted-foreground"}`}
                    >
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-muted truncate max-w-xs">
                    {log.entityType}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-muted truncate max-w-xs">
                    {log.entityId}
                  </td>

                  <td className="px-5 py-4">
                    {log.organizationName ? (
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">
                          {log.organizationName}
                        </p>
                        <p className="mt-1 text-xs text-muted truncate">
                          /{log.organizationSlug}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted">—</p>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLog(log);
                          onView(log);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-secondary"
                      >
                        <HiOutlineEye className="size-4" />
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border px-5 py-3">
          <p className="text-xs text-muted">
            Showing {auditLogs.length}{" "}
            {auditLogs.length === 1 ? "audit log" : "audit logs"}{" "}
            of {total}
          </p>
        </div>
      </div>

      {selectedLog && (
        <AuditLogDetailDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setSelectedLog(null);
          }}
          auditLog={selectedLog}
        />
      )}
    </>
  );
}
