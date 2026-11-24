
import type { OrganizationRole } from "@/lib/permissions/organization-role";

export type OrganizationPermission =
  | "VIEW_ORGANIZATION"
  | "MANAGE_MEMBERS"
  | "UPDATE_SETTINGS"
  | "DELETE_ORGANIZATION"
  | "TRANSFER_OWNERSHIP"
  | "CREATE_INCIDENT"
  | "ASSIGN_INCIDENT_COORDINATOR";

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
    "ASSIGN_INCIDENT_COORDINATOR",
  ],

  ADMIN: [
    "VIEW_ORGANIZATION",
    "MANAGE_MEMBERS",
    "UPDATE_SETTINGS",
    "CREATE_INCIDENT",
    "ASSIGN_INCIDENT_COORDINATOR",
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
  if (!validOrganizationRoles.includes(role as OrganizationRole)) {
    return false;
  }

  return organizationPermissions[role as OrganizationRole].includes(
    permission,
  );
}
