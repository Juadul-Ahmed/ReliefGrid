"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireOrganizationPermission } from "@/lib/permissions/require-organization-permission";
import {
  createShelterSchema,
  SHELTER_STATUSES,
  updateShelterSchema,
} from "@/lib/validations/shelter.schema";

const shelterIdSchema = z.object({
  id: z.string().trim().min(1, "Shelter ID is required"),
});

const shelterStatusSchema = z.object({
  id: z.string().trim().min(1, "Shelter ID is required"),
  status: z.enum(SHELTER_STATUSES, {
    error: "Choose a valid shelter status",
  }),
});

type ShelterFieldErrors = Partial<
  Record<
    | "name"
    | "address"
    | "capacity"
    | "currentOccupancy"
    | "status"
    | "latitude"
    | "longitude"
    | "id",
    string[] | undefined
  >
>;

type CreateShelterResult =
  | {
      success: false;
      message: string;
      fieldErrors?: ShelterFieldErrors;
    }
  | {
      success: true;
      message: string;
      shelterId: string;
      shelterName: string;
    };

type UpdateShelterResult =
  | {
      success: false;
      message: string;
      fieldErrors?: ShelterFieldErrors;
    }
  | {
      success: true;
      message: string;
    };

type DeleteShelterResult =
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      message: string;
    };

