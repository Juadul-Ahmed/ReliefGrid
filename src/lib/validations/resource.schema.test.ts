import { describe, expect, it } from "vitest";

import {
  RESOURCE_CATEGORIES,
  createResourceSchema,
  updateResourceSchema,
} from "./resource.schema";

const validCreate = {
  name: "Bottled water",
  category: "DRINKING_WATER",
  unit: "liters",
};

describe("RESOURCE_CATEGORIES", () => {
  it("matches the Prisma ResourceCategory enum values", () => {
    expect(RESOURCE_CATEGORIES).toEqual([
      "FOOD",
      "DRINKING_WATER",
      "MEDICAL_SUPPLIES",
      "SHELTER",
      "RESCUE",
      "TRANSPORTATION",
      "OTHER",
    ]);
  });
});

describe("createResourceSchema", () => {
  it("accepts a valid resource with optional fields omitted", () => {
    const result = createResourceSchema.safeParse(validCreate);

    expect(result.success).toBe(true);
  });

  it("accepts optional description and sku", () => {
    const result = createResourceSchema.safeParse({
      ...validCreate,
      description: "Emergency drinking water",
      sku: "WTR-001",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a name shorter than 2 characters", () => {
    const result = createResourceSchema.safeParse({
      ...validCreate,
      name: "A",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 150 characters", () => {
    const result = createResourceSchema.safeParse({
      ...validCreate,
      name: "x".repeat(151),
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid category", () => {
    const result = createResourceSchema.safeParse({
      ...validCreate,
      category: "INVALID",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty unit", () => {
    const result = createResourceSchema.safeParse({
      ...validCreate,
      unit: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a description over 500 characters", () => {
    const result = createResourceSchema.safeParse({
      ...validCreate,
      description: "x".repeat(501),
    });

    expect(result.success).toBe(false);
  });

  it("rejects an sku over 50 characters", () => {
    const result = createResourceSchema.safeParse({
      ...validCreate,
      sku: "x".repeat(51),
    });

    expect(result.success).toBe(false);
  });
});

describe("updateResourceSchema", () => {
  it("accepts a full update including isActive", () => {
    const result = updateResourceSchema.safeParse({
      ...validCreate,
      isActive: false,
    });

    expect(result.success).toBe(true);
  });

  it("requires isActive", () => {
    const result = updateResourceSchema.safeParse(validCreate);

    expect(result.success).toBe(false);
  });

  it("rejects a non-boolean isActive", () => {
    const result = updateResourceSchema.safeParse({
      ...validCreate,
      isActive: "false",
    });

    expect(result.success).toBe(false);
  });
});

describe("resource location validation", () => {
  it("accepts valid latitude and longitude together", () => {
    const result = createResourceSchema.safeParse({
      ...validCreate,
      latitude: 45.5,
      longitude: -122.7,
    });

    expect(result.success).toBe(true);
  });

  it("accepts both coordinates absent", () => {
    const result = createResourceSchema.safeParse(validCreate);

    expect(result.success).toBe(true);
  });

  it("rejects latitude below -90", () => {
    const result = createResourceSchema.safeParse({
      ...validCreate,
      latitude: -91,
      longitude: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejects latitude above 90", () => {
    const result = createResourceSchema.safeParse({
      ...validCreate,
      latitude: 91,
      longitude: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejects longitude below -180", () => {
    const result = createResourceSchema.safeParse({
      ...validCreate,
      latitude: 0,
      longitude: -181,
    });

    expect(result.success).toBe(false);
  });

  it("rejects longitude above 180", () => {
    const result = createResourceSchema.safeParse({
      ...validCreate,
      latitude: 0,
      longitude: 181,
    });

    expect(result.success).toBe(false);
  });

  it("rejects latitude provided without longitude", () => {
    const result = createResourceSchema.safeParse({
      ...validCreate,
      latitude: 45.5,
    });

    expect(result.success).toBe(false);
  });

  it("rejects longitude provided without latitude", () => {
    const result = createResourceSchema.safeParse({
      ...validCreate,
      longitude: -122.7,
    });

    expect(result.success).toBe(false);
  });

  it("accepts empty optional location fields", () => {
    const result = createResourceSchema.safeParse({
      ...validCreate,
      locationName: "",
      address: "",
      latitude: "",
      longitude: "",
    });

    expect(result.success).toBe(true);
  });
});