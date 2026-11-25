/**
 * Pure fulfillment calculations for emergency request items.
 *
 * Rules (Milestone 4):
 * - ALLOCATED and DISPATCHED quantities count as committed.
 * - DELIVERED quantities count as delivered (and are also committed).
 * - CANCELLED quantities count toward neither committed nor delivered.
 * - Remaining quantity is clamped so it can never become negative.
 *
 * The functions here are intentionally free of Prisma/DB imports so they can
 * be unit tested in isolation. Quantities may be plain numbers or any object
 * exposing `toNumber()` (e.g. Prisma.Decimal).
 */

export const COMMITTED_ALLOCATION_STATUSES = [
  "ALLOCATED",
  "DISPATCHED",
  "DELIVERED",
] as const;

export const DELIVERED_ALLOCATION_STATUS = "DELIVERED";
export const CANCELLED_ALLOCATION_STATUS = "CANCELLED";

export type FulfillmentStatus =
  | "VERIFIED"
  | "IN_PROGRESS"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED";

type DecimalLike = { toNumber(): number };
type QuantityLike = number | DecimalLike;

export interface AllocationLike {
  status: string;
  quantity: QuantityLike;
}

export interface FulfillmentSummary {
  requested: number;
  committed: number;
  delivered: number;
  remaining: number;
  /** Delivered percentage of requested, 0..100. */
  progress: number;
  derivedStatus: FulfillmentStatus;
}

function toNumber(value: QuantityLike): number {
  return typeof value === "number" ? value : value.toNumber();
}

function isCommitted(status: string): boolean {
  return (COMMITTED_ALLOCATION_STATUSES as readonly string[]).includes(status);
}

/**
 * Derives the request-level fulfillment status from aggregate quantities.
 *
 * This is consistent with the Prisma `EmergencyRequestStatus` enum but is
 * intentionally NOT persisted automatically: the stored status is owned by the
 * review workflow, and allocation must never auto-promote a request to
 * FULFILLED without actual delivery.
 */
export function deriveFulfillmentStatus(
  requested: number,
  committed: number,
  delivered: number,
): FulfillmentStatus {
  const epsilon = 1e-9;

  if (delivered <= epsilon) {
    return committed > epsilon ? "IN_PROGRESS" : "VERIFIED";
  }

  if (requested > 0 && delivered + epsilon >= requested) {
    return "FULFILLED";
  }

  return "PARTIALLY_FULFILLED";
}

/**
 * Summarizes a single requested item's fulfillment from its allocations.
 */
export function summarizeFulfillment(
  requested: QuantityLike,
  allocations: readonly AllocationLike[],
): FulfillmentSummary {
  const requestedNumber = toNumber(requested);

  let committed = 0;
  let delivered = 0;

  for (const allocation of allocations) {
    const quantity = toNumber(allocation.quantity);

    if (allocation.status === DELIVERED_ALLOCATION_STATUS) {
      delivered += quantity;
      committed += quantity;
      continue;
    }

    if (isCommitted(allocation.status)) {
      committed += quantity;
    }
  }

  const remaining = Math.max(0, requestedNumber - committed);

  const progress =
    requestedNumber > 0
      ? Math.min(100, Math.round((delivered / requestedNumber) * 100))
      : 0;

  return {
    requested: requestedNumber,
    committed,
    delivered,
    remaining,
    progress,
    derivedStatus: deriveFulfillmentStatus(
      requestedNumber,
      committed,
      delivered,
    ),
  };
}

export interface FulfillmentTotals {
  requested: number;
  committed: number;
  delivered: number;
  remaining: number;
  progress: number;
  derivedStatus: FulfillmentStatus;
}

/**
 * Aggregates fulfillment across every item of a request.
 */
export function summarizeRequestFulfillment(
  items: readonly { quantity: QuantityLike; allocations: readonly AllocationLike[] }[],
): FulfillmentTotals {
  return items.reduce<FulfillmentTotals>(
    (totals, item) => {
      const summary = summarizeFulfillment(item.quantity, item.allocations);

      const requested = totals.requested + summary.requested;
      const committed = totals.committed + summary.committed;
      const delivered = totals.delivered + summary.delivered;

      return {
        requested,
        committed,
        delivered,
        remaining: Math.max(0, requested - committed),
        progress:
          requested > 0
            ? Math.min(100, Math.round((delivered / requested) * 100))
            : 0,
        derivedStatus: deriveFulfillmentStatus(requested, committed, delivered),
      };
    },
    {
      requested: 0,
      committed: 0,
      delivered: 0,
      remaining: 0,
      progress: 0,
      derivedStatus: "VERIFIED",
    },
  );
}