interface IncidentSeverityBadgeProps {
  severity: string;
}

const severityStyles: Record<string, string> = {
  LOW: "bg-success/10 text-success",
  MODERATE: "bg-warning/10 text-warning",
  HIGH: "bg-orange-500/10 text-orange-500",
  CRITICAL: "bg-danger/10 text-danger",
};

export function IncidentSeverityBadge({
  severity,
}: IncidentSeverityBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        severityStyles[severity] ?? "bg-muted/10 text-muted"
      }`}
    >
      {severity}
    </span>
  );
}