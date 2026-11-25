import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";

const mocks = vi.hoisted(() => ({
  requireOrganizationPermission: vi.fn(),
  transaction: vi.fn(),
  findFirst: vi.fn(),
  aggregate: vi.fn(),
  create: vi.fn(),
  auditCreate: vi.fn(),
  revalidatePath: vi.fn(),
  inventoryFindFirst: vi.fn(),
  inventoryUpdateMany: vi.fn(),
  stockMovementCreate: vi.fn(),
}));

vi.mock("@/lib/permissions/require-organization-permission", () => ({
  requireOrganizationPermission: mocks.requireOrganizationPermission,
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    emergencyRequest: { findFirst: mocks.findFirst },
    resourceAllocation: {
      aggregate: mocks.aggregate,
      create: mocks.create,
    },
    inventoryItem: {
      findFirst: mocks.inventoryFindFirst,
      updateMany: mocks.inventoryUpdateMany,
    },
    stockMovement: { create: mocks.stockMovementCreate },
    auditLog: { create: mocks.auditCreate },
  },
}));

import { allocateEmergencyResources } from "./emergency-fulfillments";

const context = {
  organizationId: "org-1",
  session: { user: { id: "user-1", name: "Owner One" } },
};

function setup(overrides: {
  request?: Record<string, unknown>;
  committed?: number;
  createResult?: Record<string, unknown>;
}) {
  const tx = {
    emergencyRequest: { findFirst: mocks.findFirst },
    resourceAllocation: {
      aggregate: mocks.aggregate,
      create: mocks.create,
    },
    inventoryItem: {
      findFirst: mocks.inventoryFindFirst,
      updateMany: mocks.inventoryUpdateMany,
    },
    stockMovement: { create: mocks.stockMovementCreate },
    auditLog: { create: mocks.auditCreate },
  };

  mocks.inventoryUpdateMany.mockResolvedValue({ count: 1 });
  mocks.stockMovementCreate.mockResolvedValue({});

  mocks.transaction.mockImplementation(async (cb: (tx: unknown) => unknown) =>
    cb(tx),
  );

  mocks.findFirst.mockResolvedValue(
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
      ],
    },
  );

  mocks.aggregate.mockResolvedValue({
    _sum: { quantity: new Prisma.Decimal(overrides.committed ?? 0) },
  });

  mocks.create.mockResolvedValue(
    overrides.createResult ?? {
      id: "alloc-1",
      quantity: new Prisma.Decimal(3),
      status: "ALLOCATED",
    },
  );

  mocks.auditCreate.mockResolvedValue({});
}

describe("allocateEmergencyResources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOrganizationPermission.mockResolvedValue(context);
  });

  it("creates an allocation for a verified request within remaining quantity", async () => {
    setup({ committed: 0 });

    const result = await allocateEmergencyResources({
      requestId: "req-1",
      itemId: "item-1",
      quantity: 3,
      notes: "Pickup at 5pm",
    });

    expect(result).toEqual({
      success: true,
      message: "Resources allocated successfully.",
      allocationId: "alloc-1",
    });
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.auditCreate).toHaveBeenCalledTimes(1);
  });

  it("rejects allocating to your own organization's request", async () => {
    setup({
      request: {
        id: "req-1",
        requestNumber: "ER-1",
        title: "Water",
        organizationId: "org-1",
        status: "VERIFIED",
        items: [
          {
            id: "item-1",
            name: "Bottled water",
            unit: "liters",
            quantity: new Prisma.Decimal(10),
          },
        ],
      },
    });

    const result = await allocateEmergencyResources({
      requestId: "req-1",
      itemId: "item-1",
      quantity: 3,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("cannot allocate resources to your own");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects allocations to a request that is not VERIFIED", async () => {
    setup({
      request: {
        id: "req-1",
        requestNumber: "ER-1",
        title: "Water",
        organizationId: "org-2",
        status: "SUBMITTED",
        items: [
          {
            id: "item-1",
            name: "Bottled water",
            unit: "liters",
            quantity: new Prisma.Decimal(10),
          },
        ],
      },
    });

    const result = await allocateEmergencyResources({
      requestId: "req-1",
      itemId: "item-1",
      quantity: 3,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("must be verified");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects quantities that exceed the remaining amount", async () => {
    setup({ committed: 8 });

    const result = await allocateEmergencyResources({
      requestId: "req-1",
      itemId: "item-1",
      quantity: 5,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("exceeds the remaining quantity");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects allocation when the item is already fully allocated", async () => {
    setup({ committed: 10 });

    const result = await allocateEmergencyResources({
      requestId: "req-1",
      itemId: "item-1",
      quantity: 1,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("already been fully allocated");
  });

  it("treats cancelled allocations as not consuming committed quantity", async () => {
    // 10 requested, 4 committed (cancelled 6 is excluded by the aggregate the
    // action performs at the DB level). A 5 unit allocation must still succeed.
    setup({ committed: 4 });

    const result = await allocateEmergencyResources({
      requestId: "req-1",
      itemId: "item-1",
      quantity: 5,
    });

    expect(result.success).toBe(true);
  });

  it("reserves inventory stock and writes a RESERVE movement when linked", async () => {
    setup({ committed: 0 });
    mocks.inventoryFindFirst.mockResolvedValue({
      id: "inv-1",
      onHand: new Prisma.Decimal(20),
      reserved: new Prisma.Decimal(2),
      isActive: true,
      updatedAt: new Date("2026-01-01"),
      resource: { isActive: true },
    });

    const result = await allocateEmergencyResources({
      requestId: "req-1",
      itemId: "item-1",
      quantity: 3,
      inventoryItemId: "inv-1",
    });

    expect(result.success).toBe(true);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ inventoryItemId: "inv-1" }),
      }),
    );
    expect(mocks.inventoryUpdateMany).toHaveBeenCalledTimes(1);
    const updateArg = mocks.inventoryUpdateMany.mock.calls[0][0];
    expect(updateArg.data.reserved).toEqual(new Prisma.Decimal(5));
    expect(mocks.stockMovementCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "RESERVE",
          quantity: new Prisma.Decimal(3),
          resourceAllocationId: "alloc-1",
        }),
      }),
    );
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

    const result = await allocateEmergencyResources({
      requestId: "req-1",
      itemId: "item-1",
      quantity: 2,
      inventoryItemId: "inv-1",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("not enough available stock");
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.stockMovementCreate).not.toHaveBeenCalled();
  });

  it("rejects allocation when linked inventory is not found in the org", async () => {
    setup({ committed: 0 });
    mocks.inventoryFindFirst.mockResolvedValue(null);

    const result = await allocateEmergencyResources({
      requestId: "req-1",
      itemId: "item-1",
      quantity: 1,
      inventoryItemId: "inv-missing",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("Inventory not found");
  });

  it("rejects allocation when linked inventory belongs to another org", async () => {
    setup({ committed: 0 });
    mocks.inventoryFindFirst.mockResolvedValue(null);

    const result = await allocateEmergencyResources({
      requestId: "req-1",
      itemId: "item-1",
      quantity: 1,
      inventoryItemId: "inv-other-org",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("Inventory not found");
  });
});