
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireOrganization: vi.fn(),
  organizationUpdate: vi.fn(),
  auditLogCreate: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/permissions/organization", () => ({
  requireOrganization: mocks.requireOrganization,
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    organization: {
      update: mocks.organizationUpdate,
    },
    auditLog: { create: mocks.auditLogCreate },
  },
}));

import { updateOrganization } from "./organization";

const ORG_ID = "org-1";
const USER_ID = "user-1";

function mockRequireOrganization(role: string) {
  mocks.requireOrganization.mockResolvedValue({
    organizationId: ORG_ID,
    session: { user: { id: USER_ID, name: "Test User" } },
    membership: { role },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateOrganization - authorization", () => {
  it("allows OWNER to rename the organization", async () => {
    mockRequireOrganization("OWNER");
    mocks.organizationUpdate.mockResolvedValue({ id: ORG_ID });

    const result = await updateOrganization({ name: "New Name" });

    expect(result.success).toBe(true);
    expect(mocks.organizationUpdate).toHaveBeenCalledWith({
      where: { id: ORG_ID },
      data: { name: "New Name" },
    });
  });

  it("denies ADMIN from renaming the organization", async () => {
    mockRequireOrganization("ADMIN");

    const result = await updateOrganization({ name: "New Name" });

    expect(result.success).toBe(false);
    expect(result.message).toContain("Only the organization owner");
    expect(mocks.organizationUpdate).not.toHaveBeenCalled();
  });

  it("denies MEMBER from renaming the organization", async () => {
    mockRequireOrganization("MEMBER");

    const result = await updateOrganization({ name: "New Name" });

    expect(result.success).toBe(false);
    expect(result.message).toContain("Only the organization owner");
    expect(mocks.organizationUpdate).not.toHaveBeenCalled();
  });

  it("prevents renaming another organization by scoping to active org", async () => {
    mockRequireOrganization("OWNER");
    mocks.organizationUpdate.mockResolvedValue({ id: ORG_ID });

    await updateOrganization({ name: "New Name" });

    expect(mocks.organizationUpdate).toHaveBeenCalledWith({
      where: { id: ORG_ID },
      data: { name: "New Name" },
    });
    // The client-supplied data only contains name, never an org ID.
    const updateCall = mocks.organizationUpdate.mock.calls[0][0];
    expect(updateCall.where.id).toBe(ORG_ID);
    expect(updateCall.data.name).toBe("New Name");
  });
});

describe("updateOrganization - validation", () => {
  beforeEach(() => {
    mockRequireOrganization("OWNER");
  });

  it("accepts a valid organization name", async () => {
    mocks.organizationUpdate.mockResolvedValue({ id: ORG_ID });

    const result = await updateOrganization({ name: "ReliefGrid Org" });

    expect(result.success).toBe(true);
    expect(mocks.organizationUpdate).toHaveBeenCalledWith({
      where: { id: ORG_ID },
      data: { name: "ReliefGrid Org" },
    });
  });

  it("rejects an empty name", async () => {
    const result = await updateOrganization({ name: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors?.name?.[0]).toBe(
        "Organization name is required",
      );
    }
    expect(mocks.organizationUpdate).not.toHaveBeenCalled();
  });

  it("rejects a whitespace-only name", async () => {
    const result = await updateOrganization({ name: "   " });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors?.name?.[0]).toBe(
        "Organization name is required",
      );
    }
    expect(mocks.organizationUpdate).not.toHaveBeenCalled();
  });

  it("trims leading and trailing whitespace", async () => {
    mocks.organizationUpdate.mockResolvedValue({ id: ORG_ID });

    const result = await updateOrganization({ name: "  New Name  " });

    expect(result.success).toBe(true);
    expect(mocks.organizationUpdate).toHaveBeenCalledWith({
      where: { id: ORG_ID },
      data: { name: "New Name" },
    });
  });

  it("rejects names exceeding 150 characters", async () => {
    const longName = "A".repeat(151);
    const result = await updateOrganization({ name: longName });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors?.name?.[0]).toBe(
        "Organization name must be 150 characters or fewer",
      );
    }
    expect(mocks.organizationUpdate).not.toHaveBeenCalled();
  });

  it("accepts a name exactly 150 characters", async () => {
    mocks.organizationUpdate.mockResolvedValue({ id: ORG_ID });

    const name150 = "A".repeat(150);
    const result = await updateOrganization({ name: name150 });

    expect(result.success).toBe(true);
    expect(mocks.organizationUpdate).toHaveBeenCalledWith({
      where: { id: ORG_ID },
      data: { name: name150 },
    });
  });

  it("handles unchanged names appropriately", async () => {
    mocks.organizationUpdate.mockResolvedValue({ id: ORG_ID });

    const result = await updateOrganization({ name: "Same Name" });

    expect(result.success).toBe(true);
    expect(mocks.organizationUpdate).toHaveBeenCalledWith({
      where: { id: ORG_ID },
      data: { name: "Same Name" },
    });
  });
});

describe("updateOrganization - error handling", () => {
  beforeEach(() => {
    mockRequireOrganization("OWNER");
  });

  it("returns a graceful error when the organization is not found", async () => {
    const notFoundError = new Error("Record not found");
    Object.assign(notFoundError, { code: "P2025" });
    mocks.organizationUpdate.mockRejectedValue(notFoundError);

    const result = await updateOrganization({ name: "New Name" });

    expect(result.success).toBe(false);
    expect(result.message).toContain("Something went wrong");
  });

  it("creates an audit log entry on successful update", async () => {
    mocks.organizationUpdate.mockResolvedValue({ id: ORG_ID });

    await updateOrganization({ name: "New Name" });

    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: {
        actorUserId: USER_ID,
        actorType: "USER",
        actorNameSnapshot: "Test User",
        organizationId: ORG_ID,
        action: "ORGANIZATION_RENAMED",
        entityType: "Organization",
        entityId: ORG_ID,
        after: { name: "New Name" },
      },
    });
  });

  it("revalidates settings and dashboard paths on success", async () => {
    mocks.organizationUpdate.mockResolvedValue({ id: ORG_ID });

    await updateOrganization({ name: "New Name" });

    expect(mocks.revalidatePath).toHaveBeenCalledWith("/settings");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});
