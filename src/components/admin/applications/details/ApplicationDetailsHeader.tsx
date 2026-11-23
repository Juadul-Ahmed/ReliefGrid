
import Link from "next/link";

import ApplicationStatusBadge from "@/components/admin/applications/ApplicationStatusBadge";
import type { OrganizationApplicationStatus } from "@/generated/prisma/enums";

interface ApplicationDetailsHeaderProps {
  status: OrganizationApplicationStatus;
}

export default function ApplicationDetailsHeader({
  status,
}: ApplicationDetailsHeaderProps) {
  return (
    <div className="space-y-4">
      <Link
        href="/admin/applications"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        <span aria-hidden="true">←</span>
        Back to Applications
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Organization Management
          </p>

          <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
            Application Details
          </h1>

          <p className="mt-2 text-sm text-muted">
            Review the information submitted by this organization.
          </p>
        </div>

        <ApplicationStatusBadge status={status} />
      </div>
    </div>
  );
}
