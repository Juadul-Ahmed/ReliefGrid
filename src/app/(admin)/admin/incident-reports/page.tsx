
import Link from "next/link";

import IncidentReportTable from "@/components/admin/incident-reports/IncidentReportTable";
import {
  INCIDENT_REPORT_STATUSES,
  getIncidentReportStatus,
  getIncidentReports,
} from "@/lib/incidents/report-queries";

interface IncidentReportsPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

const statuses = [
  { label: "All Reports", value: "ALL" },
  { label: "Received", value: "RECEIVED" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Verified", value: "VERIFIED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Duplicate", value: "DUPLICATE" },
] as const;

export default async function IncidentReportsPage({
  searchParams,
}: IncidentReportsPageProps) {
  const params = await searchParams;

  const selectedStatus = getIncidentReportStatus(params.status);

  const reports = await getIncidentReports({
    status: selectedStatus,
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Page heading */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
          Emergency Management
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Incident Reports
        </h1>

        <p className="mt-2 text-sm text-muted">
          Review, verify, and manage emergency reports submitted to ReliefGrid.
        </p>
      </div>

      {/* Report filters */}
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Filter Reports
          </h2>

          <p className="text-sm text-muted">
            {reports.length}{" "}
            {reports.length === 1 ? "report" : "reports"} found
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {statuses.map((item) => {
            const isActive =
              item.value === "ALL"
                ? !selectedStatus
                : selectedStatus === item.value;

            const href =
              item.value === "ALL"
                ? "/admin/incident-reports"
                : `/admin/incident-reports?status=${item.value}`;

            return (
              <Link
                key={item.value}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`
                  rounded-lg border px-4 py-2 text-sm font-medium transition-colors
                  ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface text-muted hover:bg-surface-secondary hover:text-foreground"
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Reports table */}
      <IncidentReportTable reports={reports} />
    </div>
  );
}
