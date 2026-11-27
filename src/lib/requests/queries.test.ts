import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  emergencyRequestCount: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    emergencyRequest: {
      count: mocks.emergencyRequestCount,
    },
  },
}));

import {
  getEmergencyRequestStats,
  getEmergencyRequestScope,
} from "./queries";

const ORG = "org-1";

describe("emergency request queries tenant isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getEmergencyRequestStats", () => {
    it("returns all request status counts scoped by organization", async () => {
      mocks.emergencyRequestCount
        .mockResolvedValueOnce(20) // total
        .mockResolvedValueOnce(5) // submitted
        .mockResolvedValueOnce(3) // underReview
        .mockResolvedValueOnce(4) // verified
        .mockResolvedValueOnce(2) // rejected
        .mockResolvedValueOnce(6); // fulfilled

      const stats = await getEmergencyRequestStats(ORG);

      expect(stats.total).toBe(20);
      expect(stats.submitted).toBe(5);
      expect(stats.underReview).toBe(3);
      expect(stats.verified).toBe(4);
      expect(stats.rejected).toBe(2);
      expect(stats.fulfilled).toBe(6);
    });

    it("applies emergency request scope to every count", async () => {
      mocks.emergencyRequestCount.mockResolvedValue(0);

      await getEmergencyRequestStats(ORG);

      const scope = getEmergencyRequestScope(ORG);
      expect(mocks.emergencyRequestCount).toHaveBeenCalledTimes(6);
      mocks.emergencyRequestCount.mock.calls.forEach((call) => {
        const filter = call[0].where ?? call[0];
        if ("AND" in filter) {
          expect(filter.AND[0]).toEqual(scope);
        } else {
          expect(filter).toEqual(scope);
        }
      });
    });

    it("returns zero counts when no requests exist", async () => {
      mocks.emergencyRequestCount.mockResolvedValue(0);

      const stats = await getEmergencyRequestStats(ORG);

      expect(stats.total).toBe(0);
      expect(stats.submitted).toBe(0);
      expect(stats.underReview).toBe(0);
      expect(stats.verified).toBe(0);
      expect(stats.rejected).toBe(0);
      expect(stats.fulfilled).toBe(0);
    });
  });
});
