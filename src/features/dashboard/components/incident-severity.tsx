
import { incidentSeverity } from "../data/dashboard-data";

export function IncidentSeverity() {
  const totalIncidents = incidentSeverity.reduce(
    (total, item) => total + item.count,
    0
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

      {/* Distribution bar */}
      <div
        className="mt-6 flex h-3 overflow-hidden rounded-full bg-surface-secondary"
        aria-label="Incident severity distribution"
      >
        {incidentSeverity.map((item) => (
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
        {incidentSeverity.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className={`size-2.5 rounded-full ${item.color}`}
                />

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
    </section>
  );
}
