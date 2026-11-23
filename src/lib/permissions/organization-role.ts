
import { redirect } from "next/navigation";

import { requireOrganization } from "@/lib/permissions/organization";

export type OrganizationRole = "OWNER" | "ADMIN" | "MEMBER";

export async function requireOrganizationRole(
  allowedRoles: OrganizationRole[],
) {
  // 1. Verify authentication and organization membership.
  const organizationContext = await requireOrganization();

  // 2. Get the user's organization role.
  const userRole = organizationContext.membership.role.toUpperCase();

  // 3. Check whether the role is authorized.
  if (!allowedRoles.includes(userRole as OrganizationRole)) {
    redirect("/dashboard");
  }

  // 4. Return the verified authorization context.
  return {
    ...organizationContext,
    role: userRole as OrganizationRole,
  };
}
