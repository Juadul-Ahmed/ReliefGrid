
import Link from "next/link";
import { HiOutlineArrowLeft } from "react-icons/hi2";

import IncidentReportStatusBadge from "@/components/admin/incident-reports/IncidentReportStatusBadge";
import type { IncidentReportStatus } from "@/generated/prisma/enums";

interface IncidentReportDetailsHeaderProps {
  title: string;
  status: IncidentReportStatus;
  reportId: string;
}

export default function IncidentReportDetailsHeader({
  title,
  status,
  reportId,
}: IncidentReportDetailsHeaderProps) {
  return (
    <div className="space-y-4">
      <Link
        href="/admin/incident-reports"
        className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-foreground"
      >
        <HiOutlineArrowLeft className="size-4" />
        Back to Incident Reports
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Incident Report
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>

          <p className="mt-2 text-xs text-muted">
            Report ID: {reportId}
          </p>
        </div>

        <IncidentReportStatusBadge status={status} />
      </div>
    </div>
  );
}
