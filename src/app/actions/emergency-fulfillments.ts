
"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/db/prisma";
import { COMMITTED_ALLOCATION_STATUSES } from "@/lib/requests/fulfillment";
import { getEmergencyRequestScope } from "@/lib/requests/queries";
import { requireOrganizationPermission } from "@/lib/permissions/require-organization-permission";
import { allocateEmergencyResourcesSchema } from "@/lib/validations/emergency-fulfillment.schema";

type AllocateEmergencyResourcesResult =
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      message: string;
      allocationId: string;
    };

export async function allocateEmergencyResources(
  formData: unknown,
): Promise<AllocateEmergencyResourcesResult> {
  // Keep authorization outside try/catch so redirects work correctly.
  const context = await requireOrganizationPermission(
    "RESPOND_TO_EMERGENCY_REQUEST",
  );

  try {
    const validation =
      allocateEmergencyResourcesSchema.safeParse(formData);

    if (!validation.success) {
      return {
        success: false,
        message:
          validation.error.issues[0]?.message ??
          "Please provide valid allocation information.",
      };
    }

    const { requestId, itemId, quantity, notes, inventoryItemId } =
      validation.data;

    const allocation = await prisma.$transaction(
      async (tx) => {
        // Confirm request visibility and retrieve the requested item.
        const request = await tx.emergencyRequest.findFirst({
          where: {
            AND: [
              { id: requestId },
              getEmergencyRequestScope(context.organizationId),
            ],
          },
          select: {
            id: true,
            requestNumber: true,
            title: true,
            organizationId: true,
            status: true,
            items: {
              where: { id: itemId },
              select: {
                id: true,
                name: true,
                unit: true,
                quantity: true,
              },
            },
          },
        });

        if (!request) {
          throw new Error("REQUEST_NOT_FOUND");
        }

        if (request.organizationId === context.organizationId) {
          throw new Error("OWN_REQUEST");
        }

        // Only verified requests can receive allocations.
        if (request.status !== "VERIFIED") {
          throw new Error("REQUEST_NOT_VERIFIED");
        }

        const item = request.items[0];

        if (!item) {
          throw new Error("ITEM_NOT_FOUND");
        }

        // Count all quantities already committed by providers.
        // Cancelled allocations do not reserve any quantity.
        const existingAllocations =
          await tx.resourceAllocation.aggregate({
            where: {
              requestItemId: item.id,
              status: {
                in: [...COMMITTED_ALLOCATION_STATUSES],
              },
            },
            _sum: {
              quantity: true,
            },
          });

        const committedQuantity =
          existingAllocations._sum.quantity ??
          new Prisma.Decimal(0);

        const remainingQuantity =
          item.quantity.minus(committedQuantity);

        const requestedQuantity = new Prisma.Decimal(quantity);

        if (remainingQuantity.lte(0)) {
          throw new Error("ITEM_ALREADY_ALLOCATED");
        }

        if (requestedQuantity.gt(remainingQuantity)) {
          throw new Error("QUANTITY_EXCEEDS_REMAINING");
        }

        // Validate linked inventory before mutating anything.
        let inventoryId: string | null = null;
        let inventoryUpdatedAt: Date | null = null;
        let newReserved: Prisma.Decimal | null = null;

        if (inventoryItemId) {
          const inventory = await tx.inventoryItem.findFirst({
            where: {
              id: inventoryItemId,
              organizationId: context.organizationId,
            },
            select: {
              id: true,
              onHand: true,
              reserved: true,
              isActive: true,
              updatedAt: true,
              resource: { select: { isActive: true } },
            },
          });

          if (!inventory) {
            throw new Error("INVENTORY_NOT_FOUND");
          }

          if (!inventory.isActive || !inventory.resource.isActive) {
            throw new Error("INVENTORY_INACTIVE");
          }

          const available = new Prisma.Decimal(inventory.onHand).minus(
            new Prisma.Decimal(inventory.reserved),
          );

          if (available.lessThan(requestedQuantity)) {
            throw new Error("INVENTORY_INSUFFICIENT");
          }

          inventoryId = inventory.id;
          inventoryUpdatedAt = inventory.updatedAt;
          newReserved = new Prisma.Decimal(inventory.reserved).plus(
            requestedQuantity,
          );
        }

        // Create the allocation.
        const created = await tx.resourceAllocation.create({
          data: {
            requestItemId: item.id,

            // Request identity comes from the authorized request lookup.
            requestId: request.id,

            // Provider identity comes from the authenticated session.
            providerOrganizationId: context.organizationId,
            allocatedById: context.session.user.id,

            quantity: requestedQuantity,
            status: "ALLOCATED",
            notes: notes ?? null,

            // Optional inventory linkage (legacy allocations keep null).
            inventoryItemId: inventoryItemId ?? null,
          },
          select: {
            id: true,
            quantity: true,
            status: true,
          },
        });

        // Reserve stock atomically once the allocation exists.
        if (inventoryId && newReserved) {
          const reserveResult = await tx.inventoryItem.updateMany({
            where: {
              id: inventoryId,
              organizationId: context.organizationId,
              updatedAt: inventoryUpdatedAt ?? undefined,
            },
            data: {
              reserved: newReserved,
            },
          });

          if (reserveResult.count !== 1) {
            throw new Error("INVENTORY_CONCURRENT");
          }

          await tx.stockMovement.create({
            data: {
              inventoryItemId: inventoryId,
              organizationId: context.organizationId,
              type: "RESERVE",
              quantity: requestedQuantity,
              reason: notes ?? "Allocation reservation",
              resourceAllocationId: created.id,
              actorUserId: context.session.user.id,
            },
          });
        }

        // Record the allocation in the audit log.
        await tx.auditLog.create({
          data: {
            actorUserId: context.session.user.id,
            actorType: "USER",
            actorNameSnapshot: context.session.user.name,
            organizationId: context.organizationId,
            action: "EMERGENCY_RESOURCE_ALLOCATED",
            entityType: "ResourceAllocation",
            entityId: created.id,
            after: {
              quantity: created.quantity.toString(),
              status: created.status,
              unit: item.unit,
              notes: notes ?? null,
            },
            metadata: {
              requestId: request.id,
              requestNumber: request.requestNumber,
              requestTitle: request.title,
              requestOrganizationId: request.organizationId,
              itemId: item.id,
              itemName: item.name,
            },
          },
        });

        return created;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    revalidatePath("/requests");
    revalidatePath(`/requests/${requestId}`);

    return {
      success: true,
      message: "Resources allocated successfully.",
      allocationId: allocation.id,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return {
        success: false,
        message:
          "Another organization allocated resources at the same time. Please refresh and try again.",
      };
    }

    if (error instanceof Error) {
      switch (error.message) {
        case "REQUEST_NOT_FOUND":
          return {
            success: false,
            message: "Request not found or access denied.",
          };

        case "OWN_REQUEST":
          return {
            success: false,
            message:
              "You cannot allocate resources to your own organization's request.",
          };

        case "REQUEST_NOT_VERIFIED":
          return {
            success: false,
            message:
              "This request must be verified before resources can be allocated.",
          };

        case "ITEM_NOT_FOUND":
          return {
            success: false,
            message: "Requested item not found.",
          };

        case "ITEM_ALREADY_ALLOCATED":
          return {
            success: false,
            message: "This item has already been fully allocated.",
          };

        case "QUANTITY_EXCEEDS_REMAINING":
          return {
            success: false,
            message:
              "Your allocation exceeds the remaining quantity. Please refresh and try again.",
          };

        case "INVENTORY_NOT_FOUND":
          return {
            success: false,
            message: "Inventory not found or access denied.",
          };

        case "INVENTORY_INACTIVE":
          return {
            success: false,
            message:
              "The linked inventory or resource is inactive and cannot be allocated.",
          };

        case "INVENTORY_INSUFFICIENT":
          return {
            success: false,
            message:
              "There is not enough available stock to reserve this quantity.",
          };

        case "INVENTORY_CONCURRENT":
          return {
            success: false,
            message:
              "Inventory was updated by another request. Please refresh and try again.",
          };
      }
    }

    console.error("Emergency resource allocation failed:", error);

    return {
      success: false,
      message:
        "Something went wrong while allocating resources. Please try again.",
    };
  }
}
