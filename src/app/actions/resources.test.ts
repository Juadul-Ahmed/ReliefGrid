import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";

const mocks = vi.hoisted(() => ({
  requireOrganizationPermission: vi.fn(),
  transaction: vi.fn(),
  create: vi.fn(),
  findFirst: vi.fn(),
  updateMany: vi.fn(),
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
    resource: {
      create: mocks.create,
      findFirst: mocks.findFirst,
      updateMany: mocks.updateMany,
    },
    auditLog: { create: mocks.auditCreate },
  },
}));

import {
  createResource,
  updateResource,
  updateResourceStatus,
} from "./resources";
import { getResourceById } from "@/lib/resources/queries";

const context = {
  organizationId: "org-1",
  session: { user: { id: "user-1", name: "Owner One" } },
};

const validInput = {
  name: "Bottled water",
  category: "DRINKING_WATER",
  unit: "liters",
};

const existingResource = {
  id: "res-1",
  name: "Old name",
  category: "FOOD",
  unit: "boxes",
  description: null,
  sku: null,
  locationName: null,
  address: null,
  latitude: null,
  longitude: null,
  isActive: true,
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

function installTx() {
  mocks.transaction.mockImplementation(async (cb: (tx: unknown) => unknown) =>
    cb({
      resource: { create: mocks.create, updateMany: mocks.updateMany },
      auditLog: { create: mocks.auditCreate },
    }),
  );
}

function uniqueError() {
  return new Prisma.PrismaClientKnownRequestError(
    "Unique constraint failed on the fields: (`organizationId`, `name`)",
    {
      code: "P2002",
      clientVersion: "7.10.1",
      meta: { target: ["organizationId", "name"] },
    },
  );
}

describe("createResource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOrganizationPermission.mockResolvedValue(context);
    mocks.auditCreate.mockResolvedValue({});
    installTx();
  });

  it("creates a resource and writes an audit log", async () => {
    mocks.create.mockResolvedValue({ id: "res-1", name: "Bottled water" });

    const result = await createResource(validInput);

    expect(result).toEqual({
      success: true,
      message: "Resource created successfully.",
      resourceId: "res-1",
      resourceName: "Bottled water",
    });

    const audit = mocks.auditCreate.mock.calls[0][0].data;
    expect(audit.action).toBe("RESOURCE_CREATED");
    expect(audit.entityType).toBe("Resource");
    expect(audit.entityId).toBe("res-1");
    expect(audit.organizationId).toBe("org-1");
  });

  it("derives organizationId from the authenticated context, not the form", async () => {
    mocks.create.mockResolvedValue({ id: "res-1", name: "Bottled water" });

    await createResource({ ...validInput, organizationId: "org-evil" });

    expect(mocks.create.mock.calls[0][0].data.organizationId).toBe("org-1");
  });

  it("rejects invalid input without touching the database", async () => {
    const result = await createResource({ ...validInput, name: "A" });

    expect(result.success).toBe(false);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("denies MEMBER from creating resources", async () => {
    mocks.requireOrganizationPermission.mockRejectedValue(
      new Error("REDIRECT:/dashboard"),
    );

    await expect(createResource(validInput)).rejects.toThrow(
      "REDIRECT:/dashboard",
    );
  });

  it("handles duplicate names gracefully", async () => {
    mocks.create.mockRejectedValue(uniqueError());

    const result = await createResource(validInput);

    expect(result.success).toBe(false);
    expect(result.message).toContain("already exists");
  });

  it("handles unexpected database errors safely", async () => {
    mocks.create.mockRejectedValue(new Error("boom"));

    const result = await createResource(validInput);

    expect(result.success).toBe(false);
    expect(result.message).toContain("Something went wrong");
  });

  it("saves all four location fields", async () => {
    mocks.create.mockResolvedValue({ id: "res-1", name: "Bottled water" });

    const result = await createResource({
      ...validInput,
      locationName: "Warehouse A",
      address: "123 Main St",
      latitude: 45.5,
      longitude: -122.7,
    });

    expect(result.success).toBe(true);

    const createData = mocks.create.mock.calls[0][0].data;
    expect(createData.locationName).toBe("Warehouse A");
    expect(createData.address).toBe("123 Main St");
    expect(createData.latitude).toBe(45.5);
    expect(createData.longitude).toBe(-122.7);

    const audit = mocks.auditCreate.mock.calls[0][0].data;
    expect(audit.after.locationName).toBe("Warehouse A");
    expect(audit.after.address).toBe("123 Main St");
    expect(audit.after.latitude).toBe(45.5);
    expect(audit.after.longitude).toBe(-122.7);
  });

  it("saves null optional location fields correctly", async () => {
    mocks.create.mockResolvedValue({ id: "res-1", name: "Bottled water" });

    const result = await createResource({
      ...validInput,
      locationName: null,
      address: null,
      latitude: null,
      longitude: null,
    });

    expect(result.success).toBe(true);

    const createData = mocks.create.mock.calls[0][0].data;
    expect(createData.locationName).toBeNull();
    expect(createData.address).toBeNull();
    expect(createData.latitude).toBeNull();
    expect(createData.longitude).toBeNull();
  });

  it("rejects invalid coordinates", async () => {
    const result = await createResource({
      ...validInput,
      latitude: 91,
      longitude: -122.7,
    });

    expect(result.success).toBe(false);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects partial coordinate pairs", async () => {
    const result = await createResource({
      ...validInput,
      latitude: 45.5,
    });

    expect(result.success).toBe(false);
    expect(mocks.create).not.toHaveBeenCalled();

    const result2 = await createResource({
      ...validInput,
      longitude: -122.7,
    });

    expect(result2.success).toBe(false);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("preserves organization scoping with location fields", async () => {
    mocks.create.mockResolvedValue({ id: "res-1", name: "Bottled water" });

    await createResource({
      ...validInput,
      organizationId: "org-evil",
      locationName: "Warehouse A",
      address: "123 Main St",
      latitude: 45.5,
      longitude: -122.7,
    });

    const createData = mocks.create.mock.calls[0][0].data;
    expect(createData.organizationId).toBe("org-1");
    expect(createData.locationName).toBe("Warehouse A");
  });
});

describe("getResourceById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a resource scoped to the organization", async () => {
    mocks.findFirst.mockResolvedValue(existingResource);

    const result = await getResourceById("res-1", "org-1");

    expect(result).toEqual(existingResource);
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "res-1", organizationId: "org-1" },
      }),
    );
  });

  it("returns null when the resource belongs to another organization", async () => {
    mocks.findFirst.mockResolvedValue(null);

    const result = await getResourceById("res-1", "org-2");

    expect(result).toBeNull();
  });
});

