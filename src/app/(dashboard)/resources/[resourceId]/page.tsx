import Link from "next/link";
import { notFound } from "next/navigation";
import { HiOutlineArrowLeft } from "react-icons/hi2";

import { requireOrganization } from "@/lib/permissions/organization";
import { hasOrganizationPermission } from "@/lib/permissions/organization-permissions";
import { getResourceById, getInventoryByResource } from "@/lib/resources/queries";
import { getStockMovementsForResource } from "@/lib/inventory/queries";
import { EditResourceForm } from "@/components/resources/EditResourceForm";
import { ResourceStatusToggle } from "@/components/resources/ResourceStatusToggle";
import { InitializeInventoryForm } from "@/components/resources/InitializeInventoryForm";
import { AdjustInventoryForm } from "@/components/resources/AdjustInventoryForm";
import { SetLowStockThresholdForm } from "@/components/resources/SetLowStockThresholdForm";
import { StockMovementHistory } from "@/components/resources/StockMovementHistory";

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

  const role = membership.role.toUpperCase();

  const canManage = hasOrganizationPermission(role, "MANAGE_RESOURCES");

  const canAdjust = hasOrganizationPermission(role, "ADJUST_INVENTORY");

  const inventory = await getInventoryByResource(
    resource.id,
    organizationId,
  );

  const available = inventory
    ? Number(inventory.onHand) - Number(inventory.reserved)
    : 0;

  const lowStockThreshold = inventory?.lowStockThreshold ?? null;

  const isLowStock =
    inventory !== null &&
    lowStockThreshold !== null &&
    available <= Number(lowStockThreshold);

  const movements = await getStockMovementsForResource(
    resource.id,
    organizationId,
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

          <DetailItem label="Location Name" value={resource.locationName ?? "Not provided"} />

          <DetailItem label="Address" value={resource.address ?? "Not provided"} />

          <DetailItem
            label="Last Updated"
            value={formatDate(resource.updatedAt)}
          />
        </div>

        {(resource.latitude !== null && resource.longitude !== null) && (
          <div className="mt-5">
            <p className="text-sm text-muted">Coordinates</p>
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              <DetailItem
                label="Latitude"
                value={
                  resource.latitude !== null
                    ? resource.latitude.toFixed(6)
                    : "Not provided"
                }
              />
              <DetailItem
                label="Longitude"
                value={
                  resource.longitude !== null
                    ? resource.longitude.toFixed(6)
                    : "Not provided"
                }
              />
            </div>
          </div>
        )}

        <div className="mt-5">
          <p className="text-sm text-muted">Description</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-7">
            {resource.description ?? "No description provided."}
          </p>
        </div>
      </section>

      {/* Inventory */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Inventory</h2>
          {isLowStock && (
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600">
              Low stock
            </span>
          )}
        </div>

        {inventory ? (
          <>
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              <DetailItem
                label="On hand"
                value={`${inventory.onHand.toNumber()} ${resource.unit}`}
              />

              <DetailItem
                label="Reserved"
                value={`${inventory.reserved.toNumber()} ${resource.unit}`}
              />

              <DetailItem
                label="Available"
                value={`${available} ${resource.unit}`}
              />
            </div>

            <div className="mt-5">
              <DetailItem
                label="Low-stock threshold"
                value={
                  lowStockThreshold !== null
                    ? `${Number(lowStockThreshold)} ${resource.unit}`
                    : "Not set"
                }
              />
            </div>

            {canAdjust && (
              <AdjustInventoryForm
                inventoryItemId={inventory.id}
                unit={resource.unit}
              />
            )}

            {canAdjust && (
              <SetLowStockThresholdForm
                inventoryItemId={inventory.id}
                currentThreshold={
                  lowStockThreshold !== null
                    ? Number(lowStockThreshold)
                    : null
                }
                unit={resource.unit}
              />
            )}
          </>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-muted">
              No inventory has been initialized for this resource yet.
            </p>

            {canAdjust && (
              <InitializeInventoryForm
                resourceId={resource.id}
                unit={resource.unit}
              />
            )}
          </div>
        )}
      </section>

      {/* Stock movement history */}
      <section className="space-y-3">
        <div className="flex items-center justify-end">
          <Link
            href="/resources/movements"
            className="text-sm text-primary hover:underline"
          >
            View all movements
          </Link>
        </div>

        <StockMovementHistory
          page={movements}
          basePath={`/resources/${resource.id}`}
        />
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
            locationName: resource.locationName,
            address: resource.address,
            latitude: resource.latitude,
            longitude: resource.longitude,
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