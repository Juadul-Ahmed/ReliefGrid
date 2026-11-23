
import { HiOutlineClipboardDocumentCheck } from "react-icons/hi2";

import ApplicationDetailItem from "./ApplicationDetailItem";

interface ApplicationReviewCardProps {
  submittedAt: Date;
  updatedAt: Date;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
}

export default function ApplicationReviewCard({
  submittedAt,
  updatedAt,
  reviewedBy,
  reviewedAt,
  reviewNotes,
}: ApplicationReviewCardProps) {
  return (
    <section className="rounded-2xl border border-border bg-surface">
      <div className="flex items-center gap-3 border-b border-border p-5">
        <HiOutlineClipboardDocumentCheck className="size-5 text-primary" />

        <h2 className="font-semibold text-foreground">
          Application Review
        </h2>
      </div>

      <div className="grid gap-6 p-5 sm:grid-cols-2">
        <ApplicationDetailItem
          label="Submitted On"
          value={submittedAt.toLocaleString()}
        />

        <ApplicationDetailItem
          label="Last Updated"
          value={updatedAt.toLocaleString()}
        />

        <ApplicationDetailItem
          label="Reviewed By"
          value={reviewedBy}
        />

        <ApplicationDetailItem
          label="Reviewed On"
          value={reviewedAt?.toLocaleString() ?? null}
        />

        <div className="sm:col-span-2">
          <ApplicationDetailItem
            label="Review Notes"
            value={reviewNotes}
          />
        </div>
      </div>
    </section>
  );
}
