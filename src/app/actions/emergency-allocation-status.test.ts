import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireOrganizationPermission: vi.fn(),
  transaction: vi.fn(),
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
    resourceAllocation: {
      findFirst: mocks.findFirst,
      updateMany: mocks.updateMany,
    },
    auditLog: { create: mocks.auditCreate },
  },
}));

import { updateAllocationStatus } from "./emergency-allocation-status";

const context = {
  organizationId: "org-1",
  session: { user: { id: "user-1", name: "Provider Admin" } },
};

function setup(overrides: {
  allocation?: Record<string, unknown> | null;
  updateCount?: number;
}) {
  mocks.transaction.mockImplementation(async (cb: (tx: unknown) => unknown) =>
    cb({
      resourceAllocation: {
        findFirst: mocks.findFirst,
        updateMany: mocks.updateMany,
      },
      auditLog: { create: mocks.auditCreate },
    }),
  );

  mocks.findFirst.mockResolvedValue(
    "allocation" in overrides
      ? overrides.allocation
      : {
          id: "alloc-1",
          status: "ALLOCATED",
          requestItem: { requestId: "req-1" },
        },
  );

  mocks.updateMany.mockResolvedValue({
    count: overrides.updateCount ?? 1,
  });

  mocks.auditCreate.mockResolvedValue({});
}

describe("updateAllocationStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOrganizationPermission.mockResolvedValue(context);
  });

  it("dispatches an ALLOCATED allocation and records dispatchedAt", async () => {
    setup({ allocation: { id: "alloc-1", status: "ALLOCATED", requestItem: { requestId: "req-1" } } });

    const result = await updateAllocationStatus({
      allocationId: "alloc-1",
      status: "DISPATCHED",
    });

    expect(result.success).toBe(true);
    expect(mocks.updateMany).toHaveBeenCalledTimes(1);

    const data = mocks.updateMany.mock.calls[0][0].data;
    expect(data.status).toBe("DISPATCHED");
    expect(data.dispatchedAt).toBeInstanceOf(Date);
    expect(data.deliveredAt).toBeUndefined();
    expect(mocks.auditCreate).toHaveBeenCalledTimes(1);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/requests/req-1");
  });

  it("delivers a DISPATCHED allocation and records deliveredAt", async () => {
    setup({ allocation: { id: "alloc-1", status: "DISPATCHED", requestItem: { requestId: "req-1" } } });

    const result = await updateAllocationStatus({
      allocationId: "alloc-1",
      status: "DELIVERED",
    });

    expect(result.success).toBe(true);

    const data = mocks.updateMany.mock.calls[0][0].data;
    expect(data.status).toBe("DELIVERED");
    expect(data.deliveredAt).toBeInstanceOf(Date);
  });

  it("cancels an ALLOCATED allocation", async () => {
    setup({ allocation: { id: "alloc-1", status: "ALLOCATED", requestItem: { requestId: "req-1" } } });

    const result = await updateAllocationStatus({
      allocationId: "alloc-1",
      status: "CANCELLED",
    });

    expect(result.success).toBe(true);
    expect(mocks.updateMany.mock.calls[0][0].data.status).toBe("CANCELLED");
  });

  it("cancels a DISPATCHED allocation (allowed by product rules)", async () => {
    setup({ allocation: { id: "alloc-1", status: "DISPATCHED", requestItem: { requestId: "req-1" } } });

    const result = await updateAllocationStatus({
      allocationId: "alloc-1",
      status: "CANCELLED",
    });

    expect(result.success).toBe(true);
  });

  it("rejects allocations that do not belong to the caller's organization", async () => {
    setup({ allocation: null });

    const result = await updateAllocationStatus({
      allocationId: "alloc-1",
      status: "DISPATCHED",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("not found or access denied");
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("rejects invalid transitions (ALLOCATED -> DELIVERED)", async () => {
    setup({ allocation: { id: "alloc-1", status: "ALLOCATED", requestItem: { requestId: "req-1" } } });

    const result = await updateAllocationStatus({
      allocationId: "alloc-1",
      status: "DELIVERED",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("not allowed");
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("rejects repeated transitions (DELIVERED -> DELIVERED)", async () => {
    setup({ allocation: { id: "alloc-1", status: "DELIVERED", requestItem: { requestId: "req-1" } } });

    const result = await updateAllocationStatus({
      allocationId: "alloc-1",
      status: "DELIVERED",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("not allowed");
  });

  it("handles concurrent updates via the conditional update guard", async () => {
    setup({
      allocation: { id: "alloc-1", status: "ALLOCATED", requestItem: { requestId: "req-1" } },
      updateCount: 0,
    });

    const result = await updateAllocationStatus({
      allocationId: "alloc-1",
      status: "DISPATCHED",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("updated by another action");
  });
});