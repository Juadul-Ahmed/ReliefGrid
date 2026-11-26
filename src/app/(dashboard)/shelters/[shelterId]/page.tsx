import Link from "next/link";
import { notFound } from "next/navigation";
import { HiOutlineArrowLeft } from "react-icons/hi2";

import { requireOrganization } from "@/lib/permissions/organization";
import { hasOrganizationPermission } from "@/lib/permissions/organization-permissions";
import { getShelterById } from "@/lib/shelters/queries";
import { EditShelterForm } from "@/components/shelters/EditShelterForm";
import { ShelterStatusToggle } from "@/components/shelters/ShelterStatusToggle";

interface ShelterDetailsPageProps {
  params: Promise<{
    shelterId: string;
  }>;
}

function formatDate(date: Date) {
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

function occupancyPercent(capacity: number, currentOccupancy: number): number {
  if (capacity <= 0) return 0;
  return Math.round((currentOccupancy / capacity) * 100);
}

function statusBadge(displayStatus: string): {
  bg: string;
  text: string;
} {
  switch (displayStatus) {
    case "ACTIVE":
      return { bg: "bg-green-500/10", text: "text-green-600" };
    case "FULL":
      return { bg: "bg-amber-500/10", text: "text-amber-600" };
    case "INACTIVE":
      return { bg: "bg-muted/10", text: "text-muted" };
    case "CLOSED":
      return { bg: "bg-red-500/10", text: "text-red-600" };
    default:
      return { bg: "bg-muted/10", text: "text-muted" };
  }
}

export default async function ShelterDetailsPage({
  params,
}: ShelterDetailsPageProps) {
  const { shelterId } = await params;

  const { organizationId, membership } = await requireOrganization();

  const shelter = await getShelterById(shelterId, organizationId);

  if (!shelter) {
    notFound();
  }

  const role = membership.role.toUpperCase();

  const canView = hasOrganizationPermission(role, "VIEW_SHELTERS");
  const canManage = hasOrganizationPermission(role, "MANAGE_SHELTERS");

  if (!canView) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href="/shelters"
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted transition hover:text-foreground"
          >
            <HiOutlineArrowLeft className="size-4" />
            Back to Shelters
          </Link>

          <h1 className="text-2xl font-bold tracking-tight">Shelter</h1>
          <p className="mt-1 text-sm text-muted">
            You do not have permission to view this shelter.
          </p>
        </div>
      </div>
    );
  }

  const percent = occupancyPercent(
    shelter.capacity,
    shelter.currentOccupancy,
  );
  const { bg, text } = statusBadge(shelter.displayStatus);
  const available = shelter.capacity - shelter.currentOccupancy;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/shelters"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted transition hover:text-foreground"
        >
          <HiOutlineArrowLeft className="size-4" />
          Back to Shelters
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {shelter.name}
            </h1>

            <p className="mt-1 text-sm text-muted">
              Created {formatDate(shelter.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${bg} ${text}`}
            >
              {shelter.displayStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Shelter Information */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">Shelter Information</h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Address" value={shelter.address} />

          <DetailItem label="Capacity" value={String(shelter.capacity)} />

          <DetailItem label="Current Occupancy" value={String(shelter.currentOccupancy)} />

          <DetailItem label="Available Spaces" value={String(available)} />

          <DetailItem label="Occupancy" value={`${percent}%`} />

          <DetailItem label="Stored Status" value={shelter.status} />

          <DetailItem label="Last Updated" value={formatDate(shelter.updatedAt)} />
        </div>

        {shelter.latitude !== null || shelter.longitude !== null ? (
          <div className="mt-5">
            <p className="text-sm text-muted">Coordinates</p>
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              <DetailItem
                label="Latitude"
                value={
                  shelter.latitude !== null
                    ? shelter.latitude.toFixed(6)
                    : "Not provided"
                }
              />
              <DetailItem
                label="Longitude"
                value={
                  shelter.longitude !== null
                    ? shelter.longitude.toFixed(6)
                    : "Not provided"
                }
              />
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <p className="text-sm text-muted">Coordinates</p>
            <p className="mt-1 text-sm text-muted">
              No coordinates provided.
            </p>
          </div>
        )}
      </section>

      {/* Edit (OWNER/ADMIN only) */}
      {canManage && (
        <EditShelterForm shelter={shelter} />
      )}

      {/* Status management and deletion (OWNER/ADMIN only) */}
      {canManage && (
        <ShelterStatusToggle
          shelterId={shelter.id}
          currentStatus={shelter.status}
          currentOccupancy={shelter.currentOccupancy}
          canManage={canManage}
        />
      )}
    </div>
  );
}
