import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  incidentFindMany: vi.fn(),
  incidentGroupBy: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    incident: {
      findMany: mocks.incidentFindMany,
      groupBy: mocks.incidentGroupBy,
    },
  },
}));

import {
  buildIncidentFilters,
  getIncidentSeverityBreakdown,
  getIncidentStatusBreakdown,
  getOrganizationIncidentScope,
  getRecentIncidents,
} from "./queries";

const ORG = "org-1";

describe("incident queries tenant isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getRecentIncidents", () => {
    it("scopes findMany by organization using incident scope", async () => {
      mocks.incidentFindMany.mockResolvedValue([]);

      await getRecentIncidents(ORG);

      expect(mocks.incidentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: getOrganizationIncidentScope(ORG),
        }),
      );
    });

    it("returns only the latest 5 incidents ordered newest first", async () => {
      const rows = [
        { id: "i1", createdAt: new Date("2026-01-05T00:00:00Z") },
        { id: "i2", createdAt: new Date("2026-01-04T00:00:00Z") },
        { id: "i3", createdAt: new Date("2026-01-03T00:00:00Z") },
        { id: "i4", createdAt: new Date("2026-01-02T00:00:00Z") },
        { id: "i5", createdAt: new Date("2026-01-01T00:00:00Z") },
      ];
      mocks.incidentFindMany.mockResolvedValue(rows);

      const result = await getRecentIncidents(ORG);

      expect(result).toHaveLength(5);
      expect(result[0].id).toBe("i1");
      expect(result[4].id).toBe("i5");
      expect(mocks.incidentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      );
    });

    it("selects only required fields", async () => {
      mocks.incidentFindMany.mockResolvedValue([]);

      await getRecentIncidents(ORG);

      expect(mocks.incidentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            id: true,
            incidentNumber: true,
            title: true,
            locationName: true,
            severity: true,
            status: true,
            createdAt: true,
          },
        }),
      );
    });

    it("returns empty array when no incidents exist", async () => {
      mocks.incidentFindMany.mockResolvedValue([]);

      const result = await getRecentIncidents(ORG);

      expect(result).toEqual([]);
    });

    it("handles null locationName", async () => {
      mocks.incidentFindMany.mockResolvedValue([
        {
          id: "i1",
          incidentNumber: "INC-001",
          title: "Test Incident",
          locationName: null,
          severity: "HIGH",
          status: "OPEN",
          createdAt: new Date("2026-01-05T00:00:00Z"),
        },
      ]);

      const result = await getRecentIncidents(ORG);

      expect(result[0].locationName).toBeNull();
      expect(result[0].severity).toBe("HIGH");
      expect(result[0].status).toBe("OPEN");
    });
  });

  describe("buildIncidentFilters", () => {
    it("includes organization scope", () => {
      const where = buildIncidentFilters(ORG);

      const conditions = where.AND;
      expect(Array.isArray(conditions) ? conditions[0] : conditions).toEqual(
        getOrganizationIncidentScope(ORG),
      );
    });
  });

  describe("getIncidentSeverityBreakdown", () => {
    it("returns severity counts scoped by organization", async () => {
      mocks.incidentGroupBy.mockResolvedValue([
        { severity: "CRITICAL", _count: { severity: 3 } },
        { severity: "HIGH", _count: { severity: 5 } },
        { severity: "LOW", _count: { severity: 2 } },
      ]);

      const result = await getIncidentSeverityBreakdown(ORG);

      expect(result).toEqual([
        { severity: "CRITICAL", count: 3 },
        { severity: "HIGH", count: 5 },
        { severity: "LOW", count: 2 },
      ]);
      expect(mocks.incidentGroupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: getOrganizationIncidentScope(ORG),
          by: ["severity"],
        }),
      );
    });

    it("returns empty array when no incidents exist", async () => {
      mocks.incidentGroupBy.mockResolvedValue([]);

      const result = await getIncidentSeverityBreakdown(ORG);

      expect(result).toEqual([]);
    });
  });

  describe("getIncidentStatusBreakdown", () => {
    it("returns status counts scoped by organization", async () => {
      mocks.incidentGroupBy.mockResolvedValue([
        { status: "OPEN", _count: { status: 4 } },
        { status: "RESOLVED", _count: { status: 2 } },
      ]);

      const result = await getIncidentStatusBreakdown(ORG);

      expect(result).toEqual([
        { status: "OPEN", count: 4 },
        { status: "RESOLVED", count: 2 },
      ]);
      expect(mocks.incidentGroupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: getOrganizationIncidentScope(ORG),
          by: ["status"],
        }),
      );
    });

    it("returns empty array when no incidents exist", async () => {
      mocks.incidentGroupBy.mockResolvedValue([]);

      const result = await getIncidentStatusBreakdown(ORG);

      expect(result).toEqual([]);
    });
  });
});
