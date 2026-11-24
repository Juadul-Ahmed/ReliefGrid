interface IncidentStatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  OPEN: "bg-primary/10 text-primary",
  ASSESSING: "bg-warning/10 text-warning",
  ACTIVE: "bg-danger/10 text-danger",
  CONTAINED: "bg-success/10 text-success",
  RESOLVED: "bg-success/10 text-success",
  CLOSED: "bg-muted/10 text-muted",
  SUSPENDED: "bg-warning/10 text-warning",
  CANCELLED: "bg-muted/10 text-muted",
};

export function IncidentStatusBadge({
  status,
}: IncidentStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        statusStyles[status] ?? "bg-muted/10 text-muted"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}