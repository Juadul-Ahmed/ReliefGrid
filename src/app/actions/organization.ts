
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { requireOrganization } from "@/lib/permissions/organization";

type FieldErrors = Record<string, string[] | undefined>;

type UpdateOrganizationResult =
  | {
      success: false;
      message: string;
      fieldErrors?: FieldErrors;
    }
  | {
      success: true;
      message: string;
    };

const updateOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Organization name is required")
    .max(150, "Organization name must be 150 characters or fewer"),
});

export async function updateOrganization(
  formData: unknown,
): Promise<UpdateOrganizationResult> {
  // Authorization outside try/catch so redirects work correctly.
  const context = await requireOrganization();

  // Only the organization OWNER can rename the organization.
  if (context.membership.role.toUpperCase() !== "OWNER") {
    return {
      success: false,
      message:
        "Only the organization owner can rename the organization.",
    };
  }

  try {
    const validation = updateOrganizationSchema.safeParse(formData);

    if (!validation.success) {
      return {
        success: false,
        message:
          validation.error.issues[0]?.message ??
          "Please provide a valid organization name.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const name = validation.data.name;

    try {
      await prisma.organization.update({
        where: {
          id: context.organizationId,
        },
        data: {
          name,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorUserId: context.session.user.id,
          actorType: "USER",
          actorNameSnapshot: context.session.user.name,
          organizationId: context.organizationId,
          action: "ORGANIZATION_RENAMED",
          entityType: "Organization",
          entityId: context.organizationId,
          after: { name },
        },
      });

      revalidatePath("/settings");
      revalidatePath("/dashboard");

      return {
        success: true,
        message: "Organization name updated successfully.",
      };
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error("Organization update failed:", error);

    return {
      success: false,
      message:
        "Something went wrong while updating the organization name. Please try again.",
    };
  }
}
