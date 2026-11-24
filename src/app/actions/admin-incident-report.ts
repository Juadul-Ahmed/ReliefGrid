
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { incidentReportReviewSchema } from "@/lib/validations/incident-report-review.schema";

type ReviewResult = {
  success: boolean;
  message: string;
};

export async function reviewIncidentReport(
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
        message: "You are not authorized to review incident reports.",
      };
    }

    // 2. Validate input.
    const validation = incidentReportReviewSchema.safeParse(input);

    if (!validation.success) {
      return {
        success: false,
        message:
          validation.error.issues[0]?.message ??
          "Invalid incident report data.",
      };
    }

    const data = validation.data;

    // 3. Perform the requested action.
    const message = await prisma.$transaction(async (tx) => {
      const report = await tx.incidentReport.findUnique({
        where: { id: data.reportId },
      });

      if (!report) {
        throw new Error("REPORT_NOT_FOUND");
      }

      if (report.status !== "RECEIVED" && report.status !== "UNDER_REVIEW") {
        throw new Error("REPORT_ALREADY_PROCESSED");
      }

      if (data.action === "START_REVIEW") {
        if (report.status !== "RECEIVED") {
          throw new Error("REPORT_STATUS_CHANGED");
        }

        const updated = await tx.incidentReport.updateMany({
          where: {
            id: report.id,
            status: "RECEIVED",
          },
          data: {
            status: "UNDER_REVIEW",
          },
        });

        if (updated.count !== 1) {
          throw new Error("REPORT_STATUS_CHANGED");
        }

        await tx.auditLog.create({
          data: {
            actorUserId: session.user.id,
            actorType: "USER",
            actorNameSnapshot: session.user.name,
            action: "INCIDENT_REPORT_REVIEW_STARTED",
            entityType: "IncidentReport",
            entityId: report.id,
            before: { status: "RECEIVED" },
            after: { status: "UNDER_REVIEW" },
          },
        });

        return "Incident report moved to Under Review.";
      }

      if (report.status !== "UNDER_REVIEW") {
        throw new Error("REPORT_MUST_BE_UNDER_REVIEW");
      }

      if (data.action === "VERIFY") {
        const now = new Date();

        const updated = await tx.incidentReport.updateMany({
          where: {
            id: report.id,
            status: "UNDER_REVIEW",
          },
          data: {
            status: "VERIFIED",
            verifiedById: session.user.id,
            verifiedAt: now,
            rejectionReason: null,
          },
        });

        if (updated.count !== 1) {
          throw new Error("REPORT_STATUS_CHANGED");
        }

        await tx.auditLog.create({
          data: {
            actorUserId: session.user.id,
            actorType: "USER",
            actorNameSnapshot: session.user.name,
            action: "INCIDENT_REPORT_VERIFIED",
            entityType: "IncidentReport",
            entityId: report.id,
            before: { status: report.status },
            after: {
              status: "VERIFIED",
              verifiedById: session.user.id,
              verifiedAt: now.toISOString(),
            },
          },
        });

        return "Incident report verified successfully.";
      }

      if (data.action === "REJECT") {
        const updated = await tx.incidentReport.updateMany({
          where: {
            id: report.id,
            status: "UNDER_REVIEW",
          },
          data: {
            status: "REJECTED",
            verifiedById: session.user.id,
            verifiedAt: new Date(),
            rejectionReason: data.rejectionReason,
          },
        });

        if (updated.count !== 1) {
          throw new Error("REPORT_STATUS_CHANGED");
        }

        await tx.auditLog.create({
          data: {
            actorUserId: session.user.id,
            actorType: "USER",
            actorNameSnapshot: session.user.name,
            action: "INCIDENT_REPORT_REJECTED",
            entityType: "IncidentReport",
            entityId: report.id,
            before: { status: report.status },
            after: {
              status: "REJECTED",
              rejectionReason: data.rejectionReason,
            },
          },
        });

        return "Incident report rejected successfully.";
      }

      // MARK_DUPLICATE
      if (data.duplicateOfReportId === report.id) {
        throw new Error("REPORT_CANNOT_DUPLICATE_ITSELF");
      }

      const originalReport = await tx.incidentReport.findUnique({
        where: {
          id: data.duplicateOfReportId,
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (!originalReport || originalReport.status !== "VERIFIED") {
        throw new Error("INVALID_DUPLICATE_TARGET");
      }

      const updated = await tx.incidentReport.updateMany({
        where: {
          id: report.id,
          status: "UNDER_REVIEW",
        },
        data: {
          status: "DUPLICATE",
          duplicateOfReportId: originalReport.id,
          verifiedById: session.user.id,
          verifiedAt: new Date(),
        },
      });

      if (updated.count !== 1) {
        throw new Error("REPORT_STATUS_CHANGED");
      }

      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          actorType: "USER",
          actorNameSnapshot: session.user.name,
          action: "INCIDENT_REPORT_MARKED_DUPLICATE",
          entityType: "IncidentReport",
          entityId: report.id,
          before: { status: report.status },
          after: {
            status: "DUPLICATE",
            duplicateOfReportId: originalReport.id,
          },
        },
      });

      return "Incident report marked as a duplicate.";
    });

    // 4. Refresh relevant admin pages.
    revalidatePath("/admin");
    revalidatePath("/admin/incident-reports");
    revalidatePath(`/admin/incident-reports/${data.reportId}`);

    return {
      success: true,
      message,
    };
  } catch (error) {
    console.error("Incident report review failed:", error);

    const errorMessages: Record<string, string> = {
      REPORT_NOT_FOUND: "Incident report not found.",
      REPORT_ALREADY_PROCESSED:
        "This incident report has already been processed.",
      REPORT_STATUS_CHANGED:
        "The report status changed. Refresh and try again.",
      REPORT_MUST_BE_UNDER_REVIEW:
        "Move this report to Under Review before processing it.",
      REPORT_CANNOT_DUPLICATE_ITSELF:
        "A report cannot be marked as a duplicate of itself.",
      INVALID_DUPLICATE_TARGET:
        "The original report must exist and be verified.",
    };

    const errorCode =
      error instanceof Error ? error.message : "";

    return {
      success: false,
      message:
        errorMessages[errorCode] ??
        "Something went wrong while reviewing the incident report.",
    };
  }
}
