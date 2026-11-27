
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingAbout } from "@/components/landing/LandingAbout";
import { LandingCapabilities } from "@/components/landing/LandingCapabilities";
import { LandingContact } from "@/components/landing/LandingContact";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingMissionCta } from "@/components/landing/LandingMissionCta";

import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

type UserRole = "SYSTEM_ADMIN" | "OWNER" | "ADMIN" | "MEMBER" | null;

export default async function Home() {
  const session = await getCurrentSession();

  const isAuthenticated = Boolean(session);
  const isSystemAdmin = session?.user.systemRole === "SYSTEM_ADMIN";

  let userRole: UserRole = null;
  let hasOrganization = false;

  if (session) {
    if (isSystemAdmin) {
      userRole = "SYSTEM_ADMIN";
    } else {
      const membership = await prisma.member.findFirst({
        where: {
          userId: session.user.id,
          status: "ACTIVE",
        },
        select: {
          role: true,
          organization: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      if (membership && membership.organization.status === "ACTIVE") {
        hasOrganization = true;
        userRole = membership.role.toUpperCase() as UserRole;
      }
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <LandingNavbar
        isAuthenticated={isAuthenticated}
        hasOrganization={hasOrganization}
        isSystemAdmin={isSystemAdmin}
      />

      <LandingHero
        isAuthenticated={isAuthenticated}
        userRole={userRole}
      />
      <LandingAbout />
      <LandingCapabilities />
      <LandingContact />
      <LandingMissionCta
        isAuthenticated={isAuthenticated}
        userRole={userRole}
      />
      <LandingFooter />
    </main>
  );
}
