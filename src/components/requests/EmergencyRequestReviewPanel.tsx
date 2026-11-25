
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { reviewEmergencyRequest } from "@/app/actions/emergency-request-review";

interface EmergencyRequestReviewPanelProps {
  requestId: string;
  status: string;
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50";

export function EmergencyRequestReviewPanel({
  requestId,
  status,
}: EmergencyRequestReviewPanelProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [rejectionReason, setRejectionReason] = useState("");

  function handleReview(nextStatus: "UNDER_REVIEW" | "VERIFIED" | "REJECTED") {
    if (nextStatus === "REJECTED" && !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejecting this request.");
      return;
    }

    startTransition(async () => {
      const result = await reviewEmergencyRequest({
        requestId,
        status: nextStatus,
        rejectionReason:
          nextStatus === "REJECTED" ? rejectionReason.trim() : undefined,
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

  if (status !== "SUBMITTED" && status !== "UNDER_REVIEW") {
    return null;
  }

  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <div>
        <h2 className="text-lg font-semibold">Request Review</h2>

        <p className="mt-1 text-sm text-muted">
          Review this request on behalf of your organization.
        </p>
      </div>

      {status === "SUBMITTED" && (
        <div>
          <p className="text-sm text-muted">
            This request has been submitted and is waiting for review.
          </p>

          <button
            type="button"
            onClick={() => handleReview("UNDER_REVIEW")}
            disabled={isPending}
            className="mt-3 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Updating..." : "Start Review"}
          </button>
        </div>
      )}

      {status === "UNDER_REVIEW" && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Review the submitted information and choose a final decision.
          </p>

          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Rejection reason
            </label>

            <textarea
              rows={3}
              maxLength={1000}
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              disabled={isPending}
              placeholder="Explain why this emergency request should be rejected..."
              className={inputClass}
            />

            <p className="mt-1 text-xs text-muted">
              Required only when rejecting the request.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleReview("VERIFIED")}
              disabled={isPending}
              className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Processing..." : "Verify Request"}
            </button>

            <button
              type="button"
              onClick={() => handleReview("REJECTED")}
              disabled={isPending}
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Processing..." : "Reject Request"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
