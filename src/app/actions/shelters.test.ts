import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";

const mocks = vi.hoisted(() => ({
  requireOrganizationPermission: vi.fn(),
  transaction: vi.fn(),
  create: vi.fn(),
  findFirst: vi.fn(),
  updateMany: vi.fn(),
  deleteMany: vi.fn(),
  auditCreate: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/permissions/require-organization-permission", () => ({
  requireOrganizationPermission: mocks.requireOrganizationPermission,
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    shelter: {
      create: mocks.create,
      findFirst: mocks.findFirst,
      updateMany: mocks.updateMany,
      deleteMany: mocks.deleteMany,
    },
    auditLog: { create: mocks.auditCreate },
  },
}));

import {
  createShelter,
  deleteShelter,
  updateShelter,
  updateShelterStatus,
} from "./shelters";

const context = {
  organizationId: "org-1",
  session: { user: { id: "user-1", name: "Owner One" } },
};

const validCreateInput = {
  name: "Downtown Emergency Shelter",
  address: "123 Main Street",
  capacity: 100,
  currentOccupancy: 0,
  status: "ACTIVE",
};

const existingShelter = {
  id: "shelter-1",
  name: "Old Shelter",
  address: "456 Old Street",
  capacity: 100,
  currentOccupancy: 25,
  status: "ACTIVE",
  latitude: 40.7128,
  longitude: -74.006,
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

function installTx() {
  mocks.transaction.mockImplementation(async (cb: (tx: unknown) => unknown) =>
    cb({
      shelter: {
        create: mocks.create,
        findFirst: mocks.findFirst,
        updateMany: mocks.updateMany,
        deleteMany: mocks.deleteMany,
      },
      auditLog: { create: mocks.auditCreate },
    }),
  );
}

describe("createShelter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOrganizationPermission.mockResolvedValue(context);
    mocks.auditCreate.mockResolvedValue({});
    installTx();
  });

  it("creates a shelter and writes an audit log", async () => {
    mocks.create.mockResolvedValue({ id: "shelter-1", name: "Downtown Emergency Shelter", status: "ACTIVE" });

    const result = await createShelter(validCreateInput);

    expect(result).toEqual({
      success: true,
      message: "Shelter created successfully.",
      shelterId: "shelter-1",
      shelterName: "Downtown Emergency Shelter",
    });

    const audit = mocks.auditCreate.mock.calls[0][0].data;
    expect(audit.action).toBe("SHELTER_CREATED");
    expect(audit.entityType).toBe("Shelter");
    expect(audit.entityId).toBe("shelter-1");
    expect(audit.organizationId).toBe("org-1");
  });

  it("derives organizationId from the authenticated context, not the form", async () => {
    mocks.create.mockResolvedValue({ id: "shelter-1", name: "Downtown Emergency Shelter", status: "ACTIVE" });

    await createShelter({ ...validCreateInput, organizationId: "org-evil" });

    expect(mocks.create.mock.calls[0][0].data.organizationId).toBe("org-1");
  });

  it("rejects invalid input without touching the database", async () => {
    const result = await createShelter({ ...validCreateInput, name: "A" });

    expect(result.success).toBe(false);
    expect(result.message).toContain("at least 2 characters");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects occupancy exceeding capacity", async () => {
    const result = await createShelter({
      ...validCreateInput,
      capacity: 10,
      currentOccupancy: 100,
    });

    expect(result.success).toBe(false);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects capacity of zero", async () => {
    const result = await createShelter({
      ...validCreateInput,
      capacity: 0,
    });

    expect(result.success).toBe(false);
  });

  it("revalidates /shelters after creation", async () => {
    mocks.create.mockResolvedValue({ id: "shelter-1", name: "Downtown Emergency Shelter", status: "ACTIVE" });

    await createShelter(validCreateInput);

    expect(mocks.revalidatePath).toHaveBeenCalledWith("/shelters");
  });
});

describe("createShelter authorization", () => {
  it("requires MANAGE_SHELTERS permission", async () => {
    mocks.requireOrganizationPermission.mockRejectedValue(new Error("Forbidden"));

    await expect(createShelter(validCreateInput)).rejects.toThrow("Forbidden");
    expect(mocks.create).not.toHaveBeenCalled();
  });
});

