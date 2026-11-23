
"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { organizationApplicationSchema } from "@/lib/validations/organization-application.schema";

export async function submitOrganizationApplication(formData: unknown) {
  try {
    // 1. Verify the current session.
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return {
        success: false,
        message: "You must be logged in to submit an application.",
      };
    }

    // 2. Only regular users can submit organization applications.
    if (session.user.systemRole !== "USER") {
      return {
        success: false,
        message: "You are not authorized to submit this application.",
      };
    }

    // 3. Validate submitted data.
    const validation = organizationApplicationSchema.safeParse(formData);

    if (!validation.success) {
      return {
        success: false,
        message: "Please check the application information.",
        errors: validation.error.flatten().fieldErrors,
      };
    }

    const data = validation.data;

    // 4. Prevent multiple active applications from the same applicant.
    const existingActiveApplication =
      await prisma.organizationApplication.findFirst({
        where: {
          applicantId: session.user.id,
          status: {
            in: ["PENDING", "UNDER_REVIEW"],
          },
        },
        select: {
          id: true,
          status: true,
        },
      });

    if (existingActiveApplication) {
      return {
        success: false,
        message:
          "You already have an active organization application. Please wait for its review before submitting another.",
      };
    }

    // 5. Check whether the organization slug is already registered.
    const existingOrganization = await prisma.organization.findUnique({
      where: {
        slug: data.requestedSlug,
      },
      select: {
        id: true,
      },
    });

    if (existingOrganization) {
      return {
        success: false,
        message: "This organization URL is already in use.",
      };
    }

    // 6. Check whether another active application uses this slug.
    const existingApplication =
      await prisma.organizationApplication.findFirst({
        where: {
          requestedSlug: data.requestedSlug,
          status: {
            in: ["PENDING", "UNDER_REVIEW"],
          },
        },
        select: {
          id: true,
        },
      });

    if (existingApplication) {
      return {
        success: false,
        message:
          "An application with this organization URL is already under review.",
      };
    }

    // 7. Create the application.
    const application = await prisma.organizationApplication.create({
      data: {
        applicantId: session.user.id,
        organizationName: data.organizationName,
        requestedSlug: data.requestedSlug,
        organizationType: data.organizationType,
        description: data.description || null,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone || null,
        address: data.address || null,
        status: "PENDING",
      },
      select: {
        id: true,
        status: true,
      },
    });

    return {
      success: true,
      message:
        "Your organization application has been submitted successfully.",
      applicationId: application.id,
      status: application.status,
    };
  } catch (error) {
    console.error("Organization application submission failed:", error);

    return {
      success: false,
      message:
        "Something went wrong while submitting your application. Please try again.",
    };
  }
}
