
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireOrganizationPermission } from "@/lib/permissions/require-organization-permission";
import { updateIncidentSeveritySchema } from "@/lib/validations/incident-severity.schema";

type UpdateIncidentSeverityResult =
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      message: string;
    };

export async function updateIncidentSeverity(
  formData: unknown,
): Promise<UpdateIncidentSeverityResult> {
  // Keep authorization outside try/catch so redirects work correctly.
  const context = await requireOrganizationPermission(
    "UPDATE_INCIDENT_SEVERITY",
  );

  try {
    // 1. Validate submitted data.
    const validation =
      updateIncidentSeveritySchema.safeParse(formData);

    if (!validation.success) {
      return {
        success: false,
        message: "Invalid incident severity information.",
      };
    }

    const { incidentId, severity } = validation.data;

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
        severity: true,
        status: true,
      },
    });

    if (!incident) {
      return {
        success: false,
        message: "Incident not found or access denied.",
      };
    }

    // 3. Prevent changes to closed or cancelled incidents.
    if (
      incident.status === "CLOSED" ||
      incident.status === "CANCELLED"
    ) {
      return {
        success: false,
        message:
          "Severity cannot be changed for closed or cancelled incidents.",
      };
    }

    // 4. Avoid unnecessary updates and audit entries.
    if (incident.severity === severity) {
      return {
        success: true,
        message: "The incident already has this severity.",
      };
    }

    // 5. Update severity and create audit log atomically.
    const updated = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.incident.updateMany({
        where: {
          id: incident.id,
          leadOrganizationId: context.organizationId,
          severity: incident.severity,
          status: incident.status,
        },
        data: {
          severity,
        },
      });

      // Another request may have changed the incident.
      if (updateResult.count !== 1) {
        return false;
      }

      await tx.auditLog.create({
        data: {
          actorUserId: context.session.user.id,
          actorType: "USER",
          actorNameSnapshot: context.session.user.name,
          organizationId: context.organizationId,
          action: "INCIDENT_SEVERITY_UPDATED",
          entityType: "Incident",
          entityId: incident.id,
          before: {
            severity: incident.severity,
          },
          after: {
            severity,
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
          "The incident was changed by another request. Refresh and try again.",
      };
    }

    // 6. Refresh incident listing and detail page.
    revalidatePath("/incidents");
    revalidatePath(`/incidents/${incident.id}`);

    return {
      success: true,
      message: `Incident severity updated to ${severity.toLowerCase()}.`,
    };
  } catch (error) {
    console.error("Incident severity update failed:", error);

    return {
      success: false,
      message:
        "Something went wrong while updating incident severity. Please try again.",
    };
  }
}
