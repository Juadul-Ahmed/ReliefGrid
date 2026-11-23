
import Link from "next/link";
import { HiOutlineArrowRight } from "react-icons/hi2";

import AdminOverviewStats from "@/components/admin/AdminOverviewStats";
import ApplicationStatusBadge from "@/components/admin/applications/ApplicationStatusBadge";
import { prisma } from "@/lib/db/prisma";

export default async function AdminPage() {
  const [
    totalApplications,
    pendingApplications,
    underReviewApplications,
    approvedOrganizations,
    recentApplications,
  ] = await Promise.all([
    prisma.organizationApplication.count(),

    prisma.organizationApplication.count({
      where: { status: "PENDING" },
    }),

    prisma.organizationApplication.count({
      where: { status: "UNDER_REVIEW" },
    }),

    prisma.organization.count({
      where: { status: "ACTIVE" },
    }),

    prisma.organizationApplication.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        organizationName: true,
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
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Page heading */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
          ReliefGrid Administration
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          System Admin Dashboard
        </h1>

        <p className="mt-2 text-sm text-muted">
          Monitor organization applications and manage the ReliefGrid platform.
        </p>
      </div>

      {/* Statistics */}
      <AdminOverviewStats
        totalApplications={totalApplications}
        pendingApplications={pendingApplications}
        underReviewApplications={underReviewApplications}
        approvedOrganizations={approvedOrganizations}
      />

      {/* Recent applications */}
      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Recent Organization Applications
            </h2>

            <p className="mt-1 text-sm text-muted">
              The latest applications submitted to ReliefGrid.
            </p>
          </div>

          <Link
            href="/admin/applications"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-80"
          >
            View all applications
            <HiOutlineArrowRight className="size-4" />
          </Link>
        </div>

        {recentApplications.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="font-medium text-foreground">
              No applications yet
            </p>

            <p className="mt-2 text-sm text-muted">
              New organization applications will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-secondary text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    Organization
                  </th>
                  <th className="px-5 py-4 font-semibold">
                    Applicant
                  </th>
                  <th className="px-5 py-4 font-semibold">
                    Submitted
                  </th>
                  <th className="px-5 py-4 font-semibold">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {recentApplications.map((application) => (
                  <tr
                    key={application.id}
                    className="hover:bg-surface-secondary/50"
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

                    <td className="whitespace-nowrap px-5 py-4 text-muted">
                      {application.createdAt.toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4">
                      <ApplicationStatusBadge
                        status={application.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
