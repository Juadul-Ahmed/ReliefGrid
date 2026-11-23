
import { z } from "zod";

export const organizationInvitationSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .max(254, "Email address is too long.")
    .transform((email) => email.toLowerCase()),

  role: z.enum(["ADMIN", "MEMBER"], {
    error: "Please select a valid invitation role.",
  }),
});

export type OrganizationInvitationInput = z.infer<
  typeof organizationInvitationSchema
>;
