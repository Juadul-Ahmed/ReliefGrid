
import { z } from "zod";

export const updateIncidentSeveritySchema = z.object({
  incidentId: z.string().trim().min(1, "Incident ID is required."),

  severity: z.enum([
    "LOW",
    "MODERATE",
    "HIGH",
    "CRITICAL",
  ]),
});

export type UpdateIncidentSeverityInput = z.infer<
  typeof updateIncidentSeveritySchema
>;
