
import { z } from "zod";

export const organizationApplicationSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(2, "Organization name must contain at least 2 characters")
    .max(150, "Organization name cannot exceed 150 characters"),

  requestedSlug: z
    .string()
    .trim()
    .min(3, "Slug must contain at least 3 characters")
    .max(60, "Slug cannot exceed 60 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and single hyphens only",
    ),

  organizationType: z
    .string()
    .trim()
    .min(2, "Organization type is required")
    .max(100, "Organization type cannot exceed 100 characters"),

  description: z
    .string()
    .trim()
    .max(2000, "Description cannot exceed 2000 characters")
    .optional()
    .or(z.literal("")),

  contactEmail: z
    .string()
    .trim()
    .email("Please enter a valid contact email address")
    .max(254, "Email address is too long"),

  contactPhone: z
    .string()
    .trim()
    .max(30, "Phone number cannot exceed 30 characters")
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .trim()
    .max(300, "Address cannot exceed 300 characters")
    .optional()
    .or(z.literal("")),
});

export type OrganizationApplicationFormValues = z.infer<
  typeof organizationApplicationSchema
>;
