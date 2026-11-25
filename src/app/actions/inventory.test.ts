import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";

const mocks = vi.hoisted(() => ({
  requireOrganizationPermission: vi.fn(),
  transaction: vi.fn(),
  resourceFindFirst: vi.fn(),
  invFindFirst: vi.fn(),
  invCreate: vi.fn(),
  invUpdate: vi.fn(),
  movementCreate: vi.fn(),
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
    resource: { findFirst: mocks.resourceFindFirst },
    inventoryItem: {
      findFirst: mocks.invFindFirst,
      create: mocks.invCreate,
      updateMany: mocks.invUpdate,
    },
    stockMovement: { create: mocks.movementCreate },
    auditLog: { create: mocks.auditCreate },
  },
}));

import {
  initializeInventory,
  adjustInventory,
  updateInventoryThreshold,
} from "./inventory";

const context = {
  organizationId: "org-1",
  session: { user: { id: "user-1", name: "Owner One" } },
};

function installTx() {
  mocks.transaction.mockImplementation(async (cb: (tx: unknown) => unknown) =>
    cb({
      inventoryItem: { create: mocks.invCreate, updateMany: mocks.invUpdate },
      stockMovement: { create: mocks.movementCreate },
      auditLog: { create: mocks.auditCreate },
    }),
  );
}

function uniqueError() {
  return new Prisma.PrismaClientKnownRequestError(
    "Unique constraint failed on the fields: (`organizationId`, `resourceId`)",
    {
      code: "P2002",
      clientVersion: "7.10.1",
      meta: { target: ["organizationId", "resourceId"] },
    },
  );
}

