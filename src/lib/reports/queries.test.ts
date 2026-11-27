
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";

const mocks = vi.hoisted(() => ({
  incidentCount: vi.fn(),
  incidentGroupBy: vi.fn(),
  incidentFindMany: vi.fn(),
  emergencyRequestCount: vi.fn(),
  emergencyRequestGroupBy: vi.fn(),
  emergencyRequestFindMany: vi.fn(),
  resourceCount: vi.fn(),
  resourceGroupBy: vi.fn(),
  inventoryAggregate: vi.fn(),
  inventoryFindMany: vi.fn(),
  stockMovementGroupBy: vi.fn(),
  stockMovementFindMany: vi.fn(),
  shelterAggregate: vi.fn(),
  shelterGroupBy: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    incident: {
      count: mocks.incidentCount,
      groupBy: mocks.incidentGroupBy,
      findMany: mocks.incidentFindMany,
    },
    emergencyRequest: {
      count: mocks.emergencyRequestCount,
      groupBy: mocks.emergencyRequestGroupBy,
      findMany: mocks.emergencyRequestFindMany,
    },
    resource: {
      count: mocks.resourceCount,
      groupBy: mocks.resourceGroupBy,
    },
    inventoryItem: {
      aggregate: mocks.inventoryAggregate,
      findMany: mocks.inventoryFindMany,
    },
    stockMovement: {
      groupBy: mocks.stockMovementGroupBy,
      findMany: mocks.stockMovementFindMany,
    },
    shelter: {
      aggregate: mocks.shelterAggregate,
      groupBy: mocks.shelterGroupBy,
    },
  },
}));

import {
  getIncidentAnalytics,
  getEmergencyRequestAnalytics,
  getResourceAnalytics,
  getInventoryAnalytics,
  getStockMovementAnalytics,
  getShelterAnalytics,
  getReportsKpiSummary,
} from "./queries";

const ORG = "org-1";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getIncidentAnalytics", () => {
  it("preserves incident scope and returns correct calculations", async () => {
    mocks.incidentCount
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3);

    mocks.incidentGroupBy
      .mockResolvedValueOnce([
        { severity: "CRITICAL", _count: { severity: 2 } },
        { severity: "HIGH", _count: { severity: 5 } },
      ])
      .mockResolvedValueOnce([
        { status: "OPEN", _count: { status: 5 } },
        { status: "RESOLVED", _count: { status: 3 } },
      ])
      .mockResolvedValueOnce([
        { category: "FIRE", _count: { category: 4 } },
        { category: "FLOOD", _count: { category: 3 } },
      ]);

    mocks.incidentFindMany.mockResolvedValue([
      { createdAt: new Date("2026-01-05T10:00:00Z") },
    ]);

    const result = await getIncidentAnalytics(ORG, 7);

    expect(result.total).toBe(10);
    expect(result.active).toBe(5);
    expect(result.critical).toBe(2);
    expect(result.resolved).toBe(3);
    expect(result.byStatus).toEqual([
      { name: "OPEN", count: 5 },
      { name: "RESOLVED", count: 3 },
    ]);
    expect(result.bySeverity).toEqual([
      { name: "CRITICAL", count: 2 },
      { name: "HIGH", count: 5 },
    ]);
    expect(result.byCategory).toEqual([
      { name: "FIRE", count: 4 },
      { name: "FLOOD", count: 3 },
    ]);
    expect(result.trends).toHaveLength(7);
  });

  it("passes organization scope to incident queries", async () => {
    mocks.incidentCount.mockResolvedValue(0);
    mocks.incidentGroupBy.mockResolvedValue([]);
    mocks.incidentFindMany.mockResolvedValue([]);

    await getIncidentAnalytics(ORG, 7);

    const scope = {
      OR: [
        { leadOrganizationId: ORG },
        {
          participants: {
            some: { organizationId: ORG, status: "ACTIVE" },
          },
        },
      ],
    };

    expect(mocks.incidentCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: scope }),
    );
    expect(mocks.incidentGroupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: scope }),
    );
    expect(mocks.incidentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: [scope, { createdAt: { gte: expect.any(Date) } }],
        }),
      }),
    );
  });

  it("returns zero values and empty arrays when no incidents exist", async () => {
    mocks.incidentCount.mockResolvedValue(0);
    mocks.incidentGroupBy.mockResolvedValue([]);
    mocks.incidentFindMany.mockResolvedValue([]);

    const result = await getIncidentAnalytics(ORG, 7);

    expect(result.total).toBe(0);
    expect(result.active).toBe(0);
    expect(result.critical).toBe(0);
    expect(result.resolved).toBe(0);
    expect(result.byStatus).toEqual([]);
    expect(result.bySeverity).toEqual([]);
    expect(result.byCategory).toEqual([]);
    expect(result.trends).toHaveLength(7);
    expect(result.trends.every((t) => t.count === 0)).toBe(true);
  });
});

