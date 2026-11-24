
import { z } from "zod";

export const inviteIncidentParticipantSchema = z.object({
  incidentId: z.string().trim().min(1, "Incident ID is required."),

  organizationId: z
    .string()
    .trim()
    .min(1, "Organization ID is required."),

  roles: z
    .array(
      z.enum(["MEDICAL", "LOGISTICS", "RESCUE", "SUPPORT"]),
    )
    .min(1, "Select at least one participant role.")
    .refine(
      (roles) => new Set(roles).size === roles.length,
      "Duplicate participant roles are not allowed.",
    ),
});

export type InviteIncidentParticipantInput = z.infer<
  typeof inviteIncidentParticipantSchema
>;
