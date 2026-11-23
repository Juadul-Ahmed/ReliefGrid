
import type { OrganizationApplicationStatus } from "@/generated/prisma/enums";

interface ApplicationStatusCardProps {
  application: {
    id: string;
    organizationName: string;
    requestedSlug: string;
    organizationType: string;
    status: Extract<
      OrganizationApplicationStatus,
      "PENDING" | "UNDER_REVIEW"
    >;
    createdAt: Date;
    reviewedAt: Date | null;
    reviewNotes: string | null;
  };
}

const statusDetails = {
  PENDING: {
    label: "Awaiting Review",
    description:
      "Your application has been received and is waiting for a System Admin to review it.",
    color: "bg-amber-100 text-amber-700",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    description:
      "A System Admin is currently reviewing your organization application.",
    color: "bg-blue-100 text-blue-700",
  },
};

export default function ApplicationStatusCard({
  application,
}: ApplicationStatusCardProps) {
  const status = statusDetails[application.status];

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Organization Application
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-900">
              {application.organizationName}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {application.organizationType}
            </p>
          </div>

          <span
            className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${status.color}`}
          >
            {status.label}
          </span>
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-600">
          {status.description}
        </p>
      </div>

      <div className="grid gap-5 bg-slate-50/70 p-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-slate-400">
            Application ID
          </p>
          <p className="mt-1 break-all text-sm font-medium text-slate-700">
            {application.id}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-400">
            Organization URL
          </p>
          <p className="mt-1 text-sm font-medium text-slate-700">
            reliefgrid.org/{application.requestedSlug}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-400">
            Submitted
          </p>
          <p className="mt-1 text-sm font-medium text-slate-700">
            {application.createdAt.toLocaleDateString()}
          </p>
        </div>

        {application.reviewedAt && (
          <div>
            <p className="text-xs font-medium text-slate-400">
              Last Reviewed
            </p>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {application.reviewedAt.toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {application.reviewNotes && (
        <div className="border-t border-slate-100 p-6">
          <p className="text-sm font-semibold text-slate-800">
            Administrator Notes
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {application.reviewNotes}
          </p>
        </div>
      )}

      <div className="border-t border-slate-100 px-6 py-4">
        <p className="text-xs leading-5 text-slate-400">
          You cannot submit another organization application while this
          application is pending or under review.
        </p>
      </div>
    </section>
  );
}
