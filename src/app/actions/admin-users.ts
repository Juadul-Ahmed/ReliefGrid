
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

type UserActionResult =
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      message: string;
    };

const userIdSchema = z.object({
  userId: z.string().trim().min(1, "User is required"),
});

export interface UserDetails {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  systemRole: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  organizationCount: number;
  memberships: Array<{
    id: string;
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
    organizationStatus: string;
    role: string;
    status: string;
    createdAt: Date;
  }>;
}

export async function getUserDetails(
  userId: string,
): Promise<{
  user: UserDetails | null;
}> {
  if (!userId) {
    return { user: null };
  }

  let session;
  try {
    session = await requireSystemAdminSession();
  } catch {
    return { user: null };
  }

  void session;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      systemRole: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      members: {
        select: {
          id: true,
          role: true,
          status: true,
          createdAt: true,
          organizationId: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
            },
          },
        },
      },
      _count: {
        select: { members: true },
      },
    },
  });

  if (!user) {
    return { user: null };
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      systemRole: user.systemRole,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      organizationCount: user._count.members,
      memberships: user.members.map((m) => ({
        id: m.id,
        organizationId: m.organizationId,
        organizationName: m.organization.name,
        organizationSlug: m.organization.slug,
        organizationStatus: m.organization.status,
        role: m.role,
        status: m.status,
        createdAt: m.createdAt,
      })),
    },
  };
}

async function requireSystemAdminSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.systemRole !== "SYSTEM_ADMIN") {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}

export async function listUsers(
  input: unknown,
): Promise<{
  users: Array<{
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    systemRole: string;
    status: string;
    createdAt: Date;
    organizationCount: number;
  }>;
  total: number;
  activeCount: number;
  blockedCount: number;
  systemAdminCount: number;
}> {
  await requireSystemAdminSession();

  const validation = z
    .object({
      search: z.string().trim().optional(),
      status: z
        .enum(["ACTIVE", "BLOCKED", "DELETED", "ALL"])
        .optional()
        .default("ALL"),
      role: z.enum(["SYSTEM_ADMIN", "USER", "ALL"]).optional().default("ALL"),
      page: z
        .string()
        .optional()
        .default("1")
        .transform((val) => Math.max(1, Number(val) || 1)),
      pageSize: z
        .string()
        .optional()
        .default("20")
        .transform((val) => Math.min(100, Math.max(1, Number(val) || 20))),
    })
    .safeParse(input);

  if (!validation.success) {
    throw new Error("INVALID_FILTERS");
  }

  const { search, status, role, page, pageSize } = validation.data;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (role && role !== "ALL") {
    where.systemRole = role;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        systemRole: true,
        status: true,
        createdAt: true,
        _count: {
          select: { members: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const [activeCount, blockedCount, systemAdminCount] = await Promise.all([
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: "BLOCKED" } }),
    prisma.user.count({ where: { systemRole: "SYSTEM_ADMIN" } }),
  ]);

  return {
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      systemRole: user.systemRole,
      status: user.status,
      createdAt: user.createdAt,
      organizationCount: user._count.members,
    })),
    total,
    activeCount,
    blockedCount,
    systemAdminCount,
  };
}

async function assertNotSelf(userId: string, sessionUserId: string) {
  if (userId === sessionUserId) {
    throw new Error("CANNOT_MODIFY_SELF");
  }
}

async function assertNotLastSystemAdmin(userId: string) {
  const systemAdminCount = await prisma.user.count({
    where: { systemRole: "SYSTEM_ADMIN", status: "ACTIVE" },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, systemRole: true, status: true },
  });

  if (
    systemAdminCount <= 1 &&
    user?.systemRole === "SYSTEM_ADMIN" &&
    user.status === "ACTIVE"
  ) {
    throw new Error("LAST_SYSTEM_ADMIN");
  }
}

