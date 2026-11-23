
"use server";

import { prisma } from "@/lib/db/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export type InvitationNotificationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export interface InvitationNotification {
  id: string;
  type: "INCOMING" | "OUTGOING";
  organizationName: string;
  actorName: string;
  email: string;
  role: string;
  status: InvitationNotificationStatus;
  expiresAt: string;
  createdAt: string;
  invitationUrl: string | null;
}

type InvitationNotificationsResult = {
  success: boolean;
  message?: string;
  invitations: InvitationNotification[];
};

export async function getIncomingOrganizationInvitations(): Promise<InvitationNotificationsResult> {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return {
        success: false,
        message: "Please sign in to view your notifications.",
        invitations: [],
      };
    }

    const now = new Date();

    // Incoming invitations addressed to the current user.
    const incomingInvitations = await prisma.invitation.findMany({
      where: {
        email: {
          equals: session.user.email,
          mode: "insensitive",
        },
        status: "pending",
        expiresAt: {
          gt: now,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Outgoing invitations created by the current user.
    const outgoingInvitations = await prisma.invitation.findMany({
      where: {
        inviterId: session.user.id,
        status: {
          in: ["pending", "accepted", "rejected", "canceled"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const organizationIds = [
      ...new Set([
        ...incomingInvitations.map((item) => item.organizationId),
        ...outgoingInvitations.map((item) => item.organizationId),
      ]),
    ];

    const inviterIds = [
      ...new Set(
        incomingInvitations.map((item) => item.inviterId),
      ),
    ];

    const inviteeEmails = [
      ...new Set(
        outgoingInvitations.map((item) => item.email.toLowerCase()),
      ),
    ];

    const [organizations, inviters, invitees] = await Promise.all([
      prisma.organization.findMany({
        where: {
          id: { in: organizationIds },
        },
        select: {
          id: true,
          name: true,
        },
      }),

      prisma.user.findMany({
        where: {
          id: { in: inviterIds },
        },
        select: {
          id: true,
          name: true,
        },
      }),

      prisma.user.findMany({
        where: {
          email: {
            in: inviteeEmails,
            mode: "insensitive",
          },
        },
        select: {
          email: true,
          name: true,
        },
      }),
    ]);

    const organizationMap = new Map(
      organizations.map((item) => [item.id, item.name]),
    );

    const inviterMap = new Map(
      inviters.map((item) => [item.id, item.name]),
    );

    const inviteeMap = new Map(
      invitees.map((item) => [
        item.email.toLowerCase(),
        item.name,
      ]),
    );

    const baseUrl = process.env.BETTER_AUTH_URL;

    if (!baseUrl) {
      throw new Error("BETTER_AUTH_URL is not configured.");
    }

    // Build incoming notifications.
    const incomingNotifications: InvitationNotification[] =
      incomingInvitations.map((invitation) => {
        const invitationUrl = new URL(
          "/invitations/accept",
          baseUrl,
        );

        invitationUrl.searchParams.set("id", invitation.id);

        return {
          id: invitation.id,
          type: "INCOMING",
          organizationName:
            organizationMap.get(invitation.organizationId) ??
            "Unknown organization",
          actorName:
            inviterMap.get(invitation.inviterId) ??
            "Organization administrator",
          email: invitation.email,
          role: invitation.role ?? "MEMBER",
          status: "PENDING",
          expiresAt: invitation.expiresAt.toISOString(),
          createdAt: invitation.createdAt.toISOString(),
          invitationUrl: invitationUrl.toString(),
        };
      });

    // Build outgoing notifications.
    const outgoingNotifications: InvitationNotification[] =
      outgoingInvitations.map((invitation) => {
        const rawStatus = invitation.status.toLowerCase();

        let status: InvitationNotificationStatus;

        if (
          rawStatus === "pending" &&
          invitation.expiresAt <= now
        ) {
          status = "EXPIRED";
        } else {
          switch (rawStatus) {
            case "accepted":
              status = "ACCEPTED";
              break;

            case "rejected":
              status = "REJECTED";
              break;

            case "canceled":
              status = "CANCELLED";
              break;

            default:
              status = "PENDING";
          }
        }

        return {
          id: invitation.id,
          type: "OUTGOING",
          organizationName:
            organizationMap.get(invitation.organizationId) ??
            "Unknown organization",
          actorName:
            inviteeMap.get(invitation.email.toLowerCase()) ??
            invitation.email,
          email: invitation.email,
          role: invitation.role ?? "MEMBER",
          status,
          expiresAt: invitation.expiresAt.toISOString(),
          createdAt: invitation.createdAt.toISOString(),
          invitationUrl: null,
        };
      });

    const notifications = [
      ...incomingNotifications,
      ...outgoingNotifications,
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    );

    return {
      success: true,
      invitations: notifications,
    };
  } catch (error) {
    console.error("Get organization invitation notifications error:", error);

    return {
      success: false,
      message: "Unable to load your notifications.",
      invitations: [],
    };
  }
}
