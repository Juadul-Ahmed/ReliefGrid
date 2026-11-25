import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resourceFindMany: vi.fn(),
  resourceFindFirst: vi.fn(),
  inventoryFindFirst: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    resource: {
      findMany: mocks.resourceFindMany,
      findFirst: mocks.resourceFindFirst,
    },
    inventoryItem: { findFirst: mocks.inventoryFindFirst },
  },
}));

import {
  buildResourceFilters,
  getResources,
  getResourceById,
  getInventoryByResource,
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
});