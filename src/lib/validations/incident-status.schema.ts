
import { z } from "zod";

export const updateIncidentStatusSchema = z.object({
  incidentId: z.string().trim().min(1, "Incident ID is required."),

  status: z.enum([
    "OPEN",
    "ASSESSING",
    "ACTIVE",
    "CONTAINED",
    "RESOLVED",
    "CLOSED",
    "SUSPENDED",
    "CANCELLED",
  ]),
});

export type UpdateIncidentStatusInput = z.infer<
  typeof updateIncidentStatusSchema
>;
