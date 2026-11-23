
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import AccountInformation from "@/components/onboarding/AccountInformation";
import ApplicationStatusCard from "@/components/onboarding/ApplicationStatusCard";
import OnboardingHeader from "@/components/onboarding/OnboardingHeader";
import OnboardingOptions from "@/components/onboarding/OnboardingOptions";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export default async function OnboardingPage() {
  // 1. Authenticate the user.
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // 2. Redirect System Admin.
  if (session.user.systemRole === "SYSTEM_ADMIN") {
    redirect("/admin");
  }

  // 3. Redirect users with an active organization.
  if (session.session.activeOrganizationId) {
    redirect("/dashboard");
  }

  // 4. Retrieve the user's active organization application.
  const activeApplication =
    await prisma.organizationApplication.findFirst({
      where: {
        applicantId: session.user.id,
        status: {
          in: ["PENDING", "UNDER_REVIEW"],
        },
      },
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
        reviewedAt: true,
        reviewNotes: true,
      },
    });

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <div className="w-full max-w-4xl">

        {/* Welcome heading */}
        <OnboardingHeader userName={session.user.name} />

        {/* Account information */}
        <AccountInformation email={session.user.email} />

        {/* Organization application status */}
        {activeApplication && (
          <ApplicationStatusCard application={activeApplication} />
        )}

        {/* Onboarding options */}
        <OnboardingOptions
          hasActiveApplication={Boolean(activeApplication)}
        />

        {/* Footer */}
        <p className="mt-8 text-center text-xs leading-6 text-slate-400">
          ReliefGrid helps communities and response organizations
          coordinate resources and respond to emergencies.
        </p>

      </div>
    </main>
  );
}
