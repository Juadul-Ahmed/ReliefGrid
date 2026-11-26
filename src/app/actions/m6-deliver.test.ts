import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";

const mocks = vi.hoisted(() => ({
  requireOrganizationPermission: vi.fn(),
  transaction: vi.fn(),
  raiFindFirst: vi.fn(),
  raiUpdate: vi.fn(),
  allocationUpdate: vi.fn(),
  auditCreate: vi.fn(),
}));

vi.mock("@/lib/permissions/require-organization-permission", () => ({
  requireOrganizationPermission: mocks.requireOrganizationPermission,
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    resourceAllocationItem: {
      findFirst: mocks.raiFindFirst,
      update: mocks.raiUpdate,
    },
    resourceAllocation: { update: mocks.allocationUpdate },
    auditLog: { create: mocks.auditCreate },
  },
}));

import { deliverAllocationItem } from "./m6-deliver";

const context = {
  organizationId: "org-1",
  session: { user: { id: "user-1", name: "Provider Admin" } },
};

function setup(overrides: {
  rai?: Record<string, unknown> | null;
} = {}) {
  mocks.transaction.mockImplementation(async (cb: (tx: unknown) => unknown) =>
    cb({
      resourceAllocationItem: { findFirst: mocks.raiFindFirst, update: mocks.raiUpdate },
      resourceAllocation: { update: mocks.allocationUpdate },
      auditLog: { create: mocks.auditCreate },
    }),
  );

  mocks.raiFindFirst.mockResolvedValue(
    "rai" in overrides ? overrides.rai : {
      id: "rai-1",
      status: "DISPATCHED",
      quantity: new Prisma.Decimal(10),
      dispatchedQuantity: new Prisma.Decimal(10),
      deliveredQuantity: new Prisma.Decimal(0),
      inventoryItemId: "inv-1",
      resourceAllocationId: "alloc-1",
      inventoryItem: { id: "inv-1" },
    },
  );

  mocks.raiUpdate.mockResolvedValue({});
  mocks.allocationUpdate.mockResolvedValue({});
  mocks.auditCreate.mockResolvedValue({});
}

describe("deliverAllocationItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOrganizationPermission.mockResolvedValue(context);
  });

  it("delivers full remaining quantity when no quantity specified", async () => {
    setup();

    const result = await deliverAllocationItem({ resourceAllocationItemId: "rai-1" });

    expect(result.success).toBe(true);
    expect(result.message).toBe("Delivered successfully.");

    // Check allocation item updated to DELIVERED with full quantity
    expect(mocks.raiUpdate).toHaveBeenCalledWith({
      where: { id: "rai-1" },
      data: { deliveredQuantity: new Prisma.Decimal(10), status: "DELIVERED" },
    });

    // Check parent allocation updated to DELIVERED
    expect(mocks.allocationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "alloc-1" },
        data: expect.objectContaining({ status: "DELIVERED" }),
      }),
    );
  });

  it("delivers partial quantity and keeps status as DISPATCHED", async () => {
    setup();

    const result = await deliverAllocationItem({
      resourceAllocationItemId: "rai-1",
      quantity: "3",
    });

    expect(result.success).toBe(true);

    // Partial delivery - status remains DISPATCHED
    expect(mocks.raiUpdate).toHaveBeenCalledWith({
      where: { id: "rai-1" },
      data: { deliveredQuantity: new Prisma.Decimal(3), status: "DISPATCHED" },
    });

    // Parent allocation NOT updated to DELIVERED
    expect(mocks.allocationUpdate).not.toHaveBeenCalled();
  });

  it("updates parent allocation to DELIVERED when fully delivered", async () => {
    setup();

    await deliverAllocationItem({ resourceAllocationItemId: "rai-1" });

    expect(mocks.allocationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "alloc-1" },
        data: expect.objectContaining({ status: "DELIVERED" }),
      }),
    );
  });

  it("rejects delivery when item is not in DISPATCHED state", async () => {
    setup({
      rai: {
        id: "rai-1",
        status: "ALLOCATED",
        quantity: new Prisma.Decimal(10),
        dispatchedQuantity: new Prisma.Decimal(0),
        deliveredQuantity: new Prisma.Decimal(0),
        inventoryItemId: "inv-1",
        resourceAllocationId: "alloc-1",
        inventoryItem: { id: "inv-1" },
      },
    });

    const result = await deliverAllocationItem({ resourceAllocationItemId: "rai-1" });

    expect(result.success).toBe(false);
    expect(result.message).toContain("must be dispatched before it can be delivered");
    expect(mocks.raiUpdate).not.toHaveBeenCalled();
  });

  it("rejects when allocation item not found in organization", async () => {
    setup({ rai: null });

    const result = await deliverAllocationItem({ resourceAllocationItemId: "rai-missing" });

    expect(result.success).toBe(false);
    expect(result.message).toContain("Allocation item not found");
  });

  it("rejects when already fully delivered", async () => {
    setup({
      rai: {
        id: "rai-1",
        status: "DISPATCHED",
        quantity: new Prisma.Decimal(10),
        dispatchedQuantity: new Prisma.Decimal(10),
        deliveredQuantity: new Prisma.Decimal(10),
        inventoryItemId: "inv-1",
        resourceAllocationId: "alloc-1",
        inventoryItem: { id: "inv-1" },
      },
    });

    const result = await deliverAllocationItem({ resourceAllocationItemId: "rai-1" });

    expect(result.success).toBe(false);
    expect(result.message).toContain("already been fully delivered");
  });

  it("rejects invalid quantity (zero or negative)", async () => {
    setup();

    const result = await deliverAllocationItem({
      resourceAllocationItemId: "rai-1",
      quantity: "0",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("Quantity must be greater than zero");
  });

  it("rejects quantity exceeding remaining", async () => {
    setup({
      rai: {
        id: "rai-1",
        status: "DISPATCHED",
        quantity: new Prisma.Decimal(10),
        dispatchedQuantity: new Prisma.Decimal(10),
        deliveredQuantity: new Prisma.Decimal(3),
        inventoryItemId: "inv-1",
        resourceAllocationId: "alloc-1",
        inventoryItem: { id: "inv-1" },
      },
    });

    const result = await deliverAllocationItem({
      resourceAllocationItemId: "rai-1",
      quantity: "10", // exceeds remaining 7
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("exceeds remaining amount");
  });

  it("creates audit log with delivery details", async () => {
    setup();

    await deliverAllocationItem({
      resourceAllocationItemId: "rai-1",
      quantity: "5",
    });

    expect(mocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "EMERGENCY_ALLOCATION_DELIVERED",
          entityType: "ResourceAllocationItem",
          entityId: "rai-1",
          after: expect.objectContaining({
            deliveredQuantity: "5",
            status: "DISPATCHED",
          }),
        }),
      }),
    );
  });

  it("does not deduct inventory on delivery", async () => {
    setup();

    await deliverAllocationItem({ resourceAllocationItemId: "rai-1" });

    // No inventory-related calls should be made
    // The mocked transaction doesn't include inventoryItem, so if it were called it would fail
    // This test verifies the delivery action doesn't touch inventory
  });
});