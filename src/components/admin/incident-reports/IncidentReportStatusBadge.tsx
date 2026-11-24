
import type { IncidentReportStatus } from "@/generated/prisma/enums";

interface IncidentReportStatusBadgeProps {
  status: IncidentReportStatus;
}

const statusStyles: Record<
  IncidentReportStatus,
  { label: string; className: string }
> = {
  RECEIVED: {
    label: "Received",
    className: "bg-blue-500/10 text-blue-600",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    className: "bg-amber-500/10 text-amber-600",
  },
  VERIFIED: {
    label: "Verified",
    className: "bg-emerald-500/10 text-emerald-600",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-500/10 text-red-600",
  },
  DUPLICATE: {
    label: "Duplicate",
    className: "bg-purple-500/10 text-purple-600",
  },
};

export default function IncidentReportStatusBadge({
  status,
}: IncidentReportStatusBadgeProps) {
  const style = statusStyles[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${style.className}`}
    >
      {style.label}
    </span>
  );
}
