import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";

const mocks = vi.hoisted(() => ({
  requireOrganizationPermission: vi.fn(),
  transaction: vi.fn(),
  requestFindFirst: vi.fn(),
  allocationAggregate: vi.fn(),
  allocationCreate: vi.fn(),
  allocationItemCreate: vi.fn(),
  inventoryFindFirst: vi.fn(),
  inventoryUpdateMany: vi.fn(),
  batchFindFirst: vi.fn(),
  batchFindMany: vi.fn(),
  batchUpdate: vi.fn(),
  batchReservationCreate: vi.fn(),
  stockMovementCreate: vi.fn(),
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
    emergencyRequest: { findFirst: mocks.requestFindFirst },
    resourceAllocation: {
      aggregate: mocks.allocationAggregate,
      create: mocks.allocationCreate,
    },
    resourceAllocationItem: { create: mocks.allocationItemCreate },
    inventoryItem: {
      findFirst: mocks.inventoryFindFirst,
      updateMany: mocks.inventoryUpdateMany,
    },
    inventoryBatch: {
      findFirst: mocks.batchFindFirst,
      findMany: mocks.batchFindMany,
      update: mocks.batchUpdate,
    },
    inventoryBatchReservation: { create: mocks.batchReservationCreate },
    stockMovement: { create: mocks.stockMovementCreate },
    auditLog: { create: mocks.auditCreate },
  },
}));

import { allocateMultipleEmergencyResources } from "./m6-allocations";

const context = {
  organizationId: "org-1",
  session: { user: { id: "user-1", name: "Provider Admin" } },
};

function setup(overrides: {
  request?: Record<string, unknown>;
  committed?: number;
  inventory?: Record<string, unknown> | null;
  batches?: Record<string, unknown>[];
  createResult?: Record<string, unknown>;
} = {}) {
  const tx = {
    emergencyRequest: { findFirst: mocks.requestFindFirst },
    resourceAllocation: {
      aggregate: mocks.allocationAggregate,
      create: mocks.allocationCreate,
    },
    resourceAllocationItem: { create: mocks.allocationItemCreate },
    inventoryItem: {
      findFirst: mocks.inventoryFindFirst,
      updateMany: mocks.inventoryUpdateMany,
    },
    inventoryBatch: {
      findFirst: mocks.batchFindFirst,
      findMany: mocks.batchFindMany,
      update: mocks.batchUpdate,
    },
    inventoryBatchReservation: { create: mocks.batchReservationCreate },
    stockMovement: { create: mocks.stockMovementCreate },
    auditLog: { create: mocks.auditCreate },
  };

  mocks.inventoryUpdateMany.mockResolvedValue({ count: 1 });
  mocks.batchFindFirst.mockResolvedValue({
    id: "batch-opening",
    batchNumber: "OPENING",
    onHand: new Prisma.Decimal(20),
    reserved: new Prisma.Decimal(2),
  });
  mocks.batchUpdate.mockResolvedValue({});
  mocks.batchReservationCreate.mockResolvedValue({});
  mocks.stockMovementCreate.mockResolvedValue({});
  mocks.allocationItemCreate.mockResolvedValue({});

  mocks.transaction.mockImplementation(async (cb: (tx: unknown) => unknown) =>
    cb(tx),
  );

  mocks.requestFindFirst.mockResolvedValue(
    overrides.request ?? {
      id: "req-1",
      requestNumber: "ER-1",
      title: "Water",
      organizationId: "org-2",
      status: "VERIFIED",
      items: [
        {
          id: "item-1",
          name: "Bottled water",
          unit: "liters",
          quantity: new Prisma.Decimal(10),
        },
        {
          id: "item-2",
          name: "Water purification tablets",
          unit: "units",
          quantity: new Prisma.Decimal(100),
        },
      ],
    },
  );

  mocks.allocationAggregate.mockResolvedValue({
    _sum: { quantity: new Prisma.Decimal(overrides.committed ?? 0) },
  });

  mocks.allocationCreate.mockResolvedValue(
    overrides.createResult ?? {
      id: "alloc-1",
      quantity: new Prisma.Decimal(3),
      status: "ALLOCATED",
    },
  );

  mocks.inventoryFindFirst.mockResolvedValue(
    overrides.inventory ?? {
      id: "inv-1",
      onHand: new Prisma.Decimal(20),
      reserved: new Prisma.Decimal(2),
      isActive: true,
      updatedAt: new Date("2026-01-01"),
      resource: { isActive: true },
    },
  );

  mocks.batchFindMany.mockResolvedValue(
    overrides.batches ?? [
      {
        id: "batch-opening_inv-1",
        batchNumber: "OPENING",
        onHand: new Prisma.Decimal(20),
        reserved: new Prisma.Decimal(2),
        expiresAt: null,
      },
    ],
  );

  mocks.auditCreate.mockResolvedValue({});
}

