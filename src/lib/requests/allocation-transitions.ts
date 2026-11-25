/**
 * Allocation status lifecycle rules (Milestone 4).
 *
 * Allowed transitions:
 *   ALLOCATED  -> DISPATCHED, CANCELLED
 *   DISPATCHED -> DELIVERED, CANCELLED
 *   DELIVERED  -> (terminal)
 *   CANCELLED  -> (terminal)
 *
 * Cancellation of a DISPATCHED allocation is permitted by product rules: the
 * resources have not yet been delivered, so the commitment can be released.
 */

export const ALLOCATION_STATUS_VALUES = [
  "ALLOCATED",
  "DISPATCHED",
  "DELIVERED",
  "CANCELLED",
] as const;

export type AllocationStatusValue = (typeof ALLOCATION_STATUS_VALUES)[number];

export const ALLOCATION_TRANSITIONS: Record<
  AllocationStatusValue,
  readonly AllocationStatusValue[]
> = {
  ALLOCATED: ["DISPATCHED", "CANCELLED"],
  DISPATCHED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function isAllocationStatus(value: string): value is AllocationStatusValue {
  return (ALLOCATION_STATUS_VALUES as readonly string[]).includes(value);
}

export function canTransitionAllocation(
  from: string,
  to: string,
): boolean {
  if (!isAllocationStatus(from) || !isAllocationStatus(to)) {
    return false;
  }

  if (from === to) {
    return false;
  }

  return ALLOCATION_TRANSITIONS[from].includes(to);
}