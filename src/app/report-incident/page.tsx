
import Link from "next/link";
import { HiOutlineArrowLeft } from "react-icons/hi2";

import { PublicIncidentReportForm } from "@/components/public/PublicIncidentReportForm";

export default function ReportIncidentPage() {
  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-foreground"
          >
            <HiOutlineArrowLeft className="size-4" />
            Back to Home
          </Link>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Report an Incident
          </h1>

          <p className="mt-2 text-sm text-muted">
            Any visitor can submit an incident report. Reports enter a review
            queue where authorized administrators verify and act on them.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-7 sm:p-9 shadow-sm">
          <div className="rounded-xl border border-border bg-surface-secondary p-5 mb-6">
            <h3 className="text-lg font-semibold text-foreground">
              What happens after you submit?
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-primary">1.</span>
                Your report is received and placed in the review queue.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-primary">2.</span>
                A system administrator reviews and verifies the details.
              </li>
                <li className="flex items-start gap-3">
                <span className="mt-0.5 text-primary">3.</span>
                Verified incidents are escalated to the appropriate organizations for response.
              </li>
            </ul>
          </div>

          <PublicIncidentReportForm />
        </div>
      </div>
    </main>
  );
}
