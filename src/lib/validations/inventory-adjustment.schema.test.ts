import { describe, expect, it } from "vitest";

import { inventoryAdjustmentSchema } from "./inventory-adjustment.schema";

const valid = {
  inventoryItemId: "inv-1",
  quantity: 5,
  reason: "Stock count correction",
};

describe("inventoryAdjustmentSchema", () => {
  it("accepts a positive adjustment", () => {
    const result = inventoryAdjustmentSchema.safeParse(valid);

    expect(result.success).toBe(true);
  });

  it("accepts a negative adjustment", () => {
    const result = inventoryAdjustmentSchema.safeParse({
      ...valid,
      quantity: -2.5,
    });

    expect(result.success).toBe(true);
  });

  it("accepts a numeric string quantity (form coercion)", () => {
    const result = inventoryAdjustmentSchema.safeParse({
      ...valid,
      quantity: "3.25",
    });

    expect(result.success).toBe(true);
  });

  it("rejects zero", () => {
    const result = inventoryAdjustmentSchema.safeParse({
      ...valid,
      quantity: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejects more than three decimal places", () => {
    const result = inventoryAdjustmentSchema.safeParse({
      ...valid,
      quantity: 1.2345,
    });

    expect(result.success).toBe(false);
  });

  it("accepts exactly three decimal places", () => {
    const result = inventoryAdjustmentSchema.safeParse({
      ...valid,
      quantity: 1.234,
    });

    expect(result.success).toBe(true);
  });

  it("rejects NaN", () => {
    const result = inventoryAdjustmentSchema.safeParse({
      ...valid,
      quantity: "abc",
    });

    expect(result.success).toBe(false);
  });

  it("rejects Infinity", () => {
    const result = inventoryAdjustmentSchema.safeParse({
      ...valid,
      quantity: "Infinity",
    });

    expect(result.success).toBe(false);
  });

  it("rejects excessive magnitude", () => {
    const result = inventoryAdjustmentSchema.safeParse({
      ...valid,
      quantity: 1_000_001,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing inventoryItemId", () => {
    const result = inventoryAdjustmentSchema.safeParse({
      ...valid,
      inventoryItemId: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing reason", () => {
    const result = inventoryAdjustmentSchema.safeParse({
      ...valid,
      reason: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a reason over 500 characters", () => {
    const result = inventoryAdjustmentSchema.safeParse({
      ...valid,
      reason: "x".repeat(501),
    });

    expect(result.success).toBe(false);
  });

  it("does not accept organizationId or actorUserId as trusted input", () => {
    const result = inventoryAdjustmentSchema.safeParse({
      ...valid,
      organizationId: "org-evil",
      actorUserId: "user-evil",
    });

    // Unknown keys are stripped, never surfaced as trusted identity.
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("organizationId");
      expect(result.data).not.toHaveProperty("actorUserId");
    }
  });
});