type UpdateShelterStatusResult =
  | {
      success: false;
      message: string;
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

export async function createShelter(
  formData: unknown,
): Promise<CreateShelterResult> {
  // Keep authorization outside try/catch so redirects work correctly.
  const context = await requireOrganizationPermission("MANAGE_SHELTERS");

  try {
    const validation = createShelterSchema.safeParse(formData);

    if (!validation.success) {
      return {
        success: false,
        message:
          validation.error.issues[0]?.message ??
          "Please provide valid shelter information.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const data = validation.data;

    try {
      const created = await prisma.$transaction(async (tx) => {
        const shelter = await tx.shelter.create({
          data: {
            // Trusted server-side identity, never form input.
            organizationId: context.organizationId,
            name: data.name,
            address: data.address,
            capacity: data.capacity,
            currentOccupancy: data.currentOccupancy ?? 0,
            status: data.status ?? "ACTIVE",
            latitude: data.latitude ?? null,
            longitude: data.longitude ?? null,
          },
          select: {
            id: true,
            name: true,
            status: true,
          },
        });

        await tx.auditLog.create({
          data: {
            actorUserId: context.session.user.id,
            actorType: "USER",
            actorNameSnapshot: context.session.user.name,
            organizationId: context.organizationId,
            action: "SHELTER_CREATED",
            entityType: "Shelter",
            entityId: shelter.id,
            after: {
              name: shelter.name,
              capacity: data.capacity,
              currentOccupancy: data.currentOccupancy ?? 0,
              status: data.status ?? "ACTIVE",
              latitude: data.latitude ?? null,
              longitude: data.longitude ?? null,
            },
          },
        });

        return shelter;
      });

      revalidatePath("/shelters");

      return {
        success: true,
        message: "Shelter created successfully.",
        shelterId: created.id,
        shelterName: created.name,
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return {
          success: false,
          message:
            "A shelter with this name already exists in your organization.",
        };
      }

      throw error;
    }
  } catch (error) {
    console.error("Shelter creation failed:", error);

    return {
      success: false,
      message:
        "Something went wrong while creating the shelter. Please try again.",
    };
  }
}

export async function updateShelter(
  formData: unknown,
): Promise<UpdateShelterResult> {
  // Keep authorization outside try/catch so redirects work correctly.
  const context = await requireOrganizationPermission("MANAGE_SHELTERS");

  try {
    const idResult = updateShelterSchema.safeParse(formData);

    if (!idResult.success) {
      return {
        success: false,
        message:
          idResult.error.issues[0]?.message ?? "Please provide valid shelter information.",
        fieldErrors: idResult.error.flatten().fieldErrors,
      };
    }

    const data = idResult.data;
    const shelterId = data.id;

    try {
      const outcome = await prisma.$transaction(
        async (tx) => {
          // Read latest state inside the transaction (Serializable isolation).
          // This prevents stale-read validation: capacity/occupancy checks
          // always run against the most recent committed values.
          const existing = await tx.shelter.findFirst({
            where: {
              id: shelterId,
              organizationId: context.organizationId,
            },
            select: {
              id: true,
              name: true,
              address: true,
              capacity: true,
              currentOccupancy: true,
              status: true,
              latitude: true,
              longitude: true,
              updatedAt: true,
            },
          });

          if (!existing) {
            return { kind: "not_found" as const };
          }

          // Compute final values against the latest database state.
          // Partial updates validate against existing values:
          //   - Capacity-only  -> validated against latest occupancy
          //   - Occupancy-only -> validated against latest capacity
          //   - Both supplied  -> validated together
          const nextCapacity = data.capacity ?? existing.capacity;
          const nextOccupancy =
            data.currentOccupancy ?? existing.currentOccupancy;

          if (nextOccupancy > nextCapacity) {
            return {
              kind: "invalid" as const,
              message: "Current occupancy cannot exceed capacity.",
            };
          }

          const unchanged =
            (data.name === undefined || data.name === existing.name) &&
            (data.address === undefined || data.address === existing.address) &&
            (data.capacity === undefined || data.capacity === existing.capacity) &&
            (data.currentOccupancy === undefined ||
              data.currentOccupancy === existing.currentOccupancy) &&
            (data.status === undefined || data.status === existing.status) &&
            (data.latitude === undefined || data.latitude === existing.latitude) &&
            (data.longitude === undefined || data.longitude === existing.longitude);

          if (unchanged) {
            return { kind: "no_changes" as const };
          }

          // Optimistic locking: only update if the row hasn't changed since we read it.
          const updateResult = await tx.shelter.updateMany({
            where: {
              id: existing.id,
              organizationId: context.organizationId,
              updatedAt: existing.updatedAt,
            },
            data: {
              name: data.name ?? existing.name,
              address: data.address ?? existing.address,
              capacity: nextCapacity,
              currentOccupancy: nextOccupancy,
              status: data.status ?? existing.status,
              latitude: data.latitude ?? existing.latitude,
              longitude: data.longitude ?? existing.longitude,
            },
          });

          if (updateResult.count !== 1) {
            return { kind: "conflict" as const };
          }

          await tx.auditLog.create({
            data: {
              actorUserId: context.session.user.id,
              actorType: "USER",
              actorNameSnapshot: context.session.user.name,
              organizationId: context.organizationId,
              action: "SHELTER_UPDATED",
              entityType: "Shelter",
              entityId: existing.id,
              before: {
                name: existing.name,
                address: existing.address,
                capacity: existing.capacity,
                currentOccupancy: existing.currentOccupancy,
                status: existing.status,
                latitude: existing.latitude,
                longitude: existing.longitude,
              },
              after: {
                name: data.name ?? existing.name,
                address: data.address ?? existing.address,
                capacity: nextCapacity,
                currentOccupancy: nextOccupancy,
                status: data.status ?? existing.status,
                latitude: data.latitude ?? existing.latitude,
                longitude: data.longitude ?? existing.longitude,
              },
            },
          });

          return { kind: "success" as const, id: existing.id };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 10000,
        }
      );

      switch (outcome.kind) {
        case "not_found":
          return {
            success: false,
            message: "Shelter not found or access denied.",
          };
        case "invalid":
          return {
            success: false,
            message: outcome.message,
          };
        case "no_changes":
          return {
            success: true,
            message: "No changes to save.",
          };
        case "conflict":
          return {
            success: false,
            message:
              "This shelter was updated by another request. Refresh and try again.",
          };
        case "success":
          revalidatePath("/shelters");
          revalidatePath(`/shelters/${outcome.id}`);
          return {
            success: true,
            message: "Shelter updated successfully.",
          };
      }
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return {
          success: false,
          message:
            "A shelter with this name already exists in your organization.",
        };
      }

      // Handle serialization failures from Serializable isolation level.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      ) {
        return {
          success: false,
          message:
            "This shelter was updated by another request. Refresh and try again.",
        };
      }

      throw error;
    }
  } catch (error) {
    console.error("Shelter update failed:", error);

    return {
      success: false,
      message:
        "Something went wrong while updating the shelter. Please try again.",
    };
  }
}

export async function deleteShelter(
  formData: unknown,
): Promise<DeleteShelterResult> {
  // Keep authorization outside try/catch so redirects work correctly.
  const context = await requireOrganizationPermission("MANAGE_SHELTERS");

  try {
    const idValidation = shelterIdSchema.safeParse(formData);

    if (!idValidation.success) {
      return {
        success: false,
        message:
          idValidation.error.issues[0]?.message ?? "Shelter ID is required.",
      };
    }

    const { id: shelterId } = idValidation.data;

    // Fetch by both ID and organization ID.
    const existing = await prisma.shelter.findFirst({
      where: {
        id: shelterId,
        organizationId: context.organizationId,
      },
      select: {
        id: true,
        name: true,
        currentOccupancy: true,
        status: true,
        updatedAt: true,
      },
    });

    if (!existing) {
      return {
        success: false,
        message: "Shelter not found or access denied.",
      };
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Atomic deletion guarded by occupancy = 0 inside the transaction.
        // Prevents TOCTOU: a concurrent occupancy update cannot slip in
        // between the read and the delete.
        const deleteResult = await tx.shelter.deleteMany({
          where: {
            id: existing.id,
            organizationId: context.organizationId,
            currentOccupancy: 0,
          },
        });

        if (deleteResult.count !== 1) {
          throw new Error("DELETE_FAILED");
        }

        await tx.auditLog.create({
          data: {
            actorUserId: context.session.user.id,
            actorType: "USER",
            actorNameSnapshot: context.session.user.name,
            organizationId: context.organizationId,
            action: "SHELTER_DELETED",
            entityType: "Shelter",
            entityId: existing.id,
            before: {
              name: existing.name,
              currentOccupancy: existing.currentOccupancy,
              status: existing.status,
            },
            after: { deleted: true },
          },
        });
      });

      revalidatePath("/shelters");

      return {
        success: true,
        message: "Shelter deleted successfully.",
      };
    } catch (error) {
      if (error instanceof Error && error.message === "DELETE_FAILED") {
        return {
          success: false,
          message:
            "Could not delete this shelter. It may no longer exist, may not belong to your organization, or may have occupants.",
        };
      }

      throw error;
    }
  } catch (error) {
    console.error("Shelter deletion failed:", error);

    return {
      success: false,
      message:
        "Something went wrong while deleting the shelter. Please try again.",
    };
  }
}

