"use server";

import { revalidatePath } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireOrganizationPermission } from "@/lib/permissions/require-organization-permission";
import { initializeInventorySchema } from "@/lib/validations/inventory-initialization.schema";
import { inventoryAdjustmentSchema } from "@/lib/validations/inventory-adjustment.schema";
import { inventoryThresholdSchema } from "@/lib/validations/inventory-threshold.schema";

type FieldErrors = Record<string, string[] | undefined>;

type InventoryResult =
  | {
      success: false;
      message: string;
      fieldErrors?: FieldErrors;
    }
  | {
      success: true;
      message: string;
    };

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function initializeInventory(
  formData: unknown,
): Promise<InventoryResult> {
  // Keep authorization outside try/catch so redirects work correctly.
  const context = await requireOrganizationPermission("ADJUST_INVENTORY");

  try {
    const validation = initializeInventorySchema.safeParse(formData);

    if (!validation.success) {
      return {
        success: false,
        message:
          validation.error.issues[0]?.message ??
          "Please provide valid inventory information.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const { resourceId, onHand, reason } = validation.data;

    // Verify the resource belongs to the authenticated organization.
    const resource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        organizationId: context.organizationId,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    if (!resource) {
      return {
        success: false,
        message: "Resource not found or access denied.",
      };
    }

    if (!resource.isActive) {
      return {
        success: false,
        message: "This resource is inactive and cannot receive inventory.",
      };
    }

    // Reject duplicate initialization up front for a friendly message.
    const existing = await prisma.inventoryItem.findFirst({
      where: {
        organizationId: context.organizationId,
        resourceId,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      return {
        success: false,
        message: "Inventory has already been initialized for this resource.",
      };
    }

    try {
      await prisma.$transaction(
        async (tx) => {
          const created = await tx.inventoryItem.create({
            data: {
              organizationId: context.organizationId,
              resourceId,
              onHand,
              reserved: 0,
            },
            select: {
              id: true,
            },
          });

          // The DB CHECK requires IN quantity > 0, so only record a movement
          // when there is a positive initial quantity.
          if (onHand > 0) {
            await tx.stockMovement.create({
              data: {
                inventoryItemId: created.id,
                type: "IN",
                quantity: onHand,
                reason,
                actorUserId: context.session.user.id,
              },
            });
          }

          await tx.auditLog.create({
            data: {
              actorUserId: context.session.user.id,
              actorType: "USER",
              actorNameSnapshot: context.session.user.name,
              organizationId: context.organizationId,
              action: "INVENTORY_INITIALIZED",
              entityType: "InventoryItem",
              entityId: created.id,
              after: {
                resourceId,
                onHand,
                reserved: 0,
              },
              metadata: {
                resourceName: resource.name,
                reason,
              },
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      revalidatePath("/resources");
      revalidatePath(`/resources/${resourceId}`);

      return {
        success: true,
        message: "Inventory initialized successfully.",
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return {
          success: false,
          message: "Inventory has already been initialized for this resource.",
        };
      }

      throw error;
    }
  } catch (error) {
    console.error("Inventory initialization failed:", error);

    return {
      success: false,
      message:
        "Something went wrong while initializing inventory. Please try again.",
    };
  }
}

export async function adjustInventory(
  formData: unknown,
): Promise<InventoryResult> {
  // Keep authorization outside try/catch so redirects work correctly.
  const context = await requireOrganizationPermission("ADJUST_INVENTORY");

  try {
    const validation = inventoryAdjustmentSchema.safeParse(formData);

    if (!validation.success) {
      return {
        success: false,
        message:
          validation.error.issues[0]?.message ??
          "Please provide a valid adjustment.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const { inventoryItemId, quantity, reason } = validation.data;

    // Scope by the authenticated organization.
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id: inventoryItemId,
        organizationId: context.organizationId,
      },
      select: {
        id: true,
        resourceId: true,
        onHand: true,
        reserved: true,
        updatedAt: true,
      },
    });

    if (!item) {
      return {
        success: false,
        message: "Inventory not found or access denied.",
      };
    }

    // Decimal-safe arithmetic (never JS floating point).
    const currentOnHand = new Prisma.Decimal(item.onHand);
    const reserved = new Prisma.Decimal(item.reserved);
    const delta = new Prisma.Decimal(quantity);
    const nextOnHand = currentOnHand.plus(delta);

    if (nextOnHand.isNegative()) {
      return {
        success: false,
        message: "Adjustment would make the on-hand quantity negative.",
      };
    }

    if (nextOnHand.lessThan(reserved)) {
      return {
        success: false,
        message:
          "Adjustment would make the on-hand quantity less than the reserved quantity.",
      };
    }

    try {
      await prisma.$transaction(
        async (tx) => {
          // Conditional update guards against concurrent adjustments.
          const updateResult = await tx.inventoryItem.updateMany({
            where: {
              id: item.id,
              organizationId: context.organizationId,
              updatedAt: item.updatedAt,
            },
            data: {
              onHand: nextOnHand,
            },
          });

          if (updateResult.count !== 1) {
            throw new Error("CONCURRENT_UPDATE");
          }

          await tx.stockMovement.create({
            data: {
              inventoryItemId: item.id,
              type: "ADJUST",
              quantity: delta,
              reason,
              actorUserId: context.session.user.id,
            },
          });

          await tx.auditLog.create({
            data: {
              actorUserId: context.session.user.id,
              actorType: "USER",
              actorNameSnapshot: context.session.user.name,
              organizationId: context.organizationId,
              action: "INVENTORY_ADJUSTED",
              entityType: "InventoryItem",
              entityId: item.id,
              before: {
                onHand: currentOnHand.toNumber(),
                reserved: reserved.toNumber(),
              },
              after: {
                onHand: nextOnHand.toNumber(),
                reserved: reserved.toNumber(),
              },
              metadata: {
                resourceId: item.resourceId,
                reason,
              },
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      revalidatePath("/resources");
      revalidatePath(`/resources/${item.resourceId}`);

      return {
        success: true,
        message: "Inventory adjusted successfully.",
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "CONCURRENT_UPDATE"
      ) {
        return {
          success: false,
          message:
            "This inventory was updated by another request. Refresh and try again.",
        };
      }

      throw error;
    }
  } catch (error) {
    console.error("Inventory adjustment failed:", error);

    return {
      success: false,
      message:
        "Something went wrong while adjusting inventory. Please try again.",
    };
  }
}

export async function updateInventoryThreshold(
  formData: unknown,
): Promise<InventoryResult> {
  // Keep authorization outside try/catch so redirects work correctly.
  const context = await requireOrganizationPermission("ADJUST_INVENTORY");

  try {
    const validation = inventoryThresholdSchema.safeParse(formData);

    if (!validation.success) {
      return {
        success: false,
        message:
          validation.error.issues[0]?.message ??
          "Please provide a valid threshold.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const { inventoryItemId, lowStockThreshold } = validation.data;

    const item = await prisma.inventoryItem.findFirst({
      where: {
        id: inventoryItemId,
        organizationId: context.organizationId,
      },
      select: {
        id: true,
        resourceId: true,
        lowStockThreshold: true,
        updatedAt: true,
      },
    });

    if (!item) {
      return {
        success: false,
        message: "Inventory not found or access denied.",
      };
    }

    const nextThreshold =
      lowStockThreshold === undefined
        ? null
        : new Prisma.Decimal(lowStockThreshold);

    const currentThreshold = item.lowStockThreshold
      ? new Prisma.Decimal(item.lowStockThreshold)
      : null;

    const thresholdChanged =
      (currentThreshold === null && nextThreshold !== null) ||
      (currentThreshold !== null &&
        (nextThreshold === null ||
          !currentThreshold.equals(nextThreshold)));

    if (!thresholdChanged) {
      return {
        success: false,
        message: "The threshold is already set to this value.",
      };
    }

    await prisma.$transaction(
      async (tx) => {
        const updateResult = await tx.inventoryItem.updateMany({
          where: {
            id: item.id,
            organizationId: context.organizationId,
            updatedAt: item.updatedAt,
          },
          data: {
            lowStockThreshold: nextThreshold,
          },
        });

        if (updateResult.count !== 1) {
          throw new Error("CONCURRENT_UPDATE");
        }

        await tx.auditLog.create({
          data: {
            actorUserId: context.session.user.id,
            actorType: "USER",
            actorNameSnapshot: context.session.user.name,
            organizationId: context.organizationId,
            action: "INVENTORY_THRESHOLD_UPDATED",
            entityType: "InventoryItem",
            entityId: item.id,
            before: {
              lowStockThreshold: currentThreshold
                ? currentThreshold.toNumber()
                : null,
            },
            after: {
              lowStockThreshold: nextThreshold
                ? nextThreshold.toNumber()
                : null,
            },
            metadata: {
              resourceId: item.resourceId,
            },
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    revalidatePath("/resources");
    revalidatePath("/dashboard");
    revalidatePath(`/resources/${item.resourceId}`);

    return {
      success: true,
      message: "Low-stock threshold updated successfully.",
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "CONCURRENT_UPDATE"
    ) {
      return {
        success: false,
        message:
          "This inventory was updated by another request. Refresh and try again.",
      };
    }

    console.error("Inventory threshold update failed:", error);

    return {
      success: false,
      message:
        "Something went wrong while updating the threshold. Please try again.",
    };
  }
}