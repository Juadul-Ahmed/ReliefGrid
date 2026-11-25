
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

const optionalNumber = (min: number, max: number, label: string) =>
  z.preprocess(
    (value) => {
      const cleaned = emptyToUndefined(value);
      return cleaned === undefined ? undefined : Number(cleaned);
    },
    z
      .number()
      .finite(`${label} must be a valid number`)
      .min(min, `${label} must be at least ${min}`)
      .max(max, `${label} cannot exceed ${max}`)
      .optional(),
  );

export const EMERGENCY_REQUEST_CATEGORIES = [
  "FOOD",
  "DRINKING_WATER",
  "MEDICAL_SUPPLIES",
  "SHELTER",
  "RESCUE",
  "TRANSPORTATION",
  "OTHER",
] as const;

export const EMERGENCY_REQUEST_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

export const emergencyRequestItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Item name must contain at least 2 characters")
    .max(150, "Item name cannot exceed 150 characters"),

  description: optionalText(500, "Item description"),

  quantity: z.coerce
    .number()
    .finite("Quantity must be a valid number")
    .min(0.001, "Quantity must be greater than zero")
    .max(1_000_000, "Quantity is too large")
    .refine(
      (value) => Number.isInteger(value * 1000),
      "Quantity cannot have more than 3 decimal places",
    ),

  unit: z
    .string()
    .trim()
    .min(1, "Unit is required")
    .max(30, "Unit cannot exceed 30 characters"),
});

export const createEmergencyRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must contain at least 5 characters")
    .max(150, "Title cannot exceed 150 characters"),

  description: z
    .string()
    .trim()
    .min(20, "Description must contain at least 20 characters")
    .max(5000, "Description cannot exceed 5000 characters"),

  category: z.enum(EMERGENCY_REQUEST_CATEGORIES),

  priority: z.enum(EMERGENCY_REQUEST_PRIORITIES),

  incidentId: z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1).optional(),
  ),

  locationName: optionalText(150, "Location name"),
  address: optionalText(500, "Address"),

  latitude: optionalNumber(-90, 90, "Latitude"),
  longitude: optionalNumber(-180, 180, "Longitude"),

  requiredBy: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .refine(
        (value) => !Number.isNaN(new Date(value).getTime()),
        "Please enter a valid date",
      )
      .optional(),
  ),

  items: z
    .array(emergencyRequestItemSchema)
    .min(1, "Add at least one requested item")
    .max(25, "A request cannot contain more than 25 items"),
})
.refine(
  (data) => (data.latitude === undefined) === (data.longitude === undefined),
  {
    message: "Latitude and longitude must be provided together",
    path: ["latitude"],
  },
);

export type CreateEmergencyRequestInput =
  z.input<typeof createEmergencyRequestSchema>;

export type CreateEmergencyRequestValues =
  z.infer<typeof createEmergencyRequestSchema>;
