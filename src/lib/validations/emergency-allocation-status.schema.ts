import { z } from "zod";

import { ALLOCATION_STATUS_VALUES } from "@/lib/requests/allocation-transitions";

export const updateAllocationStatusSchema = z.object({
  allocationId: z.string().trim().min(1, "Allocation is required"),

  status: z.enum(ALLOCATION_STATUS_VALUES, {
    error: "Choose a valid allocation status",
  }),
});

export type UpdateAllocationStatusInput = z.input<
  typeof updateAllocationStatusSchema
>;

export type UpdateAllocationStatusValues = z.infer<
  typeof updateAllocationStatusSchema
>;