
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
  | "RESPOND_TO_INCIDENT_INVITATIONS"
  | "VIEW_EMERGENCY_REQUESTS"
  | "CREATE_EMERGENCY_REQUEST"
  | "REVIEW_EMERGENCY_REQUEST"
  | "RESPOND_TO_EMERGENCY_REQUEST";

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
    "VIEW_EMERGENCY_REQUESTS",
    "CREATE_EMERGENCY_REQUEST",
    "REVIEW_EMERGENCY_REQUEST",
    "RESPOND_TO_EMERGENCY_REQUEST",
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
    "VIEW_EMERGENCY_REQUESTS",
    "CREATE_EMERGENCY_REQUEST",
    "REVIEW_EMERGENCY_REQUEST",
    "RESPOND_TO_EMERGENCY_REQUEST",
  ],

  MEMBER: [
    "VIEW_ORGANIZATION",
    "CREATE_INCIDENT",
    "VIEW_EMERGENCY_REQUESTS",
    "CREATE_EMERGENCY_REQUEST",
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
