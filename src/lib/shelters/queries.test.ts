import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  shelterFindMany: vi.fn(),
  shelterFindFirst: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    shelter: {
      findMany: mocks.shelterFindMany,
      findFirst: mocks.shelterFindFirst,
    },
  },
}));

import {
  buildShelterFilters,
  getShelters,
  getShelterById,
  deriveDisplayStatus,
} from "./queries";

const ORG = "org-1";

describe("shelter queries tenant isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("buildShelterFilters always includes organizationId", () => {
    const where = buildShelterFilters(ORG, {
      search: "downtown",
      status: "ACTIVE",
    });

    const conditions = where.AND;
    expect(Array.isArray(conditions) ? conditions[0] : conditions).toEqual({
      organizationId: ORG,
    });
  });

  it("buildShelterFilters adds search conditions for name and address", () => {
    const where = buildShelterFilters(ORG, { search: "main" });

    const conditions = where.AND;
    const searchCondition = Array.isArray(conditions) ? conditions[1] : conditions;
    expect(searchCondition).toEqual({
      OR: [
        { name: { contains: "main", mode: "insensitive" } },
        { address: { contains: "main", mode: "insensitive" } },
      ],
    });
  });

  it("buildShelterFilters adds status filter when valid", () => {
    const where = buildShelterFilters(ORG, { status: "CLOSED" });

    const conditions = where.AND;
    const statusCondition = Array.isArray(conditions) ? conditions[1] : conditions;
    expect(statusCondition).toEqual({ status: "CLOSED" });
  });

  it("buildShelterFilters ignores invalid status filter", () => {
    const where = buildShelterFilters(ORG, { status: "FULL" });

    const conditions = where.AND;
    expect(conditions).toHaveLength(1);
  });

  it("getShelters scopes findMany by organization", async () => {
    mocks.shelterFindMany.mockResolvedValue([]);

    await getShelters(ORG);

    expect(mocks.shelterFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: buildShelterFilters(ORG),
      }),
    );
  });

  it("getShelterById scopes by id and organizationId", async () => {
    mocks.shelterFindFirst.mockResolvedValue(null);

    await getShelterById("shelter-1", ORG);

    expect(mocks.shelterFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "shelter-1", organizationId: ORG },
      }),
    );
  });
});

describe("deriveDisplayStatus", () => {
  it("returns FULL for ACTIVE shelter at full capacity", () => {
    const result = deriveDisplayStatus({
      status: "ACTIVE",
      currentOccupancy: 100,
      capacity: 100,
    });

    expect(result).toBe("FULL");
  });

  it("returns FULL for ACTIVE shelter over capacity", () => {
    const result = deriveDisplayStatus({
      status: "ACTIVE",
      currentOccupancy: 101,
      capacity: 100,
    });

    expect(result).toBe("FULL");
  });

  it("returns ACTIVE for ACTIVE shelter below capacity", () => {
    const result = deriveDisplayStatus({
      status: "ACTIVE",
      currentOccupancy: 50,
      capacity: 100,
    });

    expect(result).toBe("ACTIVE");
  });

  it("returns INACTIVE regardless of occupancy", () => {
    const result = deriveDisplayStatus({
      status: "INACTIVE",
      currentOccupancy: 100,
      capacity: 100,
    });

    expect(result).toBe("INACTIVE");
  });

  it("returns CLOSED regardless of occupancy", () => {
    const result = deriveDisplayStatus({
      status: "CLOSED",
      currentOccupancy: 0,
      capacity: 100,
    });

    expect(result).toBe("CLOSED");
  });

  it("does not modify stored status - FULL is derived only", () => {
    const shelter = {
      status: "ACTIVE",
      currentOccupancy: 100,
      capacity: 100,
    };

    const result = deriveDisplayStatus(shelter);

    expect(shelter.status).toBe("ACTIVE");
    expect(result).toBe("FULL");
  });
});