export async function updateShelterStatus(
  formData: unknown,
): Promise<UpdateShelterStatusResult> {
  // Keep authorization outside try/catch so redirects work correctly.
  const context = await requireOrganizationPermission("MANAGE_SHELTERS");

  try {
    const idValidation = shelterIdSchema.safeParse(formData);
    const statusValidation = shelterStatusSchema.safeParse(formData);

    if (!idValidation.success) {
      return {
        success: false,
        message:
          idValidation.error.issues[0]?.message ?? "Shelter ID is required.",
      };
    }

    if (!statusValidation.success) {
      return {
        success: false,
        message:
          statusValidation.error.issues[0]?.message ?? "Status is required.",
      };
    }

    const { id: shelterId } = idValidation.data;
    const { status } = statusValidation.data;

    // FULL is never persisted as a stored status; the schema only allows
    // ACTIVE, INACTIVE, and CLOSED.

    // Fetch by both ID and organization ID.
    const existing = await prisma.shelter.findFirst({
      where: {
        id: shelterId,
        organizationId: context.organizationId,
      },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
      },
    });

    if (!existing) {
      return {
        success: false,
        message: "Shelter not found or access denied.",
      };
    }

    // No-op: do not write or audit.
    if (existing.status === status) {
      return {
        success: true,
        message: `Shelter is already ${status}.`,
      };
    }

    try {
      await prisma.$transaction(async (tx) => {
        const updateResult = await tx.shelter.updateMany({
          where: {
            id: existing.id,
            organizationId: context.organizationId,
            updatedAt: existing.updatedAt,
          },
          data: {
            status,
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
            action: "SHELTER_STATUS_UPDATED",
            entityType: "Shelter",
            entityId: existing.id,
            before: {
              status: existing.status,
            },
            after: {
              status,
            },
          },
        });
      });

      revalidatePath("/shelters");
      revalidatePath(`/shelters/${existing.id}`);

      return {
        success: true,
        message: `Shelter status updated to ${status}.`,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "CONCURRENT_UPDATE"
      ) {
        return {
          success: false,
          message:
            "This shelter was updated by another request. Refresh and try again.",
        };
      }

      throw error;
    }
  } catch (error) {
    console.error("Shelter status update failed:", error);

    return {
      success: false,
      message:
        "Something went wrong while updating the shelter status. Please try again.",
    };
  }
}
