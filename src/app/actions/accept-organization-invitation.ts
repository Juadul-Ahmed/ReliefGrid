
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { getCurrentSession } from "@/lib/auth/session";

type InvitationActionResult = {
  success: boolean;
  message: string;
  redirectTo?: string;
};

async function getInvitation(invitationId: string) {
  return prisma.invitation.findUnique({
    where: { id: invitationId },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  });
}

export async function acceptOrganizationInvitation(
  invitationId: string,
): Promise<InvitationActionResult> {
  try {
    if (!invitationId?.trim()) {
      return {
        success: false,
        message: "Invalid invitation.",
      };
    }

    const session = await getCurrentSession();

    if (!session) {
      return {
        success: false,
        message: "Please sign in before accepting this invitation.",
      };
    }

    const invitation = await getInvitation(invitationId);

    if (!invitation) {
      return {
        success: false,
        message: "This invitation could not be found.",
      };
    }

    if (
      invitation.email.toLowerCase() !== session.user.email.toLowerCase()
    ) {
      return {
        success: false,
        message: `This invitation was sent to ${invitation.email}. Please sign in using that email address.`,
      };
    }

    if (invitation.status.toLowerCase() !== "pending") {
      return {
        success: false,
        message: "This invitation is no longer pending.",
      };
    }

    if (invitation.expiresAt <= new Date()) {
      return {
        success: false,
        message: "This invitation has expired.",
      };
    }

    if (invitation.organization.status !== "ACTIVE") {
      return {
        success: false,
        message: "This organization is not currently active.",
      };
    }

    const requestHeaders = await headers();

    await auth.api.acceptInvitation({
      headers: requestHeaders,
      body: {
        invitationId,
      },
    });

    await auth.api.setActiveOrganization({
      headers: requestHeaders,
      body: {
        organizationId: invitation.organizationId,
      },
    });

    revalidatePath("/settings/members");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `You have successfully joined ${invitation.organization.name}.`,
      redirectTo: "/dashboard",
    };
  } catch (error) {
    console.error("Accept organization invitation error:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong while accepting the invitation.",
    };
  }
}

export async function rejectOrganizationInvitation(
  invitationId: string,
): Promise<InvitationActionResult> {
  try {
    if (!invitationId?.trim()) {
      return {
        success: false,
        message: "Invalid invitation.",
      };
    }

    const session = await getCurrentSession();

    if (!session) {
      return {
        success: false,
        message: "Please sign in before responding to this invitation.",
      };
    }

    const invitation = await getInvitation(invitationId);

    if (!invitation) {
      return {
        success: false,
        message: "This invitation could not be found.",
      };
    }

    if (
      invitation.email.toLowerCase() !== session.user.email.toLowerCase()
    ) {
      return {
        success: false,
        message: "This invitation belongs to a different email address.",
      };
    }

    if (invitation.status.toLowerCase() !== "pending") {
      return {
        success: false,
        message: "This invitation is no longer pending.",
      };
    }

    if (invitation.expiresAt <= new Date()) {
      return {
        success: false,
        message: "This invitation has expired.",
      };
    }

    const requestHeaders = await headers();

    await auth.api.rejectInvitation({
      headers: requestHeaders,
      body: {
        invitationId,
      },
    });

    revalidatePath("/settings/members");

    return {
      success: true,
      message: "Invitation rejected successfully.",
      redirectTo: "/onboarding",
    };
  } catch (error) {
    console.error("Reject organization invitation error:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong while rejecting the invitation.",
    };
  }
}
