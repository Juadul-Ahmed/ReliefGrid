
import type { OrganizationApplicationStatus } from "@/generated/prisma/enums";

interface ApplicationStatusBadgeProps {
  status: OrganizationApplicationStatus;
}

const statusStyles: Record<OrganizationApplicationStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-600",
  UNDER_REVIEW: "bg-blue-500/10 text-blue-600",
  APPROVED: "bg-emerald-500/10 text-emerald-600",
  REJECTED: "bg-red-500/10 text-red-600",
  WITHDRAWN: "bg-slate-500/10 text-slate-600",
};

export default function ApplicationStatusBadge({
  status,
}: ApplicationStatusBadgeProps) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
