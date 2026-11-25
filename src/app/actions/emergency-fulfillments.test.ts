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
    auditLog: { create: mocks.auditCreate },
  };

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
});