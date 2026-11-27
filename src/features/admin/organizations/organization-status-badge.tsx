
"use client";

interface OrganizationStatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-600",
  BLOCKED: "bg-red-500/10 text-red-600",
  PENDING: "bg-amber-500/10 text-amber-600",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Active",
  BLOCKED: "Blocked",
  PENDING: "Pending",
};

export default function OrganizationStatusBadge({
  status,
}: OrganizationStatusBadgeProps) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status] ?? statusStyles.PENDING}`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}
