
"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireOrganizationPermission } from "@/lib/permissions/require-organization-permission";
import { inviteIncidentParticipantSchema } from "@/lib/validations/incident-participant.schema";

type InviteIncidentParticipantResult =
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      message: string;
      participantId: string;
      expiresAt: string;
    };

const INVITATION_VALIDITY_DAYS = 7;

export async function inviteIncidentParticipant(
  formData: unknown,
): Promise<InviteIncidentParticipantResult> {
  // Keep authorization outside try/catch so redirects work correctly.
  const context = await requireOrganizationPermission(
    "MANAGE_INCIDENT_PARTICIPANTS",
  );

  try {
    // 1. Validate submitted data.
    const validation =
      inviteIncidentParticipantSchema.safeParse(formData);

    if (!validation.success) {
      return {
        success: false,
        message: "Please provide valid participant invitation information.",
      };
    }

    const { incidentId, organizationId, roles } = validation.data;

    // 2. Prevent inviting the lead organization itself.
    if (organizationId === context.organizationId) {
      return {
        success: false,
        message: "You cannot invite your own organization.",
      };
    }

    // 3. Verify the incident belongs to the active lead organization.
    const incident = await prisma.incident.findFirst({
      where: {
        id: incidentId,
        leadOrganizationId: context.organizationId,
      },
      select: {
        id: true,
        incidentNumber: true,
        title: true,
      },
    });

    if (!incident) {
      return {
        success: false,
        message: "Incident not found or access denied.",
      };
    }

    // 4. Verify the invited organization is active.
    const invitedOrganization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!invitedOrganization) {
      return {
        success: false,
        message: "The selected organization does not exist or is inactive.",
      };
    }

    // 5. Calculate the invitation expiration.
    const now = new Date();

    const expiresAt = new Date(
      now.getTime() +
        INVITATION_VALIDITY_DAYS * 24 * 60 * 60 * 1000,
    );

    // 6. Create or reuse the participant record atomically.
    const participant = await prisma.$transaction(
      async (tx) => {
        const existingParticipant =
          await tx.incidentParticipant.findUnique({
            where: {
              incidentId_organizationId: {
                incidentId,
                organizationId,
              },
            },
            include: {
              roles: {
                select: {
                  role: true,
                },
              },
            },
          });

        // Detect an expired pending invitation.
        const expiredPendingInvitation =
          existingParticipant?.status === "INVITED" &&
          existingParticipant.expiresAt !== null &&
          existingParticipant.expiresAt <= now;

        // Preserve the expiration event in the audit history.
        if (expiredPendingInvitation && existingParticipant) {
          await tx.auditLog.create({
            data: {
              actorUserId: context.session.user.id,
              actorType: "USER",
              actorNameSnapshot: context.session.user.name,
              organizationId: context.organizationId,
              action: "INCIDENT_PARTICIPANT_INVITATION_EXPIRED",
              entityType: "IncidentParticipant",
              entityId: existingParticipant.id,
              before: {
                status: "INVITED",
                expiresAt: existingParticipant.expiresAt!.toISOString(),
              },
              after: {
                status: "EXPIRED",
              },
              metadata: {
                incidentId,
                organizationId,
                reason: "Invitation expired before being resent.",
              },
            },
          });
        }

        // An active participant cannot receive another invitation.
        if (existingParticipant?.status === "ACTIVE") {
          throw new Error("ORGANIZATION_ALREADY_PARTICIPATING");
        }

        // Prevent duplicate pending invitations.
        if (existingParticipant?.status === "INVITED") {
          const invitationStillValid =
            existingParticipant.expiresAt === null ||
            existingParticipant.expiresAt > now;

          if (invitationStillValid) {
            throw new Error("INVITATION_ALREADY_PENDING");
          }
        }

        // Only rejected, expired, withdrawn, or expired pending
        // invitations can be reused.
        if (
          existingParticipant &&
          !["INVITED", "REJECTED", "EXPIRED", "WITHDRAWN"].includes(
            existingParticipant.status,
          )
        ) {
          throw new Error("PARTICIPATION_CANNOT_BE_REINVITED");
        }

        let participantId: string;

        if (existingParticipant) {
          participantId = existingParticipant.id;

          // Replace old roles with the newly selected roles.
          await tx.incidentParticipantRole.deleteMany({
            where: {
              participantId,
            },
          });

          await tx.incidentParticipantRole.createMany({
            data: roles.map((role) => ({
              participantId,
              role,
            })),
          });

          // Revoke old permissions so stale access is not retained.
          await tx.incidentParticipantPermission.updateMany({
            where: {
              participantId,
              revokedAt: null,
            },
            data: {
              revokedAt: now,
            },
          });

          // Reopen the invitation lifecycle.
          await tx.incidentParticipant.update({
            where: {
              id: participantId,
            },
            data: {
              status: "INVITED",
              invitedById: context.session.user.id,
              respondedById: null,
              respondedAt: null,
              expiresAt,
              joinedAt: null,
              withdrawnAt: null,
            },
          });
        } else {
          const createdParticipant =
            await tx.incidentParticipant.create({
              data: {
                incidentId,
                organizationId,
                status: "INVITED",
                invitedById: context.session.user.id,
                expiresAt,
                roles: {
                  create: roles.map((role) => ({
                    role,
                  })),
                },
              },
            });

          participantId = createdParticipant.id;
        }

        // 7. Record the invitation in the audit log.
        await tx.auditLog.create({
          data: {
            actorUserId: context.session.user.id,
            actorType: "USER",
            actorNameSnapshot: context.session.user.name,
            organizationId: context.organizationId,
            action: existingParticipant
              ? "INCIDENT_PARTICIPANT_INVITATION_RESENT"
              : "INCIDENT_PARTICIPANT_INVITED",
            entityType: "IncidentParticipant",
            entityId: participantId,

            // Prisma JSON fields must not receive JavaScript null.
            ...(existingParticipant
              ? {
                  before: {
                    status: expiredPendingInvitation
                      ? "EXPIRED"
                      : existingParticipant.status,
                    roles: existingParticipant.roles.map(
                      (item) => item.role,
                    ),
                  },
                }
              : {}),

            after: {
              status: "INVITED",
              organizationId,
              organizationName: invitedOrganization.name,
              roles,
              expiresAt: expiresAt.toISOString(),
            },
            metadata: {
              incidentId,
              incidentNumber: incident.incidentNumber,
              incidentTitle: incident.title,
              invitationValidityDays: INVITATION_VALIDITY_DAYS,
            },
          },
        });

        return {
          id: participantId,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    // 8. Refresh the incident pages after a successful invitation.
    revalidatePath("/incidents");
    revalidatePath(`/incidents/${incidentId}`);

    return {
      success: true,
      message: "Organization invited successfully.",
      participantId: participant.id,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    // Handle concurrent requests and unique-constraint conflicts.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2034")
    ) {
      return {
        success: false,
        message:
          "Another invitation request may have been processed at the same time. Please refresh and try again.",
      };
    }

    if (error instanceof Error) {
      switch (error.message) {
        case "ORGANIZATION_ALREADY_PARTICIPATING":
          return {
            success: false,
            message:
              "This organization is already participating in the incident.",
          };

        case "INVITATION_ALREADY_PENDING":
          return {
            success: false,
            message:
              "This organization already has a pending invitation.",
          };

        case "PARTICIPATION_CANNOT_BE_REINVITED":
          return {
            success: false,
            message:
              "This organization's current participation status does not allow a new invitation.",
          };
      }
    }

    console.error("Incident participant invitation failed:", error);

    return {
      success: false,
      message:
        "Something went wrong while inviting the organization. Please try again.",
    };
  }
}
