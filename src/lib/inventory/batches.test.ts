import { describe, expect, it } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import { selectFefoBatches } from "./batches";

function makeBatch(overrides: Partial<{
  id: string;
  expiresAt: Date | null;
  onHand: number | string;
  reserved: number | string;
}> = {}) {
  return {
    id: overrides.id ?? "batch-1",
    expiresAt: overrides.expiresAt ?? null,
    onHand: new Prisma.Decimal(overrides.onHand ?? 100),
    reserved: new Prisma.Decimal(overrides.reserved ?? 0),
  };
}

describe("selectFefoBatches", () => {
  it("selects earliest-expiring eligible batch first", () => {
    const batches = [
      makeBatch({ id: "b1", expiresAt: new Date("2099-12-01"), onHand: 50, reserved: 0 }),
      makeBatch({ id: "b2", expiresAt: new Date("2099-07-01"), onHand: 50, reserved: 0 }),
      makeBatch({ id: "b3", expiresAt: new Date("2099-08-01"), onHand: 50, reserved: 0 }),
    ];

    const result = selectFefoBatches(batches, new Prisma.Decimal(60));

    expect(result).toHaveLength(2);
    expect(result[0].batch.id).toBe("b2"); // July 1st expires first
    expect(result[0].quantity).toEqual(new Prisma.Decimal(50));
    expect(result[1].batch.id).toBe("b3"); // August 1st next
    expect(result[1].quantity).toEqual(new Prisma.Decimal(10));
  });

  it("excludes expired batches even when they have available stock", () => {
    const batches = [
      makeBatch({ id: "expired", expiresAt: new Date("2000-01-01"), onHand: 50, reserved: 0 }), // expired but has stock
      makeBatch({ id: "good", expiresAt: new Date("2099-07-01"), onHand: 50, reserved: 0 }),
    ];

    const result = selectFefoBatches(batches, new Prisma.Decimal(30));

    expect(result).toHaveLength(1);
    expect(result[0].batch.id).toBe("good"); // only the non-expired batch is eligible
  });

  it("excludes empty batches (onHand - reserved <= 0)", () => {
    const batches = [
      makeBatch({ id: "b1", onHand: 10, reserved: 10 }), // fully reserved
      makeBatch({ id: "b2", onHand: 5, reserved: 10 }), // negative available
      makeBatch({ id: "b3", onHand: 50, reserved: 0 }), // has stock
    ];

    const result = selectFefoBatches(batches, new Prisma.Decimal(30));

    expect(result).toHaveLength(1);
    expect(result[0].batch.id).toBe("b3");
  });

  it("handles batches with null expiration (sorted last)", () => {
    const batches = [
      makeBatch({ id: "b1", expiresAt: null, onHand: 50, reserved: 0 }),
      makeBatch({ id: "b2", expiresAt: new Date("2099-07-01"), onHand: 50, reserved: 0 }),
    ];

    const result = selectFefoBatches(batches, new Prisma.Decimal(60));

    expect(result).toHaveLength(2);
    expect(result[0].batch.id).toBe("b2"); // has expiration date
    expect(result[1].batch.id).toBe("b1"); // null expiresAt sorted last
  });

  it("returns partial quantity from a batch when it satisfies the remaining need", () => {
    const batches = [
      makeBatch({ id: "b1", expiresAt: new Date("2099-07-01"), onHand: 100, reserved: 0 }),
    ];

    const result = selectFefoBatches(batches, new Prisma.Decimal(30));

    expect(result).toHaveLength(1);
    expect(result[0].quantity).toEqual(new Prisma.Decimal(30));
  });

  it("spans multiple batches when quantity exceeds single batch", () => {
    const batches = [
      makeBatch({ id: "b1", expiresAt: new Date("2099-07-01"), onHand: 20, reserved: 0 }),
      makeBatch({ id: "b2", expiresAt: new Date("2099-08-01"), onHand: 20, reserved: 0 }),
    ];

    const result = selectFefoBatches(batches, new Prisma.Decimal(35));

    expect(result).toHaveLength(2);
    expect(result[0].quantity).toEqual(new Prisma.Decimal(20));
    expect(result[1].quantity).toEqual(new Prisma.Decimal(15));
  });

  it("returns empty array when no eligible batches", () => {
    const batches = [
      makeBatch({ id: "b1", onHand: 0, reserved: 0 }),
      makeBatch({ id: "b2", onHand: 10, reserved: 10 }),
    ];

    const result = selectFefoBatches(batches, new Prisma.Decimal(10));

    expect(result).toHaveLength(0);
  });

  it("sorts by id when both have null expiresAt", () => {
    const batches = [
      makeBatch({ id: "b2", expiresAt: null, onHand: 50, reserved: 0 }),
      makeBatch({ id: "b1", expiresAt: null, onHand: 50, reserved: 0 }),
    ];

    const result = selectFefoBatches(batches, new Prisma.Decimal(60));

    expect(result[0].batch.id).toBe("b1");
    expect(result[1].batch.id).toBe("b2");
  });

  it("returns partial fulfillment when requested quantity exceeds total available", () => {
    const batches = [
      makeBatch({ id: "b1", expiresAt: new Date("2099-07-01"), onHand: 20, reserved: 0 }),
      makeBatch({ id: "b2", expiresAt: new Date("2099-08-01"), onHand: 20, reserved: 0 }),
    ];

    const result = selectFefoBatches(batches, new Prisma.Decimal(50));

    expect(result).toHaveLength(2);
    expect(result[0].quantity).toEqual(new Prisma.Decimal(20));
    expect(result[1].quantity).toEqual(new Prisma.Decimal(20));
  });
});