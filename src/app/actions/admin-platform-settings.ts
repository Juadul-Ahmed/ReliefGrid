
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

type SettingsActionResult =
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      message: string;
      settings: PlatformSettingsMap;
    };

export interface PlatformSettingsMap {
  platformName: string | null;
  platformDescription: string | null;
  supportContactEmail: string | null;
  defaultTimezone: string | null;
  defaultLocale: string | null;
  allowUserRegistration: boolean;
  requireEmailVerificationOnInvitation: boolean;
  allowUserToCreateOrganization: boolean;
  invitationExpiresInDays: number;
}

const DEFAULT_SETTINGS: PlatformSettingsMap = {
  platformName: null,
  platformDescription: null,
  supportContactEmail: null,
  defaultTimezone: null,
  defaultLocale: null,
  allowUserRegistration: true,
  requireEmailVerificationOnInvitation: false,
  allowUserToCreateOrganization: false,
  invitationExpiresInDays: 7,
};

const settingsUpdateSchema = z.object({
  platformName: z.string().trim().max(100).optional().nullable(),
  platformDescription: z.string().trim().max(500).optional().nullable(),
  supportContactEmail: z.string().email().optional().nullable(),
  defaultTimezone: z.string().trim().max(50).optional().nullable(),
  defaultLocale: z.string().trim().max(10).optional().nullable(),
  allowUserRegistration: z.boolean().optional(),
  requireEmailVerificationOnInvitation: z.boolean().optional(),
  allowUserToCreateOrganization: z.boolean().optional(),
  invitationExpiresInDays: z.number().int().min(1).max(365).optional(),
});

async function requireSystemAdminSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.systemRole !== "SYSTEM_ADMIN") {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}

function getSettingsFromDb(
  stored: Record<string, unknown> | null,
): PlatformSettingsMap {
  return {
    platformName:
      typeof stored?.platformName === "string" ? stored.platformName : null,
    platformDescription:
      typeof stored?.platformDescription === "string"
        ? stored.platformDescription
        : null,
    supportContactEmail:
      typeof stored?.supportContactEmail === "string"
        ? stored.supportContactEmail
        : null,
    defaultTimezone:
      typeof stored?.defaultTimezone === "string" ? stored.defaultTimezone : null,
    defaultLocale:
      typeof stored?.defaultLocale === "string" ? stored.defaultLocale : null,
    allowUserRegistration:
      Boolean(
        stored?.allowUserRegistration ?? DEFAULT_SETTINGS.allowUserRegistration,
      ),
    requireEmailVerificationOnInvitation:
      Boolean(
        stored?.requireEmailVerificationOnInvitation ??
          DEFAULT_SETTINGS.requireEmailVerificationOnInvitation,
      ),
    allowUserToCreateOrganization:
      Boolean(
        stored?.allowUserToCreateOrganization ??
          DEFAULT_SETTINGS.allowUserToCreateOrganization,
      ),
    invitationExpiresInDays:
      typeof stored?.invitationExpiresInDays === "number"
        ? stored.invitationExpiresInDays
        : DEFAULT_SETTINGS.invitationExpiresInDays,
  };
}

function redactSettingsForAudit(settings: PlatformSettingsMap): Record<string, unknown> {
  const sensitiveKeys = ["supportContactEmail"];
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(settings)) {
    if (sensitiveKeys.includes(key)) {
      redacted[key] = "[REDACTED]";
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

export async function getPlatformSettings(): Promise<{
  settings: PlatformSettingsMap;
}> {
  await requireSystemAdminSession();

  const row = await prisma.platformSettings.findUnique({
    where: { id: "platform" },
    select: { settings: true, updatedAt: true },
  });

  return {
    settings: getSettingsFromDb(
      (row?.settings as Record<string, unknown> | null) ?? null,
    ),
  };
}

export async function updatePlatformSettings(
  input: unknown,
): Promise<SettingsActionResult> {
  let session;
  try {
    session = await requireSystemAdminSession();
  } catch {
    return {
      success: false,
      message: "You are not authorized to update platform settings.",
    };
  }

  const validation = settingsUpdateSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message ?? "Invalid settings input.",
    };
  }

  const updates = validation.data;

  try {
    const existing = await prisma.platformSettings.findUnique({
      where: { id: "platform" },
      select: { settings: true },
    });

    const currentSettings = getSettingsFromDb(
      (existing?.settings as Record<string, unknown> | null) ?? null,
    );

    const before = redactSettingsForAudit(currentSettings);

    const merged: Record<string, unknown> = { ...currentSettings };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && value !== null) {
        merged[key] = value;
      } else if (value === null && key in merged) {
        delete merged[key];
      }
    }

    const after = getSettingsFromDb(merged);
    const afterRedacted = redactSettingsForAudit(after);

    await prisma.$transaction(async (tx) => {
      await tx.platformSettings.upsert({
        where: { id: "platform" },
        update: {
          settings: merged as unknown as Prisma.InputJsonValue,
          updatedBy: session.user.id,
        },
        create: {
          id: "platform",
          settings: merged as unknown as Prisma.InputJsonValue,
          updatedBy: session.user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          actorType: "USER",
          actorNameSnapshot: session.user.name,
          action: "PLATFORM_SETTINGS_UPDATED",
          entityType: "PlatformSettings",
          entityId: "platform",
          before: before as unknown as Prisma.InputJsonValue,
          after: afterRedacted as unknown as Prisma.InputJsonValue,
          metadata: { changedKeys: Object.keys(updates) } as unknown as Prisma.InputJsonValue,
        },
      });
    });

    revalidatePath("/admin/settings");

    return {
      success: true,
      message: "Platform settings updated successfully.",
      settings: after,
    };
  } catch (error) {
    console.error("Update platform settings failed:", error);

    return {
      success: false,
      message: "Something went wrong while updating platform settings.",
    };
  }
}
