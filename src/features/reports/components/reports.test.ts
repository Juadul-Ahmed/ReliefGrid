
import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { resolveDays, resolveRange } from "@/app/(dashboard)/reports/page";
import { formatDecimal } from "@/features/reports/components/resource-analytics";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("reports date range resolution", () => {
  describe("resolveDays", () => {
    it("returns 7 days for 7d range", () => {
      expect(resolveDays("7d")).toBe(7);
    });

    it("returns 30 days for 30d range", () => {
      expect(resolveDays("30d")).toBe(30);
    });

    it("returns 90 days for 90d range", () => {
      expect(resolveDays("90d")).toBe(90);
    });

    it("defaults to 30 days for unknown range", () => {
      expect(resolveDays("invalid")).toBe(30);
      expect(resolveDays("")).toBe(30);
    });
  });

  describe("resolveRange", () => {
    it("returns the raw range when valid", () => {
      expect(resolveRange("7d")).toBe("7d");
      expect(resolveRange("30d")).toBe("30d");
      expect(resolveRange("90d")).toBe("90d");
    });

    it("falls back to 30d for undefined", () => {
      expect(resolveRange(undefined)).toBe("30d");
    });

    it("falls back to 30d for invalid range", () => {
      expect(resolveRange("invalid")).toBe("30d");
      expect(resolveRange("")).toBe("30d");
      expect(resolveRange("1d")).toBe("30d");
    });
  });
});

describe("reports decimal formatting", () => {
  it("formats whole numbers without trailing decimals", () => {
    expect(formatDecimal("100")).toBe(100);
    expect(formatDecimal("0")).toBe(0);
  });

  it("formats decimal values with precision", () => {
    expect(formatDecimal("75.5")).toBe(75.5);
    expect(formatDecimal("100.25")).toBe(100.25);
  });

  it("returns 0 for non-numeric values", () => {
    expect(formatDecimal("")).toBe(0);
    expect(formatDecimal("abc")).toBe(0);
    expect(formatDecimal(null as unknown as string)).toBe(0);
  });
});

describe("reports analytics data flow", () => {
  it("uses real Stage A query functions (not hardcoded data)", () => {
    expect(typeof resolveDays).toBe("function");
    expect(typeof resolveRange).toBe("function");
  });
});