const inventoryItem = {
  id: "inv-1",
  resourceId: "res-1",
  onHand: new Prisma.Decimal(10),
  reserved: new Prisma.Decimal(0),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

describe("initializeInventory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOrganizationPermission.mockResolvedValue(context);
    mocks.auditCreate.mockResolvedValue({});
    mocks.movementCreate.mockResolvedValue({});
    installTx();
  });

  it("initializes positive stock with an IN movement and audit", async () => {
    mocks.resourceFindFirst.mockResolvedValue({
      id: "res-1",
      name: "Water",
      isActive: true,
    });
    mocks.invFindFirst.mockResolvedValue(null);
    mocks.invCreate.mockResolvedValue({ id: "inv-1" });

    const result = await initializeInventory({
      resourceId: "res-1",
      onHand: 5,
      reason: "Opening stock",
    });

    expect(result.success).toBe(true);
    expect(mocks.invCreate).toHaveBeenCalledTimes(1);
    expect(mocks.movementCreate).toHaveBeenCalledTimes(1);

    const movement = mocks.movementCreate.mock.calls[0][0].data;
    expect(movement.type).toBe("IN");
    expect(movement.quantity).toBe(5);

    const audit = mocks.auditCreate.mock.calls[0][0].data;
    expect(audit.action).toBe("INVENTORY_INITIALIZED");
    expect(audit.organizationId).toBe("org-1");
  });

  it("initializes zero stock without an IN movement", async () => {
    mocks.resourceFindFirst.mockResolvedValue({
      id: "res-1",
      name: "Water",
      isActive: true,
    });
    mocks.invFindFirst.mockResolvedValue(null);
    mocks.invCreate.mockResolvedValue({ id: "inv-1" });

    const result = await initializeInventory({
      resourceId: "res-1",
      onHand: 0,
      reason: "Empty starting point",
    });

    expect(result.success).toBe(true);
    expect(mocks.invCreate).toHaveBeenCalledTimes(1);
    expect(mocks.movementCreate).not.toHaveBeenCalled();
  });

  it("rejects duplicate initialization", async () => {
    mocks.resourceFindFirst.mockResolvedValue({
      id: "res-1",
      name: "Water",
      isActive: true,
    });
    mocks.invFindFirst.mockResolvedValue({ id: "inv-1" });

    const result = await initializeInventory({
      resourceId: "res-1",
      onHand: 5,
      reason: "Opening stock",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("already been initialized");
    expect(mocks.invCreate).not.toHaveBeenCalled();
  });

  it("rejects inactive resources", async () => {
    mocks.resourceFindFirst.mockResolvedValue({
      id: "res-1",
      name: "Water",
      isActive: false,
    });

    const result = await initializeInventory({
      resourceId: "res-1",
      onHand: 5,
      reason: "Opening stock",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("inactive");
    expect(mocks.invCreate).not.toHaveBeenCalled();
  });

  it("rejects negative initial quantity", async () => {
    const result = await initializeInventory({
      resourceId: "res-1",
      onHand: -1,
      reason: "Opening stock",
    });

    expect(result.success).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects more than three decimal places", async () => {
    const result = await initializeInventory({
      resourceId: "res-1",
      onHand: 1.2345,
      reason: "Opening stock",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing reason", async () => {
    const result = await initializeInventory({
      resourceId: "res-1",
      onHand: 5,
      reason: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("denies MEMBER", async () => {
    mocks.requireOrganizationPermission.mockRejectedValue(
      new Error("REDIRECT:/dashboard"),
    );

    await expect(
      initializeInventory({ resourceId: "res-1", onHand: 5, reason: "x" }),
    ).rejects.toThrow("REDIRECT:/dashboard");
  });

  it("rejects a resource from another organization", async () => {
    mocks.resourceFindFirst.mockResolvedValue(null);

    const result = await initializeInventory({
      resourceId: "res-1",
      onHand: 5,
      reason: "Opening stock",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("not found or access denied");
  });

  it("handles duplicate initialization at the database level", async () => {
    mocks.resourceFindFirst.mockResolvedValue({
      id: "res-1",
      name: "Water",
      isActive: true,
    });
    mocks.invFindFirst.mockResolvedValue(null);
    mocks.invCreate.mockRejectedValue(uniqueError());

    const result = await initializeInventory({
      resourceId: "res-1",
      onHand: 5,
      reason: "Opening stock",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("already been initialized");
  });
});

describe("adjustInventory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOrganizationPermission.mockResolvedValue(context);
    mocks.auditCreate.mockResolvedValue({});
    mocks.movementCreate.mockResolvedValue({});
    installTx();
  });

  it("applies a positive adjustment atomically", async () => {
    mocks.invFindFirst.mockResolvedValue(inventoryItem);
    mocks.invUpdate.mockResolvedValue({ count: 1 });

    const result = await adjustInventory({
      inventoryItemId: "inv-1",
      quantity: 5,
      reason: "Restock",
    });

    expect(result.success).toBe(true);
    expect(mocks.invUpdate).toHaveBeenCalledTimes(1);
    expect(mocks.movementCreate).toHaveBeenCalledTimes(1);
    expect(mocks.auditCreate).toHaveBeenCalledTimes(1);

    const data = mocks.invUpdate.mock.calls[0][0].data;
    expect(data.onHand.toNumber()).toBe(15);

    const movement = mocks.movementCreate.mock.calls[0][0].data;
    expect(movement.type).toBe("ADJUST");
    expect(movement.quantity.toNumber()).toBe(5);

    const audit = mocks.auditCreate.mock.calls[0][0].data;
    expect(audit.action).toBe("INVENTORY_ADJUSTED");
    expect(audit.before.onHand).toBe(10);
    expect(audit.after.onHand).toBe(15);
  });

  it("applies a negative adjustment", async () => {
    mocks.invFindFirst.mockResolvedValue(inventoryItem);
    mocks.invUpdate.mockResolvedValue({ count: 1 });

    const result = await adjustInventory({
      inventoryItemId: "inv-1",
      quantity: -3,
      reason: "Damage",
    });

    expect(result.success).toBe(true);
    expect(
      mocks.invUpdate.mock.calls[0][0].data.onHand.toNumber(),
    ).toBe(7);
  });

  it("rejects an adjustment below reserved", async () => {
    mocks.invFindFirst.mockResolvedValue({
      ...inventoryItem,
      onHand: new Prisma.Decimal(5),
      reserved: new Prisma.Decimal(5),
    });

    const result = await adjustInventory({
      inventoryItemId: "inv-1",
      quantity: -1,
      reason: "Remove",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("less than the reserved");
    expect(mocks.invUpdate).not.toHaveBeenCalled();
  });

  it("rejects an adjustment that makes on-hand negative", async () => {
    mocks.invFindFirst.mockResolvedValue({
      ...inventoryItem,
      onHand: new Prisma.Decimal(5),
      reserved: new Prisma.Decimal(0),
    });

    const result = await adjustInventory({
      inventoryItemId: "inv-1",
      quantity: -10,
      reason: "Remove",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("negative");
  });

  it("rejects more than three decimal places", async () => {
    const result = await adjustInventory({
      inventoryItemId: "inv-1",
      quantity: 1.2345,
      reason: "Restock",
    });

    expect(result.success).toBe(false);
    expect(mocks.invFindFirst).not.toHaveBeenCalled();
  });

  it("rejects zero adjustment", async () => {
    const result = await adjustInventory({
      inventoryItemId: "inv-1",
      quantity: 0,
      reason: "Restock",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing reason", async () => {
    const result = await adjustInventory({
      inventoryItemId: "inv-1",
      quantity: 5,
      reason: "",
    });

    expect(result.success).toBe(false);
  });

  it("denies MEMBER", async () => {
    mocks.requireOrganizationPermission.mockRejectedValue(
      new Error("REDIRECT:/dashboard"),
    );

    await expect(
      adjustInventory({ inventoryItemId: "inv-1", quantity: 5, reason: "x" }),
    ).rejects.toThrow("REDIRECT:/dashboard");
  });

  it("rejects inventory from another organization", async () => {
    mocks.invFindFirst.mockResolvedValue(null);

    const result = await adjustInventory({
      inventoryItemId: "inv-1",
      quantity: 5,
      reason: "Restock",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("not found or access denied");
  });

  it("detects concurrent updates", async () => {
    mocks.invFindFirst.mockResolvedValue(inventoryItem);
    mocks.invUpdate.mockResolvedValue({ count: 0 });

    const result = await adjustInventory({
      inventoryItemId: "inv-1",
      quantity: 5,
      reason: "Restock",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("another request");
  });

  it("handles unexpected database errors safely", async () => {
    mocks.invFindFirst.mockResolvedValue(inventoryItem);
    mocks.invUpdate.mockRejectedValue(new Error("boom"));

    const result = await adjustInventory({
      inventoryItemId: "inv-1",
      quantity: 5,
      reason: "Restock",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("Something went wrong");
  });
});

describe("updateInventoryThreshold", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOrganizationPermission.mockResolvedValue(context);
    mocks.auditCreate.mockResolvedValue({});
    installTx();
  });

  it("sets a threshold and writes an audit log", async () => {
    mocks.invFindFirst.mockResolvedValue({
      id: "inv-1",
      resourceId: "res-1",
      lowStockThreshold: null,
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    });
    mocks.invUpdate.mockResolvedValue({ count: 1 });

    const result = await updateInventoryThreshold({
      inventoryItemId: "inv-1",
      lowStockThreshold: 12.5,
    });

    expect(result.success).toBe(true);
    expect(mocks.invUpdate.mock.calls[0][0].data.lowStockThreshold).toEqual(
      new Prisma.Decimal(12.5),
    );
    expect(mocks.auditCreate).toHaveBeenCalledTimes(1);
  });

  it("clears the threshold when given an empty value", async () => {
    mocks.invFindFirst.mockResolvedValue({
      id: "inv-1",
      resourceId: "res-1",
      lowStockThreshold: new Prisma.Decimal(5),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    });
    mocks.invUpdate.mockResolvedValue({ count: 1 });

    const result = await updateInventoryThreshold({
      inventoryItemId: "inv-1",
      lowStockThreshold: "",
    });

    expect(result.success).toBe(true);
    expect(mocks.invUpdate.mock.calls[0][0].data.lowStockThreshold).toBeNull();
  });

  it("rejects when the value is unchanged", async () => {
    mocks.invFindFirst.mockResolvedValue({
      id: "inv-1",
      resourceId: "res-1",
      lowStockThreshold: new Prisma.Decimal(5),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    });

    const result = await updateInventoryThreshold({
      inventoryItemId: "inv-1",
      lowStockThreshold: 5,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("already set");
    expect(mocks.invUpdate).not.toHaveBeenCalled();
  });

  it("rejects inventory from another organization", async () => {
    mocks.invFindFirst.mockResolvedValue(null);

    const result = await updateInventoryThreshold({
      inventoryItemId: "inv-1",
      lowStockThreshold: 5,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("not found or access denied");
  });

  it("detects concurrent updates", async () => {
    mocks.invFindFirst.mockResolvedValue({
      id: "inv-1",
      resourceId: "res-1",
      lowStockThreshold: null,
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    });
    mocks.invUpdate.mockResolvedValue({ count: 0 });

    const result = await updateInventoryThreshold({
      inventoryItemId: "inv-1",
      lowStockThreshold: 5,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("another request");
  });

  it("denies MEMBER", async () => {
    mocks.requireOrganizationPermission.mockRejectedValue(
      new Error("REDIRECT:/dashboard"),
    );

    await expect(
      updateInventoryThreshold({ inventoryItemId: "inv-1", lowStockThreshold: 5 }),
    ).rejects.toThrow("REDIRECT:/dashboard");
  });
});