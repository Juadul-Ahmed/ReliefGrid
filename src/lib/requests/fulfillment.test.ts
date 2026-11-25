import { describe, expect, it } from "vitest";

import {
  COMMITTED_ALLOCATION_STATUSES,
  deriveFulfillmentStatus,
  summarizeFulfillment,
  summarizeRequestFulfillment,
} from "./fulfillment";

const decimal = (value: number) => ({ toNumber: () => value });

describe("COMMITTED_ALLOCATION_STATUSES", () => {
  it("treats ALLOCATED, DISPATCHED and DELIVERED as committed", () => {
    expect(COMMITTED_ALLOCATION_STATUSES).toEqual([
      "ALLOCATED",
      "DISPATCHED",
      "DELIVERED",
    ]);
  });

  it("does not include CANCELLED", () => {
    expect(
      (COMMITTED_ALLOCATION_STATUSES as readonly string[]).includes("CANCELLED"),
    ).toBe(false);
  });
});

describe("summarizeFulfillment", () => {
  it("counts ALLOCATED and DISPATCHED as committed but not delivered", () => {
    const summary = summarizeFulfillment(10, [
      { status: "ALLOCATED", quantity: 3 },
      { status: "DISPATCHED", quantity: 2 },
    ]);

    expect(summary.requested).toBe(10);
    expect(summary.committed).toBe(5);
    expect(summary.delivered).toBe(0);
    expect(summary.remaining).toBe(5);
    expect(summary.progress).toBe(0);
    expect(summary.derivedStatus).toBe("IN_PROGRESS");
  });

  it("counts DELIVERED as both committed and delivered", () => {
    const summary = summarizeFulfillment(10, [
      { status: "DELIVERED", quantity: 4 },
    ]);

    expect(summary.committed).toBe(4);
    expect(summary.delivered).toBe(4);
    expect(summary.remaining).toBe(6);
    expect(summary.progress).toBe(40);
    expect(summary.derivedStatus).toBe("PARTIALLY_FULFILLED");
  });

  it("excludes CANCELLED quantities from committed and delivered", () => {
    const summary = summarizeFulfillment(10, [
      { status: "ALLOCATED", quantity: 3 },
      { status: "CANCELLED", quantity: 5 },
    ]);

    expect(summary.committed).toBe(3);
    expect(summary.delivered).toBe(0);
    expect(summary.remaining).toBe(7);
  });

  it("releases committed quantity when an allocation is cancelled", () => {
    const before = summarizeFulfillment(10, [
      { status: "DISPATCHED", quantity: 6 },
    ]);
    const after = summarizeFulfillment(10, [
      { status: "CANCELLED", quantity: 6 },
    ]);

    expect(before.committed).toBe(6);
    expect(before.remaining).toBe(4);
    expect(after.committed).toBe(0);
    expect(after.remaining).toBe(10);
  });

  it("never returns a negative remaining quantity", () => {
    const summary = summarizeFulfillment(5, [
      { status: "ALLOCATED", quantity: 8 },
    ]);

    expect(summary.committed).toBe(8);
    expect(summary.remaining).toBe(0);
  });

  it("accepts Prisma.Decimal-like quantities", () => {
    const summary = summarizeFulfillment(decimal(10), [
      { status: "DELIVERED", quantity: decimal(2.5) },
    ]);

    expect(summary.requested).toBe(10);
    expect(summary.delivered).toBe(2.5);
    expect(summary.remaining).toBe(7.5);
  });

  it("reports VERIFIED when there are no allocations", () => {
    const summary = summarizeFulfillment(10, []);
    expect(summary.derivedStatus).toBe("VERIFIED");
    expect(summary.progress).toBe(0);
  });

  it("reports FULFILLED only when delivered meets requested", () => {
    const summary = summarizeFulfillment(10, [
      { status: "DELIVERED", quantity: 10 },
    ]);

    expect(summary.derivedStatus).toBe("FULFILLED");
    expect(summary.progress).toBe(100);
  });
});

describe("deriveFulfillmentStatus", () => {
  it("is VERIFIED with nothing committed", () => {
    expect(deriveFulfillmentStatus(10, 0, 0)).toBe("VERIFIED");
  });

  it("is IN_PROGRESS when committed but nothing delivered", () => {
    expect(deriveFulfillmentStatus(10, 4, 0)).toBe("IN_PROGRESS");
  });

  it("is PARTIALLY_FULFILLED when some but not all delivered", () => {
    expect(deriveFulfillmentStatus(10, 10, 4)).toBe("PARTIALLY_FULFILLED");
  });

  it("is FULFILLED when delivered meets requested", () => {
    expect(deriveFulfillmentStatus(10, 10, 10)).toBe("FULFILLED");
  });

  it("is never FULFILLED from allocation alone", () => {
    expect(deriveFulfillmentStatus(10, 10, 0)).toBe("IN_PROGRESS");
  });
});

describe("summarizeRequestFulfillment", () => {
  it("aggregates across items and derives a request-level status", () => {
    const totals = summarizeRequestFulfillment([
      {
        quantity: 10,
        allocations: [{ status: "DELIVERED", quantity: 10 }],
      },
      {
        quantity: 5,
        allocations: [{ status: "ALLOCATED", quantity: 5 }],
      },
    ]);

    expect(totals.requested).toBe(15);
    expect(totals.committed).toBe(15);
    expect(totals.delivered).toBe(10);
    expect(totals.remaining).toBe(0);
    expect(totals.derivedStatus).toBe("PARTIALLY_FULFILLED");
    expect(totals.progress).toBe(67);
  });
});