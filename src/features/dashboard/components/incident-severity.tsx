
import type { IncidentSeverityBreakdownItem } from "@/lib/incidents/queries";

import type { IncidentSeverity } from "../types/dashboard.types";
import { IncidentSeverityBadge } from "./incident-badges";

const SEVERITY_LABELS: Record<string, IncidentSeverity> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MODERATE: "Medium",
  LOW: "Low",
};

const SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  Critical: "bg-critical",
  High: "bg-emergency",
  Medium: "bg-info",
  Low: "bg-success",
};

function mapSeverity(severity: string): IncidentSeverity {
  const mapped = SEVERITY_LABELS[severity];
  if (mapped) return mapped;
  return "Low";
}

interface IncidentSeverityProps {
  breakdown: IncidentSeverityBreakdownItem[];
}

export function IncidentSeverity({ breakdown }: IncidentSeverityProps) {
  const totalIncidents = breakdown.reduce(
    (total, item) => total + item.count,
    0,
  );

  const items = breakdown.map((item) => {
    const label = mapSeverity(item.severity);
    const percentage =
      totalIncidents > 0 ? Math.round((item.count / totalIncidents) * 100) : 0;
    return {
      label,
      count: item.count,
      percentage,
      color: SEVERITY_COLORS[label],
    };
  });

  // Sort by severity order: Critical, High, Medium, Low
  const severityOrder: IncidentSeverity[] = [
    "Critical",
    "High",
    "Medium",
    "Low",
  ];
  items.sort(
    (a, b) =>
      severityOrder.indexOf(a.label) - severityOrder.indexOf(b.label),
  );

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      {/* Header */}
      <div>
        <h3 className="font-semibold text-foreground">
          Incident Severity
        </h3>

        <p className="mt-1 text-xs text-muted">
          Distribution of active incidents
        </p>
      </div>

      {totalIncidents === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-muted">
            No incidents recorded for your organization.
          </p>
        </div>
      ) : (
        <>
          {/* Distribution bar */}
          <div
            className="mt-6 flex h-3 overflow-hidden rounded-full bg-surface-secondary"
            aria-label="Incident severity distribution"
          >
            {items.map((item) => (
              <div
                key={item.label}
                className={item.color}
                style={{ width: `${item.percentage}%` }}
                title={`${item.label}: ${item.count}`}
              />
            ))}
          </div>

          {/* Severity breakdown */}
          <div className="mt-6 space-y-5">
            {items.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <IncidentSeverityBadge severity={item.label} />

                    <span className="text-muted">
                      {item.label}
                    </span>
                  </div>

                  <span className="font-semibold text-foreground">
                    {item.count}
                  </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-surface-secondary">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-7 border-t border-border pt-4">
            <p className="text-xs text-muted">
              Total active incidents
            </p>

            <p className="mt-1 text-2xl font-bold text-foreground">
              {totalIncidents}
            </p>
          </div>
        </>
      )}
    </section>
  );
}
