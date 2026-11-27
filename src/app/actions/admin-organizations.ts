
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

type OrganizationActionResult =
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      message: string;
    };

const organizationIdSchema = z.object({
  organizationId: z.string().trim().min(1, "Organization is required"),
});

export interface OrganizationDetails {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  logo: string | null;
  metadata: string | null;
  owner: { name: string | null; email: string | null } | null;
  memberCount: number;
  members: Array<{
    id: string;
    role: string;
    status: string;
    user: { id: string; name: string | null; email: string | null };
  }>;
}

export async function getOrganizationDetails(
  organizationId: string,
): Promise<{
  organization: OrganizationDetails | null;
}> {
  if (!organizationId) {
    return { organization: null };
  }

  let session;
  try {
    session = await requireSystemAdminSession();
  } catch {
    return { organization: null };
  }

  void session;

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      logo: true,
      metadata: true,
      members: {
        select: {
          id: true,
          role: true,
          status: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: { members: true },
      },
    },
  });

  if (!organization) {
    return { organization: null };
  }

  const owner = organization.members.find(
    (m) => m.role.toLowerCase() === "owner" && m.status === "ACTIVE",
  );

  return {
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      status: organization.status,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      logo: organization.logo,
      metadata: organization.metadata,
      owner: owner
        ? { name: owner.user.name, email: owner.user.email }
        : null,
      memberCount: organization._count.members,
      members: organization.members.map((m) => ({
        id: m.id,
        role: m.role,
        status: m.status,
        user: m.user,
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

export async function listOrganizations(
  input: unknown,
): Promise<{
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: Date;
    owner: { name: string | null; email: string | null } | null;
    memberCount: number;
  }>;
  total: number;
  activeCount: number;
  blockedCount: number;
  memberTotal: number;
}> {
  await requireSystemAdminSession();

  const validation = z
    .object({
      search: z.string().trim().optional(),
      status: z
        .enum(["ACTIVE", "BLOCKED", "PENDING", "ALL"])
        .optional()
        .default("ALL"),
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

  const { search, status, page, pageSize } = validation.data;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  if (status && status !== "ALL") {
    where.status = status;
  }

  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        members: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            role: true,
            status: true,
          },
        },
        _count: {
          select: { members: true },
        },
      },
    }),
    prisma.organization.count({ where }),
  ]);

  const [activeCount, blockedCount, memberTotal] = await Promise.all([
    prisma.organization.count({ where: { status: "ACTIVE" } }),
    prisma.organization.count({ where: { status: "BLOCKED" } }),
    prisma.member.count(),
  ]);

  return {
    organizations: organizations.map((org) => {
      const owner = org.members.find(
        (m) => m.role.toLowerCase() === "owner" && m.status === "ACTIVE",
      );

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        status: org.status,
        createdAt: org.createdAt,
        owner: owner
          ? { name: owner.user.name, email: owner.user.email }
          : null,
        memberCount: org._count.members,
      };
    }),
    total,
    activeCount,
    blockedCount,
    memberTotal,
  };
}

export async function blockOrganization(
  input: unknown,
): Promise<OrganizationActionResult> {
  let session;
  try {
    session = await requireSystemAdminSession();
  } catch {
    return {
      success: false,
      message: "You are not authorized to block organizations.",
    };
  }

  const validation = organizationIdSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message: "Organization is required.",
    };
  }

  const { organizationId } = validation.data;

  try {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, status: true },
    });

    if (!organization) {
      return {
        success: false,
        message: "Organization not found.",
      };
    }

    if (organization.status === "BLOCKED") {
      return {
        success: false,
        message: "Organization is already blocked.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id: organizationId },
        data: { status: "BLOCKED" },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          actorType: "USER",
          actorNameSnapshot: session.user.name,
          organizationId,
          action: "ORGANIZATION_BLOCKED",
          entityType: "Organization",
          entityId: organizationId,
          before: { status: organization.status },
          after: { status: "BLOCKED" },
        },
      });
    });

    revalidatePath("/admin/organizations");
    revalidatePath("/admin");

    return {
      success: true,
      message: `Organization "${organization.name}" has been blocked.`,
    };
  } catch (error) {
    console.error("Block organization failed:", error);

    return {
      success: false,
      message: "Something went wrong while blocking the organization.",
    };
  }
}

export async function unblockOrganization(
  input: unknown,
): Promise<OrganizationActionResult> {
  let session;
  try {
    session = await requireSystemAdminSession();
  } catch {
    return {
      success: false,
      message: "You are not authorized to unblock organizations.",
    };
  }

  const validation = organizationIdSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message: "Organization is required.",
    };
  }

  const { organizationId } = validation.data;

  try {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, status: true },
    });

    if (!organization) {
      return {
        success: false,
        message: "Organization not found.",
      };
    }

    if (organization.status === "ACTIVE") {
      return {
        success: false,
        message: "Organization is already active.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id: organizationId },
        data: { status: "ACTIVE" },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          actorType: "USER",
          actorNameSnapshot: session.user.name,
          organizationId,
          action: "ORGANIZATION_UNBLOCKED",
          entityType: "Organization",
          entityId: organizationId,
          before: { status: organization.status },
          after: { status: "ACTIVE" },
        },
      });
    });

    revalidatePath("/admin/organizations");
    revalidatePath("/admin");

    return {
      success: true,
      message: `Organization "${organization.name}" has been unblocked.`,
    };
  } catch (error) {
    console.error("Unblock organization failed:", error);

    return {
      success: false,
      message: "Something went wrong while unblocking the organization.",
    };
  }
}

export async function deleteOrganization(
  input: unknown,
): Promise<OrganizationActionResult> {
  let session;
  try {
    session = await requireSystemAdminSession();
  } catch {
    return {
      success: false,
      message: "You are not authorized to delete organizations.",
    };
  }

  const validation = z
    .object({
      organizationId: z.string().trim().min(1, "Organization is required"),
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

  const { organizationId, reason } = validation.data;

  try {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, status: true },
    });

    if (!organization) {
      return {
        success: false,
        message: "Organization not found.",
      };
    }

    // Respect the existing deletion-request workflow: do not create a duplicate
    // pending request when one already exists.
    const existingRequest =
      await prisma.organizationDeletionRequest.findFirst({
        where: {
          organizationId,
          status: "PENDING",
        },
      });

    if (existingRequest) {
      return {
        success: false,
        message:
          "A deletion request for this organization is already pending review.",
      };
    }

    await prisma.$transaction(async (tx) => {
      // System admin is authorized to approve the deletion directly. Record it
      // as APPROVED so the deletion intent is captured through the existing
      // OrganizationDeletionRequest workflow without unsafe cascading deletes.
      await tx.organizationDeletionRequest.create({
        data: {
          id: crypto.randomUUID(),
          organizationId,
          requestedById: session.user.id,
          reviewedById: session.user.id,
          status: "APPROVED",
          reason,
          reviewedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          actorType: "USER",
          actorNameSnapshot: session.user.name,
          organizationId,
          action: "ORGANIZATION_DELETED",
          entityType: "Organization",
          entityId: organizationId,
          before: { status: organization.status, name: organization.name },
          after: { status: "DELETION_REQUESTED", reason },
        },
      });
    });

    revalidatePath("/admin/organizations");
    revalidatePath("/admin");

    return {
      success: true,
      message: `Deletion requested for "${organization.name}".`,
    };
  } catch (error) {
    console.error("Delete organization failed:", error);

    return {
      success: false,
      message: "Something went wrong while requesting deletion.",
    };
  }
}
