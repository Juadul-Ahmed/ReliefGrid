
import type {
  IncidentSeverity,
  IncidentStatus,
} from "../types/dashboard.types";

interface IncidentSeverityBadgeProps {
  severity: IncidentSeverity;
}

interface IncidentStatusBadgeProps {
  status: IncidentStatus;
}

const severityStyles: Record<IncidentSeverity, string> = {
  Critical: "bg-critical/10 text-critical",
  High: "bg-emergency/10 text-emergency",
  Medium: "bg-info/10 text-info",
  Low: "bg-success/10 text-success",
};

const statusStyles: Record<IncidentStatus, string> = {
  Responding: "bg-success/10 text-success",
  Investigating: "bg-info/10 text-info",
  Reported: "bg-emergency/10 text-emergency",
  Resolved: "bg-surface-secondary text-muted",
};

export function IncidentSeverityBadge({
  severity,
}: IncidentSeverityBadgeProps) {
  return (
    <span
      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${severityStyles[severity]}`}
    >
      {severity}
    </span>
  );
}

export function IncidentStatusBadge({
  status,
}: IncidentStatusBadgeProps) {
  return (
    <span
      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
