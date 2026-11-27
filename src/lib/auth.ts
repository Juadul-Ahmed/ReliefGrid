
import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { organization } from "better-auth/plugins";

import { prisma } from "@/lib/db/prisma";

async function buildAuthConfig() {
  let settings: Record<string, unknown> = {};
  try {
    const row = await prisma.platformSettings.findUnique({
      where: { id: "platform" },
    });
    settings = (row?.settings as Record<string, unknown>) ?? {};
  } catch {
    // Database not yet available (e.g., during build/migrations).
    // Use safe defaults.
  }

  const allowUserRegistration =
    settings.allowUserRegistration ?? DEFAULT_SETTINGS.allowUserRegistration;
  const allowUserToCreateOrganization =
    settings.allowUserToCreateOrganization ??
    DEFAULT_SETTINGS.allowUserToCreateOrganization;
  const requireEmailVerificationOnInvitation =
    settings.requireEmailVerificationOnInvitation ??
    DEFAULT_SETTINGS.requireEmailVerificationOnInvitation;
  const invitationExpiresInDays =
    typeof settings.invitationExpiresInDays === "number"
      ? settings.invitationExpiresInDays
      : DEFAULT_SETTINGS.invitationExpiresInDays;

  return {
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),

    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,

    emailAndPassword: {
      enabled: allowUserRegistration as boolean,
    },

    user: {
      additionalFields: {
        systemRole: {
          type: "string" as const,
          required: true,
          defaultValue: "USER",
          input: false,
        },
      },
    },

    session: {
      additionalFields: {
        activeOrganizationId: {
          type: "string" as const,
          required: false,
          input: false,
        },
      },
    },

    plugins: [
      organization({
        allowUserToCreateOrganization: allowUserToCreateOrganization as boolean,

        requireEmailVerificationOnInvitation:
          requireEmailVerificationOnInvitation as boolean,

        invitationExpiresIn: invitationExpiresInDays * 60 * 60 * 24,

        organization: {
          additionalFields: {
            status: {
              type: "string" as const,
              required: true,
              defaultValue: "PENDING",
              input: false,
            },
          },
        },

        schema: {
          member: {
            additionalFields: {
              status: {
                type: "string" as const,
                required: true,
                defaultValue: "ACTIVE",
                input: false,
              },
            },
          },
        },
      }),
    ],
  };
}

const DEFAULT_SETTINGS = {
  allowUserRegistration: true,
  allowUserToCreateOrganization: false,
  requireEmailVerificationOnInvitation: false,
  invitationExpiresInDays: 7,
};

export const auth = betterAuth(await buildAuthConfig());
