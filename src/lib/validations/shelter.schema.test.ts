import { describe, expect, it } from "vitest";

import {
  SHELTER_STATUSES,
  createShelterSchema,
  updateShelterSchema,
} from "./shelter.schema";

const validCreate = {
  name: "Downtown Emergency Shelter",
  address: "123 Main Street",
  capacity: 100,
  status: "ACTIVE",
};

const validUpdate = {
  id: "shelter-1",
  name: "Downtown Emergency Shelter",
  address: "123 Main Street",
  capacity: 100,
  currentOccupancy: 50,
  status: "ACTIVE",
};

describe("SHELTER_STATUSES", () => {
  it("contains ACTIVE, INACTIVE, and CLOSED", () => {
    expect(SHELTER_STATUSES).toEqual(["ACTIVE", "INACTIVE", "CLOSED"]);
  });
});

describe("createShelterSchema", () => {
  it("accepts a valid shelter with minimal required fields", () => {
    const result = createShelterSchema.safeParse(validCreate);

    expect(result.success).toBe(true);
  });

  it("accepts currentOccupancy when within capacity", () => {
    const result = createShelterSchema.safeParse({
      ...validCreate,
      currentOccupancy: 50,
    });

    expect(result.success).toBe(true);
  });

  it("accepts latitude and longitude within valid ranges", () => {
    const result = createShelterSchema.safeParse({
      ...validCreate,
      latitude: 40.7128,
      longitude: -74.006,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a name shorter than 2 characters", () => {
    const result = createShelterSchema.safeParse({
      ...validCreate,
      name: "A",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 150 characters", () => {
    const result = createShelterSchema.safeParse({
      ...validCreate,
      name: "x".repeat(151),
    });

    expect(result.success).toBe(false);
  });

  it("rejects an address shorter than 2 characters", () => {
    const result = createShelterSchema.safeParse({
      ...validCreate,
      address: "A",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an address longer than 500 characters", () => {
    const result = createShelterSchema.safeParse({
      ...validCreate,
      address: "x".repeat(501),
    });

    expect(result.success).toBe(false);
  });

  it("rejects capacity of zero", () => {
    const result = createShelterSchema.safeParse({
      ...validCreate,
      capacity: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejects negative capacity", () => {
    const result = createShelterSchema.safeParse({
      ...validCreate,
      capacity: -5,
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-integer capacity", () => {
    const result = createShelterSchema.safeParse({
      ...validCreate,
      capacity: 100.5,
    });

    expect(result.success).toBe(false);
  });

  it("rejects currentOccupancy exceeding capacity", () => {
    const result = createShelterSchema.safeParse({
      ...validCreate,
      capacity: 50,
      currentOccupancy: 100,
    });

    expect(result.success).toBe(false);
  });

  it("rejects negative currentOccupancy", () => {
    const result = createShelterSchema.safeParse({
      ...validCreate,
      currentOccupancy: -1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-integer currentOccupancy", () => {
    const result = createShelterSchema.safeParse({
      ...validCreate,
      currentOccupancy: 50.5,
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = createShelterSchema.safeParse({
      ...validCreate,
      status: "FULL",
    });

    expect(result.success).toBe(false);
  });

  it("rejects latitude below -90", () => {
    const result = createShelterSchema.safeParse({
      ...validCreate,
      latitude: -90.1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects latitude above 90", () => {
    const result = createShelterSchema.safeParse({
      ...validCreate,
      latitude: 90.1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects longitude below -180", () => {
    const result = createShelterSchema.safeParse({
      ...validCreate,
      longitude: -180.1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects longitude above 180", () => {
    const result = createShelterSchema.safeParse({
      ...validCreate,
      longitude: 180.1,
    });

    expect(result.success).toBe(false);
  });

  it("accepts latitude exactly -90 and 90", () => {
    const result = createShelterSchema.safeParse({
      ...validCreate,
      latitude: -90,
      longitude: 180,
    });

    expect(result.success).toBe(true);
  });

  it("accepts optional latitude and longitude omitted", () => {
    const result = createShelterSchema.safeParse({
      ...validCreate,
      latitude: undefined,
      longitude: undefined,
    });

    expect(result.success).toBe(true);
  });

  it("accepts currentOccupancy equal to capacity", () => {
    const result = createShelterSchema.safeParse({
      ...validCreate,
      capacity: 100,
      currentOccupancy: 100,
    });

    expect(result.success).toBe(true);
  });

  it("treats missing currentOccupancy as zero for create", () => {
    const result = createShelterSchema.safeParse(validCreate);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentOccupancy).toBeUndefined();
    }
  });
});

describe("updateShelterSchema", () => {
  it("accepts a full update including all fields", () => {
    const result = updateShelterSchema.safeParse(validUpdate);

    expect(result.success).toBe(true);
  });

  it("accepts update with only capacity changed (occupancy within new capacity)", () => {
    const result = updateShelterSchema.safeParse({
      ...validUpdate,
      capacity: 200,
    });

    expect(result.success).toBe(true);
  });

  it("rejects update where new capacity is below current occupancy", () => {
    const result = updateShelterSchema.safeParse({
      ...validUpdate,
      capacity: 25,
      currentOccupancy: 50,
    });

    expect(result.success).toBe(false);
  });

  it("accepts update with only occupancy changed (within existing capacity)", () => {
    const result = updateShelterSchema.safeParse({
      ...validUpdate,
      capacity: undefined,
      currentOccupancy: 75,
    });

    expect(result.success).toBe(true);
  });

  it("rejects update where occupancy exceeds capacity", () => {
    const result = updateShelterSchema.safeParse({
      ...validUpdate,
      currentOccupancy: 150,
    });

    expect(result.success).toBe(false);
  });

  it("requires id", () => {
    const result = updateShelterSchema.safeParse({
      ...validUpdate,
      id: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid status on update", () => {
    const result = updateShelterSchema.safeParse({
      ...validUpdate,
      status: "FULL",
    });

    expect(result.success).toBe(false);
  });

  it("rejects capacity of zero on update", () => {
    const result = updateShelterSchema.safeParse({
      ...validUpdate,
      capacity: 0,
    });

    expect(result.success).toBe(false);
  });

  it("accepts partial update with only name", () => {
    const result = updateShelterSchema.safeParse({
      id: "shelter-1",
      name: "Updated Shelter Name",
    });

    expect(result.success).toBe(true);
  });
});
