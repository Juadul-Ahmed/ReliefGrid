"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireOrganizationPermission } from "@/lib/permissions/require-organization-permission";
import {
  createResourceSchema,
  updateResourceSchema,
} from "@/lib/validations/resource.schema";

type FieldErrors = Record<string, string[] | undefined>;

type CreateResourceResult =
  | {
      success: false;
      message: string;
      fieldErrors?: FieldErrors;
    }
  | {
      success: true;
      message: string;
      resourceId: string;
      resourceName: string;
    };

type UpdateResourceResult =
  | {
      success: false;
      message: string;
      fieldErrors?: FieldErrors;
    }
  | {
      success: true;
      message: string;
    };

const resourceIdSchema = z.object({
  resourceId: z.string().trim().min(1, "Resource is required"),
});

const resourceStatusSchema = z.object({
  resourceId: z.string().trim().min(1, "Resource is required"),
  isActive: z.boolean({ error: "Active state is required" }),
});

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function createResource(
  formData: unknown,
): Promise<CreateResourceResult> {
  // Keep authorization outside try/catch so redirects work correctly.
  const context = await requireOrganizationPermission("MANAGE_RESOURCES");

  try {
    const validation = createResourceSchema.safeParse(formData);

    if (!validation.success) {
      return {
        success: false,
        message:
          validation.error.issues[0]?.message ??
          "Please provide valid resource information.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const data = validation.data;

    try {
      const created = await prisma.$transaction(async (tx) => {
        const resource = await tx.resource.create({
          data: {
            // Trusted server-side identity, never form input.
            organizationId: context.organizationId,
            name: data.name,
            category: data.category,
            unit: data.unit,
            description: data.description ?? null,
            sku: data.sku ?? null,
            locationName: data.locationName ?? null,
            address: data.address ?? null,
            latitude: data.latitude ?? null,
            longitude: data.longitude ?? null,
          },
          select: {
            id: true,
            name: true,
          },
        });

        await tx.auditLog.create({
          data: {
            actorUserId: context.session.user.id,
            actorType: "USER",
            actorNameSnapshot: context.session.user.name,
            organizationId: context.organizationId,
            action: "RESOURCE_CREATED",
            entityType: "Resource",
            entityId: resource.id,
            after: {
              name: resource.name,
              category: data.category,
              unit: data.unit,
              sku: data.sku ?? null,
              locationName: data.locationName ?? null,
              address: data.address ?? null,
              latitude: data.latitude ?? null,
              longitude: data.longitude ?? null,
              isActive: true,
            },
          },
        });

        return resource;
      });

      revalidatePath("/resources");

      return {
        success: true,
        message: "Resource created successfully.",
        resourceId: created.id,
        resourceName: created.name,
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return {
          success: false,
          message:
            "A resource with this name already exists in your organization.",
        };
      }

      throw error;
    }
  } catch (error) {
    console.error("Resource creation failed:", error);

    return {
      success: false,
      message:
        "Something went wrong while creating the resource. Please try again.",
    };
  }
}

export async function updateResource(
  formData: unknown,
): Promise<UpdateResourceResult> {
  // Keep authorization outside try/catch so redirects work correctly.
  const context = await requireOrganizationPermission("MANAGE_RESOURCES");

  try {
    const idResult = resourceIdSchema.safeParse(formData);

    if (!idResult.success) {
      return {
        success: false,
        message: "Resource is required.",
      };
    }

    const validation = updateResourceSchema.safeParse(formData);

    if (!validation.success) {
      return {
        success: false,
        message:
          validation.error.issues[0]?.message ??
          "Please provide valid resource information.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const { resourceId } = idResult.data;
    const data = validation.data;

    // Scope the lookup by the authenticated organization.
    const existing = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        organizationId: context.organizationId,
      },
      select: {
        id: true,
        name: true,
        category: true,
        unit: true,
        description: true,
        sku: true,
        locationName: true,
        address: true,
        latitude: true,
        longitude: true,
        isActive: true,
        updatedAt: true,
      },
    });

    if (!existing) {
      return {
        success: false,
        message: "Resource not found or access denied.",
      };
    }

    const nextDescription = data.description ?? null;
    const nextSku = data.sku ?? null;
    const nextLocationName = data.locationName ?? null;
    const nextAddress = data.address ?? null;
    const nextLatitude = data.latitude ?? null;
    const nextLongitude = data.longitude ?? null;

    // Avoid unnecessary writes and audit entries for no-op updates.
    const unchanged =
      existing.name === data.name &&
      existing.category === data.category &&
      existing.unit === data.unit &&
      existing.description === nextDescription &&
      existing.sku === nextSku &&
      existing.locationName === nextLocationName &&
      existing.address === nextAddress &&
      existing.latitude === nextLatitude &&
      existing.longitude === nextLongitude &&
      existing.isActive === data.isActive;

    if (unchanged) {
      return {
        success: true,
        message: "No changes to save.",
      };
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Conditional update guards against concurrent edits.
        const updateResult = await tx.resource.updateMany({
          where: {
            id: existing.id,
            organizationId: context.organizationId,
            updatedAt: existing.updatedAt,
          },
          data: {
            name: data.name,
            category: data.category,
            unit: data.unit,
            description: nextDescription,
            sku: nextSku,
            locationName: nextLocationName,
            address: nextAddress,
            latitude: nextLatitude,
            longitude: nextLongitude,
            isActive: data.isActive,
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
            action: "RESOURCE_UPDATED",
            entityType: "Resource",
            entityId: existing.id,
            before: {
              name: existing.name,
              category: existing.category,
              unit: existing.unit,
              description: existing.description,
              sku: existing.sku,
              locationName: existing.locationName,
              address: existing.address,
              latitude: existing.latitude,
              longitude: existing.longitude,
              isActive: existing.isActive,
            },
            after: {
              name: data.name,
              category: data.category,
              unit: data.unit,
              description: nextDescription,
              sku: nextSku,
              locationName: nextLocationName,
              address: nextAddress,
              latitude: nextLatitude,
              longitude: nextLongitude,
              isActive: data.isActive,
            },
          },
        });
      });

      revalidatePath("/resources");
      revalidatePath(`/resources/${existing.id}`);

      return {
        success: true,
        message: "Resource updated successfully.",
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return {
          success: false,
          message:
            "A resource with this name already exists in your organization.",
        };
      }

      if (
        error instanceof Error &&
        error.message === "CONCURRENT_UPDATE"
      ) {
        return {
          success: false,
          message:
            "This resource was updated by another request. Refresh and try again.",
        };
      }

      throw error;
    }
  } catch (error) {
    console.error("Resource update failed:", error);

    return {
      success: false,
      message:
        "Something went wrong while updating the resource. Please try again.",
    };
  }
}

