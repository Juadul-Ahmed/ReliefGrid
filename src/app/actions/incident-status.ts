
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireOrganizationPermission } from "@/lib/permissions/require-organization-permission";
import { updateIncidentStatusSchema } from "@/lib/validations/incident-status.schema";

type UpdateIncidentStatusResult =
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      message: string;
    };

// Defines the permitted incident lifecycle.
const allowedStatusTransitions = {
  OPEN: ["ASSESSING", "CANCELLED"],
  ASSESSING: ["ACTIVE", "SUSPENDED", "CANCELLED"],
  ACTIVE: ["CONTAINED", "SUSPENDED", "CANCELLED"],
  CONTAINED: ["ACTIVE", "RESOLVED", "SUSPENDED"],
  RESOLVED: ["CLOSED", "ACTIVE"],
  SUSPENDED: ["ACTIVE", "CANCELLED"],
  CLOSED: [],
  CANCELLED: [],
} as const;

export async function updateIncidentStatus(
  formData: unknown,
): Promise<UpdateIncidentStatusResult> {
  // Keep authorization outside try/catch so redirects work correctly.
  const context = await requireOrganizationPermission(
    "UPDATE_INCIDENT_STATUS",
  );

  try {
    // 1. Validate submitted data.
    const validation = updateIncidentStatusSchema.safeParse(formData);

    if (!validation.success) {
      return {
        success: false,
        message: "Invalid incident status information.",
      };
    }

    const { incidentId, status } = validation.data;

    // 2. Find the incident under the active lead organization.
    const incident = await prisma.incident.findFirst({
      where: {
        id: incidentId,
        leadOrganizationId: context.organizationId,
      },
      select: {
        id: true,
        incidentNumber: true,
        title: true,
        status: true,
      },
    });

    if (!incident) {
      return {
        success: false,
        message: "Incident not found or access denied.",
      };
    }

    // 3. Avoid unnecessary updates and audit entries.
    if (incident.status === status) {
      return {
        success: true,
        message: "The incident already has this status.",
      };
    }

    // 4. Validate the requested lifecycle transition.
    const allowedNextStatuses: readonly string[] =
      allowedStatusTransitions[incident.status];

    if (!allowedNextStatuses.includes(status)) {
      return {
        success: false,
        message: `Cannot change incident status from ${incident.status} to ${status}.`,
      };
    }

    // 5. Update status and create audit log atomically.
    // The status condition protects against concurrent updates.
    const updated = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.incident.updateMany({
        where: {
          id: incident.id,
          leadOrganizationId: context.organizationId,
          status: incident.status,
        },
        data: {
          status,
        },
      });

      // Another request may have changed the status already.
      if (updateResult.count !== 1) {
        return false;
      }

      await tx.auditLog.create({
        data: {
          actorUserId: context.session.user.id,
          actorType: "USER",
          actorNameSnapshot: context.session.user.name,
          organizationId: context.organizationId,
          action: "INCIDENT_STATUS_UPDATED",
          entityType: "Incident",
          entityId: incident.id,
          before: {
            status: incident.status,
          },
          after: {
            status,
          },
          metadata: {
            incidentNumber: incident.incidentNumber,
            incidentTitle: incident.title,
          },
        },
      });

      return true;
    });

    if (!updated) {
      return {
        success: false,
        message:
          "The incident status was changed by another request. Refresh and try again.",
      };
    }

    // 6. Refresh the incident listing and detail page.
    revalidatePath("/incidents");
    revalidatePath(`/incidents/${incident.id}`);

    return {
      success: true,
      message: `Incident status updated to ${status.replaceAll("_", " ").toLowerCase()}.`,
    };
  } catch (error) {
    console.error("Incident status update failed:", error);

    return {
      success: false,
      message:
        "Something went wrong while updating the incident status. Please try again.",
    };
  }
}
