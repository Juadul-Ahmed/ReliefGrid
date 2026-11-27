import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resourceFindMany: vi.fn(),
  resourceFindFirst: vi.fn(),
  resourceCount: vi.fn(),
  inventoryFindFirst: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    resource: {
      findMany: mocks.resourceFindMany,
      findFirst: mocks.resourceFindFirst,
      count: mocks.resourceCount,
    },
    inventoryItem: { findFirst: mocks.inventoryFindFirst },
  },
}));

import {
  buildResourceFilters,
  getResources,
  getResourceById,
  getInventoryByResource,
  getResourceStats,
} from "./queries";

const ORG = "org-1";

describe("resource queries tenant isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("buildResourceFilters always includes organizationId", () => {
    const where = buildResourceFilters(ORG, {
      search: "water",
      category: "FOOD",
    });

    const conditions = where.AND;
    expect(Array.isArray(conditions) ? conditions[0] : conditions).toEqual({
      organizationId: ORG,
    });
  });

  it("getResources scopes the findMany by organization", async () => {
    mocks.resourceFindMany.mockResolvedValue([]);

    await getResources(ORG);

    expect(mocks.resourceFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: buildResourceFilters(ORG),
      }),
    );
  });

  it("getResourceById scopes by id and organizationId", async () => {
    mocks.resourceFindFirst.mockResolvedValue(null);

    await getResourceById("res-1", ORG);

    expect(mocks.resourceFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "res-1", organizationId: ORG },
      }),
    );
  });

  it("getInventoryByResource scopes by resource and organizationId", async () => {
    mocks.inventoryFindFirst.mockResolvedValue(null);

    await getInventoryByResource("res-1", ORG);

    expect(mocks.inventoryFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { resourceId: "res-1", organizationId: ORG },
      }),
    );
  });

  it("getResources selects all four location fields", async () => {
    mocks.resourceFindMany.mockResolvedValue([]);

    await getResources(ORG);

    const select = mocks.resourceFindMany.mock.calls[0][0].select;
    expect(select.locationName).toBe(true);
    expect(select.address).toBe(true);
    expect(select.latitude).toBe(true);
    expect(select.longitude).toBe(true);
  });

  it("getResourceById selects all four location fields", async () => {
    mocks.resourceFindFirst.mockResolvedValue(null);

    await getResourceById("res-1", ORG);

    const select = mocks.resourceFindFirst.mock.calls[0][0].select;
    expect(select.locationName).toBe(true);
    expect(select.address).toBe(true);
    expect(select.latitude).toBe(true);
    expect(select.longitude).toBe(true);
  });

  describe("getResourceStats", () => {
    it("returns total and active resource counts scoped by organization", async () => {
      mocks.resourceCount
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(7);

      const stats = await getResourceStats(ORG);

      expect(mocks.resourceCount).toHaveBeenCalledWith({
        where: { organizationId: ORG },
      });
      expect(mocks.resourceCount).toHaveBeenCalledWith({
        where: { organizationId: ORG, isActive: true },
      });
      expect(stats.total).toBe(10);
      expect(stats.active).toBe(7);
    });

    it("returns zero counts when no resources exist", async () => {
      mocks.resourceCount.mockResolvedValue(0);

      const stats = await getResourceStats(ORG);

      expect(stats.total).toBe(0);
      expect(stats.active).toBe(0);
    });
  });
});