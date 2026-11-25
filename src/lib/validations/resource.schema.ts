import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null || value === undefined ? undefined : value;

const optionalText = (max: number, label: string) =>
  z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .max(max, `${label} cannot exceed ${max} characters`)
      .optional(),
  );

// Must stay in sync with the Prisma ResourceCategory enum.
export const RESOURCE_CATEGORIES = [
  "FOOD",
  "DRINKING_WATER",
  "MEDICAL_SUPPLIES",
  "SHELTER",
  "RESCUE",
  "TRANSPORTATION",
  "OTHER",
] as const;

export const createResourceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(150, "Name cannot exceed 150 characters"),

  category: z.enum(RESOURCE_CATEGORIES, {
    error: "Choose a valid resource category",
  }),

  unit: z
    .string()
    .trim()
    .min(1, "Unit is required")
    .max(30, "Unit cannot exceed 30 characters"),

  description: optionalText(500, "Description"),

  sku: optionalText(50, "SKU"),
});

// Full-update schema: every editable field plus the active flag is required.
// This matches a single edit form that submits the complete resource state.
export const updateResourceSchema = createResourceSchema.extend({
  isActive: z.boolean({ error: "Active state is required" }),
});

export type CreateResourceInput = z.input<typeof createResourceSchema>;
export type CreateResourceValues = z.infer<typeof createResourceSchema>;

export type UpdateResourceInput = z.input<typeof updateResourceSchema>;
export type UpdateResourceValues = z.infer<typeof updateResourceSchema>;