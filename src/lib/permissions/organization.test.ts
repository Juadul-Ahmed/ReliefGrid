
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  findFirst: vi.fn(),
  redirect: vi.fn((path: string): never => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock("@/lib/auth/session", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    organization: {
      findFirst: mocks.findFirst,
    },
  },
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import { requireOrganization } from "./organization";

const mockSession = {
  user: {
    id: "user-1",
    systemRole: "USER",
  },
  session: {
    activeOrganizationId: "org-1",
  },
};

const mockOrganization = {
  id: "org-1",
  members: [
    {
      id: "member-1",
      userId: "user-1",
      role: "owner",
      status: "ACTIVE",
    },
  ],
};

describe("requireOrganization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows a user with an active organization and membership", async () => {
    mocks.requireAuth.mockResolvedValue(mockSession);
    mocks.findFirst.mockResolvedValue(mockOrganization);

    const result = await requireOrganization();

    expect(result.organizationId).toBe("org-1");
    expect(result.organization).toEqual(mockOrganization);
    expect(result.membership).toEqual(mockOrganization.members[0]);
    expect(mocks.findFirst).toHaveBeenCalledTimes(1);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects users without an active organization", async () => {
    mocks.requireAuth.mockResolvedValue({
      ...mockSession,
      session: {
        activeOrganizationId: null,
      },
    });

    await expect(requireOrganization()).rejects.toThrow(
      "REDIRECT:/onboarding",
    );

    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("rejects an inactive or unavailable organization", async () => {
    mocks.requireAuth.mockResolvedValue(mockSession);
    mocks.findFirst.mockResolvedValue(null);

    await expect(requireOrganization()).rejects.toThrow(
      "REDIRECT:/onboarding",
    );

    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "org-1",
          status: "ACTIVE",
          members: {
            some: {
              userId: "user-1",
              status: "ACTIVE",
            },
          },
        }),
      }),
    );
  });

  it("rejects users without active membership", async () => {
    mocks.requireAuth.mockResolvedValue(mockSession);
    mocks.findFirst.mockResolvedValue(null);

    await expect(requireOrganization()).rejects.toThrow(
      "REDIRECT:/onboarding",
    );

    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          members: {
            some: {
              userId: "user-1",
              status: "ACTIVE",
            },
          },
        }),
      }),
    );
  });
});
