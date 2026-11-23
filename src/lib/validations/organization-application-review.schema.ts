
import { z } from "zod";

export const organizationApplicationReviewSchema = z.discriminatedUnion(
  "action",
  [
    z.object({
      applicationId: z.string().min(1),
      action: z.literal("START_REVIEW"),
    }),

    z.object({
      applicationId: z.string().min(1),
      action: z.literal("APPROVE"),
      reviewNotes: z.string().trim().max(2000).optional(),
    }),

    z.object({
      applicationId: z.string().min(1),
      action: z.literal("REJECT"),
      reviewNotes: z
        .string()
        .trim()
        .min(10, "Please provide a rejection reason of at least 10 characters.")
        .max(2000, "Rejection reason cannot exceed 2000 characters."),
    }),
  ],
);

export type OrganizationApplicationReviewInput = z.infer<
  typeof organizationApplicationReviewSchema
>;
