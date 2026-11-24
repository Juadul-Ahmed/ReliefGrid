
import Link from "next/link";
import { HiOutlineEye, HiOutlineDocumentText } from "react-icons/hi2";

import IncidentReportStatusBadge from "@/components/admin/incident-reports/IncidentReportStatusBadge";
import type {
  IncidentCategory,
  IncidentReportStatus,
  IncidentSeverity,
} from "@/generated/prisma/enums";

export interface IncidentReportTableRow {
  id: string;
  title: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentReportStatus;
  createdAt: Date;
  submitter: {
    name: string;
    email: string;
  } | null;
}

interface IncidentReportTableProps {
  reports: IncidentReportTableRow[];
}

export default function IncidentReportTable({
  reports,
}: IncidentReportTableProps) {
  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-5 py-16 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-surface-secondary">
          <HiOutlineDocumentText className="size-7 text-muted" />
        </div>

        <h3 className="mt-4 font-semibold text-foreground">
          No incident reports found
        </h3>

        <p className="mt-2 text-sm text-muted">
          Submitted incident reports will appear here when received.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-secondary text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-5 py-4 font-semibold">Report</th>
              <th className="px-5 py-4 font-semibold">Submitter</th>
              <th className="px-5 py-4 font-semibold">Severity</th>
              <th className="px-5 py-4 font-semibold">Submitted</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 text-right font-semibold">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {reports.map((report) => (
              <tr
                key={report.id}
                className="transition-colors hover:bg-surface-secondary/50"
              >
                <td className="px-5 py-4">
                  <p className="font-medium text-foreground">
                    {report.title}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {report.category.replaceAll("_", " ")}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <p className="font-medium text-foreground">
                    {report.submitter?.name ?? "Anonymous"}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {report.submitter?.email ?? "No email available"}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <span className="text-muted">
                    {report.severity}
                  </span>
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-muted">
                  {report.createdAt.toLocaleDateString()}
                </td>

                <td className="px-5 py-4">
                  <IncidentReportStatusBadge status={report.status} />
                </td>

                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/admin/incident-reports/${report.id}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-secondary"
                  >
                    <HiOutlineEye className="size-4" />
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border px-5 py-3">
        <p className="text-xs text-muted">
          Showing {reports.length}{" "}
          {reports.length === 1 ? "report" : "reports"}
        </p>
      </div>
    </div>
  );
}