export async function blockUser(
  input: unknown,
): Promise<UserActionResult> {
  let session;
  try {
    session = await requireSystemAdminSession();
  } catch {
    return {
      success: false,
      message: "You are not authorized to block users.",
    };
  }

  const validation = userIdSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message: "User is required.",
    };
  }

  const { userId } = validation.data;

  try {
    await assertNotSelf(userId, session.user.id);
    await assertNotLastSystemAdmin(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, status: true },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    if (user.status === "BLOCKED") {
      return {
        success: false,
        message: "User is already blocked.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { status: "BLOCKED" },
      });

      // Invalidate all existing sessions so blocked users cannot authenticate.
      await tx.session.deleteMany({
        where: { userId },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          actorType: "USER",
          actorNameSnapshot: session.user.name,
          action: "USER_BLOCKED",
          entityType: "User",
          entityId: userId,
          before: { status: user.status },
          after: { status: "BLOCKED" },
          metadata: { userEmail: user.email },
        },
      });
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin");

    return {
      success: true,
      message: `User "${user.name}" (${user.email}) has been blocked. All active sessions were revoked.`,
    };
  } catch (error) {
    if (error instanceof Error) {
      const map: Record<string, string> = {
        CANNOT_MODIFY_SELF: "You cannot block your own account.",
        LAST_SYSTEM_ADMIN: "Cannot block the last active System Administrator.",
      };
      if (map[error.message]) {
        return { success: false, message: map[error.message] };
      }
    }

    console.error("Block user failed:", error);

    return {
      success: false,
      message: "Something went wrong while blocking the user.",
    };
  }
}

export async function unblockUser(
  input: unknown,
): Promise<UserActionResult> {
  let session;
  try {
    session = await requireSystemAdminSession();
  } catch {
    return {
      success: false,
      message: "You are not authorized to unblock users.",
    };
  }

  const validation = userIdSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message: "User is required.",
    };
  }

  const { userId } = validation.data;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, status: true },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    if (user.status === "ACTIVE") {
      return {
        success: false,
        message: "User is already active.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { status: "ACTIVE" },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          actorType: "USER",
          actorNameSnapshot: session.user.name,
          action: "USER_UNBLOCKED",
          entityType: "User",
          entityId: userId,
          before: { status: user.status },
          after: { status: "ACTIVE" },
          metadata: { userEmail: user.email },
        },
      });
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin");

    return {
      success: true,
      message: `User "${user.name}" (${user.email}) has been unblocked.`,
    };
  } catch (error) {
    console.error("Unblock user failed:", error);

    return {
      success: false,
      message: "Something went wrong while unblocking the user.",
    };
  }
}

export async function deleteUser(
  input: unknown,
): Promise<UserActionResult> {
  let session;
  try {
    session = await requireSystemAdminSession();
  } catch {
    return {
      success: false,
      message: "You are not authorized to delete users.",
    };
  }

  const validation = z
    .object({
      userId: z.string().trim().min(1, "User is required"),
      reason: z.string().trim().min(1, "A reason is required"),
    })
    .safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message:
        validation.error.issues[0]?.message ?? "Invalid deletion request.",
    };
  }

  const { userId, reason } = validation.data;

  try {
    await assertNotSelf(userId, session.user.id);
    await assertNotLastSystemAdmin(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        systemRole: true,
      },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    if (user.status === "DELETED") {
      return {
        success: false,
        message: "User is already deactivated.",
      };
    }

    const anonymizedEmail = `deleted_${userId}@reliefgrid.local`;
    const anonymizedName = "Deleted User";

    await prisma.$transaction(async (tx) => {
      // Anonymize PII and deactivate. Do not hard-delete: many relations
      // use ON DELETE RESTRICT and operational history must be preserved.
      await tx.user.update({
        where: { id: userId },
        data: {
          status: "DELETED",
          name: anonymizedName,
          email: anonymizedEmail,
          image: null,
        },
      });

      // Invalidate all existing sessions.
      await tx.session.deleteMany({
        where: { userId },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          actorType: "USER",
          actorNameSnapshot: session.user.name,
          action: "USER_DELETED",
          entityType: "User",
          entityId: userId,
          before: {
            status: user.status,
            name: user.name,
            email: user.email,
            systemRole: user.systemRole,
          },
          after: {
            status: "DELETED",
            name: anonymizedName,
            email: anonymizedEmail,
          },
          metadata: { reason },
        },
      });
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin");

    return {
      success: true,
      message: `User "${user.name}" (${user.email}) has been deactivated. Operational history is preserved.`,
    };
  } catch (error) {
    if (error instanceof Error) {
      const map: Record<string, string> = {
        CANNOT_MODIFY_SELF: "You cannot delete your own account.",
        LAST_SYSTEM_ADMIN: "Cannot delete the last active System Administrator.",
      };
      if (map[error.message]) {
        return { success: false, message: map[error.message] };
      }
    }

    console.error("Delete user failed:", error);

    return {
      success: false,
      message: "Something went wrong while deactivating the user.",
    };
  }
}
