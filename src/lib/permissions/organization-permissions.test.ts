
import { describe, expect, it } from "vitest";

import { hasOrganizationPermission } from "./organization-permissions";

describe("Organization permissions", () => {
  it("allows OWNER to delete an organization", () => {
    expect(
      hasOrganizationPermission("OWNER", "DELETE_ORGANIZATION"),
    ).toBe(true);
  });

  it("prevents ADMIN from deleting an organization", () => {
    expect(
      hasOrganizationPermission("ADMIN", "DELETE_ORGANIZATION"),
    ).toBe(false);
  });

  it("prevents MEMBER from managing members", () => {
    expect(
      hasOrganizationPermission("MEMBER", "MANAGE_MEMBERS"),
    ).toBe(false);
  });

  it("allows all roles to view an organization", () => {
    const roles = ["OWNER", "ADMIN", "MEMBER"] as const;

    roles.forEach((role) => {
      expect(
        hasOrganizationPermission(role, "VIEW_ORGANIZATION"),
      ).toBe(true);
    });
  });

  it("prevents ADMIN from transferring ownership", () => {
    expect(
      hasOrganizationPermission("ADMIN", "TRANSFER_OWNERSHIP"),
    ).toBe(false);
  });

  it("denies all permissions to unknown roles", () => {
    expect(
      hasOrganizationPermission("COORDINATOR", "VIEW_ORGANIZATION"),
    ).toBe(false);

    expect(
      hasOrganizationPermission("SUPER_ADMIN", "DELETE_ORGANIZATION"),
    ).toBe(false);

    expect(
      hasOrganizationPermission("", "MANAGE_MEMBERS"),
    ).toBe(false);
  });

  it("allows OWNER to manage incident participants", () => {
    expect(
      hasOrganizationPermission("OWNER", "MANAGE_INCIDENT_PARTICIPANTS"),
    ).toBe(true);
  });

  it("allows ADMIN to manage incident participants", () => {
    expect(
      hasOrganizationPermission("ADMIN", "MANAGE_INCIDENT_PARTICIPANTS"),
    ).toBe(true);
  });

  it("prevents MEMBER from managing incident participants", () => {
    expect(
      hasOrganizationPermission("MEMBER", "MANAGE_INCIDENT_PARTICIPANTS"),
    ).toBe(false);
  });

  it("allows OWNER and ADMIN to respond to incident invitations", () => {
    expect(
      hasOrganizationPermission("OWNER", "RESPOND_TO_INCIDENT_INVITATIONS"),
    ).toBe(true);

    expect(
      hasOrganizationPermission("ADMIN", "RESPOND_TO_INCIDENT_INVITATIONS"),
    ).toBe(true);
  });

  it("prevents MEMBER from responding to incident invitations", () => {
    expect(
      hasOrganizationPermission("MEMBER", "RESPOND_TO_INCIDENT_INVITATIONS"),
    ).toBe(false);
  });

  it("allows only OWNER and ADMIN to review emergency requests", () => {
    expect(
      hasOrganizationPermission("OWNER", "REVIEW_EMERGENCY_REQUEST"),
    ).toBe(true);
    expect(
      hasOrganizationPermission("ADMIN", "REVIEW_EMERGENCY_REQUEST"),
    ).toBe(true);
    expect(
      hasOrganizationPermission("MEMBER", "REVIEW_EMERGENCY_REQUEST"),
    ).toBe(false);
  });

  it("allows only OWNER and ADMIN to allocate to emergency requests", () => {
    expect(
      hasOrganizationPermission("OWNER", "RESPOND_TO_EMERGENCY_REQUEST"),
    ).toBe(true);
    expect(
      hasOrganizationPermission("ADMIN", "RESPOND_TO_EMERGENCY_REQUEST"),
    ).toBe(true);
    expect(
      hasOrganizationPermission("MEMBER", "RESPOND_TO_EMERGENCY_REQUEST"),
    ).toBe(false);
  });

  it("allows MEMBER to create and view emergency requests", () => {
    expect(
      hasOrganizationPermission("MEMBER", "CREATE_EMERGENCY_REQUEST"),
    ).toBe(true);
    expect(
      hasOrganizationPermission("MEMBER", "VIEW_EMERGENCY_REQUESTS"),
    ).toBe(true);
  });

  it("allows all roles to view resources", () => {
    const roles = ["OWNER", "ADMIN", "MEMBER"] as const;

    roles.forEach((role) => {
      expect(hasOrganizationPermission(role, "VIEW_RESOURCES")).toBe(true);
    });
  });

  it("allows only OWNER and ADMIN to manage resources", () => {
    expect(hasOrganizationPermission("OWNER", "MANAGE_RESOURCES")).toBe(true);
    expect(hasOrganizationPermission("ADMIN", "MANAGE_RESOURCES")).toBe(true);
    expect(hasOrganizationPermission("MEMBER", "MANAGE_RESOURCES")).toBe(false);
  });

  it("allows only OWNER and ADMIN to adjust inventory", () => {
    expect(hasOrganizationPermission("OWNER", "ADJUST_INVENTORY")).toBe(true);
    expect(hasOrganizationPermission("ADMIN", "ADJUST_INVENTORY")).toBe(true);
    expect(hasOrganizationPermission("MEMBER", "ADJUST_INVENTORY")).toBe(false);
  });
});
