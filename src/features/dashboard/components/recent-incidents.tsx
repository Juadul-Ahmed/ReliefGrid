
import { HiOutlineMapPin } from "react-icons/hi2";

import { recentIncidents } from "../data/dashboard-data";
import {
  IncidentSeverityBadge,
  IncidentStatusBadge,
} from "./incident-badges";

export function RecentIncidents() {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface xl:col-span-2">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h3 className="font-semibold text-foreground">
            Recent Incidents
          </h3>

          <p className="mt-1 text-xs text-muted">
            Latest reported emergency incidents
          </p>
        </div>

        <span className="rounded-md bg-critical/10 px-2.5 py-1 text-xs font-semibold text-critical">
          24 Active
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="bg-surface-secondary text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">Incident</th>
              <th className="px-5 py-3 font-semibold">Location</th>
              <th className="px-5 py-3 font-semibold">Severity</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Reported</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {recentIncidents.map((incident) => (
              <tr
                key={incident.id}
                className="transition-colors hover:bg-surface-secondary/60"
              >
                <td className="px-5 py-4">
                  <p className="font-medium text-foreground">
                    {incident.title}
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    {incident.id}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <span className="flex items-center gap-1.5 text-muted">
                    <HiOutlineMapPin className="size-4 shrink-0" />
                    {incident.location}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <IncidentSeverityBadge
                    severity={incident.severity}
                  />
                </td>

                <td className="px-5 py-4">
                  <IncidentStatusBadge
                    status={incident.status}
                  />
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-xs text-muted">
                  {incident.time}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-5 py-3">
        <p className="text-xs text-muted">
          Showing {recentIncidents.length} illustrative incidents
        </p>
      </div>
    </section>
  );
}
