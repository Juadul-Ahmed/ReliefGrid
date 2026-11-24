
"use server";

import { prisma } from "@/lib/db/prisma";
import { requireOrganizationPermission } from "@/lib/permissions/require-organization-permission";
import { assignIncidentCoordinatorSchema } from "@/lib/validations/incident-coordinator.schema";

type AssignIncidentCoordinatorResult =
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      message: string;
    };

export async function assignIncidentCoordinator(
  formData: unknown,
): Promise<AssignIncidentCoordinatorResult> {
  // Authorization stays outside try/catch so redirects work correctly.
  const context = await requireOrganizationPermission(
    "ASSIGN_INCIDENT_COORDINATOR",
  );

  try {
    // 1. Validate the submitted data.
    const validation =
      assignIncidentCoordinatorSchema.safeParse(formData);

    if (!validation.success) {
      return {
        success: false,
        message: "Invalid coordinator assignment information.",
      };
    }

    const { incidentId, coordinatorId } = validation.data;

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
        coordinatorId: true,
        coordinator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!incident) {
      return {
        success: false,
        message: "Incident not found or access denied.",
      };
    }

    // 3. If assigning someone, verify active membership.
    let newCoordinator = null;

    if (coordinatorId !== null) {
      const membership = await prisma.member.findFirst({
        where: {
          organizationId: context.organizationId,
          userId: coordinatorId,
          status: "ACTIVE",
        },
        select: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!membership) {
        return {
          success: false,
          message:
            "The selected coordinator is not an active member of this organization.",
        };
      }

      newCoordinator = membership.user;
    }

    // 4. Avoid unnecessary updates and audit entries.
    if (incident.coordinatorId === coordinatorId) {
      return {
        success: true,
        message: "The coordinator is already assigned.",
      };
    }

    // 5. Update the coordinator and audit log atomically.
    await prisma.$transaction(async (tx) => {
      await tx.incident.update({
        where: {
          id: incident.id,
        },
        data: {
          coordinatorId,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: context.session.user.id,
          actorType: "USER",
          actorNameSnapshot: context.session.user.name,
          organizationId: context.organizationId,
          action:
            coordinatorId === null
              ? "INCIDENT_COORDINATOR_REMOVED"
              : incident.coordinatorId
                ? "INCIDENT_COORDINATOR_CHANGED"
                : "INCIDENT_COORDINATOR_ASSIGNED",
          entityType: "Incident",
          entityId: incident.id,
          before: {
            coordinatorId: incident.coordinatorId,
            coordinatorName:
              incident.coordinator?.name ?? null,
          },
          after: {
            coordinatorId,
            coordinatorName: newCoordinator?.name ?? null,
          },
          metadata: {
            incidentNumber: incident.incidentNumber,
            incidentTitle: incident.title,
          },
        },
      });
    });

    return {
      success: true,
      message:
        coordinatorId === null
          ? "Incident coordinator removed successfully."
          : incident.coordinatorId
            ? "Incident coordinator updated successfully."
            : "Incident coordinator assigned successfully.",
    };
  } catch (error) {
    console.error("Incident coordinator update failed:", error);

    return {
      success: false,
      message:
        "Something went wrong while updating the incident coordinator. Please try again.",
    };
  }
}
