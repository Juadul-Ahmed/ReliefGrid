"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireOrganizationPermission } from "@/lib/permissions/require-organization-permission";

type DeliverResult =
  | { success: false; message: string }
  | { success: true; message: string };

export async function deliverAllocationItem(formData: unknown): Promise<DeliverResult> {
  const context = await requireOrganizationPermission("RESPOND_TO_EMERGENCY_REQUEST");
  try {
    const data = formData as { resourceAllocationItemId: string; quantity?: string | null };
    if (!data?.resourceAllocationItemId) return { success: false, message: "Invalid input." };

    const deliverQuantity = data.quantity ? new Prisma.Decimal(data.quantity) : null;

    await prisma.$transaction(async (tx) => {
      const rai = await tx.resourceAllocationItem.findFirst({
        where: { id: data.resourceAllocationItemId, providerOrganizationId: context.organizationId },
        include: { resourceAllocation: true, inventoryItem: true },
      });
      if (!rai) throw new Error("ITEM_NOT_FOUND");
      if (rai.status !== "DISPATCHED") throw new Error("ITEM_NOT_DISPATCHED");

      const totalQuantity = rai.quantity;
      const alreadyDelivered = rai.deliveredQuantity;
      const remaining = totalQuantity.minus(alreadyDelivered);
      if (remaining.lte(0)) throw new Error("ALREADY_DELIVERED");

      const qtyToDeliver = deliverQuantity ?? remaining;
      if (qtyToDeliver.lte(0)) throw new Error("INVALID_QUANTITY");
      if (qtyToDeliver.gt(remaining)) throw new Error("QUANTITY_EXCEEDS_REMAINING");

      const newDelivered = alreadyDelivered.plus(qtyToDeliver);
      const isFullyDelivered = newDelivered.equals(totalQuantity);

      await tx.resourceAllocationItem.update({
        where: { id: rai.id },
        data: { deliveredQuantity: newDelivered, status: isFullyDelivered ? "DELIVERED" : "DISPATCHED" },
      });

      if (isFullyDelivered) {
        await tx.resourceAllocation.update({
          where: { id: rai.resourceAllocationId },
          data: { status: "DELIVERED", deliveredAt: new Date() },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: context.session.user.id,
          actorType: "USER",
          actorNameSnapshot: context.session.user.name,
          organizationId: context.organizationId,
          action: "EMERGENCY_ALLOCATION_DELIVERED",
          entityType: "ResourceAllocationItem",
          entityId: rai.id,
          after: { deliveredQuantity: newDelivered.toString(), status: isFullyDelivered ? "DELIVERED" : "DISPATCHED" },
          metadata: { resourceAllocationId: rai.resourceAllocationId, quantity: qtyToDeliver.toString() },
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    revalidatePath("/requests");
    return { success: true, message: "Delivered successfully." };
  } catch (error) {
    if (error instanceof Error) {
      const map: Record<string, string> = {
        ITEM_NOT_FOUND: "Allocation item not found.",
        ITEM_NOT_DISPATCHED: "Item must be dispatched before it can be delivered.",
        ALREADY_DELIVERED: "Item has already been fully delivered.",
        INVALID_QUANTITY: "Quantity must be greater than zero.",
        QUANTITY_EXCEEDS_REMAINING: "Delivered quantity exceeds remaining amount.",
      };
      if (map[error.message]) return { success: false, message: map[error.message] };
    }
    console.error("Delivery failed:", error);
    return { success: false, message: "Something went wrong while recording delivery." };
  }
}