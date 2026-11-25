import { z } from "zod";

export const reviewEmergencyRequestSchema = z
  .object({
    requestId: z.string().trim().min(1, "Request is required."),

    status: z.enum(["UNDER_REVIEW", "VERIFIED", "REJECTED"]),

    rejectionReason: z.preprocess(
      (value) =>
        value === "" || value === null || value === undefined
          ? undefined
          : value,
      z.string().trim().max(1000).optional(),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.status === "REJECTED" && !data.rejectionReason) {
      ctx.addIssue({
        code: "custom",
        path: ["rejectionReason"],
        message: "A rejection reason is required.",
      });
    }
  });

export type ReviewEmergencyRequestInput = z.input<
  typeof reviewEmergencyRequestSchema
>;