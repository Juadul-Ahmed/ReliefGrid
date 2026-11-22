
import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { organization } from "better-auth/plugins";

import { prisma } from "@/lib/db/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  emailAndPassword: {
    enabled: true,
  },

  user: {
    additionalFields: {
      systemRole: {
        type: "string",
        required: true,
        defaultValue: "USER",
        input: false,
      },
    },
  },

  session: {
    additionalFields: {
      activeOrganizationId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },

  plugins: [
    organization({
      allowUserToCreateOrganization: false,

      organization: {
        additionalFields: {
          status: {
            type: "string",
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
              type: "string",
              required: true,
              defaultValue: "ACTIVE",
              input: false,
            },
          },
        },
      },
    }),
  ],
});
