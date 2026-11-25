import { describe, expect, it } from "vitest";

import {
  ALLOCATION_TRANSITIONS,
  canTransitionAllocation,
  isAllocationStatus,
} from "./allocation-transitions";

describe("canTransitionAllocation", () => {
  it("allows ALLOCATED -> DISPATCHED", () => {
    expect(canTransitionAllocation("ALLOCATED", "DISPATCHED")).toBe(true);
  });

  it("allows ALLOCATED -> CANCELLED", () => {
    expect(canTransitionAllocation("ALLOCATED", "CANCELLED")).toBe(true);
  });

  it("allows DISPATCHED -> DELIVERED", () => {
    expect(canTransitionAllocation("DISPATCHED", "DELIVERED")).toBe(true);
  });

  it("allows DISPATCHED -> CANCELLED", () => {
    expect(canTransitionAllocation("DISPATCHED", "CANCELLED")).toBe(true);
  });

  it("rejects ALLOCATED -> DELIVERED (must dispatch first)", () => {
    expect(canTransitionAllocation("ALLOCATED", "DELIVERED")).toBe(false);
  });

  it("rejects repeated transitions to the same status", () => {
    expect(canTransitionAllocation("ALLOCATED", "ALLOCATED")).toBe(false);
    expect(canTransitionAllocation("DELIVERED", "DELIVERED")).toBe(false);
  });

  it("rejects transitions out of terminal states", () => {
    expect(canTransitionAllocation("DELIVERED", "CANCELLED")).toBe(false);
    expect(canTransitionAllocation("CANCELLED", "DISPATCHED")).toBe(false);
    expect(canTransitionAllocation("CANCELLED", "ALLOCATED")).toBe(false);
  });

  it("rejects unknown statuses", () => {
    expect(canTransitionAllocation("ALLOCATED", "SHIPPED")).toBe(false);
    expect(canTransitionAllocation("BOGUS", "DISPATCHED")).toBe(false);
  });
});

describe("isAllocationStatus", () => {
  it("recognizes valid statuses", () => {
    expect(isAllocationStatus("ALLOCATED")).toBe(true);
    expect(isAllocationStatus("CANCELLED")).toBe(true);
  });

  it("rejects invalid statuses", () => {
    expect(isAllocationStatus("SHIPPED")).toBe(false);
  });
});

describe("ALLOCATION_TRANSITIONS", () => {
  it("has no outgoing transitions for terminal states", () => {
    expect(ALLOCATION_TRANSITIONS.DELIVERED).toEqual([]);
    expect(ALLOCATION_TRANSITIONS.CANCELLED).toEqual([]);
  });
});