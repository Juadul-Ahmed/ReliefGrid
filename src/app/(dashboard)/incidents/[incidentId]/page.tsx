
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiOutlineArrowLeft,
  HiOutlineCalendar,
  HiOutlineMapPin,
  HiOutlineUser,
} from "react-icons/hi2";

import { requireOrganization } from "@/lib/permissions/organization";
import { getIncidentById } from "@/lib/incidents/queries";
import { IncidentSeverityBadge } from "@/components/incidents/IncidentSeverityBadge";
import { IncidentStatusBadge } from "@/components/incidents/IncidentStatusBadge";

interface IncidentDetailsPageProps {
  params: Promise<{
    incidentId: string;
  }>;
}

function formatDate(date: Date | null) {
  if (!date) return "Not provided";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

export default async function IncidentDetailsPage({
  params,
}: IncidentDetailsPageProps) {
  const { incidentId } = await params;
  const { organizationId } = await requireOrganization();

  const incident = await getIncidentById(
    incidentId,
    organizationId,
  );

  if (!incident) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/incidents"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted transition hover:text-foreground"
        >
          <HiOutlineArrowLeft className="size-4" />
          Back to Incidents
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted">
              {incident.incidentNumber}
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              {incident.title}
            </h1>

            <p className="mt-1 text-sm text-muted">
              Created {formatDate(incident.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <IncidentSeverityBadge severity={incident.severity} />
            <IncidentStatusBadge status={incident.status} />
          </div>
        </div>
      </div>

      {/* Incident Description */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">
          Incident Description
        </h2>

        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">
          {incident.description}
        </p>
      </section>

      {/* Incident Information */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">
          Incident Information
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            label="Category"
            value={incident.category.replaceAll("_", " ")}
          />

          <DetailItem
            label="Severity"
            value={incident.severity}
          />

          <DetailItem
            label="Status"
            value={incident.status.replaceAll("_", " ")}
          />

          <DetailItem
            label="Created By"
            value={incident.createdBy?.name ?? "Unknown"}
          />

          <DetailItem
            label="Occurred At"
            value={formatDate(incident.occurredAt)}
          />

          <DetailItem
            label="Last Updated"
            value={formatDate(incident.updatedAt)}
          />

          <DetailItem
            label="Verified At"
            value={formatDate(incident.verifiedAt)}
          />
        </div>
      </section>

      {/* Location */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center gap-2">
          <HiOutlineMapPin className="size-5 text-muted" />
          <h2 className="text-lg font-semibold">
            Location Details
          </h2>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <DetailItem
            label="Location Name"
            value={incident.locationName || "Not provided"}
          />

          <DetailItem
            label="Address"
            value={incident.address || "Not provided"}
          />

          <DetailItem
            label="Latitude"
            value={incident.latitude?.toString() ?? "Not provided"}
          />

          <DetailItem
            label="Longitude"
            value={incident.longitude?.toString() ?? "Not provided"}
          />
        </div>
      </section>
    </div>
  );
}
