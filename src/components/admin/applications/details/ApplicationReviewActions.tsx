
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { toast } from "react-toastify";

import { reviewOrganizationApplication } from "@/app/actions/admin-organization-application";
import ApplicationConfirmationDialog from "@/components/admin/applications/details/ApplicationConfirmationDialog";

interface ApplicationReviewActionsProps {
  applicationId: string;
  status:
    | "PENDING"
    | "UNDER_REVIEW"
    | "APPROVED"
    | "REJECTED"
    | "WITHDRAWN";
}

export default function ApplicationReviewActions({
  applicationId,
  status,
}: ApplicationReviewActionsProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [rejectionReason, setRejectionReason] = useState("");

  const isReviewable =
    status === "PENDING" || status === "UNDER_REVIEW";

  function handleAction(
    action: "START_REVIEW" | "APPROVE" | "REJECT",
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

    startTransition(async () => {
      const result = await reviewOrganizationApplication({
        applicationId,
        action,
        ...(action === "REJECT"
          ? { reviewNotes: rejectionReason.trim() }
          : {}),
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);

      setRejectionReason("");
      router.refresh();
    });
  }

  if (!isReviewable) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Application Actions
        </h2>

        <p className="mt-1 text-sm text-muted">
          Review the application and make an administrative decision.
        </p>
      </div>

      {/* Review and approval actions */}
      <div className="mt-5 flex flex-wrap gap-3">
        {status === "PENDING" && (
          <ApplicationConfirmationDialog
            title="Start reviewing this application?"
            description="This application will move from Pending to Under Review."
            confirmLabel="Start Review"
            variant="primary"
            isDisabled={isPending}
            onConfirm={() => handleAction("START_REVIEW")}
          />
        )}

        <ApplicationConfirmationDialog
          title="Approve this organization?"
          description="This will create an active organization and assign the applicant as its OWNER."
          confirmLabel="Approve Application"
          variant="primary"
          iconStatus="success"
          isDisabled={isPending}
          onConfirm={() => handleAction("APPROVE")}
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
          onChange={(event) => setRejectionReason(event.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Explain why this application is being rejected..."
          className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            Minimum 10 characters. Maximum 2,000 characters.
          </p>

          <ApplicationConfirmationDialog
            title="Reject this application?"
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
    </section>
  );
}
