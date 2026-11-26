"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getEmergencyRequestScope } from "@/lib/requests/queries";
import { requireOrganizationPermission } from "@/lib/permissions/require-organization-permission";
import { selectFefoBatches, ensureOpeningBatch } from "@/lib/inventory/batches";

type Result =
  | { success: false; message: string }
  | { success: true; message: string; allocationIds: string[] };

export async function allocateMultipleEmergencyResources(formData: unknown): Promise<Result> {
  const context = await requireOrganizationPermission("RESPOND_TO_EMERGENCY_REQUEST");
  try {
    const data = formData as { requestId: string; lines: { itemId: string; quantity: string; inventoryItemId?: string | null }[] };
    if (!data?.requestId || !Array.isArray(data.lines) || data.lines.length === 0) {
      return { success: false, message: "Invalid allocation input." };
    }

    const allocationIds = await prisma.$transaction(async (tx) => {
      const request = await tx.emergencyRequest.findFirst({
        where: { AND: [{ id: data.requestId }, getEmergencyRequestScope(context.organizationId)] },
        select: { id: true, requestNumber: true, title: true, organizationId: true, status: true, items: { select: { id: true, name: true, unit: true, quantity: true } } },
      });
      if (!request) throw new Error("REQUEST_NOT_FOUND");
      if (request.organizationId === context.organizationId) throw new Error("OWN_REQUEST");
      if (request.status !== "VERIFIED") throw new Error("REQUEST_NOT_VERIFIED");

      const ids: string[] = [];
      for (const line of data.lines) {
        const item = request.items.find((i) => i.id === line.itemId);
        if (!item) throw new Error("ITEM_NOT_FOUND");
        const requestedQuantity = new Prisma.Decimal(line.quantity);
        if (requestedQuantity.lte(0)) throw new Error("INVALID_QUANTITY");

        const agg = await tx.resourceAllocation.aggregate({
          where: { requestItemId: item.id, status: { in: ["ALLOCATED", "DISPATCHED", "DELIVERED"] } },
          _sum: { quantity: true },
        });
        const committed = agg._sum.quantity ?? new Prisma.Decimal(0);
        const remaining = item.quantity.minus(committed);
        if (remaining.lte(0)) throw new Error("ITEM_ALREADY_ALLOCATED");
        if (requestedQuantity.gt(remaining)) throw new Error("QUANTITY_EXCEEDS_REMAINING");

        const inventoryId = line.inventoryItemId ?? null;
        if (!inventoryId) throw new Error("INVENTORY_REQUIRED");

        const inventory = await tx.inventoryItem.findFirst({
          where: { id: inventoryId, organizationId: context.organizationId },
          select: { id: true, onHand: true, reserved: true, isActive: true, updatedAt: true, resource: { select: { isActive: true } } },
        });
        if (!inventory) throw new Error("INVENTORY_NOT_FOUND");
        if (!inventory.isActive || !inventory.resource.isActive) throw new Error("INVENTORY_INACTIVE");
        const available = new Prisma.Decimal(inventory.onHand).minus(new Prisma.Decimal(inventory.reserved));
        if (available.lessThan(requestedQuantity)) throw new Error("INVENTORY_INSUFFICIENT");

        await ensureOpeningBatch(tx, inventory.id, context.organizationId);

        const created = await tx.resourceAllocation.create({
          data: {
            requestItemId: item.id,
            requestId: request.id,
            providerOrganizationId: context.organizationId,
            allocatedById: context.session.user.id,
            quantity: requestedQuantity,
            status: "ALLOCATED",
            inventoryItemId: inventory.id,
          },
          select: { id: true },
        });

        await tx.resourceAllocationItem.create({
          data: {
            id: "rai_" + created.id,
            resourceAllocationId: created.id,
            providerOrganizationId: context.organizationId,
            requestItemId: item.id,
            requestId: request.id,
            inventoryItemId: inventory.id,
            quantity: requestedQuantity,
            dispatchedQuantity: 0,
            deliveredQuantity: 0,
            status: "ALLOCATED",
          },
        });

        const batches = await tx.inventoryBatch.findMany({ where: { inventoryItemId: inventory.id, organizationId: context.organizationId } });
        const picks = selectFefoBatches(batches, requestedQuantity);
        const newReserved = new Prisma.Decimal(inventory.reserved).plus(requestedQuantity);
        for (const p of picks) {
          await tx.inventoryBatch.update({ where: { id: p.batch.id }, data: { reserved: new Prisma.Decimal(p.batch.reserved).plus(p.quantity) } });
          await tx.inventoryBatchReservation.create({
            data: { id: "res_" + created.id + "_" + p.batch.id, resourceAllocationItemId: "rai_" + created.id, inventoryBatchId: p.batch.id, inventoryItemId: inventory.id, reservedQuantity: p.quantity, releasedQuantity: 0, consumedQuantity: 0 },
          });
        }

        const reserveResult = await tx.inventoryItem.updateMany({
          where: { id: inventory.id, organizationId: context.organizationId, updatedAt: inventory.updatedAt },
          data: { reserved: newReserved },
        });
        if (reserveResult.count !== 1) throw new Error("INVENTORY_CONCURRENT");

        await tx.stockMovement.create({
          data: { inventoryItemId: inventory.id, organizationId: context.organizationId, type: "RESERVE", quantity: requestedQuantity, reason: "Allocation reservation", resourceAllocationId: created.id, resourceAllocationItemId: "rai_" + created.id, actorUserId: context.session.user.id },
        });

        await tx.auditLog.create({
          data: { actorUserId: context.session.user.id, actorType: "USER", actorNameSnapshot: context.session.user.name, organizationId: context.organizationId, action: "EMERGENCY_RESOURCE_ALLOCATED", entityType: "ResourceAllocation", entityId: created.id, after: { quantity: requestedQuantity.toString(), status: "ALLOCATED" }, metadata: { requestId: request.id, requestNumber: request.requestNumber, itemId: item.id, itemName: item.name } },
        });
        ids.push(created.id);
      }
      return ids;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    revalidatePath("/requests");
    revalidatePath("/requests/" + data.requestId);
    return { success: true, message: "Resources allocated successfully.", allocationIds };
  } catch (error) {
    if (error instanceof Error) {
      const map: Record<string, string> = {
        REQUEST_NOT_FOUND: "Request not found or access denied.",
        OWN_REQUEST: "You cannot allocate resources to your own organization's request.",
        REQUEST_NOT_VERIFIED: "This request must be verified before resources can be allocated.",
        ITEM_NOT_FOUND: "Requested item not found.",
        ITEM_ALREADY_ALLOCATED: "This item has already been fully allocated.",
        QUANTITY_EXCEEDS_REMAINING: "Your allocation exceeds the remaining quantity.",
        INVENTORY_NOT_FOUND: "Inventory not found or access denied.",
        INVENTORY_INACTIVE: "The linked inventory or resource is inactive.",
        INVENTORY_INSUFFICIENT: "Not enough available stock to reserve this quantity.",
        INVENTORY_CONCURRENT: "Inventory was updated by another request. Refresh and try again.",
        INVALID_QUANTITY: "Quantity must be greater than zero.",
        INVENTORY_REQUIRED: "Each allocated line must link to an inventory item.",
      };
      if (map[error.message]) return { success: false, message: map[error.message] };
    }
    console.error("Multi-allocation failed:", error);
    return { success: false, message: "Something went wrong while allocating resources." };
  }
}
