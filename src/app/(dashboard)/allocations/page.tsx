
import { notFound, redirect } from "next/navigation";

import { requireOrganization } from "@/lib/permissions/organization";
import { hasOrganizationPermission } from "@/lib/permissions/organization-permissions";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getEmergencyRequestScope } from "@/lib/requests/queries";
import { AllocationTable } from "@/app/(dashboard)/allocations/components/AllocationTable";
import { CreateAllocation } from "@/app/(dashboard)/allocations/components/CreateAllocation";

type AllocationStatus = "ALLOCATED" | "DISPATCHED" | "DELIVERED" | "CANCELLED";

interface AllocationsPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function AllocationsPage({
  searchParams,
}: AllocationsPageProps) {
  const { organizationId, organization, membership } = await requireOrganization();

  const role = membership.role.toUpperCase();
  const canView = hasOrganizationPermission(role, "VIEW_EMERGENCY_REQUESTS");
  const canManage = hasOrganizationPermission(role, "RESPOND_TO_EMERGENCY_REQUEST");

  if (!canView) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const statusFilter = params.status;

  const allocations = await prisma.resourceAllocation.findMany({
    where: {
      providerOrganizationId: organizationId,
      ...(statusFilter ? { status: statusFilter as AllocationStatus } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      requestId: true,
      requestItemId: true,
      quantity: true,
      status: true,
      dispatchedAt: true,
      deliveredAt: true,
      trackingReference: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      providerOrganization: {
        select: { id: true, name: true },
      },
      requestItem: {
        select: {
          id: true,
          name: true,
          unit: true,
          quantity: true,
          request: {
            select: {
              id: true,
              requestNumber: true,
              title: true,
              organizationId: true,
              organization: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          dispatchedQuantity: true,
          deliveredQuantity: true,
          status: true,
          inventoryItemId: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  // Fetch verified requests accessible to this org for allocation creation.
  let createRequests: Array<{
    id: string;
    requestNumber: string;
    title: string;
    organizationId: string;
    organizationName: string;
    items: Array<{ id: string; name: string; unit: string; quantity: string }>;
  }> = [];

  if (canManage) {
    const verifiedRequests = await prisma.emergencyRequest.findMany({
      where: {
        AND: [
          getEmergencyRequestScope(organizationId),
          { status: "VERIFIED" },
          { organizationId: { not: organizationId } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        requestNumber: true,
        title: true,
        organizationId: true,
        organization: {
          select: { name: true },
        },
        items: {
          select: {
            id: true,
            name: true,
            unit: true,
            quantity: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    createRequests = verifiedRequests.map((r) => ({
      id: r.id,
      requestNumber: r.requestNumber,
      title: r.title,
      organizationId: r.organizationId,
      organizationName: r.organization.name,
      items: r.items.map((i) => ({
        id: i.id,
        name: i.name,
        unit: i.unit,
        quantity: i.quantity.toString(),
      })),
    }));
  }

  // Fetch active inventory for the current provider organization.
  let inventoryOptions: Array<{
    id: string;
    name: string;
    available: string;
  }> = [];

  if (canManage) {
    const inventory = await prisma.inventoryItem.findMany({
      where: { organizationId, isActive: true },
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: {
        id: true,
        onHand: true,
        reserved: true,
        resource: { select: { name: true, unit: true, isActive: true } },
      },
    });

    inventoryOptions = inventory
      .filter((iv) => iv.resource.isActive)
      .map((iv) => ({
        id: iv.id,
        name: `${iv.resource.name} (${iv.resource.unit})`,
        available: new Prisma.Decimal(iv.onHand).minus(new Prisma.Decimal(iv.reserved)).toString(),
      }));
  }

  // Map query results into client-safe objects: convert all Prisma Decimal
  // values to strings so they can be passed to Client Components.
  const clientAllocations = allocations.map((a) => ({
    id: a.id,
    requestId: a.requestId,
    requestItemId: a.requestItemId,
    quantity: a.quantity.toString(),
    status: a.status,
    dispatchedAt: a.dispatchedAt,
    deliveredAt: a.deliveredAt,
    trackingReference: a.trackingReference,
    notes: a.notes,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    providerOrganization: {
      id: a.providerOrganization.id,
      name: a.providerOrganization.name,
    },
    requestItem: {
      id: a.requestItem.id,
      name: a.requestItem.name,
      unit: a.requestItem.unit,
      quantity: a.requestItem.quantity.toString(),
      request: {
        id: a.requestItem.request.id,
        requestNumber: a.requestItem.request.requestNumber,
        title: a.requestItem.request.title,
        organizationId: a.requestItem.request.organizationId,
        organization: {
          id: a.requestItem.request.organization.id,
          name: a.requestItem.request.organization.name,
        },
      },
    },
    items: a.items.map((item) => ({
      id: item.id,
      quantity: item.quantity.toString(),
      dispatchedQuantity: item.dispatchedQuantity.toString(),
      deliveredQuantity: item.deliveredQuantity.toString(),
      status: item.status,
      inventoryItemId: item.inventoryItemId,
    })),
  }));

  if (!allocations) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Allocations</h1>
          <p className="mt-1 text-sm text-muted">
            Resource allocations provided by {organization.name}.
          </p>
        </div>

        {canManage && (
          <CreateAllocation
            requests={createRequests}
            inventory={inventoryOptions}
          />
        )}
      </div>

      <AllocationTable
        allocations={clientAllocations}
        currentOrganizationId={organizationId}
        statusFilter={statusFilter ?? ""}
        canManage={canManage}
      />
    </div>
  );
}
