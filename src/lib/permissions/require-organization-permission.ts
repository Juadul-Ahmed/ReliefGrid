
import { redirect } from "next/navigation";

import { requireOrganization } from "@/lib/permissions/organization";
import {
  hasOrganizationPermission,
  type OrganizationPermission,
} from "@/lib/permissions/organization-permissions";
import type { OrganizationRole } from "@/lib/permissions/organization-role";

export async function requireOrganizationPermission(
  permission: OrganizationPermission,
) {
  // 1. Verify authentication and active organization membership.
  const context = await requireOrganization();

  // 2. Normalize the membership role.
  const role = context.membership.role.toUpperCase() as OrganizationRole;

  // 3. Verify the requested permission.
  if (!hasOrganizationPermission(role, permission)) {
    redirect("/dashboard");
  }

  // 4. Return the verified context.
  return {
    ...context,
    role,
    permission,
  };
}
