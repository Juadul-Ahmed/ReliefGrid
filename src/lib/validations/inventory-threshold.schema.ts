import { z } from "zod";

/**
 * Low-stock threshold update for an inventory item.
 *
 * - threshold is optional; an empty value clears the threshold (null).
 * - non-negative, at most three decimal places (Prisma Decimal(14,3)).
 * - bounded to 1,000,000 (well within Decimal(14,3) range).
 *
 * Identity fields (organizationId, actorUserId) are intentionally excluded:
 * they are derived from the authenticated session in the server action.
 */
export const inventoryThresholdSchema = z.object({
  inventoryItemId: z
    .string()
    .trim()
    .min(1, "Inventory item is required"),

  lowStockThreshold: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce
      .number()
      .finite("Enter a valid threshold")
      .refine(
        (value) => Math.abs(value * 1000 - Math.round(value * 1000)) < 1e-8,
        "Threshold cannot have more than 3 decimal places",
      )
      .min(0, "Threshold cannot be negative")
      .max(1_000_000, "Threshold is too large")
      .optional(),
  ),
});

export type InventoryThresholdInput = z.input<typeof inventoryThresholdSchema>;

export type InventoryThresholdValues = z.infer<
  typeof inventoryThresholdSchema
>;