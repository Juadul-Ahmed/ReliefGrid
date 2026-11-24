
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import ApplicationConfirmationDialog from "@/components/admin/applications/details/ApplicationConfirmationDialog";
import type { IncidentReportStatus } from "@/generated/prisma/enums";
import { reviewIncidentReport } from "@/app/actions/admin-incident-report";

interface IncidentReportReviewActionsProps {
  reportId: string;
  status: IncidentReportStatus;
  verifiedReports: {
    id: string;
    title: string;
  }[];
}

export default function IncidentReportReviewActions({
  reportId,
  status,
  verifiedReports,
}: IncidentReportReviewActionsProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [rejectionReason, setRejectionReason] = useState("");
  const [duplicateOfReportId, setDuplicateOfReportId] = useState("");

  function handleAction(
    action: "START_REVIEW" | "VERIFY" | "REJECT" | "MARK_DUPLICATE",
  ) {
    if (
      action === "REJECT" &&
      rejectionReason.trim().length < 10
    ) {
      toast.error(
        "Please provide a rejection reason of at least 10 characters.",
      );
      return;
    }

    if (action === "MARK_DUPLICATE" && !duplicateOfReportId) {
      toast.error("Please select the original incident report.");
      return;
    }

    startTransition(async () => {
      const result = await reviewIncidentReport({
        reportId,
        action,
        ...(action === "REJECT"
          ? { rejectionReason: rejectionReason.trim() }
          : {}),
        ...(action === "MARK_DUPLICATE"
          ? { duplicateOfReportId }
          : {}),
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);

      setRejectionReason("");
      setDuplicateOfReportId("");
      router.refresh();
    });
  }

  if (status !== "RECEIVED" && status !== "UNDER_REVIEW") {
    return null;
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Report Review Actions
        </h2>

        <p className="mt-1 text-sm text-muted">
          Review this emergency report and make an administrative decision.
        </p>
      </div>

      {/* Start review */}
      {status === "RECEIVED" && (
        <div className="mt-5">
          <ApplicationConfirmationDialog
            title="Start reviewing this report?"
            description="This report will move from Received to Under Review."
            confirmLabel="Start Review"
            variant="primary"
            isDisabled={isPending}
            onConfirm={() => handleAction("START_REVIEW")}
          />
        </div>
      )}

      {/* Verification and other review actions */}
      {status === "UNDER_REVIEW" && (
        <>
          {/* Verify */}
          <div className="mt-5 flex flex-wrap gap-3">
            <ApplicationConfirmationDialog
              title="Verify this incident report?"
              description="This report will be marked as verified. You can then convert it into an operational incident."
              confirmLabel="Verify Report"
              variant="primary"
              iconStatus="success"
              isDisabled={isPending}
              onConfirm={() => handleAction("VERIFY")}
            />
          </div>

          {/* Rejection */}
          <div className="mt-6 border-t border-border pt-5">
            <label
              htmlFor="rejectionReason"
              className="text-sm font-semibold text-foreground"
            >
              Rejection Reason
            </label>

            <textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(event) =>
                setRejectionReason(event.target.value)
              }
              rows={3}
              maxLength={2000}
              placeholder="Explain why this incident report is being rejected..."
              className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted">
                Minimum 10 characters. Maximum 2,000 characters.
              </p>

              <ApplicationConfirmationDialog
                title="Reject this incident report?"
                description={`Rejection reason: ${rejectionReason.trim()}`}
                confirmLabel="Confirm Rejection"
                variant="danger"
                iconStatus="danger"
                isDisabled={
                  isPending || rejectionReason.trim().length < 10
                }
                onConfirm={() => handleAction("REJECT")}
              />
            </div>
          </div>

          {/* Duplicate */}
          <div className="mt-6 border-t border-border pt-5">
            <label
              htmlFor="duplicateReport"
              className="text-sm font-semibold text-foreground"
            >
              Mark as Duplicate
            </label>

            <p className="mt-1 text-sm text-muted">
              Select an existing verified report describing the same emergency.
            </p>

            <select
              id="duplicateReport"
              value={duplicateOfReportId}
              onChange={(event) =>
                setDuplicateOfReportId(event.target.value)
              }
              disabled={isPending || verifiedReports.length === 0}
              className="mt-3 w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">
                {verifiedReports.length === 0
                  ? "No verified reports available"
                  : "Select original report"}
              </option>

              {verifiedReports.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.title}
                </option>
              ))}
            </select>

            <div className="mt-3">
              <ApplicationConfirmationDialog
                title="Mark this report as a duplicate?"
                description="This report will be linked to the selected verified report."
                confirmLabel="Mark Duplicate"
                variant="danger"
                iconStatus="warning"
                isDisabled={
                  isPending ||
                  !duplicateOfReportId ||
                  verifiedReports.length === 0
                }
                onConfirm={() => handleAction("MARK_DUPLICATE")}
              />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
