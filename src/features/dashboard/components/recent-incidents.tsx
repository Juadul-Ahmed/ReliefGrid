
import { HiOutlineMapPin } from "react-icons/hi2";

import type { RecentIncident } from "@/lib/incidents/queries";
import {
  IncidentSeverityBadge,
  IncidentStatusBadge,
} from "./incident-badges";

import type { IncidentSeverity, IncidentStatus } from "../types/dashboard.types";

const SEVERITY_MAP: Record<string, IncidentSeverity> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MODERATE: "Medium",
  LOW: "Low",
};

const STATUS_MAP: Record<string, IncidentStatus> = {
  OPEN: "Open",
  ASSESSING: "Assessing",
  ACTIVE: "Active",
  CONTAINED: "Contained",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  SUSPENDED: "Suspended",
  CANCELLED: "Cancelled",
};

function mapSeverity(severity: string): IncidentSeverity {
  const mapped = SEVERITY_MAP[severity];
  if (mapped) return mapped;
  return "Low";
}

export function mapStatus(status: string): IncidentStatus {
  const mapped = STATUS_MAP[status];
  if (mapped) return mapped;
  return "Open";
}

function relativeTime(createdAt: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(createdAt).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;

  return new Date(createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface RecentIncidentsProps {
  incidents: RecentIncident[];
}

export function RecentIncidents({ incidents }: RecentIncidentsProps) {
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
            {incidents.map((incident) => (
              <tr
                key={incident.id}
                className="transition-colors hover:bg-surface-secondary/60"
              >
                <td className="px-5 py-4">
                  <p className="font-medium text-foreground">
                    {incident.title}
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    {incident.incidentNumber}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <span className="flex items-center gap-1.5 text-muted">
                    <HiOutlineMapPin className="size-4 shrink-0" />
                    {incident.locationName ?? "No location specified"}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <IncidentSeverityBadge
                    severity={mapSeverity(incident.severity)}
                  />
                </td>

                <td className="px-5 py-4">
                  <IncidentStatusBadge
                    status={mapStatus(incident.status)}
                  />
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-xs text-muted">
                  {relativeTime(incident.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
