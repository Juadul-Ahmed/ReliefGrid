
import { z } from "zod";

const baseSchema = z.object({
  reportId: z.string().min(1, "Report ID is required."),
});

export const incidentReportReviewSchema = z.discriminatedUnion(
  "action",
  [
    baseSchema.extend({
      action: z.literal("START_REVIEW"),
    }),

    baseSchema.extend({
      action: z.literal("VERIFY"),
    }),

    baseSchema.extend({
      action: z.literal("REJECT"),
      rejectionReason: z
        .string()
        .trim()
        .min(10, "Rejection reason must contain at least 10 characters.")
        .max(2000, "Rejection reason cannot exceed 2000 characters."),
    }),

    baseSchema.extend({
      action: z.literal("MARK_DUPLICATE"),
      duplicateOfReportId: z
        .string()
        .min(1, "Please select the original report."),
    }),
  ],
);

export type IncidentReportReviewInput = z.infer<
  typeof incidentReportReviewSchema
>;
