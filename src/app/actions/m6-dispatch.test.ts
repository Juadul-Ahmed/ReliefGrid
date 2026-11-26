import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";

const mocks = vi.hoisted(() => ({
  requireOrganizationPermission: vi.fn(),
  transaction: vi.fn(),
  raiFindFirst: vi.fn(),
  raiUpdate: vi.fn(),
  allocationUpdate: vi.fn(),
  batchFindMany: vi.fn(),
  batchUpdate: vi.fn(),
  batchReservationFindMany: vi.fn(),
  batchReservationUpdate: vi.fn(),
  inventoryUpdate: vi.fn(),
  stockMovementCreate: vi.fn(),
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
    inventoryBatch: {
      findMany: mocks.batchFindMany,
      update: mocks.batchUpdate,
    },
    inventoryBatchReservation: {
      findMany: mocks.batchReservationFindMany,
      update: mocks.batchReservationUpdate,
    },
    inventoryItem: { update: mocks.inventoryUpdate },
    stockMovement: { create: mocks.stockMovementCreate },
  },
}));

import { dispatchAllocationItem } from "./m6-dispatch";

const context = {
  organizationId: "org-1",
  session: { user: { id: "user-1", name: "Provider Admin" } },
};

function setup(overrides: {
  rai?: Record<string, unknown> | null;
  batches?: Record<string, unknown>[];
  reservations?: Record<string, unknown>[];
} = {}) {
  mocks.transaction.mockImplementation(async (cb: (tx: unknown) => unknown) =>
    cb({
      resourceAllocationItem: { findFirst: mocks.raiFindFirst, update: mocks.raiUpdate },
      resourceAllocation: { update: mocks.allocationUpdate },
      inventoryBatch: { findMany: mocks.batchFindMany, update: mocks.batchUpdate },
      inventoryBatchReservation: { 
        findMany: mocks.batchReservationFindMany, 
        update: mocks.batchReservationUpdate,
        fields: { reservedQuantity: "reservedQuantity" },
      },
      inventoryItem: { update: mocks.inventoryUpdate },
      stockMovement: { create: mocks.stockMovementCreate },
    }),
  );

  mocks.raiFindFirst.mockResolvedValue(
    "rai" in overrides ? overrides.rai : {
      id: "rai-1",
      status: "ALLOCATED",
      quantity: new Prisma.Decimal(10),
      dispatchedQuantity: new Prisma.Decimal(0),
      deliveredQuantity: new Prisma.Decimal(0),
      inventoryItemId: "inv-1",
      resourceAllocationId: "alloc-1",
      inventoryItem: {
        id: "inv-1",
        onHand: new Prisma.Decimal(20),
        reserved: new Prisma.Decimal(10),
      },
    },
  );

  mocks.batchFindMany.mockResolvedValue(
    overrides.batches ?? [
      {
        id: "batch-opening",
        batchNumber: "OPENING",
        onHand: new Prisma.Decimal(20),
        reserved: new Prisma.Decimal(10),
        inventoryItemId: "inv-1",
      },
    ],
  );

  mocks.batchReservationFindMany.mockResolvedValue(
    overrides.reservations ?? [
      {
        id: "res-1",
        inventoryBatchId: "batch-opening",
        reservedQuantity: new Prisma.Decimal(10),
        releasedQuantity: new Prisma.Decimal(0),
        consumedQuantity: new Prisma.Decimal(0),
      },
    ],
  );

  mocks.raiUpdate.mockResolvedValue({});
  mocks.allocationUpdate.mockResolvedValue({});
  mocks.batchUpdate.mockResolvedValue({});
  mocks.batchReservationUpdate.mockResolvedValue({});
  mocks.inventoryUpdate.mockResolvedValue({});
  mocks.stockMovementCreate.mockResolvedValue({});
}

