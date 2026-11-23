
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { organizationApplicationReviewSchema } from "@/lib/validations/organization-application-review.schema";

type ReviewResult = {
  success: boolean;
  message: string;
};

export async function reviewOrganizationApplication(
  input: unknown,
): Promise<ReviewResult> {
  try {
    // 1. Verify System Admin access.
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.systemRole !== "SYSTEM_ADMIN") {
      return {
        success: false,
        message: "You are not authorized to review applications.",
      };
    }

    // 2. Validate input.
    const validation = organizationApplicationReviewSchema.safeParse(input);

    if (!validation.success) {
      return {
        success: false,
        message:
          validation.error.issues[0]?.message ?? "Invalid application data.",
      };
    }

    const data = validation.data;

    // 3. Perform the requested action.
    const message = await prisma.$transaction(async (tx) => {
      const application =
        await tx.organizationApplication.findUnique({
          where: { id: data.applicationId },
        });

      if (!application) {
        throw new Error("APPLICATION_NOT_FOUND");
      }

      if (
        application.status !== "PENDING" &&
        application.status !== "UNDER_REVIEW"
      ) {
        throw new Error("APPLICATION_ALREADY_PROCESSED");
      }

      if (data.action === "START_REVIEW") {
        const updated = await tx.organizationApplication.updateMany({
          where: {
            id: application.id,
            status: "PENDING",
          },
          data: {
            status: "UNDER_REVIEW",
          },
        });

        if (updated.count !== 1) {
          throw new Error("APPLICATION_STATUS_CHANGED");
        }

        await tx.auditLog.create({
          data: {
            actorUserId: session.user.id,
            actorType: "USER",
            actorNameSnapshot: session.user.name,
            action: "ORGANIZATION_APPLICATION_REVIEW_STARTED",
            entityType: "OrganizationApplication",
            entityId: application.id,
            before: { status: "PENDING" },
            after: { status: "UNDER_REVIEW" },
          },
        });

        return "Application moved to Under Review.";
      }

      if (data.action === "REJECT") {
        const updated = await tx.organizationApplication.updateMany({
          where: {
            id: application.id,
            status: {
              in: ["PENDING", "UNDER_REVIEW"],
            },
          },
          data: {
            status: "REJECTED",
            reviewedById: session.user.id,
            reviewedAt: new Date(),
            reviewNotes: data.reviewNotes,
          },
        });

        if (updated.count !== 1) {
          throw new Error("APPLICATION_STATUS_CHANGED");
        }

        await tx.auditLog.create({
          data: {
            actorUserId: session.user.id,
            actorType: "USER",
            actorNameSnapshot: session.user.name,
            action: "ORGANIZATION_APPLICATION_REJECTED",
            entityType: "OrganizationApplication",
            entityId: application.id,
            before: { status: application.status },
            after: {
              status: "REJECTED",
              reviewNotes: data.reviewNotes,
            },
          },
        });

        return "Organization application rejected.";
      }

      // APPROVE
      const existingOrganization = await tx.organization.findUnique({
        where: {
          slug: application.requestedSlug,
        },
        select: { id: true },
      });

      if (existingOrganization) {
        throw new Error("ORGANIZATION_SLUG_ALREADY_USED");
      }

      // Claim the application before creating related records.
      // A concurrent approval cannot process the same application.
      const updated = await tx.organizationApplication.updateMany({
        where: {
          id: application.id,
          status: {
            in: ["PENDING", "UNDER_REVIEW"],
          },
        },
        data: {
          status: "APPROVED",
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          reviewNotes:
            data.action === "APPROVE"
              ? data.reviewNotes || null
              : null,
        },
      });

      if (updated.count !== 1) {
        throw new Error("APPLICATION_STATUS_CHANGED");
      }

      const organizationId = crypto.randomUUID();

      // Create the active organization.
      const organization = await tx.organization.create({
        data: {
          id: organizationId,
          name: application.organizationName,
          slug: application.requestedSlug,
          status: "ACTIVE",
        },
      });

      // Give the applicant active OWNER membership.
      await tx.member.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: organization.id,
          userId: application.applicantId,
          role: "owner",
          status: "ACTIVE",
        },
      });

      // Link the approved application to its organization.
      await tx.organizationApplication.update({
        where: { id: application.id },
        data: {
          organizationId: organization.id,
          approvedOrganizationId: organization.id,
        },
      });

      // Record the approval in the audit log.
      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          actorType: "USER",
          actorNameSnapshot: session.user.name,
          organizationId: organization.id,
          action: "ORGANIZATION_APPLICATION_APPROVED",
          entityType: "OrganizationApplication",
          entityId: application.id,
          before: {
            status: application.status,
          },
          after: {
            status: "APPROVED",
            organizationId: organization.id,
            organizationName: organization.name,
            ownerUserId: application.applicantId,
          },
        },
      });

      return "Application approved. Organization created and applicant assigned as OWNER.";
    });

    revalidatePath("/admin");
    revalidatePath("/admin/applications");
    revalidatePath(
      `/admin/applications/${data.applicationId}`,
    );

    return {
      success: true,
      message,
    };
  } catch (error) {
    console.error("Organization application review failed:", error);

    const errorMessages: Record<string, string> = {
      APPLICATION_NOT_FOUND: "Application not found.",
      APPLICATION_ALREADY_PROCESSED:
        "This application has already been processed.",
      APPLICATION_STATUS_CHANGED:
        "The application status changed. Refresh and try again.",
      ORGANIZATION_SLUG_ALREADY_USED:
        "This organization URL is already in use.",
    };

    const errorCode =
      error instanceof Error ? error.message : "";

    return {
      success: false,
      message:
        errorMessages[errorCode] ??
        "Something went wrong while processing the application.",
    };
  }
}
