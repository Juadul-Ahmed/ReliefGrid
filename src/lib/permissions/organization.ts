
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function requireOrganization() {
  // 1. Require authentication.
  const session = await requireAuth();

  // 2. System administrators use the admin dashboard.
  if (session.user.systemRole === "SYSTEM_ADMIN") {
    redirect("/admin");
  }

  // 3. Get the active organization.
  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    redirect("/onboarding");
  }

  // 4. Verify organization status and active membership together.
  const organization = await prisma.organization.findFirst({
    where: {
      id: organizationId,
      status: "ACTIVE",
      members: {
        some: {
          userId: session.user.id,
          status: "ACTIVE",
        },
      },
    },
    include: {
      members: {
        where: {
          userId: session.user.id,
          status: "ACTIVE",
        },
        take: 1,
      },
    },
  });

  if (!organization || !organization.members[0]) {
    redirect("/onboarding");
  }

  // 5. Return verified authorization information.
  return {
    session,
    organizationId,
    organization,
    membership: organization.members[0],
  };
}
