import Link from "next/link";
import { notFound } from "next/navigation";
import { HiOutlineArrowLeft } from "react-icons/hi2";

import { requireOrganization } from "@/lib/permissions/organization";
import { hasOrganizationPermission } from "@/lib/permissions/organization-permissions";
import { getResourceById } from "@/lib/resources/queries";
import { EditResourceForm } from "@/components/resources/EditResourceForm";
import { ResourceStatusToggle } from "@/components/resources/ResourceStatusToggle";

interface ResourceDetailsPageProps {
  params: Promise<{
    resourceId: string;
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

export default async function ResourceDetailsPage({
  params,
}: ResourceDetailsPageProps) {
  const { resourceId } = await params;

  const { organizationId, membership } = await requireOrganization();

  const resource = await getResourceById(resourceId, organizationId);

  if (!resource) {
    notFound();
  }

  const canManage = hasOrganizationPermission(
    membership.role.toUpperCase(),
    "MANAGE_RESOURCES",
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/resources"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted transition hover:text-foreground"
        >
          <HiOutlineArrowLeft className="size-4" />
          Back to Resources
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {resource.name}
            </h1>

            <p className="mt-1 text-sm text-muted">
              Created {formatDate(resource.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                resource.isActive
                  ? "bg-green-500/10 text-green-600"
                  : "bg-muted/10 text-muted"
              }`}
            >
              {resource.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Resource Information */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">Resource Information</h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            label="Category"
            value={resource.category.replaceAll("_", " ")}
          />

          <DetailItem label="Unit" value={resource.unit} />

          <DetailItem label="SKU" value={resource.sku ?? "Not provided"} />

          <DetailItem
            label="Last Updated"
            value={formatDate(resource.updatedAt)}
          />
        </div>

        <div className="mt-5">
          <p className="text-sm text-muted">Description</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-7">
            {resource.description ?? "No description provided."}
          </p>
        </div>
      </section>

      {/* Edit (OWNER/ADMIN only) */}
      {canManage && (
        <EditResourceForm
          resource={{
            id: resource.id,
            name: resource.name,
            category: resource.category,
            unit: resource.unit,
            description: resource.description,
            sku: resource.sku,
            isActive: resource.isActive,
          }}
        />
      )}

      {/* Status control (OWNER/ADMIN only) */}
      {canManage && (
        <ResourceStatusToggle
          resourceId={resource.id}
          isActive={resource.isActive}
        />
      )}
    </div>
  );
}