import { z } from "zod";

/**
 * Signed inventory adjustment (StockMovementType.ADJUST).
 *
 * - quantity may be positive or negative, but never zero.
 * - at most three decimal places (Prisma Decimal(14,3)).
 * - bounded to +/- 1,000,000 (well within Decimal(14,3) range).
 *
 * Identity fields (organizationId, actorUserId) are intentionally excluded:
 * they are derived from the authenticated session in the server action.
 */
export const inventoryAdjustmentSchema = z.object({
  inventoryItemId: z
    .string()
    .trim()
    .min(1, "Inventory item is required"),

  quantity: z.coerce
    .number()
    .finite("Enter a valid quantity")
    .refine((value) => value !== 0, "Adjustment cannot be zero")
    .refine(
      (value) => Math.abs(value * 1000 - Math.round(value * 1000)) < 1e-8,
      "Quantity cannot have more than 3 decimal places",
    )
    .min(-1_000_000, "Quantity is too large")
    .max(1_000_000, "Quantity is too large"),

  reason: z
    .string()
    .trim()
    .min(1, "Reason is required")
    .max(500, "Reason cannot exceed 500 characters"),
});

export type InventoryAdjustmentInput = z.input<
  typeof inventoryAdjustmentSchema
>;

export type InventoryAdjustmentValues = z.infer<
  typeof inventoryAdjustmentSchema
>;