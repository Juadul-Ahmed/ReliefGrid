
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { FiActivity, FiShield } from "react-icons/fi";

import AccountInformation from "@/components/onboarding/AccountInformation";
import ApplicationStatusCard from "@/components/onboarding/ApplicationStatusCard";
import OnboardingHeader from "@/components/onboarding/OnboardingHeader";
import OnboardingOptions from "@/components/onboarding/OnboardingOptions";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export default async function OnboardingPage() {
  const requestHeaders = await headers();

  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    redirect("/login");
  }

  if (session.user.systemRole === "SYSTEM_ADMIN") {
    redirect("/admin");
  }

  if (session.session.activeOrganizationId) {
    redirect("/dashboard");
  }

  // Check whether the user already belongs to an active organization.
  const activeMembership = await prisma.member.findFirst({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
      organization: {
        status: "ACTIVE",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      organizationId: true,
    },
  });

  // Automatically activate the organization for approved members.
  if (activeMembership) {
    await auth.api.setActiveOrganization({
      headers: requestHeaders,
      body: {
        organizationId: activeMembership.organizationId,
      },
    });

    redirect("/dashboard");
  }

  // Find the user's active organization application.
  const application = await prisma.organizationApplication.findFirst({
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

  // Narrow the status to the two statuses displayed by the component.
  const activeApplication = application
    ? {
        ...application,
        status: application.status as "PENDING" | "UNDER_REVIEW",
      }
    : null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F4F7FB]">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-40 -top-40 size-[500px] rounded-full bg-emerald-200/20 blur-3xl" />

      <div className="pointer-events-none absolute -right-40 top-40 size-[500px] rounded-full bg-blue-200/20 blur-3xl" />

      {/* Top accent */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#101D35] via-emerald-500 to-[#101D35]" />

      <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12 lg:px-10">
        <OnboardingHeader userName={session.user.name} />

        <div className="mx-auto max-w-5xl">
          <AccountInformation email={session.user.email} />

          {activeApplication && (
            <ApplicationStatusCard application={activeApplication} />
          )}

          <OnboardingOptions
            hasActiveApplication={Boolean(activeApplication)}
          />

          {/* Footer */}
          <footer className="mt-16 border-t border-slate-200/80 pt-7">
            <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#101D35]">
                <FiShield className="text-emerald-600" />
                ReliefGrid
              </div>

              <p className="text-xs leading-6 text-slate-400">
                Connecting communities. Coordinating response.
                Saving lives.
              </p>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <FiActivity className="text-emerald-500" />
                Emergency Response Platform
              </div>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
