import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  incidentFindMany: vi.fn(),
  emergencyRequestFindMany: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    incident: {
      findMany: mocks.incidentFindMany,
    },
    emergencyRequest: {
      findMany: mocks.emergencyRequestFindMany,
    },
  },
}));

import {
  DATE_RANGE_OPTIONS,
  getDateRangeFilter,
  getEmergencyRequestTrends,
  getIncidentTrends,
  groupTrendsByDate,
} from "./queries";

const ORG = "org-1";

describe("dashboard queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("DATE_RANGE_OPTIONS", () => {
    it("includes 7d, 30d, and 90d options", () => {
      const values = DATE_RANGE_OPTIONS.map((o) => o.value);
      expect(values).toContain("7d");
      expect(values).toContain("30d");
      expect(values).toContain("90d");
    });
  });

  describe("getDateRangeFilter", () => {
    it("returns a date N days ago", () => {
      const before = Date.now();
      const result = getDateRangeFilter(7);
      const after = Date.now();

      const expectedMin = new Date(before - 8 * 24 * 60 * 60 * 1000);
      const expectedMax = new Date(after - 6 * 24 * 60 * 60 * 1000);

      expect(result.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
      expect(result.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
    });
  });

  describe("groupTrendsByDate", () => {
    it("groups items by date and fills missing dates with zero", () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const dayBefore = new Date(today);
      dayBefore.setDate(today.getDate() - 2);

      const items = [
        { createdAt: today },
        { createdAt: today },
        { createdAt: yesterday },
      ];

      // 5 days ending today
      const result = groupTrendsByDate(items, 5);

      expect(result).toHaveLength(5);
      // Find the entry for today
      const todayStr = today.toISOString().split("T")[0];
      const todayEntry = result.find((d) => d.date === todayStr);
      expect(todayEntry?.count).toBe(2);
      // Find the entry for yesterday
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      const yesterdayEntry = result.find((d) => d.date === yesterdayStr);
      expect(yesterdayEntry?.count).toBe(1);
      // Day before should have zero
      const dayBeforeStr = dayBefore.toISOString().split("T")[0];
      const dayBeforeEntry = result.find((d) => d.date === dayBeforeStr);
      expect(dayBeforeEntry?.count).toBe(0);
    });

    it("returns all zeros when no items provided", () => {
      const result = groupTrendsByDate([], 3);

      expect(result).toHaveLength(3);
      expect(result.every((d) => d.count === 0)).toBe(true);
    });
  });

  describe("getIncidentTrends", () => {
    it("returns incident trends scoped by organization", async () => {
      mocks.incidentFindMany.mockResolvedValue([
        { createdAt: new Date("2026-01-05T10:00:00Z") },
      ]);

      const result = await getIncidentTrends(ORG, 7);

      expect(mocks.incidentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: [
              expect.objectContaining({
                OR: [
                  { leadOrganizationId: ORG },
                  {
                    participants: {
                      some: {
                        organizationId: ORG,
                        status: "ACTIVE",
                      },
                    },
                  },
                ],
              }),
              { createdAt: { gte: expect.any(Date) } },
            ],
          }),
          orderBy: { createdAt: "asc" },
          select: { createdAt: true },
          take: 1000,
        }),
      );
      expect(result).toHaveLength(7);
    });

    it("returns all zeros when no incidents exist", async () => {
      mocks.incidentFindMany.mockResolvedValue([]);

      const result = await getIncidentTrends(ORG, 7);

      expect(result).toHaveLength(7);
      expect(result.every((d) => d.count === 0)).toBe(true);
    });
  });

  describe("getEmergencyRequestTrends", () => {
    it("returns request trends scoped by organization", async () => {
      mocks.emergencyRequestFindMany.mockResolvedValue([
        { createdAt: new Date("2026-01-05T10:00:00Z") },
      ]);

      const result = await getEmergencyRequestTrends(ORG, 7);

      expect(mocks.emergencyRequestFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: [
              expect.objectContaining({
                OR: [
                  { organizationId: ORG },
                  {
                    incident: expect.any(Object),
                  },
                ],
              }),
              { createdAt: { gte: expect.any(Date) } },
            ],
          }),
          orderBy: { createdAt: "asc" },
          select: { createdAt: true },
          take: 1000,
        }),
      );
      expect(result).toHaveLength(7);
    });

    it("returns all zeros when no requests exist", async () => {
      mocks.emergencyRequestFindMany.mockResolvedValue([]);

      const result = await getEmergencyRequestTrends(ORG, 7);

      expect(result).toHaveLength(7);
      expect(result.every((d) => d.count === 0)).toBe(true);
    });
  });
});