describe("getEmergencyRequestAnalytics", () => {
  it("preserves request scope and calculates fulfillment rate correctly", async () => {
    mocks.emergencyRequestCount
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(6);

    mocks.emergencyRequestGroupBy
      .mockResolvedValueOnce([
        { status: "FULFILLED", _count: { status: 6 } },
        { status: "SUBMITTED", _count: { status: 5 } },
      ])
      .mockResolvedValueOnce([
        { priority: "CRITICAL", _count: { priority: 3 } },
        { priority: "HIGH", _count: { priority: 7 } },
      ])
      .mockResolvedValueOnce([
        { category: "FOOD", _count: { category: 8 } },
        { category: "MEDICAL_SUPPLIES", _count: { category: 5 } },
      ]);

    mocks.emergencyRequestFindMany.mockResolvedValue([
      { createdAt: new Date("2026-01-05T10:00:00Z") },
    ]);

    const result = await getEmergencyRequestAnalytics(ORG, 7);

    expect(result.total).toBe(20);
    expect(result.pending).toBe(8);
    expect(result.fulfilled).toBe(6);
    expect(result.fulfillmentRate).toBe(30);
    expect(result.byStatus).toEqual([
      { name: "FULFILLED", count: 6 },
      { name: "SUBMITTED", count: 5 },
    ]);
    expect(result.byPriority).toEqual([
      { name: "CRITICAL", count: 3 },
      { name: "HIGH", count: 7 },
    ]);
    expect(result.byCategory).toEqual([
      { name: "FOOD", count: 8 },
      { name: "MEDICAL_SUPPLIES", count: 5 },
    ]);
    expect(result.trends).toHaveLength(7);
  });

  it("fulfillment rate is zero when there are no requests", async () => {
    mocks.emergencyRequestCount.mockResolvedValue(0);
    mocks.emergencyRequestGroupBy.mockResolvedValue([]);
    mocks.emergencyRequestFindMany.mockResolvedValue([]);

    const result = await getEmergencyRequestAnalytics(ORG, 7);

    expect(result.total).toBe(0);
    expect(result.fulfilled).toBe(0);
    expect(result.fulfillmentRate).toBe(0);
    expect(result.pending).toBe(0);
  });

  it("passes organization scope to request queries", async () => {
    mocks.emergencyRequestCount.mockResolvedValue(0);
    mocks.emergencyRequestGroupBy.mockResolvedValue([]);
    mocks.emergencyRequestFindMany.mockResolvedValue([]);

    const scope = {
      OR: [
        { organizationId: ORG },
        { incident: expect.any(Object) },
      ],
    };

    await getEmergencyRequestAnalytics(ORG, 7);

    expect(mocks.emergencyRequestCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: scope }),
    );
    expect(mocks.emergencyRequestGroupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: scope }),
    );
    expect(mocks.emergencyRequestFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: [scope, { createdAt: { gte: expect.any(Date) } }],
        }),
      }),
    );
  });
});

describe("getResourceAnalytics", () => {
  it("returns resource counts scoped by organization", async () => {
    mocks.resourceCount
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(7);

    mocks.resourceGroupBy.mockResolvedValue([
      { category: "FOOD", _count: { category: 4 } },
      { category: "MEDICAL_SUPPLIES", _count: { category: 3 } },
    ]);

    const result = await getResourceAnalytics(ORG);

    expect(result.total).toBe(10);
    expect(result.active).toBe(7);
    expect(result.inactive).toBe(3);
    expect(result.byCategory).toEqual([
      { name: "FOOD", count: 4 },
      { name: "MEDICAL_SUPPLIES", count: 3 },
    ]);
  });

  it("scopes resource queries by organizationId", async () => {
    mocks.resourceCount.mockResolvedValue(0);
    mocks.resourceGroupBy.mockResolvedValue([]);

    await getResourceAnalytics(ORG);

    expect(mocks.resourceCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: ORG } }),
    );
    expect(mocks.resourceGroupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: ORG } }),
    );
  });
});

