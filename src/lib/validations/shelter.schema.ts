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

export const SHELTER_STATUSES = ["ACTIVE", "INACTIVE", "CLOSED"] as const;

export const createShelterSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must contain at least 2 characters")
      .max(150, "Name cannot exceed 150 characters"),

    address: z
      .string()
      .trim()
      .min(2, "Address must contain at least 2 characters")
      .max(500, "Address cannot exceed 500 characters"),

    capacity: z
      .number()
      .int("Capacity must be a whole number")
      .positive("Capacity must be greater than zero"),

    currentOccupancy: z
      .number()
      .int("Current occupancy must be a whole number")
      .nonnegative("Current occupancy cannot be negative")
      .optional(),

    status: z.enum(SHELTER_STATUSES, {
      error: "Choose a valid shelter status",
    }).optional(),

    latitude: z.preprocess(
      emptyToUndefined,
      z
        .number()
        .finite("Latitude must be a valid number")
        .min(-90, "Latitude must be at least -90")
        .max(90, "Latitude cannot exceed 90")
        .optional(),
    ),

    longitude: z.preprocess(
      emptyToUndefined,
      z
        .number()
        .finite("Longitude must be a valid number")
        .min(-180, "Longitude must be at least -180")
        .max(180, "Longitude cannot exceed 180")
        .optional(),
    ),
  })
  .refine(
    (data) => {
      const occupancy = data.currentOccupancy ?? 0;
      return occupancy <= data.capacity;
    },
    {
      message: "Current occupancy cannot exceed capacity",
      path: ["currentOccupancy"],
    },
  );

export const updateShelterSchema = z
  .object({
    id: z.string().trim().min(1, "Shelter ID is required"),

    name: optionalText(150, "Name"),

    address: optionalText(500, "Address"),

    capacity: z
      .number()
      .int("Capacity must be a whole number")
      .positive("Capacity must be greater than zero")
      .optional(),

    currentOccupancy: z
      .number()
      .int("Current occupancy must be a whole number")
      .nonnegative("Current occupancy cannot be negative")
      .optional(),

    status: z.enum(SHELTER_STATUSES, {
      error: "Choose a valid shelter status",
    }).optional(),

    latitude: z.preprocess(
      emptyToUndefined,
      z
        .number()
        .finite("Latitude must be a valid number")
        .min(-90, "Latitude must be at least -90")
        .max(90, "Latitude cannot exceed 90")
        .optional(),
    ),

    longitude: z.preprocess(
      emptyToUndefined,
      z
        .number()
        .finite("Longitude must be a valid number")
        .min(-180, "Longitude must be at least -180")
        .max(180, "Longitude cannot exceed 180")
        .optional(),
    ),
  })
  .refine(
    (data) => {
      if (data.capacity !== undefined && data.currentOccupancy !== undefined) {
        return data.currentOccupancy <= data.capacity;
      }
      return true;
    },
    {
      message: "Current occupancy cannot exceed capacity",
      path: ["currentOccupancy"],
    },
  );

export type CreateShelterInput = z.input<typeof createShelterSchema>;
export type CreateShelterValues = z.infer<typeof createShelterSchema>;

export type UpdateShelterInput = z.input<typeof updateShelterSchema>;
export type UpdateShelterValues = z.infer<typeof updateShelterSchema>;