describe("updateShelter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOrganizationPermission.mockResolvedValue(context);
    mocks.auditCreate.mockResolvedValue({});
    installTx();
  });

  it("updates a shelter and writes an audit log", async () => {
    mocks.findFirst.mockResolvedValue(existingShelter);
    mocks.updateMany.mockResolvedValue({ count: 1 });

    const result = await updateShelter({
      ...existingShelter,
      name: "Updated Shelter Name",
      id: "shelter-1",
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe("Shelter updated successfully.");

    const audit = mocks.auditCreate.mock.calls[0][0].data;
    expect(audit.action).toBe("SHELTER_UPDATED");
    expect(audit.entityType).toBe("Shelter");
    expect(audit.entityId).toBe("shelter-1");
  });

  it("returns not found for cross-organization shelter", async () => {
    mocks.findFirst.mockResolvedValue(null);

    const result = await updateShelter({
      id: "shelter-1",
      name: "Updated Name",
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Shelter not found or access denied.");
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("rejects reducing capacity below current occupancy", async () => {
    mocks.findFirst.mockResolvedValue({
      ...existingShelter,
      currentOccupancy: 50,
    });

    const result = await updateShelter({
      id: "shelter-1",
      capacity: 25,
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Current occupancy cannot exceed capacity.");
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("rejects occupancy exceeding capacity", async () => {
    mocks.findFirst.mockResolvedValue(existingShelter);

    const result = await updateShelter({
      id: "shelter-1",
      currentOccupancy: 150,
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Current occupancy cannot exceed capacity.");
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("allows reducing capacity when occupancy fits", async () => {
    mocks.findFirst.mockResolvedValue({
      ...existingShelter,
      currentOccupancy: 25,
    });
    mocks.updateMany.mockResolvedValue({ count: 1 });

    const result = await updateShelter({
      id: "shelter-1",
      capacity: 50,
    });

    expect(result.success).toBe(true);
    expect(mocks.updateMany).toHaveBeenCalled();
  });

  it("handles concurrent update conflict", async () => {
    mocks.findFirst.mockResolvedValue(existingShelter);
    mocks.updateMany.mockResolvedValue({ count: 0 });

    const result = await updateShelter({
      ...existingShelter,
      name: "Updated Name",
      id: "shelter-1",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("another request");
  });

  it("revalidates /shelters and detail route after update", async () => {
    mocks.findFirst.mockResolvedValue(existingShelter);
    mocks.updateMany.mockResolvedValue({ count: 1 });

    await updateShelter({
      ...existingShelter,
      name: "Updated Name",
      id: "shelter-1",
    });

    expect(mocks.revalidatePath).toHaveBeenCalledWith("/shelters");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/shelters/shelter-1");
  });

  it("does not write audit log when the mutation is rejected by optimistic locking", async () => {
    mocks.findFirst.mockResolvedValue(existingShelter);
    mocks.updateMany.mockResolvedValue({ count: 0 });

    const result = await updateShelter({
      ...existingShelter,
      name: "Updated Name",
      id: "shelter-1",
    });

    expect(result.success).toBe(false);
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("returns error when audit logging fails inside the transaction", async () => {
    mocks.findFirst.mockResolvedValue(existingShelter);
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.auditCreate.mockRejectedValue(new Error("Audit failed"));

    const result = await updateShelter({
      ...existingShelter,
      name: "Updated Name",
      id: "shelter-1",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("Something went wrong");
  });

  it("handles Prisma transaction serialization conflict (P2034)", async () => {
    mocks.findFirst.mockResolvedValue(existingShelter);
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Transaction conflict", {
        code: "P2034",
        clientVersion: "7.10.1",
      })
    );

    const result = await updateShelter({
      ...existingShelter,
      name: "Updated Name",
      id: "shelter-1",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("another request");
  });
});

describe("updateShelter authorization", () => {
  it("requires MANAGE_SHELTERS permission", async () => {
    mocks.requireOrganizationPermission.mockRejectedValue(new Error("Forbidden"));

    await expect(updateShelter({ id: "shelter-1", name: "Updated" })).rejects.toThrow(
      "Forbidden",
    );
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });
});

describe("deleteShelter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOrganizationPermission.mockResolvedValue(context);
    mocks.auditCreate.mockResolvedValue({});
    installTx();
  });

  it("deletes an empty shelter and writes an audit log", async () => {
    mocks.findFirst.mockResolvedValue({
      ...existingShelter,
      currentOccupancy: 0,
    });
    mocks.deleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteShelter({ id: "shelter-1" });

    expect(result.success).toBe(true);
    expect(result.message).toBe("Shelter deleted successfully.");

    const audit = mocks.auditCreate.mock.calls[0][0].data;
    expect(audit.action).toBe("SHELTER_DELETED");
    expect(audit.entityType).toBe("Shelter");
    expect(audit.entityId).toBe("shelter-1");
  });

  it("rejects deleting an occupied shelter", async () => {
    mocks.findFirst.mockResolvedValue({
      ...existingShelter,
      currentOccupancy: 10,
    });
    // Database rejects the delete because currentOccupancy != 0
    mocks.deleteMany.mockResolvedValue({ count: 0 });

    const result = await deleteShelter({ id: "shelter-1" });

    expect(result.success).toBe(false);
    expect(result.message).toContain("may have occupants");
    expect(mocks.deleteMany).toHaveBeenCalled();
  });

  it("conditional delete returns count zero when occupancy changes concurrently", async () => {
    // Initial read shows empty shelter, but delete condition fails at commit time
    mocks.findFirst.mockResolvedValue({
      ...existingShelter,
      currentOccupancy: 0,
    });
    mocks.deleteMany.mockResolvedValue({ count: 0 });

    const result = await deleteShelter({ id: "shelter-1" });

    expect(result.success).toBe(false);
    expect(result.message).toContain("Could not delete this shelter");
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "shelter-1",
        organizationId: "org-1",
        currentOccupancy: 0,
      },
    });
  });

  it("returns not found for cross-organization shelter", async () => {
    mocks.findFirst.mockResolvedValue(null);

    const result = await deleteShelter({ id: "shelter-1" });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Shelter not found or access denied.");
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("revalidates /shelters after deletion", async () => {
    mocks.findFirst.mockResolvedValue({
      ...existingShelter,
      currentOccupancy: 0,
    });
    mocks.deleteMany.mockResolvedValue({ count: 1 });

    await deleteShelter({ id: "shelter-1" });

    expect(mocks.revalidatePath).toHaveBeenCalledWith("/shelters");
  });
});

describe("updateShelterStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOrganizationPermission.mockResolvedValue(context);
    mocks.auditCreate.mockResolvedValue({});
    installTx();
  });

  it("updates status to ACTIVE and writes an audit log", async () => {
    mocks.findFirst.mockResolvedValue({
      ...existingShelter,
      status: "INACTIVE",
    });
    mocks.updateMany.mockResolvedValue({ count: 1 });

    const result = await updateShelterStatus({
      id: "shelter-1",
      status: "ACTIVE",
    });

    expect(result.success).toBe(true);

    const audit = mocks.auditCreate.mock.calls[0][0].data;
    expect(audit.action).toBe("SHELTER_STATUS_UPDATED");
    expect(audit.after).toEqual({ status: "ACTIVE" });
  });

  it("rejects FULL status (derived only)", async () => {
    mocks.findFirst.mockResolvedValue(existingShelter);

    const result = await updateShelterStatus({
      id: "shelter-1",
      status: "FULL",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("valid shelter status");
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("returns no-op when status is unchanged", async () => {
    mocks.findFirst.mockResolvedValue({
      ...existingShelter,
      status: "ACTIVE",
    });

    const result = await updateShelterStatus({
      id: "shelter-1",
      status: "ACTIVE",
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe("Shelter is already ACTIVE.");
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("returns not found for cross-organization shelter", async () => {
    mocks.findFirst.mockResolvedValue(null);

    const result = await updateShelterStatus({
      id: "shelter-1",
      status: "CLOSED",
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Shelter not found or access denied.");
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("revalidates /shelters and detail route after status update", async () => {
    mocks.findFirst.mockResolvedValue({
      ...existingShelter,
      status: "INACTIVE",
    });
    mocks.updateMany.mockResolvedValue({ count: 1 });

    await updateShelterStatus({
      id: "shelter-1",
      status: "CLOSED",
    });

    expect(mocks.revalidatePath).toHaveBeenCalledWith("/shelters");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/shelters/shelter-1");
  });
});

describe("updateShelterStatus authorization", () => {
  it("requires MANAGE_SHELTERS permission", async () => {
    mocks.requireOrganizationPermission.mockRejectedValue(new Error("Forbidden"));

    await expect(
      updateShelterStatus({ id: "shelter-1", status: "CLOSED" }),
    ).rejects.toThrow("Forbidden");
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });
});
