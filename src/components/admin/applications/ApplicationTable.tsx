
import Link from "next/link";
import { HiOutlineEye, HiOutlineBuildingOffice2 } from "react-icons/hi2";

import ApplicationStatusBadge from "@/components/admin/applications/ApplicationStatusBadge";
import type { OrganizationApplicationStatus } from "@/generated/prisma/enums";

export interface ApplicationTableRow {
  id: string;
  organizationName: string;
  requestedSlug: string;
  organizationType: string;
  status: OrganizationApplicationStatus;
  createdAt: Date;
  applicant: {
    name: string;
    email: string;
  };
}

interface ApplicationTableProps {
  applications: ApplicationTableRow[];
}

export default function ApplicationTable({
  applications,
}: ApplicationTableProps) {
  if (applications.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-5 py-16 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-surface-secondary">
          <HiOutlineBuildingOffice2 className="size-7 text-muted" />
        </div>

        <h3 className="mt-4 font-semibold text-foreground">
          No applications found
        </h3>

        <p className="mt-2 text-sm text-muted">
          Organization applications will appear here when submitted.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-secondary text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-5 py-4 font-semibold">Organization</th>
              <th className="px-5 py-4 font-semibold">Applicant</th>
              <th className="px-5 py-4 font-semibold">Organization URL</th>
              <th className="px-5 py-4 font-semibold">Submitted</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 text-right font-semibold">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {applications.map((application) => (
              <tr
                key={application.id}
                className="transition-colors hover:bg-surface-secondary/50"
              >
                <td className="px-5 py-4">
                  <p className="font-medium text-foreground">
                    {application.organizationName}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {application.organizationType}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <p className="font-medium text-foreground">
                    {application.applicant.name}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {application.applicant.email}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <span className="text-muted">
                    /{application.requestedSlug}
                  </span>
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-muted">
                  {application.createdAt.toLocaleDateString()}
                </td>

                <td className="px-5 py-4">
                  <ApplicationStatusBadge status={application.status} />
                </td>

                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/admin/applications/${application.id}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-secondary"
                  >
                    <HiOutlineEye className="size-4" />
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border px-5 py-3">
        <p className="text-xs text-muted">
          Showing {applications.length}{" "}
          {applications.length === 1 ? "application" : "applications"}
        </p>
      </div>
    </div>
  );
}