export async function updateResourceStatus(
  formData: unknown,
): Promise<UpdateResourceResult> {
  // Keep authorization outside try/catch so redirects work correctly.
  const context = await requireOrganizationPermission("MANAGE_RESOURCES");

  try {
    const validation = resourceStatusSchema.safeParse(formData);

    if (!validation.success) {
      return {
        success: false,
        message:
          validation.error.issues[0]?.message ??
          "Invalid resource status update.",
      };
    }

    const { resourceId, isActive } = validation.data;

    // Read the latest state server-side; never trust client ownership.
    const existing = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        organizationId: context.organizationId,
      },
      select: {
        id: true,
        isActive: true,
        updatedAt: true,
      },
    });

    if (!existing) {
      return {
        success: false,
        message: "Resource not found or access denied.",
      };
    }

    // No-op: do not write or audit.
    if (existing.isActive === isActive) {
      return {
        success: true,
        message: isActive
          ? "Resource is already active."
          : "Resource is already inactive.",
      };
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Only the status changes; other fields are never overwritten.
        const updateResult = await tx.resource.updateMany({
          where: {
            id: existing.id,
            organizationId: context.organizationId,
            updatedAt: existing.updatedAt,
          },
          data: {
            isActive,
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
            action: "RESOURCE_STATUS_UPDATED",
            entityType: "Resource",
            entityId: existing.id,
            before: {
              isActive: existing.isActive,
            },
            after: {
              isActive,
            },
          },
        });
      });

      revalidatePath("/resources");
      revalidatePath(`/resources/${existing.id}`);

      return {
        success: true,
        message: isActive
          ? "Resource activated successfully."
          : "Resource deactivated successfully.",
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "CONCURRENT_UPDATE"
      ) {
        return {
          success: false,
          message:
            "This resource was updated by another request. Refresh and try again.",
        };
      }

      throw error;
    }
  } catch (error) {
    console.error("Resource status update failed:", error);

    return {
      success: false,
      message:
        "Something went wrong while updating the resource status. Please try again.",
    };
  }
}