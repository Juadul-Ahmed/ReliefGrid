
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { organizationInvitationSchema } from "@/lib/validations/organization-invitation.schema";

type CreateInvitationResult =
  | {
      success: true;
      message: string;
      invitationUrl: string;
      expiresAt: string;
    }
  | {
      success: false;
      message: string;
    };

export async function createOrganizationInvitation(
  input: unknown,
): Promise<CreateInvitationResult> {
  try {
    const validation = organizationInvitationSchema.safeParse(input);

    if (!validation.success) {
      return {
        success: false,
        message:
          validation.error.issues[0]?.message ??
          "Invalid invitation details.",
      };
    }

    const { email, role } = validation.data;

    const session = await getCurrentSession();

    if (!session) {
      return {
        success: false,
        message: "You must be logged in to invite members.",
      };
    }

    if (session.user.systemRole === "SYSTEM_ADMIN") {
      return {
        success: false,
        message:
          "System administrators cannot invite organization members.",
      };
    }

    const organizationId = session.session.activeOrganizationId;

    if (!organizationId) {
      return {
        success: false,
        message: "Please select an active organization first.",
      };
    }

    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        status: "ACTIVE",
        members: {
          some: {
            userId: session.user.id,
            status: "ACTIVE",
          },
        },
      },
      include: {
        members: {
          where: {
            userId: session.user.id,
            status: "ACTIVE",
          },
          take: 1,
        },
      },
    });

    if (!organization || !organization.members[0]) {
      return {
        success: false,
        message:
          "You do not have an active membership in this organization.",
      };
    }

    const currentRole = organization.members[0].role.toUpperCase();

    if (currentRole !== "OWNER" && currentRole !== "ADMIN") {
      return {
        success: false,
        message:
          "You do not have permission to invite organization members.",
      };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      const existingMembership = await prisma.member.findFirst({
        where: {
          organizationId,
          userId: existingUser.id,
          status: "ACTIVE",
        },
        select: { id: true },
      });

      if (existingMembership) {
        return {
          success: false,
          message:
            "This user is already an active member of your organization.",
        };
      }
    }

    const invitation = await auth.api.createInvitation({
      headers: await headers(),
      body: {
        email,
        role: role === "ADMIN" ? "admin" : "member",
        organizationId,
      },
    });

    const baseUrl = process.env.BETTER_AUTH_URL;

    if (!baseUrl) {
      throw new Error("BETTER_AUTH_URL is not configured.");
    }

    const invitationUrl = new URL(
      `/invitations/accept?id=${encodeURIComponent(invitation.id)}`,
      baseUrl,
    ).toString();

    revalidatePath("/settings/members");

    return {
      success: true,
      message: `Invitation created successfully for ${email}.`,
      invitationUrl,
      expiresAt: invitation.expiresAt.toISOString(),
    };
  } catch (error) {
    console.error("Create organization invitation error:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong while creating the invitation.",
    };
  }
}