describe("dispatchAllocationItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOrganizationPermission.mockResolvedValue(context);
  });

  it("dispatches an ALLOCATED item and updates dispatchedQuantity", async () => {
    setup();

    const result = await dispatchAllocationItem({
      resourceAllocationItemId: "rai-1",
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe("Dispatched successfully.");

    // Check allocation item updated to DISPATCHED with full quantity dispatched
    expect(mocks.raiUpdate).toHaveBeenCalledWith({
      where: { id: "rai-1" },
      data: { dispatchedQuantity: new Prisma.Decimal(10), status: "DISPATCHED" },
    });

    // Check parent allocation updated
    expect(mocks.allocationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "alloc-1" },
        data: expect.objectContaining({ status: "DISPATCHED" }),
      }),
    );
  });

  it("updates dispatchedQuantity to full quantity (not partial)", async () => {
    setup({
      rai: {
        id: "rai-1",
        status: "ALLOCATED",
        quantity: new Prisma.Decimal(10),
        dispatchedQuantity: new Prisma.Decimal(0),
        deliveredQuantity: new Prisma.Decimal(0),
        inventoryItemId: "inv-1",
        resourceAllocationId: "alloc-1",
        inventoryItem: {
          id: "inv-1",
          onHand: new Prisma.Decimal(20),
          reserved: new Prisma.Decimal(10),
        },
      },
    });

    await dispatchAllocationItem({ resourceAllocationItemId: "rai-1" });

    // The current implementation dispatches the full remaining quantity
    expect(mocks.raiUpdate).toHaveBeenCalledWith({
      where: { id: "rai-1" },
      data: { dispatchedQuantity: new Prisma.Decimal(10), status: "DISPATCHED" },
    });
  });

  it("rejects dispatch when item is not in ALLOCATED state", async () => {
    setup({
      rai: {
        id: "rai-1",
        status: "DISPATCHED",
        quantity: new Prisma.Decimal(10),
        dispatchedQuantity: new Prisma.Decimal(10),
        deliveredQuantity: new Prisma.Decimal(0),
        inventoryItemId: "inv-1",
        resourceAllocationId: "alloc-1",
        inventoryItem: { id: "inv-1", onHand: new Prisma.Decimal(20), reserved: new Prisma.Decimal(0) },
      },
    });

    const result = await dispatchAllocationItem({ resourceAllocationItemId: "rai-1" });

    expect(result.success).toBe(false);
    expect(result.message).toContain("not in allocated state");
    expect(mocks.raiUpdate).not.toHaveBeenCalled();
  });

  it("rejects when allocation item not found in organization", async () => {
    setup({ rai: null });

    const result = await dispatchAllocationItem({ resourceAllocationItemId: "rai-missing" });

    expect(result.success).toBe(false);
    expect(result.message).toContain("Allocation item not found");
  });

  it("rejects when no inventory linked", async () => {
    setup({
      rai: {
        id: "rai-1",
        status: "ALLOCATED",
        quantity: new Prisma.Decimal(10),
        dispatchedQuantity: new Prisma.Decimal(0),
        inventoryItemId: null,
        resourceAllocationId: "alloc-1",
        inventoryItem: null,
      },
    });

    const result = await dispatchAllocationItem({ resourceAllocationItemId: "rai-1" });

    expect(result.success).toBe(false);
    expect(result.message).toContain("No inventory linked");
  });

  it("rejects when already fully dispatched", async () => {
    setup({
      rai: {
        id: "rai-1",
        status: "ALLOCATED",
        quantity: new Prisma.Decimal(10),
        dispatchedQuantity: new Prisma.Decimal(10),
        inventoryItemId: "inv-1",
        resourceAllocationId: "alloc-1",
        inventoryItem: { id: "inv-1", onHand: new Prisma.Decimal(20), reserved: new Prisma.Decimal(0) },
      },
    });

    const result = await dispatchAllocationItem({ resourceAllocationItemId: "rai-1" });

    expect(result.success).toBe(false);
    expect(result.message).toContain("already been fully dispatched");
  });

  it("rejects when opening batch is missing", async () => {
    setup({ batches: [] });

    const result = await dispatchAllocationItem({ resourceAllocationItemId: "rai-1" });

    expect(result.success).toBe(false);
    expect(result.message).toContain("Opening batch missing");
  });

  it("consumes batch reservations and updates batch onHand and reserved", async () => {
    setup();

    await dispatchAllocationItem({ resourceAllocationItemId: "rai-1" });

    // Should consume from batch reservation
    expect(mocks.batchReservationUpdate).toHaveBeenCalledWith({
      where: { id: "res-1" },
      data: { consumedQuantity: new Prisma.Decimal(10) },
    });

    // Should update batch onHand and reserved
    expect(mocks.batchUpdate).toHaveBeenCalledWith({
      where: { id: "batch-opening" },
      data: { onHand: { decrement: 10 }, reserved: { decrement: 10 } },
    });
  });

  it("updates inventory reserved quantity", async () => {
    setup();

    await dispatchAllocationItem({ resourceAllocationItemId: "rai-1" });

    expect(mocks.inventoryUpdate).toHaveBeenCalledWith({
      where: { id: "inv-1" },
      data: { reserved: new Prisma.Decimal(0) }, // 10 - 10 = 0
    });
  });

  it("creates OUT stock movement", async () => {
    setup();

    await dispatchAllocationItem({ resourceAllocationItemId: "rai-1" });

    expect(mocks.stockMovementCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "OUT",
          quantity: new Prisma.Decimal(10),
          reason: "Dispatch",
        }),
      }),
    );
  });

  it("supports partial dispatch then completes the remaining quantity", async () => {
    const rai = {
      id: "rai-1",
      status: "ALLOCATED",
      quantity: new Prisma.Decimal(10),
      dispatchedQuantity: new Prisma.Decimal(0),
      deliveredQuantity: new Prisma.Decimal(0),
      inventoryItemId: "inv-1",
      resourceAllocationId: "alloc-1",
      inventoryItem: { id: "inv-1", onHand: new Prisma.Decimal(20), reserved: new Prisma.Decimal(10) },
    };
    setup({ rai });

    // First dispatch: 4 of 10 units (partial).
    const result1 = await dispatchAllocationItem({ resourceAllocationItemId: "rai-1", quantity: "4" });
    expect(result1.success).toBe(true);
    expect(result1.message).toBe("Dispatched successfully.");

    expect(mocks.raiUpdate).toHaveBeenLastCalledWith({
      where: { id: "rai-1" },
      data: { dispatchedQuantity: new Prisma.Decimal(4), status: "PARTIALLY_DISPATCHED" },
    });

    // 6 units remain: inventory reserved 10 - 4 = 6.
    expect(mocks.inventoryUpdate).toHaveBeenLastCalledWith({
      where: { id: "inv-1" },
      data: { reserved: new Prisma.Decimal(6) },
    });

    expect(mocks.stockMovementCreate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "OUT", quantity: new Prisma.Decimal(4) }),
      }),
    );

    expect(mocks.batchReservationUpdate).toHaveBeenLastCalledWith({
      where: { id: "res-1" },
      data: { consumedQuantity: new Prisma.Decimal(4) },
    });

    // The allocation header is not marked dispatched while partially dispatched.
    expect(mocks.allocationUpdate).not.toHaveBeenCalled();

    // Second dispatch: the remaining 6 units.
    mocks.raiFindFirst.mockResolvedValueOnce({
      ...rai,
      dispatchedQuantity: new Prisma.Decimal(4),
      inventoryItem: { id: "inv-1", onHand: new Prisma.Decimal(20), reserved: new Prisma.Decimal(6) },
    });

    const result2 = await dispatchAllocationItem({ resourceAllocationItemId: "rai-1", quantity: "6" });
    expect(result2.success).toBe(true);

    expect(mocks.raiUpdate).toHaveBeenLastCalledWith({
      where: { id: "rai-1" },
      data: { dispatchedQuantity: new Prisma.Decimal(10), status: "DISPATCHED" },
    });

    expect(mocks.allocationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "alloc-1" },
        data: expect.objectContaining({ status: "DISPATCHED" }),
      }),
    );

    // Final inventory reserved returns to 0 (6 - 6).
    expect(mocks.inventoryUpdate).toHaveBeenLastCalledWith({
      where: { id: "inv-1" },
      data: { reserved: new Prisma.Decimal(0) },
    });
  });
});