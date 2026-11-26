"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireOrganizationPermission } from "@/lib/permissions/require-organization-permission";

type DispatchResult =
  | { success: false; message: string }
  | { success: true; message: string };

export async function dispatchAllocationItem(formData: unknown): Promise<DispatchResult> {
  const context = await requireOrganizationPermission("RESPOND_TO_EMERGENCY_REQUEST");
  try {
    const data = formData as { resourceAllocationItemId: string; quantity?: string | number | null; trackingReference?: string | null; notes?: string | null };
    if (!data?.resourceAllocationItemId) return { success: false, message: "Invalid input." };

    await prisma.$transaction(async (tx) => {
      const rai = await tx.resourceAllocationItem.findFirst({
        where: { id: data.resourceAllocationItemId, providerOrganizationId: context.organizationId },
        include: { resourceAllocation: true, inventoryItem: true },
      });
      if (!rai) throw new Error("ITEM_NOT_FOUND");
      if (rai.status !== "ALLOCATED") throw new Error("ITEM_NOT_ALLOCATED");
      if (!rai.inventoryItemId || !rai.inventoryItem) throw new Error("NO_INVENTORY");

      const quantity = rai.quantity;
      const dispatched = rai.dispatchedQuantity;
      const remaining = quantity.minus(dispatched);
      if (remaining.lte(0)) throw new Error("ALREADY_DISPATCHED");

      let dispatchAmount: Prisma.Decimal;
      if (data.quantity !== undefined && data.quantity !== null && data.quantity !== "") {
        const requested = new Prisma.Decimal(String(data.quantity));
        if (!requested.greaterThan(0)) throw new Error("INVALID_QUANTITY");
        if (requested.greaterThan(remaining)) throw new Error("QUANTITY_EXCEEDS_REMAINING");
        dispatchAmount = requested;
      } else {
        dispatchAmount = remaining;
      }

      const newDispatched = dispatched.plus(dispatchAmount);
      const fullyDispatched = !newDispatched.lessThan(quantity);

      await tx.resourceAllocationItem.update({
        where: { id: rai.id },
        data: { dispatchedQuantity: newDispatched, status: fullyDispatched ? "DISPATCHED" : "PARTIALLY_DISPATCHED" },
      });

      if (fullyDispatched) {
        await tx.resourceAllocation.update({
          where: { id: rai.resourceAllocationId },
          data: { status: "DISPATCHED", dispatchedAt: new Date(), trackingReference: data.trackingReference ?? null, notes: data.notes ?? null },
        });
      }

      const batches = await tx.inventoryBatch.findMany({ where: { inventoryItemId: rai.inventoryItemId, organizationId: context.organizationId } });
      const opening = batches.find((b) => b.batchNumber === "OPENING");
      if (!opening) throw new Error("NO_OPENING_BATCH");

      const reservations = await tx.inventoryBatchReservation.findMany({
        where: { resourceAllocationItemId: rai.id, releasedQuantity: { lt: tx.inventoryBatchReservation.fields.reservedQuantity } },
      });
      let dispatchRemaining = dispatchAmount;
      for (const res of reservations) {
        if (dispatchRemaining.lessThanOrEqualTo(0)) break;
        const available = res.reservedQuantity.minus(res.releasedQuantity).minus(res.consumedQuantity);
        if (available.lessThanOrEqualTo(0)) continue;
        const consume = available.lessThan(dispatchRemaining) ? available : dispatchRemaining;
        await tx.inventoryBatchReservation.update({ where: { id: res.id }, data: { consumedQuantity: res.consumedQuantity.plus(consume) } });
        await tx.inventoryBatch.update({ where: { id: res.inventoryBatchId }, data: { onHand: { decrement: consume.toNumber() }, reserved: { decrement: consume.toNumber() } } });
        dispatchRemaining = dispatchRemaining.minus(consume);
      }

      const newReserved = new Prisma.Decimal(rai.inventoryItem.reserved).minus(dispatchAmount);
      await tx.inventoryItem.update({ where: { id: rai.inventoryItemId }, data: { reserved: newReserved.lessThan(0) ? 0 : newReserved } });

      await tx.stockMovement.create({
        data: { inventoryItemId: rai.inventoryItemId, organizationId: context.organizationId, type: "OUT", quantity: dispatchAmount, reason: "Dispatch", resourceAllocationId: rai.resourceAllocationId, resourceAllocationItemId: rai.id, actorUserId: context.session.user.id },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    revalidatePath("/requests");
    return { success: true, message: "Dispatched successfully." };
  } catch (error) {
    if (error instanceof Error) {
      const map: Record<string, string> = {
        ITEM_NOT_FOUND: "Allocation item not found.",
        ITEM_NOT_ALLOCATED: "Item is not in allocated state.",
        NO_INVENTORY: "No inventory linked to this allocation.",
        ALREADY_DISPATCHED: "Item has already been fully dispatched.",
        NO_OPENING_BATCH: "Opening batch missing for inventory item.",
        INVALID_QUANTITY: "Invalid dispatch quantity.",
        QUANTITY_EXCEEDS_REMAINING: "Cannot dispatch more than remaining.",
      };
      if (map[error.message]) return { success: false, message: map[error.message] };
    }
    console.error("Dispatch failed:", error);
    return { success: false, message: "Something went wrong while dispatching." };
  }
}
