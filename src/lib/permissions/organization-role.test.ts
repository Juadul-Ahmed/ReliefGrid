
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

import { requireOrganizationRole } from "./organization-role";

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

describe("requireOrganizationRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows OWNER when OWNER is an allowed role", async () => {
    mocks.requireOrganization.mockResolvedValue(createContext("owner"));

    const result = await requireOrganizationRole(["OWNER"]);

    expect(result.role).toBe("OWNER");
    expect(result.organizationId).toBe("org-1");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("allows ADMIN when ADMIN is an allowed role", async () => {
    mocks.requireOrganization.mockResolvedValue(createContext("admin"));

    const result = await requireOrganizationRole(["ADMIN"]);

    expect(result.role).toBe("ADMIN");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("allows MEMBER when MEMBER is an allowed role", async () => {
    mocks.requireOrganization.mockResolvedValue(createContext("member"));

    const result = await requireOrganizationRole(["MEMBER"]);

    expect(result.role).toBe("MEMBER");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects MEMBER when only OWNER is allowed", async () => {
    mocks.requireOrganization.mockResolvedValue(createContext("member"));

    await expect(
      requireOrganizationRole(["OWNER"]),
    ).rejects.toThrow("REDIRECT:/dashboard");

    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("redirects ADMIN when only OWNER is allowed", async () => {
    mocks.requireOrganization.mockResolvedValue(createContext("admin"));

    await expect(
      requireOrganizationRole(["OWNER"]),
    ).rejects.toThrow("REDIRECT:/dashboard");

    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("normalizes uppercase roles", async () => {
    mocks.requireOrganization.mockResolvedValue(createContext("OWNER"));

    const result = await requireOrganizationRole(["OWNER"]);

    expect(result.role).toBe("OWNER");
  });
});
