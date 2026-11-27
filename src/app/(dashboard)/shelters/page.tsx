import Link from "next/link";
import { HiOutlinePlus } from "react-icons/hi2";

import { requireOrganization } from "@/lib/permissions/organization";
import { hasOrganizationPermission } from "@/lib/permissions/organization-permissions";
import { getShelters } from "@/lib/shelters/queries";
import { ShelterFilters } from "@/components/shelters/ShelterFilters";
import { ShelterTable } from "@/components/shelters/ShelterTable";

interface SheltersPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
  }>;
}

export default async function SheltersPage({
  searchParams,
}: SheltersPageProps) {
  const { organizationId, organization, membership } =
    await requireOrganization();

  const params = await searchParams;

  const shelters = await getShelters(organizationId, {
    search: params.search,
    status: params.status,
  });

  const role = membership.role.toUpperCase();

  const canView = hasOrganizationPermission(role, "VIEW_SHELTERS");
  const canManage = hasOrganizationPermission(role, "MANAGE_SHELTERS");

  const hasFilters = Boolean(params.search || params.status);

  if (!canView) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shelters</h1>
          <p className="mt-1 text-sm text-muted">
            You do not have permission to view shelters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shelters</h1>

          <p className="mt-1 text-sm text-muted">
            Shelter facilities for {organization.name}.
          </p>
        </div>

        {canManage && (
          <Link
            href="/shelters/create"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <HiOutlinePlus className="size-5" />
            Create Shelter
          </Link>
        )}
      </div>

      {/* Filters */}
      <ShelterFilters
        search={params.search ?? undefined}
        status={params.status ?? undefined}
      />

      {/* Shelter table */}
      <ShelterTable
        shelters={shelters}
        hasFilters={hasFilters}
        canManage={canManage}
      />
    </div>
  );
}
