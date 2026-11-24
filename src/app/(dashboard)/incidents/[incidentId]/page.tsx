
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiOutlineArrowLeft,
  HiOutlineMapPin,
} from "react-icons/hi2";

import { requireOrganization } from "@/lib/permissions/organization";
import {
  getIncidentById,
  getIncidentParticipants,
  getAvailableParticipantOrganizations,
} from "@/lib/incidents/queries";
import { prisma } from "@/lib/db/prisma";
import { hasOrganizationPermission } from "@/lib/permissions/organization-permissions";

import { IncidentSeverityBadge } from "@/components/incidents/IncidentSeverityBadge";
import { IncidentStatusBadge } from "@/components/incidents/IncidentStatusBadge";
import { IncidentCoordinatorManager } from "@/components/incidents/IncidentCoordinatorManager";
import { IncidentStatusSeverityManager } from "@/components/incidents/IncidentStatusSeverityManager";
import { IncidentParticipantManager } from "@/components/incidents/IncidentParticipantManager";

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

  const { organizationId, membership } =
    await requireOrganization();

  const incident = await getIncidentById(
    incidentId,
    organizationId,
  );

  if (!incident) {
    notFound();
  }

  // Check whether the current organization owns this incident.
  const isLeadOrganization =
    incident.leadOrganizationId === organizationId;

  const currentRole = membership.role.toUpperCase();

  // Only lead organization OWNER and ADMIN can manage coordinators.
  const canManageCoordinator =
    isLeadOrganization &&
    hasOrganizationPermission(
      currentRole,
      "ASSIGN_INCIDENT_COORDINATOR",
    );

  // Only lead organization OWNER and ADMIN can update status and severity.
  const canManageIncidentUpdates =
    isLeadOrganization &&
    hasOrganizationPermission(
      currentRole,
      "UPDATE_INCIDENT_STATUS",
    ) &&
    hasOrganizationPermission(
      currentRole,
      "UPDATE_INCIDENT_SEVERITY",
    );

  // Only lead organization OWNER and ADMIN can manage participants.
  const canManageParticipants =
    isLeadOrganization &&
    hasOrganizationPermission(
      currentRole,
      "MANAGE_INCIDENT_PARTICIPANTS",
    );

  // Fetch coordinator members, participants, and invitation options.
  // Invitation options are fetched only for authorized managers.
  const [
    members,
    participants,
    availableOrganizations,
  ] = await Promise.all([
    canManageCoordinator
      ? prisma.member.findMany({
          where: {
            organizationId: incident.leadOrganizationId,
            status: "ACTIVE",
          },
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        })
      : Promise.resolve([]),

    getIncidentParticipants(
      incident.id,
      incident.leadOrganizationId,
    ),

    canManageParticipants
      ? getAvailableParticipantOrganizations(
          incident.leadOrganizationId,
        )
      : Promise.resolve([]),
  ]);

  const coordinatorMembers = members.map((member) => ({
    id: member.user.id,
    name: member.user.name,
    email: member.user.email,
  }));

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

      {/* Incident Coordinator */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">
          Incident Coordinator
        </h2>

        {incident.coordinator ? (
          <div className="mt-4">
            <p className="text-sm font-medium">
              {incident.coordinator.name}
            </p>

            <p className="mt-1 text-sm text-muted">
              {incident.coordinator.email}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">
            No coordinator assigned yet.
          </p>
        )}
      </section>

      {/* Coordinator Management */}
      {canManageCoordinator && (
        <IncidentCoordinatorManager
          incidentId={incident.id}
          currentCoordinatorId={
            incident.coordinator?.id ?? null
          }
          members={coordinatorMembers}
        />
      )}

      {/* Incident Status & Severity Management */}
      {canManageIncidentUpdates && (
        <IncidentStatusSeverityManager
          key={`${incident.status}-${incident.severity}`}
          incidentId={incident.id}
          currentStatus={incident.status}
          currentSeverity={incident.severity}
        />
      )}

      {/* Incident Participants */}
      <IncidentParticipantManager
        incidentId={incident.id}
        participants={participants ?? []}
        availableOrganizations={availableOrganizations}
        canManage={canManageParticipants}
      />

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
