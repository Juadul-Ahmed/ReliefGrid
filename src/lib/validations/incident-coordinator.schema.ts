
import { z } from "zod";

export const assignIncidentCoordinatorSchema = z.object({
  incidentId: z.string().trim().min(1, "Incident ID is required."),

  // null means remove the current coordinator.
  coordinatorId: z.string().trim().min(1).nullable(),
});
