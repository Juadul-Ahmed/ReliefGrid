
"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getOrganizationIncidentScope } from "@/lib/incidents/queries";
import { requireOrganizationPermission } from "@/lib/permissions/require-organization-permission";
import { createEmergencyRequestSchema } from "@/lib/validations/emergency-request.schema";

type CreateEmergencyRequestResult =
  | {
      success: false;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    }
  | {
      success: true;
      message: string;
      requestId: string;
      requestNumber: string;
    };

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRequestNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");

  const suffix = Array.from(
    randomBytes(6),
    (byte) => ALPHABET[byte % ALPHABET.length],
  ).join("");

  return `ER-${date}-${suffix}`;
}

export async function createEmergencyRequest(
  formData: unknown,
): Promise<CreateEmergencyRequestResult> {
  const context = await requireOrganizationPermission(
    "CREATE_EMERGENCY_REQUEST",
  );

  try {
    const validation = createEmergencyRequestSchema.safeParse(formData);

    if (!validation.success) {
      return {
        success: false,
        message:
          validation.error.issues[0]?.message ??
          "Please provide valid emergency request information.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const data = validation.data;

    // Verify that the organization can access the linked incident.
    if (data.incidentId) {
      const incident = await prisma.incident.findFirst({
        where: {
          AND: [
            { id: data.incidentId },
            getOrganizationIncidentScope(context.organizationId),
          ],
        },
        select: { id: true },
      });

      if (!incident) {
        return {
          success: false,
          message: "The selected incident was not found or access was denied.",
        };
      }
    }

    // Create the request, items and audit log atomically.
    for (let attempt = 0; attempt < 5; attempt++) {
      const requestNumber = generateRequestNumber();

      try {
        const created = await prisma.$transaction(async (tx) => {
          const request = await tx.emergencyRequest.create({
            data: {
              requestNumber,
              title: data.title,
              description: data.description,
              category: data.category,
              priority: data.priority,
              status: "SUBMITTED",

              // Trusted server-side identity, never form input.
              organizationId: context.organizationId,
              submittedById: context.session.user.id,

              incidentId: data.incidentId ?? null,
              locationName: data.locationName ?? null,
              address: data.address ?? null,
              latitude: data.latitude ?? null,
              longitude: data.longitude ?? null,
              requiredBy: data.requiredBy
                ? new Date(data.requiredBy)
                : null,

              items: {
                create: data.items.map((item) => ({
                  name: item.name,
                  description: item.description ?? null,
                  quantity: new Prisma.Decimal(item.quantity),
                  unit: item.unit,
                })),
              },
            },
            select: {
              id: true,
              requestNumber: true,
            },
          });

          await tx.auditLog.create({
            data: {
              actorUserId: context.session.user.id,
              actorType: "USER",
              actorNameSnapshot: context.session.user.name,
              organizationId: context.organizationId,
              action: "EMERGENCY_REQUEST_CREATED",
              entityType: "EmergencyRequest",
              entityId: request.id,
              after: {
                requestNumber: request.requestNumber,
                title: data.title,
                category: data.category,
                priority: data.priority,
                incidentId: data.incidentId ?? null,
                itemCount: data.items.length,
              },
            },
          });

          return request;
        });

        revalidatePath("/requests");

        if (data.incidentId) {
          revalidatePath(`/incidents/${data.incidentId}`);
        }

        return {
          success: true,
          message: "Emergency request created successfully.",
          requestId: created.id,
          requestNumber: created.requestNumber,
        };
      } catch (error) {
        // Retry only when the request number's unique constraint collides.
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          const target = error.meta?.target;
          const targetText = Array.isArray(target)
            ? target.join(",")
            : String(target ?? "");

          if (targetText.toLowerCase().includes("requestnumber")) {
            continue;
          }
        }

        throw error;
      }
    }

    return {
      success: false,
      message: "Could not generate a unique request number. Please try again.",
    };
  } catch (error) {
    console.error("Emergency request creation failed:", error);

    return {
      success: false,
      message:
        "Something went wrong while creating the emergency request. Please try again.",
    };
  }
}
