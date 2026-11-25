
import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null || value === undefined
    ? undefined
    : value;

export const allocateEmergencyResourcesSchema = z.object({
  requestId: z.string().trim().min(1, "Request is required"),

  itemId: z.string().trim().min(1, "Requested item is required"),

  quantity: z.coerce
    .number()
    .finite("Enter a valid quantity")
    .min(0.001, "Quantity must be greater than zero")
    .max(1_000_000, "Quantity is too large")
    .refine(
      (value) =>
        Math.abs(value * 1000 - Math.round(value * 1000)) < 1e-8,
      "Quantity cannot have more than 3 decimal places",
    ),

  notes: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(500, "Notes cannot exceed 500 characters").optional(),
  ),
});

export type AllocateEmergencyResourcesInput = z.input<
  typeof allocateEmergencyResourcesSchema
>;

export type AllocateEmergencyResourcesValues = z.infer<
  typeof allocateEmergencyResourcesSchema
>;
