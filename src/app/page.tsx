
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingAbout } from "@/components/landing/LandingAbout";
import { LandingContact } from "@/components/landing/LandingContact";
import { LandingFooter } from "@/components/landing/LandingFooter";

import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function Home() {
  const session = await getCurrentSession();

  const isAuthenticated = Boolean(session);
  const isSystemAdmin =
    session?.user.systemRole === "SYSTEM_ADMIN";

  let hasOrganization = false;

  if (session && !isSystemAdmin) {
    const organization = await prisma.organization.findFirst({
      where: {
        status: "ACTIVE",
        members: {
          some: {
            userId: session.user.id,
            status: "ACTIVE",
          },
        },
      },
      select: {
        id: true,
      },
    });

    hasOrganization = Boolean(organization);
  }

  return (
    <main className="min-h-screen bg-background">
      <LandingNavbar
        isAuthenticated={isAuthenticated}
        hasOrganization={hasOrganization}
        isSystemAdmin={isSystemAdmin}
      />

      <LandingHero />
      <LandingAbout />
      <LandingContact />
      <LandingFooter />
    </main>
  );
}