describe("getInventoryAnalytics", () => {
  it("returns inventory stats scoped by organization with decimal precision", async () => {
    mocks.resourceCount.mockResolvedValue(4);
    mocks.inventoryAggregate.mockResolvedValue({
      _count: { _all: 4 },
      _sum: {
        onHand: new Prisma.Decimal(100),
        reserved: new Prisma.Decimal(25),
      },
    });
    mocks.inventoryFindMany.mockResolvedValue([
      {
        id: "inv-1",
        onHand: new Prisma.Decimal(10),
        reserved: new Prisma.Decimal(2),
        lowStockThreshold: new Prisma.Decimal(1),
        resource: { name: "Water", unit: "liters" },
      },
      {
        id: "inv-2",
        onHand: new Prisma.Decimal(0),
        reserved: new Prisma.Decimal(0),
        lowStockThreshold: null,
        resource: { name: "Blankets", unit: "units" },
      },
    ]);

    const result = await getInventoryAnalytics(ORG);

    expect(result.onHand).toBe("100");
    expect(result.reserved).toBe("25");
    expect(result.available).toBe("75");
    expect(result.lowStockCount).toBe(0);
    expect(result.outOfStockCount).toBe(1);
  });

  it("scopes inventory queries by organizationId", async () => {
    mocks.resourceCount.mockResolvedValue(0);
    mocks.inventoryAggregate.mockResolvedValue({
      _count: { _all: 0 },
      _sum: { onHand: new Prisma.Decimal(0), reserved: new Prisma.Decimal(0) },
    });
    mocks.inventoryFindMany.mockResolvedValue([]);

    await getInventoryAnalytics(ORG);

    expect(mocks.resourceCount).toHaveBeenCalledWith({
      where: { organizationId: ORG, isActive: true },
    });
    expect(mocks.inventoryAggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: ORG, isActive: true },
      }),
    );
    expect(mocks.inventoryFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: ORG, isActive: true },
      }),
    );
  });
});

describe("getStockMovementAnalytics", () => {
  it("returns movement type summaries scoped by organization", async () => {
    mocks.stockMovementGroupBy.mockResolvedValue([
      { type: "IN", _sum: { quantity: new Prisma.Decimal(50) }, _count: { type: 3 } },
      { type: "OUT", _sum: { quantity: new Prisma.Decimal(20) }, _count: { type: 2 } },
    ]);
    mocks.stockMovementFindMany.mockResolvedValue([
      { createdAt: new Date("2026-01-05T10:00:00Z") },
    ]);

    const result = await getStockMovementAnalytics(ORG, 7);

    expect(result.byType).toEqual([
      { type: "IN", quantity: "50", count: 3 },
      { type: "OUT", quantity: "20", count: 2 },
    ]);
    expect(result.trends).toHaveLength(7);
  });

  it("scopes stock movements through inventory organization, preventing cross-org leaks", async () => {
    mocks.stockMovementGroupBy.mockResolvedValue([]);
    mocks.stockMovementFindMany.mockResolvedValue([]);

    await getStockMovementAnalytics(ORG, 7);

    const groupByCall = mocks.stockMovementGroupBy.mock
      .calls[0][0] as { where: { inventoryItem: { organizationId: string } } };
    expect(groupByCall.where).toEqual({
      inventoryItem: { organizationId: ORG },
    });

    const findManyCall = mocks.stockMovementFindMany.mock
      .calls[0][0] as { where: { inventoryItem: { organizationId: string }; createdAt: { gte: Date } } };
    expect(findManyCall.where.inventoryItem).toEqual({
      organizationId: ORG,
    });
    expect(findManyCall.where.createdAt).toHaveProperty("gte");
  });
});

