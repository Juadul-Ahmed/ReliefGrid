
"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

const pageSizeSchema = z
  .string()
  .optional()
  .default("20")
  .transform((val) => Math.min(100, Math.max(1, Number(val) || 20)));

const pageSchema = z
  .string()
  .optional()
  .default("1")
  .transform((val) => Math.max(1, Number(val) || 1));

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorNameSnapshot: string | null;
  actorEmail: string | null;
  actorSystemRole: string | null;
  organizationName: string | null;
  organizationSlug: string | null;
  before: unknown;
  after: unknown;
  metadata: unknown;
  createdAt: Date;
}

export interface AuditLogStats {
  totalEvents: number;
  eventsToday: number;
  eventsLast7Days: number;
  distinctActors: number;
}

const listAuditLogsSchema = z.object({
  search: z.string().trim().optional(),
  action: z.string().trim().optional(),
  organizationId: z.string().trim().optional(),
  entityType: z.string().trim().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: pageSchema,
  pageSize: pageSizeSchema,
  sortBy: z
    .enum(["createdAt", "action", "actorNameSnapshot"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
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

function redactSensitiveMetadata(metadata: unknown): unknown {
  if (metadata === null || metadata === undefined) {
    return metadata;
  }

  if (Array.isArray(metadata)) {
    return metadata.map(redactSensitiveMetadata);
  }

  if (typeof metadata === "object") {
    const sensitiveKeys = [
      "password",
      "token",
      "secret",
      "credential",
      "apikey",
      "api_key",
      "accessToken",
      "refreshToken",
      "idToken",
      "sessionToken",
      "authorization",
      "privateKey",
      "clientSecret",
    ];

    const redacted: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some((s) => lowerKey.includes(s));

      if (isSensitive) {
        redacted[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        redacted[key] = redactSensitiveMetadata(value);
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  return metadata;
}

export async function listAuditLogs(
  input: unknown,
): Promise<{
  auditLogs: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}> {
  await requireSystemAdminSession();

  const validation = listAuditLogsSchema.safeParse(input);

  if (!validation.success) {
    throw new Error("INVALID_FILTERS");
  }

  const {
    search,
    action,
    organizationId,
    entityType,
    startDate,
    endDate,
    page,
    pageSize,
    sortBy,
    sortOrder,
  } = validation.data;

  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { actorNameSnapshot: { contains: search, mode: "insensitive" } },
    ];
  }

  if (action) {
    where.action = { contains: action, mode: "insensitive" };
  }

  if (organizationId) {
    where.organizationId = organizationId;
  }

  if (entityType) {
    where.entityType = { contains: entityType, mode: "insensitive" };
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
    }
    if (endDate) {
      (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
    }
  }

  const [auditLogs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: pageSize,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        actorNameSnapshot: true,
        actor: {
          select: {
            email: true,
            systemRole: true,
          },
        },
        organization: {
          select: {
            name: true,
            slug: true,
          },
        },
        before: true,
        after: true,
        metadata: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    auditLogs: auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      actorNameSnapshot: log.actorNameSnapshot,
      actorEmail: log.actor?.email ?? null,
      actorSystemRole: log.actor?.systemRole ?? null,
      organizationName: log.organization?.name ?? null,
      organizationSlug: log.organization?.slug ?? null,
      before: log.before ?? null,
      after: log.after ?? null,
      metadata: redactSensitiveMetadata(log.metadata) ?? null,
      createdAt: log.createdAt,
    })),
    total,
    page,
    pageSize,
  };
}

export async function getAuditLogStats(
  input: unknown,
): Promise<AuditLogStats> {
  await requireSystemAdminSession();

  const validation = z
    .object({
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      organizationId: z.string().trim().optional(),
    })
    .safeParse(input);

  if (!validation.success) {
    throw new Error("INVALID_FILTERS");
  }

  const { startDate, endDate, organizationId } = validation.data;

  const where: Record<string, unknown> = {};

  if (organizationId) {
    where.organizationId = organizationId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
    }
    if (endDate) {
      (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
    }
  }

  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const whereToday: Record<string, unknown> = {
    ...where,
    createdAt: { gte: todayStart },
  };

  const whereLast7Days: Record<string, unknown> = {
    ...where,
    createdAt: { gte: sevenDaysAgo },
  };

  const [totalEvents, eventsToday, eventsLast7Days, distinctActors] =
    await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.count({ where: whereToday }),
      prisma.auditLog.count({ where: whereLast7Days }),
      prisma.auditLog.findMany({
        where,
        select: { actorUserId: true },
        distinct: ["actorUserId"],
      }),
    ]);

  return {
    totalEvents,
    eventsToday,
    eventsLast7Days,
    distinctActors: distinctActors.filter(
      (a) => a.actorUserId !== null,
    ).length,
  };
}

export async function getAuditLogDetails(
  auditLogId: string,
): Promise<{
  auditLog: AuditLogEntry | null;
}> {
  if (!auditLogId) {
    return { auditLog: null };
  }

  let session;
  try {
    session = await requireSystemAdminSession();
  } catch {
    return { auditLog: null };
  }

  void session;

  const auditLog = await prisma.auditLog.findUnique({
    where: { id: auditLogId },
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      actorNameSnapshot: true,
      actor: {
        select: {
          email: true,
          systemRole: true,
        },
      },
      organization: {
        select: {
          name: true,
          slug: true,
        },
      },
      before: true,
      after: true,
      metadata: true,
      createdAt: true,
    },
  });

  if (!auditLog) {
    return { auditLog: null };
  }

  return {
    auditLog: {
      id: auditLog.id,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      actorNameSnapshot: auditLog.actorNameSnapshot,
      actorEmail: auditLog.actor?.email ?? null,
      actorSystemRole: auditLog.actor?.systemRole ?? null,
      organizationName: auditLog.organization?.name ?? null,
      organizationSlug: auditLog.organization?.slug ?? null,
      before: auditLog.before ?? null,
      after: auditLog.after ?? null,
      metadata: redactSensitiveMetadata(auditLog.metadata) ?? null,
      createdAt: auditLog.createdAt,
    },
  };
}
