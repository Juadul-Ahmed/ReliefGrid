
"use client";

interface UserStatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-600",
  BLOCKED: "bg-red-500/10 text-red-600",
  DELETED: "bg-muted/50 text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Active",
  BLOCKED: "Blocked",
  DELETED: "Deactivated",
};

export default function UserStatusBadge({
  status,
}: UserStatusBadgeProps) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status] ?? statusStyles.ACTIVE}`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}
