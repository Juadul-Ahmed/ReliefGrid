import { z } from "zod";

/**
 * Inventory initialization input.
 *
 * Identity (organizationId, actorUserId) and reserved quantity are never
 * accepted from the client: reserved is always initialized to 0 server-side.
 */
export const initializeInventorySchema = z.object({
  resourceId: z.string().trim().min(1, "Resource is required"),

  onHand: z.coerce
    .number()
    .finite("Enter a valid quantity")
    .min(0, "Quantity cannot be negative")
    .max(1_000_000, "Quantity is too large")
    .refine(
      (value) => Math.abs(value * 1000 - Math.round(value * 1000)) < 1e-8,
      "Quantity cannot have more than 3 decimal places",
    ),

  reason: z
    .string()
    .trim()
    .min(1, "Reason is required")
    .max(500, "Reason cannot exceed 500 characters"),
});

export type InitializeInventoryInput = z.input<
  typeof initializeInventorySchema
>;

export type InitializeInventoryValues = z.infer<
  typeof initializeInventorySchema
>;