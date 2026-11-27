import { describe, expect, it } from "vitest";

import { mapStatus } from "./recent-incidents";

describe("status mapping", () => {
  it.each([
    ["OPEN", "Open"],
    ["ASSESSING", "Assessing"],
    ["ACTIVE", "Active"],
    ["CONTAINED", "Contained"],
    ["RESOLVED", "Resolved"],
    ["CLOSED", "Closed"],
    ["SUSPENDED", "Suspended"],
    ["CANCELLED", "Cancelled"],
  ])("maps Prisma status %s to display label %s", (prismaStatus, expected) => {
    expect(mapStatus(prismaStatus)).toBe(expected);
  });

  it("does not map different statuses to the same label", () => {
    const labels = [
      "OPEN",
      "ASSESSING",
      "ACTIVE",
      "CONTAINED",
      "RESOLVED",
      "CLOSED",
      "SUSPENDED",
      "CANCELLED",
    ].map(mapStatus);

    expect(new Set(labels).size).toBe(8);
  });

  it("does not map CANCELLED to Resolved", () => {
    expect(mapStatus("CANCELLED")).toBe("Cancelled");
  });

  it("does not map SUSPENDED to Open or Reported", () => {
    expect(mapStatus("SUSPENDED")).toBe("Suspended");
  });

  it("falls back to Open for unknown statuses", () => {
    expect(mapStatus("UNKNOWN_STATUS")).toBe("Open");
  });
});
