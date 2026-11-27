import Link from "next/link";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { IncidentStatusBadge } from "./IncidentStatusBadge";
import { IncidentSeverityBadge } from "./IncidentSeverityBadge";

interface Incident {
  id: string;
  incidentNumber: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  locationName: string | null;
  occurredAt: Date | null;
  createdAt: Date;
}

interface IncidentTableProps {
  incidents: Incident[];
  hasFilters?: boolean;
}

export function IncidentTable({
  incidents,
  hasFilters = false,
}: IncidentTableProps) {
  if (incidents.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface px-6 py-16 text-center">
        <HiOutlineClipboardDocumentList className="mx-auto size-12 text-muted" />

        <h3 className="mt-4 text-lg font-semibold">
          No incidents found
        </h3>

        <p className="mt-2 text-sm text-muted">
          {hasFilters
            ? "Try adjusting your search or filters."
            : "Your organization has no incidents yet."}
        </p>

        {!hasFilters && (
          <Link
            href="/incidents/create"
            className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Create your first incident
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-semibold">Incident Records</h2>
        <p className="mt-1 text-sm text-muted">
          {incidents.length} incident{incidents.length !== 1 ? "s" : ""} displayed
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-background">
            <tr>
              <th className="px-5 py-3 font-medium">Incident</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Severity</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Location</th>
              <th className="px-5 py-3 font-medium">Created</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {incidents.map((incident) => (
              <tr
                key={incident.id}
                className="transition hover:bg-background"
              >
                <td className="px-5 py-4">
                  <Link
                    href={`/incidents/${incident.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {incident.title}
                  </Link>

                  <p className="mt-1 text-xs text-muted">
                    {incident.incidentNumber}
                  </p>
                </td>

                <td className="px-5 py-4">
                  {incident.category.replaceAll("_", " ")}
                </td>

                <td className="px-5 py-4">
                  <IncidentSeverityBadge severity={incident.severity} />
                </td>

                <td className="px-5 py-4">
                  <IncidentStatusBadge status={incident.status} />
                </td>

                <td className="px-5 py-4">
                  {incident.locationName || "—"}
                </td>

                <td className="px-5 py-4 whitespace-nowrap">
                  {incident.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}