
import Link from "next/link";

import ApplicationTable from "@/components/admin/applications/ApplicationTable";
import { prisma } from "@/lib/db/prisma";
import type { OrganizationApplicationStatus } from "@/generated/prisma/enums";

interface ApplicationsPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

const statuses: {
  label: string;
  value: OrganizationApplicationStatus | "ALL";
}[] = [
  { label: "All Applications", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Withdrawn", value: "WITHDRAWN" },
];

const validStatuses = statuses
  .map((item) => item.value)
  .filter(
    (value): value is OrganizationApplicationStatus =>
      value !== "ALL",
  );

export default async function ApplicationsPage({
  searchParams,
}: ApplicationsPageProps) {
  const params = await searchParams;

  const selectedStatus = validStatuses.find(
    (status) => status === params.status,
  );

  const applications = await prisma.organizationApplication.findMany({
    where: selectedStatus
      ? { status: selectedStatus }
      : {},
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      organizationName: true,
      requestedSlug: true,
      organizationType: true,
      status: true,
      createdAt: true,
      applicant: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Page heading */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
          Organization Management
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Organization Applications
        </h1>

        <p className="mt-2 text-sm text-muted">
          Review and manage organizations requesting access to ReliefGrid.
        </p>
      </div>

      {/* Application filters */}
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Filter Applications
          </h2>

          <p className="text-sm text-muted">
            {applications.length}{" "}
            {applications.length === 1 ? "application" : "applications"} found
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {statuses.map((item) => {
            const isActive =
              item.value === "ALL"
                ? !selectedStatus
                : selectedStatus === item.value;

            const href =
              item.value === "ALL"
                ? "/admin/applications"
                : `/admin/applications?status=${item.value}`;

            return (
              <Link
                key={item.value}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`
                  rounded-lg border px-4 py-2 text-sm font-medium transition-colors
                  ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface text-muted hover:bg-surface-secondary hover:text-foreground"
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Applications table */}
      <ApplicationTable applications={applications} />
    </div>
  );
}
