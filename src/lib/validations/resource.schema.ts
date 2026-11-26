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

const optionalCoordinate = (min: number, max: number, label: string) =>
  z.preprocess(
    emptyToUndefined,
    z
      .number()
      .min(min, `${label} must be at least ${min}`)
      .max(max, `${label} cannot exceed ${max}`)
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

export const createResourceSchema = z
  .object({
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

    locationName: optionalText(200, "Location Name"),

    address: optionalText(500, "Address"),

    latitude: optionalCoordinate(-90, 90, "Latitude"),

    longitude: optionalCoordinate(-180, 180, "Longitude"),
  })
  .refine(
    (data) => {
      const hasLat = data.latitude !== undefined;
      const hasLong = data.longitude !== undefined;
      return hasLat === hasLong;
    },
    {
      message:
        "Latitude and longitude must both be provided or both be absent.",
      path: ["longitude"],
    },
  );

// Full-update schema: every editable field plus the active flag is required.
// This matches a single edit form that submits the complete resource state.
export const updateResourceSchema = createResourceSchema.extend({
  isActive: z.boolean({ error: "Active state is required" }),
});

export type CreateResourceInput = z.input<typeof createResourceSchema>;
export type CreateResourceValues = z.infer<typeof createResourceSchema>;

export type UpdateResourceInput = z.input<typeof updateResourceSchema>;
export type UpdateResourceValues = z.infer<typeof updateResourceSchema>;