describe("allocateMultipleEmergencyResources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOrganizationPermission.mockResolvedValue(context);
  });

  it("allocates multiple items successfully", async () => {
    setup({ committed: 0 });

    const result = await allocateMultipleEmergencyResources({
      requestId: "req-1",
      lines: [
        { itemId: "item-1", quantity: "3", inventoryItemId: "inv-1" },
        { itemId: "item-2", quantity: "10", inventoryItemId: "inv-1" },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.allocationIds).toHaveLength(2);
    }
    expect(mocks.allocationCreate).toHaveBeenCalledTimes(2);
    expect(mocks.allocationItemCreate).toHaveBeenCalledTimes(2);
    expect(mocks.auditCreate).toHaveBeenCalledTimes(2);
  });

  it("rejects allocating to your own organization's request", async () => {
    setup({
      request: {
        id: "req-1",
        requestNumber: "ER-1",
        title: "Water",
        organizationId: "org-1", // same as provider
        status: "VERIFIED",
        items: [{ id: "item-1", name: "Bottled water", unit: "liters", quantity: new Prisma.Decimal(10) }],
      },
    });

    const result = await allocateMultipleEmergencyResources({
      requestId: "req-1",
      lines: [{ itemId: "item-1", quantity: "3", inventoryItemId: "inv-1" }],
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("cannot allocate resources to your own");
    expect(mocks.allocationCreate).not.toHaveBeenCalled();
  });

  it("rejects allocations to a request that is not VERIFIED", async () => {
    setup({
      request: {
        id: "req-1",
        requestNumber: "ER-1",
        title: "Water",
        organizationId: "org-2",
        status: "SUBMITTED",
        items: [{ id: "item-1", name: "Bottled water", unit: "liters", quantity: new Prisma.Decimal(10) }],
      },
    });

    const result = await allocateMultipleEmergencyResources({
      requestId: "req-1",
      lines: [{ itemId: "item-1", quantity: "3", inventoryItemId: "inv-1" }],
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("must be verified");
    expect(mocks.allocationCreate).not.toHaveBeenCalled();
  });

  it("rejects quantities that exceed the remaining amount", async () => {
    setup({ committed: 8 });

    const result = await allocateMultipleEmergencyResources({
      requestId: "req-1",
      lines: [{ itemId: "item-1", quantity: "5", inventoryItemId: "inv-1" }],
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("exceeds the remaining quantity");
    expect(mocks.allocationCreate).not.toHaveBeenCalled();
  });

  it("rejects allocation when the item is already fully allocated", async () => {
    setup({ committed: 10 });

    const result = await allocateMultipleEmergencyResources({
      requestId: "req-1",
      lines: [{ itemId: "item-1", quantity: "1", inventoryItemId: "inv-1" }],
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("already been fully allocated");
  });

  it("rejects allocation when linked inventory has insufficient available stock", async () => {
    setup({ committed: 0 });
    mocks.inventoryFindFirst.mockResolvedValue({
      id: "inv-1",
      onHand: new Prisma.Decimal(5),
      reserved: new Prisma.Decimal(4),
      isActive: true,
      updatedAt: new Date("2026-01-01"),
      resource: { isActive: true },
    });

    const result = await allocateMultipleEmergencyResources({
      requestId: "req-1",
      lines: [{ itemId: "item-1", quantity: "2", inventoryItemId: "inv-1" }],
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("Not enough available stock to reserve");
    expect(mocks.allocationCreate).not.toHaveBeenCalled();
    expect(mocks.stockMovementCreate).not.toHaveBeenCalled();
  });

  it("rejects allocation when linked inventory is not found in the org", async () => {
    setup({ committed: 0 });
    mocks.inventoryFindFirst.mockResolvedValue(null);

    const result = await allocateMultipleEmergencyResources({
      requestId: "req-1",
      lines: [{ itemId: "item-1", quantity: "1", inventoryItemId: "inv-missing" }],
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("Inventory not found");
  });

  it("rejects allocation when linked inventory belongs to another org", async () => {
    setup({ committed: 0 });
    mocks.inventoryFindFirst.mockResolvedValue(null);

    const result = await allocateMultipleEmergencyResources({
      requestId: "req-1",
      lines: [{ itemId: "item-1", quantity: "1", inventoryItemId: "inv-other-org" }],
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("Inventory not found");
  });

  it("rejects invalid quantity (zero or negative)", async () => {
    setup({ committed: 0 });

    const result = await allocateMultipleEmergencyResources({
      requestId: "req-1",
      lines: [{ itemId: "item-1", quantity: "0", inventoryItemId: "inv-1" }],
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("Quantity must be greater than zero");
  });

  it("rejects when inventoryItemId is missing", async () => {
    setup({ committed: 0 });

    const result = await allocateMultipleEmergencyResources({
      requestId: "req-1",
      lines: [{ itemId: "item-1", quantity: "3", inventoryItemId: null }],
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("must link to an inventory item");
  });

  it("creates batch reservations and updates inventory reserved quantity", async () => {
    setup({ committed: 0 });

    const result = await allocateMultipleEmergencyResources({
      requestId: "req-1",
      lines: [{ itemId: "item-1", quantity: "3", inventoryItemId: "inv-1" }],
    });

    expect(result.success).toBe(true);
    expect(mocks.batchUpdate).toHaveBeenCalled();
    expect(mocks.batchReservationCreate).toHaveBeenCalled();
    expect(mocks.inventoryUpdateMany).toHaveBeenCalledTimes(1);
    const updateArg = mocks.inventoryUpdateMany.mock.calls[0][0];
    expect(updateArg.data.reserved).toEqual(new Prisma.Decimal(5)); // 2 + 3
  });

  it("creates RESERVE stock movement for each allocation line", async () => {
    setup({ committed: 0 });

    await allocateMultipleEmergencyResources({
      requestId: "req-1",
      lines: [{ itemId: "item-1", quantity: "3", inventoryItemId: "inv-1" }],
    });

    expect(mocks.stockMovementCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "RESERVE",
          quantity: new Prisma.Decimal(3),
          reason: "Allocation reservation",
        }),
      }),
    );
  });

  it("handles concurrent inventory update", async () => {
    setup({ committed: 0 });
    mocks.inventoryUpdateMany.mockResolvedValue({ count: 0 });

    const result = await allocateMultipleEmergencyResources({
      requestId: "req-1",
      lines: [{ itemId: "item-1", quantity: "3", inventoryItemId: "inv-1" }],
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("updated by another request");
  });

  it("skips inactive inventory or resource", async () => {
    setup({ committed: 0 });
    mocks.inventoryFindFirst.mockResolvedValue({
      id: "inv-1",
      onHand: new Prisma.Decimal(20),
      reserved: new Prisma.Decimal(2),
      isActive: false, // inactive inventory
      updatedAt: new Date("2026-01-01"),
      resource: { isActive: true },
    });

    const result = await allocateMultipleEmergencyResources({
      requestId: "req-1",
      lines: [{ itemId: "item-1", quantity: "3", inventoryItemId: "inv-1" }],
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("inactive");
  });
});