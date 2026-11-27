
import Link from "next/link";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";

interface AlertItem {
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  count: number;
  href?: string;
}

interface OperationalAlertsProps {
  alerts: AlertItem[];
}

export function OperationalAlerts({ alerts }: OperationalAlertsProps) {
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");

  return (
    <section className={`rounded-xl border border-border bg-surface overflow-hidden ${criticalAlerts.length > 0 ? "border-red-200 bg-red-50" : ""}`}>
      {/* Header */}
      <div className="border-b border-border px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HiOutlineExclamationTriangle
            className={`size-5 ${criticalAlerts.length > 0 ? "text-red-600" : "text-amber-500"}`}
          />
          <h3 className="font-semibold text-foreground">
            Operational Alerts
          </h3>
        </div>
        <Link
          href="/resources"
          className="text-sm text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      {/* Alerts list */}
      <div className="divide-y divide-border">
        {alerts.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-muted">
              No active alerts. All systems operational.
            </p>
          </div>
        ) : (
          <ul>
            {alerts.map((alert) => (
              <li key={alert.title} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                      alert.severity === "critical"
                        ? "bg-red-100 text-red-600"
                        : alert.severity === "warning"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-info/10 text-info"
                    }`}
                  >
                    {alert.severity === "critical" ? (
                      "!"
                    ) : alert.severity === "warning" ? (
                      "⚠"
                    ) : (
                      "i"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {alert.title}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {alert.description} ({alert.count})
                    </p>
                  </div>
                  {alert.href && (
                    <Link
                      href={alert.href}
                      className="text-sm text-primary hover:underline ml-2"
                    >
                      View
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
