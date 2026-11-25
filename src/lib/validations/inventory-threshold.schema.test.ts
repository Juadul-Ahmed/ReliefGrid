import { describe, expect, it } from "vitest";

import { inventoryThresholdSchema } from "./inventory-threshold.schema";

describe("inventoryThresholdSchema", () => {
  it("accepts a valid non-negative threshold", () => {
    const result = inventoryThresholdSchema.safeParse({
      inventoryItemId: "inv-1",
      lowStockThreshold: "12.5",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lowStockThreshold).toBe(12.5);
    }
  });

  it("treats an empty string as clearing the threshold (undefined)", () => {
    const result = inventoryThresholdSchema.safeParse({
      inventoryItemId: "inv-1",
      lowStockThreshold: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lowStockThreshold).toBeUndefined();
    }
  });

  it("rejects negative thresholds", () => {
    const result = inventoryThresholdSchema.safeParse({
      inventoryItemId: "inv-1",
      lowStockThreshold: "-1",
    });

    expect(result.success).toBe(false);
  });

  it("rejects thresholds with more than 3 decimal places", () => {
    const result = inventoryThresholdSchema.safeParse({
      inventoryItemId: "inv-1",
      lowStockThreshold: "1.2345",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing inventory item id", () => {
    const result = inventoryThresholdSchema.safeParse({
      inventoryItemId: "",
      lowStockThreshold: 5,
    });

    expect(result.success).toBe(false);
  });
});