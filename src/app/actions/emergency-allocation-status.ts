"use server";

import { revalidatePath } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireOrganizationPermission } from "@/lib/permissions/require-organization-permission";
import { canTransitionAllocation } from "@/lib/requests/allocation-transitions";
import { updateAllocationStatusSchema } from "@/lib/validations/emergency-allocation-status.schema";

type UpdateAllocationStatusResult =
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      message: string;
    };

const STATUS_VERB: Record<string, string> = {
  DISPATCHED: "dispatched",
  DELIVERED: "marked as delivered",
  CANCELLED: "cancelled",
};

export async function updateAllocationStatus(
  formData: unknown,
): Promise<UpdateAllocationStatusResult> {
  // Keep authorization outside try/catch so redirects work correctly.
  // Only OWNER/ADMIN (RESPOND_TO_EMERGENCY_REQUEST) may manage allocations.
  const context = await requireOrganizationPermission(
    "RESPOND_TO_EMERGENCY_REQUEST",
  );

  try {
    const validation = updateAllocationStatusSchema.safeParse(formData);

    if (!validation.success) {
      return {
        success: false,
        message:
          validation.error.issues[0]?.message ??
          "Invalid allocation status update.",
      };
    }

    const { allocationId, status } = validation.data;

    const result = await prisma.$transaction(
      async (tx) => {
        // The allocation must belong to the caller's organization.
        const allocation = await tx.resourceAllocation.findFirst({
          where: {
            id: allocationId,
            providerOrganizationId: context.organizationId,
          },
          select: {
            id: true,
            status: true,
            requestItem: {
              select: {
                requestId: true,
              },
            },
          },
        });

        if (!allocation) {
          throw new Error("ALLOCATION_NOT_FOUND");
        }

        // Validate the transition on the server.
        if (!canTransitionAllocation(allocation.status, status)) {
          throw new Error("INVALID_TRANSITION");
        }

        const now = new Date();

        const data: Prisma.ResourceAllocationUpdateInput = {
          status,
        };

        // Keep timestamps consistent with the new status.
        if (status === "DISPATCHED") {
          data.dispatchedAt = now;
        } else if (status === "DELIVERED") {
          data.deliveredAt = now;
        }
        // CANCELLED leaves prior timestamps untouched (a dispatched allocation
        // keeps its dispatchedAt; deliveredAt is never set because a delivered
        // allocation cannot be cancelled).

        // Conditional update guards against concurrent transitions.
        const updateResult = await tx.resourceAllocation.updateMany({
          where: {
            id: allocation.id,
            providerOrganizationId: context.organizationId,
            status: allocation.status,
          },
          data,
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
            action: "EMERGENCY_ALLOCATION_STATUS_UPDATED",
            entityType: "ResourceAllocation",
            entityId: allocation.id,
            before: {
              status: allocation.status,
            },
            after: {
              status,
            },
            metadata: {
              requestId: allocation.requestItem.requestId,
            },
            requestId: allocation.requestItem.requestId,
          },
        });

        return { requestId: allocation.requestItem.requestId };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    revalidatePath("/requests");
    revalidatePath(`/requests/${result.requestId}`);

    return {
      success: true,
      message: `Allocation ${STATUS_VERB[status] ?? status.toLowerCase()} successfully.`,
    };
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "ALLOCATION_NOT_FOUND":
          return {
            success: false,
            message: "Allocation not found or access denied.",
          };

        case "INVALID_TRANSITION":
          return {
            success: false,
            message: "This allocation status change is not allowed.",
          };

        case "CONCURRENT_UPDATE":
          return {
            success: false,
            message:
              "This allocation was updated by another action. Refresh and try again.",
          };
      }
    }

    console.error("Allocation status update failed:", error);

    return {
      success: false,
      message:
        "Something went wrong while updating the allocation. Please try again.",
    };
  }
}