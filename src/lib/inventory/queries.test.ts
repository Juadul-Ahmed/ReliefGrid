import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";

const mocks = vi.hoisted(() => ({
  resourceCount: vi.fn(),
  inventoryAggregate: vi.fn(),
  inventoryFindMany: vi.fn(),
  movementFindMany: vi.fn(),
  movementCount: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    resource: { count: mocks.resourceCount },
    inventoryItem: {
      aggregate: mocks.inventoryAggregate,
      findMany: mocks.inventoryFindMany,
    },
    stockMovement: {
      findMany: mocks.movementFindMany,
      count: mocks.movementCount,
    },
  },
}));

import {
  getInventoryStats,
  getInventoryOverview,
  getStockMovements,
} from "./queries";

const ORG = "org-1";

describe("inventory queries tenant isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getInventoryStats scopes resource and inventory aggregates by org", async () => {
    mocks.resourceCount.mockResolvedValue(3);
    mocks.inventoryAggregate.mockResolvedValue({
      _count: { _all: 2 },
      _sum: {
        onHand: new Prisma.Decimal(20),
        reserved: new Prisma.Decimal(5),
      },
    });

    const stats = await getInventoryStats(ORG);

    expect(mocks.resourceCount).toHaveBeenCalledWith({
      where: { organizationId: ORG, isActive: true },
    });
    expect(mocks.inventoryAggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: ORG, isActive: true },
      }),
    );
    expect(stats.activeResources).toBe(3);
    expect(stats.available).toBe("15");
  });

  it("getInventoryOverview derives LOW and OUT status from org-scoped rows", async () => {
    mocks.inventoryFindMany.mockResolvedValue([
      {
        id: "inv-ok",
        resourceId: "res-1",
        onHand: new Prisma.Decimal(10),
        reserved: new Prisma.Decimal(2),
        lowStockThreshold: new Prisma.Decimal(1),
        resource: { name: "Water", unit: "liters" },
      },
      {
        id: "inv-low",
        resourceId: "res-2",
        onHand: new Prisma.Decimal(10),
        reserved: new Prisma.Decimal(2),
        lowStockThreshold: new Prisma.Decimal(10),
        resource: { name: "Kits", unit: "units" },
      },
      {
        id: "inv-out",
        resourceId: "res-3",
        onHand: new Prisma.Decimal(0),
        reserved: new Prisma.Decimal(0),
        lowStockThreshold: null,
        resource: { name: "Blankets", unit: "units" },
      },
    ]);

    const overview = await getInventoryOverview(ORG);

    expect(mocks.inventoryFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: ORG, isActive: true },
      }),
    );
    expect(overview.lowStock.map((item) => item.id)).toEqual(["inv-low"]);
    expect(overview.outOfStock.map((item) => item.id)).toEqual(["inv-out"]);
    expect(overview.items.find((item) => item.id === "inv-ok")?.status).toBe(
      "OK",
    );
  });

  it("getStockMovements scopes every query through inventory org", async () => {
    mocks.movementFindMany.mockResolvedValue([]);
    mocks.movementCount.mockResolvedValue(0);

    await getStockMovements(ORG, { type: "RESERVE", page: 2 });

    expect(mocks.movementFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          inventoryItem: { organizationId: ORG },
          type: "RESERVE",
        },
        skip: 50,
      }),
    );
    expect(mocks.movementCount).toHaveBeenCalledWith({
      where: {
        inventoryItem: { organizationId: ORG },
        type: "RESERVE",
      },
    });
  });

  it("getStockMovements ignores unknown movement type filters", async () => {
    mocks.movementFindMany.mockResolvedValue([]);
    mocks.movementCount.mockResolvedValue(0);

    await getStockMovements(ORG, { type: "BOGUS" });

    const where = mocks.movementCount.mock.calls[0][0].where;
    expect(where.type).toBeUndefined();
    expect(where.inventoryItem).toEqual({ organizationId: ORG });
  });
});