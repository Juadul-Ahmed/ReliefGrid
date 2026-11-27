
"use server";

import { z } from "zod";

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .max(255, "Email cannot exceed 255 characters"),
  subject: z
    .string()
    .trim()
    .min(5, "Subject must be at least 5 characters")
    .max(200, "Subject cannot exceed 200 characters"),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(3000, "Message cannot exceed 3000 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

type ContactActionResult =
  | {
      success: false;
      message: string;
      errors?: Partial<Record<keyof ContactFormValues, string[]>>;
    }
  | {
      success: true;
      message: string;
    };

export async function submitContactForm(
  formData: unknown,
): Promise<ContactActionResult> {
  const validation = contactSchema.safeParse(formData);

  if (!validation.success) {
    return {
      success: false,
      message: "Please check the form for errors.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const { name, email, subject, message } = validation.data;

  try {
    // Contact submissions are acknowledged and queued for review.
    // No email delivery mechanism is configured in this environment,
    // so submissions are not sent anywhere automatically.
    // In a production environment, integrate with an email service here.

    console.log("Contact form submission received:", {
      name,
      email,
      subject,
      message,
      receivedAt: new Date().toISOString(),
    });

    return {
      success: true,
      message:
        "Thank you for contacting ReliefGrid. Your message has been received and will be reviewed by our team.",
    };
  } catch (error) {
    console.error("Contact form submission failed:", error);

    return {
      success: false,
      message:
        "Something went wrong while submitting your message. Please try again.",
    };
  }
}
