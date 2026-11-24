
import { z } from "zod";

// Create Incident validation
export const createIncidentSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, "Incident title must contain at least 5 characters")
      .max(150, "Incident title cannot exceed 150 characters"),

    description: z
      .string()
      .trim()
      .min(20, "Description must contain at least 20 characters")
      .max(5000, "Description cannot exceed 5000 characters"),

    category: z.enum([
      "FIRE",
      "FLOOD",
      "EARTHQUAKE",
      "LANDSLIDE",
      "STORM",
      "MEDICAL",
      "ACCIDENT",
      "MISSING_PERSON",
      "OTHER",
    ]),

    severity: z.enum([
      "LOW",
      "MODERATE",
      "HIGH",
      "CRITICAL",
    ]),

    locationName: z
      .string()
      .trim()
      .max(150, "Location name cannot exceed 150 characters")
      .optional(),

    address: z
      .string()
      .trim()
      .max(500, "Address cannot exceed 500 characters")
      .optional(),

    latitude: z.preprocess(
      (value) =>
        value === "" || value === null || value === undefined
          ? undefined
          : Number(value),
      z
        .number()
        .finite("Latitude must be a valid number")
        .min(-90, "Latitude must be at least -90")
        .max(90, "Latitude cannot exceed 90")
        .optional(),
    ),

    longitude: z.preprocess(
      (value) =>
        value === "" || value === null || value === undefined
          ? undefined
          : Number(value),
      z
        .number()
        .finite("Longitude must be a valid number")
        .min(-180, "Longitude must be at least -180")
        .max(180, "Longitude cannot exceed 180")
        .optional(),
    ),

    occurredAt: z.preprocess(
      (value) =>
        value === "" || value === null || value === undefined
          ? undefined
          : value,
      z
        .string()
        .refine(
          (value) => !Number.isNaN(new Date(value).getTime()),
          "Please enter a valid occurrence date",
        )
        .optional(),
    ),
  })
  .refine(
    (data) =>
      (data.latitude === undefined) ===
      (data.longitude === undefined),
    {
      message: "Latitude and longitude must be provided together",
      path: ["latitude"],
    },
  );

// TypeScript type inferred from schema
export type CreateIncidentFormValues = z.infer<
  typeof createIncidentSchema
>;
