
import Link from "next/link";
import { HiOutlineClipboardDocumentCheck } from "react-icons/hi2";

interface IncidentReportReviewCardProps {
  report: {
    createdAt: Date;
    updatedAt: Date;
    verifiedAt: Date | null;
    rejectionReason: string | null;
    verifiedBy: {
      name: string;
    } | null;
    duplicateOfReport: {
      id: string;
      title: string;
    } | null;
    incident: {
      id: string;
      incidentNumber: string;
      title: string;
    } | null;
  };
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">
        {value}
      </p>
    </div>
  );
}

export default function IncidentReportReviewCard({
  report,
}: IncidentReportReviewCardProps) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <HiOutlineClipboardDocumentCheck className="size-5 text-muted" />
        <h2 className="font-semibold text-foreground">
          Review Information
        </h2>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <DetailItem
          label="Submitted At"
          value={report.createdAt.toLocaleString()}
        />

        <DetailItem
          label="Last Updated"
          value={report.updatedAt.toLocaleString()}
        />

        <DetailItem
          label="Reviewed By"
          value={report.verifiedBy?.name ?? "Not reviewed"}
        />

        <DetailItem
          label="Verified At"
          value={report.verifiedAt?.toLocaleString() ?? "Not verified"}
        />
      </div>

      {report.rejectionReason && (
        <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm font-semibold text-red-600">
            Rejection Reason
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
            {report.rejectionReason}
          </p>
        </div>
      )}

      {report.duplicateOfReport && (
        <div className="mt-6 border-t border-border pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Duplicate Of
          </p>

          <Link
            href={`/admin/incident-reports/${report.duplicateOfReport.id}`}
            className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
          >
            {report.duplicateOfReport.title}
          </Link>
        </div>
      )}

      {report.incident && (
        <div className="mt-6 border-t border-border pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Linked Operational Incident
          </p>

          <Link
            href={`/incidents/${report.incident.id}`}
            className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
          >
            {report.incident.incidentNumber} — {report.incident.title}
          </Link>
        </div>
      )}
    </section>
  );
}