describe("getShelterAnalytics", () => {
  it("returns shelter capacity and utilization scoped by organization", async () => {
    mocks.shelterAggregate.mockResolvedValue({
      _count: { _all: 5 },
      _sum: { capacity: 500, currentOccupancy: 350 },
    });
    mocks.shelterGroupBy.mockResolvedValue([
      { status: "ACTIVE", _count: { status: 3 } },
      { status: "INACTIVE", _count: { status: 1 } },
      { status: "CLOSED", _count: { status: 1 } },
    ]);

    const result = await getShelterAnalytics(ORG);

    expect(result.capacity.total).toBe(5);
    expect(result.capacity.active).toBe(3);
    expect(result.capacity.inactive).toBe(1);
    expect(result.capacity.closed).toBe(1);
    expect(result.capacity.totalCapacity).toBe(500);
    expect(result.capacity.totalOccupancy).toBe(350);
    expect(result.capacity.availableCapacity).toBe(150);
    expect(result.capacity.utilization).toBe(70);
    expect(result.statusBreakdown).toEqual([
      { name: "ACTIVE", count: 3 },
      { name: "INACTIVE", count: 1 },
      { name: "CLOSED", count: 1 },
    ]);
  });

  it("handles zero capacity safely for utilization", async () => {
    mocks.shelterAggregate.mockResolvedValue({
      _count: { _all: 2 },
      _sum: { capacity: 0, currentOccupancy: 0 },
    });
    mocks.shelterGroupBy.mockResolvedValue([
      { status: "ACTIVE", _count: { status: 2 } },
    ]);

    const result = await getShelterAnalytics(ORG);

    expect(result.capacity.utilization).toBe(0);
    expect(result.capacity.availableCapacity).toBe(0);
  });

  it("scopes shelter queries by organizationId", async () => {
    mocks.shelterAggregate.mockResolvedValue({
      _count: { _all: 0 },
      _sum: { capacity: 0, currentOccupancy: 0 },
    });
    mocks.shelterGroupBy.mockResolvedValue([]);

    await getShelterAnalytics(ORG);

    expect(mocks.shelterAggregate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: ORG } }),
    );
    expect(mocks.shelterGroupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: ORG } }),
    );
  });
});

describe("getReportsKpiSummary", () => {
  it("composes all sub-metrics into a single KPI summary", async () => {
    mocks.incidentCount
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);

    mocks.incidentGroupBy.mockResolvedValue([]);
    mocks.incidentFindMany.mockResolvedValue([]);

    mocks.emergencyRequestCount
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(3);

    mocks.emergencyRequestGroupBy.mockResolvedValue([]);
    mocks.emergencyRequestFindMany.mockResolvedValue([]);

    mocks.resourceCount
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(6);
    mocks.resourceGroupBy.mockResolvedValue([]);

    mocks.inventoryAggregate.mockResolvedValue({
      _count: { _all: 4 },
      _sum: { onHand: new Prisma.Decimal(100), reserved: new Prisma.Decimal(20) },
    });
    mocks.inventoryFindMany.mockResolvedValue([]);

    mocks.shelterAggregate.mockResolvedValue({
      _count: { _all: 3 },
      _sum: { capacity: 300, currentOccupancy: 150 },
    });
    mocks.shelterGroupBy.mockResolvedValue([
      { status: "ACTIVE", _count: { status: 2 } },
      { status: "CLOSED", _count: { status: 1 } },
    ]);

    const result = await getReportsKpiSummary(ORG);

    expect(result.totalIncidents).toBe(7);
    expect(result.activeIncidents).toBe(4);
    expect(result.criticalIncidents).toBe(1);
    expect(result.resolvedIncidents).toBe(2);
    expect(result.totalRequests).toBe(10);
    expect(result.pendingRequests).toBe(3);
    expect(result.fulfilledRequests).toBe(3);
    expect(result.fulfillmentRate).toBe(30);
    expect(result.totalResources).toBe(8);
    expect(result.activeResources).toBe(6);
    expect(result.totalShelters).toBe(3);
    expect(result.shelterUtilization).toBe(50);
  });
});

describe("date range support", () => {
  it("supports 7d, 30d, and 90d ranges for incident trends", async () => {
    mocks.incidentCount.mockResolvedValue(0);
    mocks.incidentGroupBy.mockResolvedValue([]);

    for (const days of [7, 30, 90]) {
      mocks.incidentFindMany.mockResolvedValue([]);
      await getIncidentAnalytics(ORG, days);
      expect(mocks.incidentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: [
              expect.any(Object),
              { createdAt: { gte: expect.any(Date) } },
            ],
          }),
          take: 1000,
        }),
      );
    }
  });
});
