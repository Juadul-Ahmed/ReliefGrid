
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import OrganizationApplicationForm from "@/components/organization/OrganizationApplicationForm";
import { auth } from "@/lib/auth";

export default async function OrganizationApplicationPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Require authentication.
  if (!session) {
    redirect("/login");
  }

  // System administrators use the admin dashboard.
  if (session.user.systemRole === "SYSTEM_ADMIN") {
    redirect("/admin");
  }

  // Users with an active organization should use their dashboard.
  if (session.session.activeOrganizationId) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Back Navigation */}
        <Link
          href="/onboarding"
          className="mb-6 inline-flex items-center text-sm font-medium text-gray-500 transition hover:text-emerald-600"
        >
          ← Back to onboarding
        </Link>

        {/* Header */}
        <div className="mb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Organization Registration
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Register your organization
          </h1>

          <p className="mt-3 leading-7 text-gray-600 dark:text-gray-400">
            Apply to join ReliefGrid and coordinate disaster response,
            emergency resources, and humanitarian operations with other
            organizations.
          </p>
        </div>

        {/* Application Form */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
          <OrganizationApplicationForm />
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Applications are reviewed by the ReliefGrid administration team.
        </p>
      </div>
    </main>
  );
}
