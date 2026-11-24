
import type { OrganizationRole } from "@/lib/permissions/organization-role";

export type OrganizationPermission =
  | "VIEW_ORGANIZATION"
  | "MANAGE_MEMBERS"
  | "UPDATE_SETTINGS"
  | "DELETE_ORGANIZATION"
  | "TRANSFER_OWNERSHIP"
  | "CREATE_INCIDENT";

const validOrganizationRoles: OrganizationRole[] = [
  "OWNER",
  "ADMIN",
  "MEMBER",
];

const organizationPermissions: Record<
  OrganizationRole,
  OrganizationPermission[]
> = {
  OWNER: [
    "VIEW_ORGANIZATION",
    "MANAGE_MEMBERS",
    "UPDATE_SETTINGS",
    "DELETE_ORGANIZATION",
    "TRANSFER_OWNERSHIP",
    "CREATE_INCIDENT",
  ],

  ADMIN: [
    "VIEW_ORGANIZATION",
    "MANAGE_MEMBERS",
    "UPDATE_SETTINGS",
    "CREATE_INCIDENT",
  ],

  MEMBER: [
    "VIEW_ORGANIZATION",
    "CREATE_INCIDENT",
  ],
};

export function hasOrganizationPermission(
  role: string,
  permission: OrganizationPermission,
): boolean {
  // Reject unknown roles before accessing the permissions map.
  if (!validOrganizationRoles.includes(role as OrganizationRole)) {
    return false;
  }

  return organizationPermissions[role as OrganizationRole].includes(
    permission,
  );
}
