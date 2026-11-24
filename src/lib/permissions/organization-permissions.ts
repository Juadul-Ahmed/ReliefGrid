
import type { OrganizationRole } from "@/lib/permissions/organization-role";

export type OrganizationPermission =
  | "VIEW_ORGANIZATION"
  | "MANAGE_MEMBERS"
  | "UPDATE_SETTINGS"
  | "DELETE_ORGANIZATION"
  | "TRANSFER_OWNERSHIP"
  | "CREATE_INCIDENT"
  | "ASSIGN_INCIDENT_COORDINATOR"
  | "UPDATE_INCIDENT_STATUS"
  | "UPDATE_INCIDENT_SEVERITY"
  | "MANAGE_INCIDENT_PARTICIPANTS"
  | "RESPOND_TO_INCIDENT_INVITATIONS";

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
    "UPDATE_INCIDENT_STATUS",
    "UPDATE_INCIDENT_SEVERITY",
    "MANAGE_INCIDENT_PARTICIPANTS",
    "RESPOND_TO_INCIDENT_INVITATIONS",
  ],

  ADMIN: [
    "VIEW_ORGANIZATION",
    "MANAGE_MEMBERS",
    "UPDATE_SETTINGS",
    "CREATE_INCIDENT",
    "ASSIGN_INCIDENT_COORDINATOR",
    "UPDATE_INCIDENT_STATUS",
    "UPDATE_INCIDENT_SEVERITY",
    "MANAGE_INCIDENT_PARTICIPANTS",
    "RESPOND_TO_INCIDENT_INVITATIONS",
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
