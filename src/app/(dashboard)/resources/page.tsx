import Link from "next/link";
import { HiOutlinePlus } from "react-icons/hi2";

import { requireOrganization } from "@/lib/permissions/organization";
import { hasOrganizationPermission } from "@/lib/permissions/organization-permissions";
import { getResources } from "@/lib/resources/queries";
import { ResourceFilters } from "@/components/resources/ResourceFilters";
import { ResourceTable } from "@/components/resources/ResourceTable";

interface ResourcesPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
  }>;
}

export default async function ResourcesPage({
  searchParams,
}: ResourcesPageProps) {
  const { organizationId, organization, membership } =
    await requireOrganization();

  const params = await searchParams;

  const resources = await getResources(organizationId, {
    search: params.search,
    category: params.category,
  });

  const canManage = hasOrganizationPermission(
    membership.role.toUpperCase(),
    "MANAGE_RESOURCES",
  );

  const hasFilters = Boolean(params.search || params.category);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resources</h1>

          <p className="mt-1 text-sm text-muted">
            Resource catalog for {organization.name}.
          </p>
        </div>

        {canManage && (
          <Link
            href="/resources/create"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <HiOutlinePlus className="size-5" />
            Create Resource
          </Link>
        )}
      </div>

      {/* Filters */}
      <ResourceFilters search={params.search} category={params.category} />

      {/* Resource table */}
      <ResourceTable
        resources={resources}
        hasFilters={hasFilters}
        canManage={canManage}
      />
    </div>
  );
}