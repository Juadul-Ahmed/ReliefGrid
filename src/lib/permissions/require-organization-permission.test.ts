
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireOrganization: vi.fn(),
  redirect: vi.fn((path: string): never => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock("@/lib/permissions/organization", () => ({
  requireOrganization: mocks.requireOrganization,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import { requireOrganizationPermission } from "./require-organization-permission";

const createContext = (role: string) => ({
  session: {
    user: {
      id: "user-1",
      systemRole: "USER",
    },
  },
  organizationId: "org-1",
  organization: {
    id: "org-1",
    status: "ACTIVE",
  },
  membership: {
    id: "member-1",
    userId: "user-1",
    role,
    status: "ACTIVE",
  },
});

describe("requireOrganizationPermission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows OWNER to delete an organization", async () => {
    mocks.requireOrganization.mockResolvedValue(createContext("owner"));

    const result = await requireOrganizationPermission("DELETE_ORGANIZATION");

    expect(result.role).toBe("OWNER");
    expect(result.permission).toBe("DELETE_ORGANIZATION");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("denies ADMIN permission to delete an organization", async () => {
    mocks.requireOrganization.mockResolvedValue(createContext("admin"));

    await expect(
      requireOrganizationPermission("DELETE_ORGANIZATION"),
    ).rejects.toThrow("REDIRECT:/dashboard");

    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("allows ADMIN to manage members", async () => {
    mocks.requireOrganization.mockResolvedValue(createContext("admin"));

    const result = await requireOrganizationPermission("MANAGE_MEMBERS");

    expect(result.role).toBe("ADMIN");
    expect(result.permission).toBe("MANAGE_MEMBERS");
  });

  it("denies MEMBER permission to manage members", async () => {
    mocks.requireOrganization.mockResolvedValue(createContext("member"));

    await expect(
      requireOrganizationPermission("MANAGE_MEMBERS"),
    ).rejects.toThrow("REDIRECT:/dashboard");
  });

  it("allows MEMBER to view an organization", async () => {
    mocks.requireOrganization.mockResolvedValue(createContext("member"));

    const result = await requireOrganizationPermission("VIEW_ORGANIZATION");

    expect(result.role).toBe("MEMBER");
    expect(result.permission).toBe("VIEW_ORGANIZATION");
  });

  it("denies ADMIN permission to transfer ownership", async () => {
    mocks.requireOrganization.mockResolvedValue(createContext("admin"));

    await expect(
      requireOrganizationPermission("TRANSFER_OWNERSHIP"),
    ).rejects.toThrow("REDIRECT:/dashboard");
  });

  it("allows OWNER to transfer ownership", async () => {
    mocks.requireOrganization.mockResolvedValue(createContext("owner"));

    const result = await requireOrganizationPermission("TRANSFER_OWNERSHIP");

    expect(result.role).toBe("OWNER");
    expect(result.permission).toBe("TRANSFER_OWNERSHIP");
  });
});