describe("updateResource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOrganizationPermission.mockResolvedValue(context);
    mocks.auditCreate.mockResolvedValue({});
    installTx();
  });

  it("updates a resource and records before/after audit states", async () => {
    mocks.findFirst.mockResolvedValue(existingResource);
    mocks.updateMany.mockResolvedValue({ count: 1 });

    const result = await updateResource({
      resourceId: "res-1",
      name: "New name",
      category: "DRINKING_WATER",
      unit: "liters",
      description: "",
      sku: "",
      isActive: false,
    });

    expect(result.success).toBe(true);

    const audit = mocks.auditCreate.mock.calls[0][0].data;
    expect(audit.action).toBe("RESOURCE_UPDATED");
    expect(audit.before.name).toBe("Old name");
    expect(audit.after.name).toBe("New name");
    expect(audit.after.isActive).toBe(false);
  });

  it("scopes the update to the authenticated organization", async () => {
    mocks.findFirst.mockResolvedValue(existingResource);
    mocks.updateMany.mockResolvedValue({ count: 1 });

    await updateResource({
      resourceId: "res-1",
      organizationId: "org-evil",
      name: "New name",
      category: "DRINKING_WATER",
      unit: "liters",
      description: "",
      sku: "",
      isActive: true,
    });

    expect(mocks.findFirst.mock.calls[0][0].where.organizationId).toBe("org-1");
    expect(mocks.updateMany.mock.calls[0][0].where.organizationId).toBe(
      "org-1",
    );
  });

  it("rejects invalid input without updating the database", async () => {
    const result = await updateResource({
      resourceId: "res-1",
      name: "A",
      category: "FOOD",
      unit: "boxes",
      isActive: true,
    });

    expect(result.success).toBe(false);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("denies MEMBER from updating resources", async () => {
    mocks.requireOrganizationPermission.mockRejectedValue(
      new Error("REDIRECT:/dashboard"),
    );

    await expect(
      updateResource({ resourceId: "res-1" }),
    ).rejects.toThrow("REDIRECT:/dashboard");
  });

  it("does not write or audit a no-op update", async () => {
    mocks.findFirst.mockResolvedValue({
      ...existingResource,
      name: "Same",
      description: null,
      sku: null,
    });

    const result = await updateResource({
      resourceId: "res-1",
      name: "Same",
      category: "FOOD",
      unit: "boxes",
      description: "",
      sku: "",
      isActive: true,
    });

    expect(result.success).toBe(true);
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("detects concurrent updates", async () => {
    mocks.findFirst.mockResolvedValue(existingResource);
    mocks.updateMany.mockResolvedValue({ count: 0 });

    const result = await updateResource({
      resourceId: "res-1",
      name: "New name",
      category: "DRINKING_WATER",
      unit: "liters",
      description: "",
      sku: "",
      isActive: true,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("another request");
  });

  it("handles duplicate names gracefully", async () => {
    mocks.findFirst.mockResolvedValue(existingResource);
    mocks.updateMany.mockRejectedValue(uniqueError());

    const result = await updateResource({
      resourceId: "res-1",
      name: "Duplicate",
      category: "FOOD",
      unit: "boxes",
      description: "",
      sku: "",
      isActive: true,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("already exists");
  });

  it("handles unexpected database errors safely", async () => {
    mocks.findFirst.mockResolvedValue(existingResource);
    mocks.updateMany.mockRejectedValue(new Error("boom"));

    const result = await updateResource({
      resourceId: "res-1",
      name: "New name",
      category: "DRINKING_WATER",
      unit: "liters",
      description: "",
      sku: "",
      isActive: true,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("Something went wrong");
  });

  it("updates location fields successfully", async () => {
    mocks.findFirst.mockResolvedValue(existingResource);
    mocks.updateMany.mockResolvedValue({ count: 1 });

    const result = await updateResource({
      resourceId: "res-1",
      name: "Old name",
      category: "FOOD",
      unit: "boxes",
      description: null,
      sku: null,
      locationName: "Warehouse B",
      address: "456 Oak Ave",
      latitude: 40.7,
      longitude: -74.0,
      isActive: true,
    });

    expect(result.success).toBe(true);

    const updateData = mocks.updateMany.mock.calls[0][0].data;
    expect(updateData.locationName).toBe("Warehouse B");
    expect(updateData.address).toBe("456 Oak Ave");
    expect(updateData.latitude).toBe(40.7);
    expect(updateData.longitude).toBe(-74.0);

    const audit = mocks.auditCreate.mock.calls[0][0].data;
    expect(audit.before.locationName).toBeNull();
    expect(audit.before.address).toBeNull();
    expect(audit.after.locationName).toBe("Warehouse B");
    expect(audit.after.address).toBe("456 Oak Ave");
  });

  it("updates only location fields without being treated as unchanged", async () => {
    mocks.findFirst.mockResolvedValue(existingResource);
    mocks.updateMany.mockResolvedValue({ count: 1 });

    const result = await updateResource({
      resourceId: "res-1",
      name: "Old name",
      category: "FOOD",
      unit: "boxes",
      description: null,
      sku: null,
      locationName: "Warehouse C",
      address: "789 Pine Rd",
      latitude: null,
      longitude: null,
      isActive: true,
    });

    expect(result.success).toBe(true);
    expect(mocks.updateMany).toHaveBeenCalled();
  });

  it("handles clearing optional location fields", async () => {
    mocks.findFirst.mockResolvedValue({
      ...existingResource,
      locationName: "Old Location",
      address: "Old Address",
      latitude: 10.0,
      longitude: 20.0,
    });
    mocks.updateMany.mockResolvedValue({ count: 1 });

    const result = await updateResource({
      resourceId: "res-1",
      name: "Old name",
      category: "FOOD",
      unit: "boxes",
      description: null,
      sku: null,
      locationName: null,
      address: null,
      latitude: null,
      longitude: null,
      isActive: true,
    });

    expect(result.success).toBe(true);

    const updateData = mocks.updateMany.mock.calls[0][0].data;
    expect(updateData.locationName).toBeNull();
    expect(updateData.address).toBeNull();
    expect(updateData.latitude).toBeNull();
    expect(updateData.longitude).toBeNull();
  });

  it("includes location values in audit before/after data", async () => {
    mocks.findFirst.mockResolvedValue({
      ...existingResource,
      locationName: "Old Loc",
      address: "Old Addr",
      latitude: 1.0,
      longitude: 2.0,
    });
    mocks.updateMany.mockResolvedValue({ count: 1 });

    await updateResource({
      resourceId: "res-1",
      name: "Old name",
      category: "FOOD",
      unit: "boxes",
      description: null,
      sku: null,
      locationName: "New Loc",
      address: "New Addr",
      latitude: 3.0,
      longitude: 4.0,
      isActive: true,
    });

    const audit = mocks.auditCreate.mock.calls[0][0].data;
    expect(audit.before.locationName).toBe("Old Loc");
    expect(audit.before.address).toBe("Old Addr");
    expect(audit.before.latitude).toBe(1.0);
    expect(audit.before.longitude).toBe(2.0);
    expect(audit.after.locationName).toBe("New Loc");
    expect(audit.after.address).toBe("New Addr");
    expect(audit.after.latitude).toBe(3.0);
    expect(audit.after.longitude).toBe(4.0);
  });

  it("preserves optimistic locking with location fields", async () => {
    mocks.findFirst.mockResolvedValue(existingResource);
    mocks.updateMany.mockResolvedValue({ count: 0 });

    const result = await updateResource({
      resourceId: "res-1",
      name: "Old name",
      category: "FOOD",
      unit: "boxes",
      description: null,
      sku: null,
      locationName: "Warehouse B",
      address: "456 Oak Ave",
      latitude: 40.7,
      longitude: -74.0,
      isActive: true,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("another request");
    expect(mocks.updateMany.mock.calls[0][0].where.updatedAt).toEqual(
      existingResource.updatedAt,
    );
  });

  it("preserves tenant isolation with location fields", async () => {
    mocks.findFirst.mockResolvedValue(existingResource);
    mocks.updateMany.mockResolvedValue({ count: 1 });

    await updateResource({
      resourceId: "res-1",
      organizationId: "org-evil",
      name: "Old name",
      category: "FOOD",
      unit: "boxes",
      description: null,
      sku: null,
      locationName: "Warehouse B",
      address: "456 Oak Ave",
      latitude: 40.7,
      longitude: -74.0,
      isActive: true,
    });

    expect(mocks.findFirst.mock.calls[0][0].where.organizationId).toBe("org-1");
    expect(mocks.updateMany.mock.calls[0][0].where.organizationId).toBe(
      "org-1",
    );
  });
});

describe("updateResourceStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOrganizationPermission.mockResolvedValue(context);
    mocks.auditCreate.mockResolvedValue({});
    installTx();
  });

  it("deactivates a resource and audits the change", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "res-1",
      isActive: true,
      updatedAt: existingResource.updatedAt,
    });
    mocks.updateMany.mockResolvedValue({ count: 1 });

    const result = await updateResourceStatus({
      resourceId: "res-1",
      isActive: false,
    });

    expect(result.success).toBe(true);

    const audit = mocks.auditCreate.mock.calls[0][0].data;
    expect(audit.action).toBe("RESOURCE_STATUS_UPDATED");
    expect(audit.before.isActive).toBe(true);
    expect(audit.after.isActive).toBe(false);
  });

  it("reactivates a resource", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "res-1",
      isActive: false,
      updatedAt: existingResource.updatedAt,
    });
    mocks.updateMany.mockResolvedValue({ count: 1 });

    const result = await updateResourceStatus({
      resourceId: "res-1",
      isActive: true,
    });

    expect(result.success).toBe(true);
    expect(mocks.updateMany.mock.calls[0][0].data).toEqual({ isActive: true });
  });

  it("does not overwrite other resource fields", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "res-1",
      isActive: true,
      updatedAt: existingResource.updatedAt,
    });
    mocks.updateMany.mockResolvedValue({ count: 1 });

    await updateResourceStatus({ resourceId: "res-1", isActive: false });

    expect(Object.keys(mocks.updateMany.mock.calls[0][0].data)).toEqual([
      "isActive",
    ]);
  });

  it("does not write or audit a no-op status change", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "res-1",
      isActive: true,
      updatedAt: existingResource.updatedAt,
    });

    const result = await updateResourceStatus({
      resourceId: "res-1",
      isActive: true,
    });

    expect(result.success).toBe(true);
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("returns a safe not-found result for another organization", async () => {
    mocks.findFirst.mockResolvedValue(null);

    const result = await updateResourceStatus({
      resourceId: "res-1",
      isActive: false,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("not found or access denied");
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("detects concurrent status updates", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "res-1",
      isActive: true,
      updatedAt: existingResource.updatedAt,
    });
    mocks.updateMany.mockResolvedValue({ count: 0 });

    const result = await updateResourceStatus({
      resourceId: "res-1",
      isActive: false,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("another request");
  });

  it("denies MEMBER from changing status", async () => {
    mocks.requireOrganizationPermission.mockRejectedValue(
      new Error("REDIRECT:/dashboard"),
    );

    await expect(
      updateResourceStatus({ resourceId: "res-1", isActive: false }),
    ).rejects.toThrow("REDIRECT:/dashboard");
  });
});