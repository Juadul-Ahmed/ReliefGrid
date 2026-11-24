
"use server";

import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db/prisma";
import { requireOrganizationPermission } from "@/lib/permissions/require-organization-permission";
import { createIncidentSchema } from "@/lib/validations/incident.schema";

type IncidentFieldErrors = Partial<
  Record<
    | "title"
    | "description"
    | "category"
    | "severity"
    | "locationName"
    | "address"
    | "latitude"
    | "longitude"
    | "occurredAt",
    string[] | undefined
  >
>;

type CreateIncidentResult =
  | {
      success: false;
      message: string;
      errors?: IncidentFieldErrors;
    }
  | {
      success: true;
      message: string;
      incident: {
        id: string;
        incidentNumber: string;
        title: string;
        status: string;
      };
    };

export async function createIncident(
  formData: unknown,
): Promise<CreateIncidentResult> {
  // Keep authorization outside try/catch so Next.js redirects work correctly.
  const context = await requireOrganizationPermission("CREATE_INCIDENT");

  try {
    // 1. Validate submitted form data.
    const validation = createIncidentSchema.safeParse(formData);

    if (!validation.success) {
      return {
        success: false,
        message: "Please check the incident information.",
        errors: validation.error.flatten().fieldErrors,
      };
    }

    const data = validation.data;

    // 2. Generate a unique incident number on the server.
    const datePart = new Date()
      .toISOString()
      .slice(0, 10)
      .replaceAll("-", "");

    const incidentNumber = `RG-${datePart}-${randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;

    // 3. Create the incident and audit record atomically.
    const incident = await prisma.$transaction(async (tx) => {
      const createdIncident = await tx.incident.create({
        data: {
          incidentNumber,
          title: data.title,
          description: data.description,
          category: data.category,
          severity: data.severity,

          // System-controlled values come from the server.
          status: "OPEN",
          leadOrganizationId: context.organizationId,
          createdById: context.session.user.id,

          // Optional location information.
          locationName: data.locationName || null,
          address: data.address || null,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          occurredAt: data.occurredAt
            ? new Date(data.occurredAt)
            : null,
        },
        select: {
          id: true,
          incidentNumber: true,
          title: true,
          status: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: context.session.user.id,
          actorType: "USER",
          actorNameSnapshot: context.session.user.name,
          organizationId: context.organizationId,
          action: "INCIDENT_CREATED",
          entityType: "Incident",
          entityId: createdIncident.id,
          after: {
            incidentNumber: createdIncident.incidentNumber,
            title: createdIncident.title,
            category: data.category,
            severity: data.severity,
            status: createdIncident.status,
          },
        },
      });

      return createdIncident;
    });

    return {
      success: true,
      message: "Incident created successfully.",
      incident,
    };
  } catch (error) {
    console.error("Incident creation failed:", error);

    return {
      success: false,
      message:
        "Something went wrong while creating the incident. Please try again.",
    };
  }
}
