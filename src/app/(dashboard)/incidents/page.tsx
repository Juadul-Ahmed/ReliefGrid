import Link from "next/link";
import { HiOutlinePlus } from "react-icons/hi2";

import { requireOrganization } from "@/lib/permissions/organization";
import { getIncidents, getIncidentStats } from "@/lib/incidents/queries";
import { IncidentStats } from "@/components/incidents/IncidentStats";
import { IncidentFilters } from "@/components/incidents/IncidentFilters";
import { IncidentTable } from "@/components/incidents/IncidentTable";


interface IncidentsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    severity?: string;
  }>;
}

export default async function IncidentsPage({
  searchParams,
}: IncidentsPageProps) {
  const { organizationId, organization } = await requireOrganization();
  const params = await searchParams;

  const filters = {
    search: params.search,
    status: params.status,
    severity: params.severity,
  };

  const [incidents, stats] = await Promise.all([
    getIncidents(organizationId, filters),
    getIncidentStats(organizationId),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Incidents</h1>

          <p className="mt-1 text-sm text-muted">
            Emergency incident management for {organization.name}.
          </p>
        </div>

        <Link
          href="/incidents/create"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          <HiOutlinePlus className="size-5" />
          Create Incident
        </Link>
      </div>

      {/* Statistics */}
      <IncidentStats {...stats} />

      {/* Filters */}
      <IncidentFilters
        search={params.search}
        status={params.status}
        severity={params.severity}
      />

      {/* Incident table */}
      <IncidentTable
        incidents={incidents}
        hasFilters={Boolean(
          params.search || params.status || params.severity,
        )}
      />
    </div>
  );
}