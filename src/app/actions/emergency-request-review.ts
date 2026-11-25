"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireOrganizationPermission } from "@/lib/permissions/require-organization-permission";
import { reviewEmergencyRequestSchema } from "@/lib/validations/emergency-request-review.schema";

type ReviewEmergencyRequestResult =
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      message: string;
    };

export async function reviewEmergencyRequest(
  formData: unknown,
): Promise<ReviewEmergencyRequestResult> {
  // Keep authorization outside try/catch so redirects work correctly.
  const context = await requireOrganizationPermission(
    "REVIEW_EMERGENCY_REQUEST",
  );

  try {
    const validation = reviewEmergencyRequestSchema.safeParse(formData);

    if (!validation.success) {
      return {
        success: false,
        message:
          validation.error.issues[0]?.message ??
          "Invalid review information.",
      };
    }

    const { requestId, status, rejectionReason } = validation.data;

    const result = await prisma.$transaction(async (tx) => {
      // Only the submitting organization can review its request.
      const request = await tx.emergencyRequest.findFirst({
        where: {
          id: requestId,
          organizationId: context.organizationId,
        },
        select: {
          id: true,
          requestNumber: true,
          title: true,
          status: true,
        },
      });

      if (!request) {
        return {
          success: false as const,
          message: "Request not found or access denied.",
        };
      }

      // Enforce the request lifecycle.
      const allowedTransitions: Record<string, readonly string[]> = {
        SUBMITTED: ["UNDER_REVIEW"],
        UNDER_REVIEW: ["VERIFIED", "REJECTED"],
      };

      const allowedNextStatuses =
        allowedTransitions[request.status] ?? [];

      if (!allowedNextStatuses.includes(status)) {
        return {
          success: false as const,
          message: `Cannot change request status from ${request.status} to ${status}.`,
        };
      }

      const isFinalDecision =
        status === "VERIFIED" || status === "REJECTED";

      // Conditional update protects against concurrent review actions.
      const updateResult = await tx.emergencyRequest.updateMany({
        where: {
          id: request.id,
          organizationId: context.organizationId,
          status: request.status,
        },
        data: {
          status,
          reviewedById: isFinalDecision
            ? context.session.user.id
            : null,
          reviewedAt: isFinalDecision ? new Date() : null,
          rejectionReason:
            status === "REJECTED" ? rejectionReason : null,
        },
      });

      if (updateResult.count !== 1) {
        return {
          success: false as const,
          message:
            "This request was updated by another action. Refresh and try again.",
        };
      }

      await tx.auditLog.create({
        data: {
          actorUserId: context.session.user.id,
          actorType: "USER",
          actorNameSnapshot: context.session.user.name,
          organizationId: context.organizationId,
          action: "EMERGENCY_REQUEST_STATUS_UPDATED",
          entityType: "EmergencyRequest",
          entityId: request.id,
          before: {
            status: request.status,
          },
          after: {
            status,
            rejectionReason:
              status === "REJECTED" ? rejectionReason : null,
          },
          metadata: {
            requestNumber: request.requestNumber,
            requestTitle: request.title,
          },
        },
      });

      return {
        success: true as const,
        message: `Request ${status.replaceAll("_", " ").toLowerCase()} successfully.`,
      };
    });

    if (!result.success) {
      return result;
    }

    revalidatePath("/requests");
    revalidatePath(`/requests/${requestId}`);

    return result;
  } catch (error) {
    console.error("Emergency request review failed:", error);

    return {
      success: false,
      message:
        "Something went wrong while reviewing the request. Please try again.",
    };
  }
}